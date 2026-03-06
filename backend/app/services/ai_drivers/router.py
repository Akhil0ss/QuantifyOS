import os
import logging
import hashlib
import contextvars
from typing import Optional, Dict, Any, List
from .base import AIProvider
from .openai_driver import OpenAIDriver
from .ollama_driver import OllamaDriver
from .web_driver import WebRouter

logger = logging.getLogger(__name__)

# Context variable to track active replay session without polluting every function signature
_active_replay_session = contextvars.ContextVar('active_replay_session', default=None)
_active_replay_workspace = contextvars.ContextVar('active_replay_workspace', default=None)
_replay_sequence = contextvars.ContextVar('replay_sequence', default=0)

def set_replay_session(session_id: str, workspace_id: str):
    _active_replay_session.set(session_id)
    _active_replay_workspace.set(workspace_id)
    _replay_sequence.set(0)

def _record_to_replay(prompt_text: str, system_message: Optional[str], response_text: str, provider_name: str):
    session_id = _active_replay_session.get()
    workspace_id = _active_replay_workspace.get()
    if not session_id or not workspace_id:
        return
        
    seq = _replay_sequence.get()
    _replay_sequence.set(seq + 1)
    
    from app.services.replay_store import ReplayStore
    store = ReplayStore(workspace_id)
    store.record_llm_call(
        session_id=session_id,
        sequence=seq,
        prompt_hash=_hash_prompt(prompt_text),
        prompt_text=prompt_text,
        system_message=system_message,
        response_text=response_text,
        provider=provider_name
    )

def _hash_prompt(prompt: str) -> str:
    """Returns a short SHA256 hash of the prompt for replay indexing."""
    return hashlib.sha256(prompt.encode()).hexdigest()[:16]


def _get_telemetry():
    """Lazy import to avoid circular dependency."""
    try:
        from app.services.telemetry import TelemetryService
        return TelemetryService()
    except Exception:
        return None

class ModelRouter:
    """
    Service responsible for selecting the appropriate AI provider driver
    based on the user's connectivity configuration (API, Local, or Web).
    """

    @staticmethod
    def get_provider_from_config(p_config: Dict[str, Any], user_id: str = "default") -> AIProvider:
        """
        Factory method to instantiate the correct driver.
        """
        mode = p_config.get("mode", "api") # api, local, or web
        provider_name = p_config.get("provider", "openai")
        model_name = p_config.get("model_name", "default")
        api_key = p_config.get("api_key")

        if os.getenv("TEST_MODE") == "true":
            from .mock_driver import MockAIDriver
            return MockAIDriver(mode=mode, provider=provider_name)

        if mode == "api":
            if provider_name == "openai":
                return OpenAIDriver(api_key=api_key, model=model_name if model_name != "default" else "gpt-4o")
            # Other API providers...
        elif mode == "local":
            local_url = p_config.get("local_url", "http://localhost:11434")
            return OllamaDriver(
                local_model=model_name if model_name != "default" else "llama3",
                base_url=local_url,
                user_id=user_id
            )
        elif mode == "web":
            return WebRouter(provider=provider_name, user_id=user_id)
        
        # Default fallback
        if api_key:
            return OpenAIDriver(api_key=api_key)
        
        # Absolute fallback if everything is broken or empty config
        return OpenAIDriver(api_key="unconfigured-api-key")

    @staticmethod
    async def get_best_provider(user_id: str, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Selects provider from pool and executes text generation.
        Logs all selection decisions and fallback cascades via telemetry.
        """
        from app.core.firebase_admin_sdk import db_admin
        telemetry = _get_telemetry()
        prompt_hash = _hash_prompt(prompt)
        
        # 1. Fetch user's provider pool from RTDB
        pool_ref = db_admin.reference(f"ai_config/{user_id}")
        config = pool_ref.get() or {}
        
        pool = config.get("fallback_pool", [])
        if not pool:
            if telemetry:
                telemetry.log_system_event(user_id, "Router", f"No pool configured. Falling back to default OpenAI. prompt_hash={prompt_hash}")
            return await OpenAIDriver().generate_text(prompt, system_message)

        # 2. Strategy-based selection (Sorted by performance_tier)
        sorted_pool = sorted(pool, key=lambda x: x.get("performance_tier", "low"), reverse=True)
        
        last_error = None
        attempt = 0
        for p_config in sorted_pool:
            attempt += 1
            provider_name = p_config.get('provider', 'unknown')
            try:
                if telemetry:
                    telemetry.log_system_event(
                        user_id, "Router",
                        f"Attempt {attempt}/{len(sorted_pool)}: {provider_name} (tier={p_config.get('performance_tier')}) prompt_hash={prompt_hash}"
                    )
                provider = ModelRouter.get_provider_from_config(p_config, user_id)
                result = await provider.generate_text(prompt, system_message)
                
                # Log success
                if telemetry:
                    response_hash = _hash_prompt(result[:200] if result else "")
                    telemetry.log_system_event(
                        user_id, "Router",
                        f"SUCCESS: {provider_name} responded. prompt_hash={prompt_hash} response_hash={response_hash}"
                    )

                # Avoid circular import, don't record if we are currently replaying
                from app.services.replay_engine import ReplayProvider
                if not isinstance(provider, ReplayProvider):
                    _record_to_replay(prompt, system_message, result, provider_name)
                    
                return result
            except Exception as e:
                if telemetry:
                    telemetry.log_system_event(
                        user_id, "Router",
                        f"FAILED: {provider_name} error: {str(e)[:100]}. Cascading to next...",
                        level="warning"
                    )
                logger.warning(f"AI Provider {provider_name} failed: {str(e)}. Attempting fallback...")
                last_error = e
                continue
        
        if telemetry:
            telemetry.log_system_event(
                user_id, "Router",
                f"ALL PROVIDERS FAILED. prompt_hash={prompt_hash} last_error={str(last_error)[:100]}",
                level="error"
            )
        raise Exception(f"All AI providers in pool failed. Last error: {str(last_error)}")

    @staticmethod
    async def route_tool_call(user_id: str, goal: str, tools: List[Dict[str, Any]], context: Optional[str] = None) -> Dict[str, Any]:
        """
        Routes tool execution requests with automatic pool-based fallback.
        """
        from app.core.firebase_admin_sdk import db_admin
        telemetry = _get_telemetry()
        
        pool_ref = db_admin.reference(f"ai_config/{user_id}")
        config = pool_ref.get() or {}
        
        pool = config.get("fallback_pool", [])
        if not pool:
             return await OpenAIDriver().execute_tool(goal, tools, context)

        sorted_pool = sorted(pool, key=lambda x: x.get("performance_tier", "low"), reverse=True)
        
        last_error = None
        for p_config in sorted_pool:
            provider_name = p_config.get('provider', 'unknown')
            try:
                if telemetry:
                    telemetry.log_system_event(user_id, "Router", f"Tool routing: trying {provider_name}")
                provider = ModelRouter.get_provider_from_config(p_config, user_id)
                result = await provider.execute_tool(goal, tools, context)
                if telemetry:
                    telemetry.log_system_event(user_id, "Router", f"Tool routing SUCCESS via {provider_name}")
                
                from app.services.replay_engine import ReplayProvider
                if not isinstance(provider, ReplayProvider):
                    import json
                    _record_to_replay(
                        prompt_text=f"GOAL: {goal}\nCONTEXT: {context}\nTOOLS: {json.dumps(tools)}",
                        system_message="Execute Tool",
                        response_text=json.dumps(result) if isinstance(result, dict) else str(result),
                        provider_name=provider_name
                    )

                return result
            except Exception as e:
                if telemetry:
                    telemetry.log_system_event(user_id, "Router", f"Tool routing FAILED for {provider_name}: {str(e)[:100]}", level="warning")
                last_error = e
                continue
                
        raise Exception(f"All providers failed to route tool call. Last error: {str(last_error)}")
