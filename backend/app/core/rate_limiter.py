"""
API Rate Limiting Middleware for Quantify OS.
Prevents abuse by enforcing per-user request limits.
"""

import time
import json
import os
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Token-bucket rate limiter per IP / authenticated user.
    Default: 100 requests per minute per client.
    """
    
    def __init__(self, app, requests_per_minute: int = 100, burst_limit: int = 20):
        super().__init__(app)
        self.rpm = requests_per_minute
        self.burst = burst_limit
        self.clients = defaultdict(lambda: {"tokens": burst_limit, "last_refill": time.time()})
        
        # Exempt paths (webhooks, health checks)
        self.exempt_paths = {"/api/billing/webhook", "/api/system/health", "/docs", "/redoc", "/openapi.json"}
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Skip rate limiting for exempt routes
        if path in self.exempt_paths:
            return await call_next(request)
        
        # Identify client by Authorization header (user) or IP
        auth = request.headers.get("Authorization", "")
        client_id = auth[:50] if auth else request.client.host if request.client else "unknown"
        
        client = self.clients[client_id]
        now = time.time()
        
        # Refill tokens based on elapsed time
        elapsed = now - client["last_refill"]
        refill = elapsed * (self.rpm / 60.0)
        client["tokens"] = min(self.burst, client["tokens"] + refill)
        client["last_refill"] = now
        
        # Check if request is allowed
        if client["tokens"] < 1:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": f"{self.rpm} requests/minute",
                    "retry_after_seconds": round(60 / self.rpm, 2)
                }
            )
        
        # Consume a token
        client["tokens"] -= 1
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rpm)
        response.headers["X-RateLimit-Remaining"] = str(int(client["tokens"]))
        response.headers["X-RateLimit-Reset"] = str(int(now + 60))
        
        return response
