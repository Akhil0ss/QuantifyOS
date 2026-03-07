import asyncio
import json
import os
import time
import hashlib
from datetime import datetime
from typing import Dict, Any, List
from app.autonomy.healing import SelfHealingAgent
from app.autonomy.research import CompetitorIntelligenceEngine
from app.autonomy.monitoring import MonitoringEngine
from app.autonomy.generator import ModuleGenerator
from app.autonomy.predictive import PredictiveEvolutionEngine
from app.services.entities import ConfigService
from app.services.telemetry import TelemetryService
from app.core.saas import WorkspaceManager, SaaSController
from app.core.security import SecurityEngine
from app.core.admin_config import system_config
from app.autonomy.simulator import EvolutionSimulator
from app.services.mcp import mcp_host
from app.services.evolution import EvolutionService

class EvolutionOrchestrator:
    """
    Phase 30: Controlled Evolution Orchestrator.
    Manages the 6-hour cycle of gap detection and module generation.
    """
    def __init__(self, user_id: str, provider_config: Dict[str, Any]):
        self.user_id = user_id
        self.provider_config = provider_config
        self.healer = SelfHealingAgent(provider_config, user_id)
        self.researcher = CompetitorIntelligenceEngine(provider_config, user_id)
        self.monitor = MonitoringEngine(provider_config, user_id)
        self.generator = ModuleGenerator(provider_config, user_id)
        self.predictor = PredictiveEvolutionEngine(provider_config, user_id)
        self.simulator = EvolutionSimulator(user_id)
        self.mcp = mcp_host
        self.telemetry = TelemetryService()
        self.saas = SaaSController()
        
        self.evolution_service = EvolutionService()

        # Sovereign V15.1: Path to the global workspace-transcendent marketplace
        # Correctly pointing to f:\Quantify OS\marketplace
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        self.market_path = os.path.join(base_dir, "marketplace")
        if not os.path.exists(self.market_path):
            os.makedirs(self.market_path, exist_ok=True)

    async def autonomous_market_scan(self, workspace_id: str):
        """
        Sovereign V15.1: Proactive Global Evolution.
        Scrapes news, predicts features, and installs them in the marketplace.
        """
        self.telemetry.log_process(workspace_id, "evolution", "Sovereign Scan", "Initiating proactive market and tech analysis...", "thought")
        
        # 1. Perform deep niche research
        niche = "Post-LLM Autonomous Operating Systems and Agentic Infrastructure"
        try:
            features = await self.researcher.perform_market_research(workspace_id, niche)
        except Exception as e:
            print(f"SOVEREIGN: Market research failed: {e}")
            features = []
        
        if not features:
            self.telemetry.log_process(workspace_id, "evolution", "Scan Result", "No new gaps identified in the current tech cycle.", "system")
            return

        # 2. Forge tools for gaps
        for feature in features:
            cap_name = feature["Feature Name"].lower().replace(' ', '_')
            
            # Check if already in marketplace
            if os.path.exists(os.path.join(self.market_path, f"{cap_name}.py")):
                print(f"SOVEREIGN: Tool '{cap_name}' already exists in marketplace. Skipping.")
                continue
                
            self.telemetry.log_process(workspace_id, "evolution", "Tool Forging", f"Generating sovereign upgrade: {cap_name}", "thought")
            
            gap_def = {
                "capability_name": cap_name,
                "description": feature["Description"],
                "is_hardware": "hardware" in feature["Description"].lower() or "iot" in feature["Description"].lower()
            }
            
            try:
                result = await self.generator.generate_module(gap_def, workspace_id)
                
                if result["success"]:
                    # Move to global marketplace
                    generated_path = result["file_path"]
                    market_dest = os.path.join(self.market_path, f"{cap_name}.py")
                    
                    import shutil
                    shutil.copy2(generated_path, market_dest)
                    
                    # Signal global RTDB of new sovereign feature
                    try:
                        from app.services.base_rtdb import BaseRTDBService
                        global_db = BaseRTDBService("marketplace_announcements")
                        global_db.push({
                            "type": "new_sovereign_tool",
                            "tool": cap_name,
                            "description": feature["Description"],
                            "timestamp": int(time.time() * 1000)
                        })
                    except: pass
                    
                    self.telemetry.log_process(workspace_id, "evolution", "Upgrade Deployed", f"Sovereign tool '{cap_name}' added to Global Marketplace.", "system")
                else:
                    print(f"SOVEREIGN: Failed to forge {cap_name}: {result.get('error')}")
            except Exception as e:
                print(f"SOVEREIGN: Generation crashed for {cap_name}: {e}")

    async def run_cycle(self, workspace_id: str):
        """
        Runs a single strategic and predictive evolution cycle if enabled.
        """
        if not system_config.get("evolution_enabled") or system_config.get("emergency_stop"):
            print(f"DEBUG: Evolution is GLOBALLY DISABLED or EMERGENCY STOP is ACTIVE. Skipping cycle for {workspace_id}.")
            return
            
        try:
            # 1. SaaS & Safety Checks
            if not self.saas.check_task_limit(workspace_id):
                print(f"EVOLUTION: Workspace {workspace_id} over task limit. Pass skipped.")
                return

            state = self._get_state(workspace_id)


            if state["failure_count"] >= 3:
                print("EVOLUTION: Circuit breaker active (>= 3 failures). Evolution halted until daily reset.")
                self.telemetry.log_system_event(self.user_id, "Orchestrator", "Evolution HALTED - Circuit breaker active. Will auto-reset at next daily cycle.")
                return

            if not os.environ.get("TEST_MODE") and not system_config.get("evolution_active", True):
                print("EVOLUTION: Deactivated by admin toggle.")
                return
            
            # 1.1 WORKSPACE KILL SWITCH CHECK (Firebase)
            from app.core.firebase_admin_sdk import db_admin
            ws_kill = db_admin.reference(f"workspace_states/{workspace_id}/kill_switch").get()
            if ws_kill:
                print(f"EVOLUTION: Workspace {workspace_id} KILL SWITCH is ACTIVE. Aborting cycle.")
                self.telemetry.log_system_event(self.user_id, "Orchestrator", f"Cycle aborted - Workspace Kill Switch active for {workspace_id}")
                return

            print(f"SCHEDULER: Starting evolution pass for {workspace_id}")
            
            # 2. Strategic Gap Detection
            gaps = await self.monitor.analyze_gaps(workspace_id)
            
            if gaps and state["daily_count"] < 2:
                top_gap = gaps[0]
                # Log Strategic Decision
                self._log_intel(workspace_id, {
                    "decision": "Selecting Top Priority Gap",
                    "gap": top_gap["capability_name"],
                    "score": top_gap["priority_score"],
                    "justification": top_gap["strategic_justification"]
                })

                # security check
                security = SecurityEngine(workspace_id)
                if not security.check_permissions(top_gap["capability_name"]):
                    print(f"SECURITY: Gap '{top_gap['capability_name']}' BLOCKED by workspace permissions.")
                    self._log_history(workspace_id, {
                        "capability": top_gap["capability_name"],
                        "event": "Security Block",
                        "reason": "Workspace policy restriction."
                    })
                    return # Skip this gap
                
                # 3. Controlled Module Creation — with conflict detection
                # STABILITY: Check if capability already exists and compare
                wm_check = WorkspaceManager(workspace_id)
                idx_file = wm_check.get_path("capability_index.json")
                if os.path.exists(idx_file):
                    with open(idx_file, "r") as f:
                        existing_index = json.load(f)
                    existing_cap = existing_index.get(top_gap["capability_name"].lower().replace(' ', '_'))
                    if existing_cap and existing_cap.get("available") and existing_cap.get("file_path"):
                        # Capability exists — check if file content hash matches
                        existing_path = existing_cap["file_path"]
                        if os.path.exists(existing_path):
                            with open(existing_path, "r") as f:
                                existing_hash = hashlib.sha256(f.read().encode()).hexdigest()
                            self._log_history(workspace_id, {
                                "capability": top_gap["capability_name"],
                                "event": "Conflict Detection",
                                "existing_hash": existing_hash[:16],
                                "result": "Skipped — working capability already exists."
                            })
                            print(f"EVOLUTION: Skipping '{top_gap['capability_name']}' — already exists with hash {existing_hash[:16]}")
                            return

                # S-TIER: Shadow Simulation Governance
                sim_result = await self.simulator.simulate_impact(workspace_id, top_gap)
                if sim_result["status"] == "FAIL" or sim_result["recommendation"] == "BLOCK":
                    print(f"GOVERNANCE: Evolution BLOCKED by Shadow Simulation. Reason: {sim_result.get('recommendation')}")
                    self._log_history(workspace_id, {
                        "capability": top_gap["capability_name"],
                        "event": "Simulation Block",
                        "metrics": sim_result["impact_metrics"]
                    })
                    return

                result = await self.generator.generate_module(top_gap, workspace_id)
                
                if result["success"]:
                    self._log_history(workspace_id, {
                        "capability": top_gap["capability_name"],
                        "event": "Module Created",
                        "module": result["file_path"],
                        "result": "Success"
                    })
                else:
                    self._log_history(workspace_id, {
                        "capability": top_gap["capability_name"],
                        "event": "Generation Failed",
                        "error": result.get("error", "Unknown error"),
                        "result": "Sandbox Failure"
                    })
            
            # 4. Predictive Evolution Phase
            if system_config.get("predictive_evolution_enabled") and state["daily_count"] < 2 and state.get("proactive_count", 0) < 1:
                print("EVOLUTION: Checking for predictive opportunities...")
                await self.predictor.analyze_trends(workspace_id)
                directive = system_config.get("primary_directive", "Global Automation")
                forecasts = await self.predictor.generate_forecast(directive, workspace_id)
                
                if forecasts:
                    top_forecast = forecasts[0]
                    print(f"EVOLUTION: Proactively generating forecast: {top_forecast['capability_name']}")
                    
                    # Log Proactive Decision
                    proactive_entry = {
                        "timestamp": datetime.now().isoformat(),
                        "forecast": top_forecast,
                        "reasoning": "High trend alignment & strategic ROI."
                    }
                    
                    # Run Generator
                    result = await self.generator.generate_module(top_forecast, workspace_id)
                    
                    if result["success"]:
                        proactive_entry["result"] = "Success"
                    else:
                        proactive_entry["result"] = "Failure"
                        proactive_entry["error"] = result.get("error")

                    # Log proactive result
                    self.evolution_service.log_event(workspace_id, "autonomous_upgrade", top_forecast['capability_name'], "success" if result["success"] else "failure", proactive_entry)

            # 5. Sovereign V15.1: Global Marketplace Scan
            # This scans the web for trends and populates the marketplace proactively
            if system_config.get("sovereign_autonomy_enabled", True):
                await self.autonomous_market_scan(workspace_id)

            # 6. Competitive Intelligence & Revalidation
            await self.revalidate_capabilities(workspace_id)
            await self.researcher.perform_market_research(workspace_id)

            # 7. Record Intelligence & Growth
            intelligence = IntelligenceEngine(workspace_id)
            intelligence.record_evolution_result(True)
            
            # Gather growth stats
            wm = WorkspaceManager(workspace_id)
            index_file = wm.get_path("capability_index.json")
            cap_count = 0
            if os.path.exists(index_file):
                with open(index_file, "r") as f:
                    cap_count = len(json.load(f))
            
            intelligence.track_growth(
                capability_count=cap_count,
                module_count=cap_count,
                hardware_count=0, # placeholder
                protocol_count=8 # REST, Serial, USB, etc.
            )
            
        except Exception as e:
            import traceback
            print(f"Evolution cycle error: {e}")
            traceback.print_exc()
            try:
                IntelligenceEngine(workspace_id).record_evolution_result(False)
            except: pass

    async def start_evolution_cycle(self, workspace_id: str):
        """
        Runs a full evolution loop every 12 hours (Sovereign mode).
        """
        while True:
            await self.run_cycle(workspace_id)
            # Cycle interval increased for Sovereign stability
            await asyncio.sleep(12 * 3600)

async def run_global_evolution(user_id: str, workspace_id: str):
    """
    Entry point for the global evolution loop.
    """
    config_service = ConfigService()
    ai_config = config_service.get_ai_config(user_id)
    if not ai_config: return
    
    active_id = ai_config.get("active_provider_id")
    provider_def = next((p for p in ai_config.get("fallback_pool", []) if p.get("id") == active_id), ai_config.get("fallback_pool", [{}])[0])
    
    orchestrator = EvolutionOrchestrator(user_id, provider_def)
    await orchestrator.start_evolution_cycle(workspace_id)
