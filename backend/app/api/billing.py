"""
Stripe Payment Integration for Quantify OS SaaS.
Handles subscription creation, plan changes, and webhook processing.
"""

import os
import json
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Depends
from app.core.auth_middleware import get_current_user

router = APIRouter(prefix="/api/billing", tags=["Billing"])

# Stripe will be imported at runtime if available
stripe = None
try:
    import stripe as stripe_lib
    stripe = stripe_lib
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
except ImportError:
    print("WARNING: stripe package not installed. Billing endpoints will return mock data.")

# Plan definitions
PLANS = {
    "free": {
        "name": "Free",
        "price_monthly": 0,
        "stripe_price_id": None,
        "max_agents": 5,
        "max_tasks_per_hour": 50,
        "evolution_enabled": True,
        "predictive_evolution": False,
        "hardware_bridge": False,
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 29,
        "stripe_price_id": os.environ.get("STRIPE_PRO_PRICE_ID", "price_pro_monthly"),
        "max_agents": 20,
        "max_tasks_per_hour": 200,
        "evolution_enabled": True,
        "predictive_evolution": True,
        "hardware_bridge": True,
    },
    "enterprise": {
        "name": "Enterprise",
        "price_monthly": 99,
        "stripe_price_id": os.environ.get("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise_monthly"),
        "max_agents": 100,
        "max_tasks_per_hour": 1000,
        "evolution_enabled": True,
        "predictive_evolution": True,
        "hardware_bridge": True,
    }
}

# Local subscription store
SUBS_FILE = "subscriptions.json"

def _load_subs() -> Dict:
    if os.path.exists(SUBS_FILE):
        with open(SUBS_FILE, "r") as f:
            return json.load(f)
    return {}

def _save_subs(data: Dict):
    with open(SUBS_FILE, "w") as f:
        json.dump(data, f, indent=2)

def _apply_plan_limits(user_id: str, plan_id: str):
    """Apply plan limits to the user's workspace."""
    from app.core.saas import SaaSController
    plan = PLANS.get(plan_id, PLANS["free"])
    sc = SaaSController()
    limits = {
        "max_agents": plan["max_agents"],
        "max_tasks_per_hour": plan["max_tasks_per_hour"],
    }
    sc.set_limits(f"default-{user_id[:8]}", limits)

# ─── API Endpoints ───

@router.get("/plans")
async def get_plans():
    """Returns all available subscription plans."""
    return {pid: {k: v for k, v in p.items() if k != "stripe_price_id"} for pid, p in PLANS.items()}

@router.get("/subscription")
async def get_subscription(user: dict = Depends(get_current_user)):
    """Returns the current user's subscription status."""
    subs = _load_subs()
    user_sub = subs.get(user["uid"], {
        "plan": "free",
        "status": "active",
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "created_at": time.time()
    })
    plan_info = PLANS.get(user_sub["plan"], PLANS["free"])
    return {**user_sub, "plan_details": {k: v for k, v in plan_info.items() if k != "stripe_price_id"}}

@router.post("/checkout")
async def create_checkout(request: Request, user: dict = Depends(get_current_user)):
    """Creates a Stripe Checkout Session for plan upgrade."""
    body = await request.json()
    plan_id = body.get("plan", "pro")
    
    if plan_id not in PLANS or plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan selection.")
    
    plan = PLANS[plan_id]
    
    if stripe and stripe.api_key:
        try:
            # Create or retrieve Stripe customer
            subs = _load_subs()
            user_sub = subs.get(user["uid"], {})
            customer_id = user_sub.get("stripe_customer_id")
            
            if not customer_id:
                customer = stripe.Customer.create(
                    email=user.get("email", ""),
                    metadata={"uid": user["uid"]}
                )
                customer_id = customer.id
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{"price": plan["stripe_price_id"], "quantity": 1}],
                mode="subscription",
                success_url=os.environ.get("FRONTEND_URL", "http://localhost:3000") + "/dashboard?upgrade=success",
                cancel_url=os.environ.get("FRONTEND_URL", "http://localhost:3000") + "/dashboard?upgrade=cancelled",
                metadata={"uid": user["uid"], "plan": plan_id}
            )
            return {"checkout_url": session.url, "session_id": session.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
    else:
        # Mock mode — apply plan directly without payment
        subs = _load_subs()
        subs[user["uid"]] = {
            "plan": plan_id,
            "status": "active",
            "stripe_customer_id": None,
            "stripe_subscription_id": f"mock_sub_{int(time.time())}",
            "created_at": time.time()
        }
        _save_subs(subs)
        _apply_plan_limits(user["uid"], plan_id)
        return {"checkout_url": None, "message": f"Plan upgraded to {plan_id} (mock mode — no Stripe key configured)."}

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handles Stripe webhook events for subscription lifecycle."""
    if not stripe or not stripe.api_key:
        return {"status": "skipped", "reason": "Stripe not configured"}
    
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    
    subs = _load_subs()
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        uid = session["metadata"]["uid"]
        plan_id = session["metadata"]["plan"]
        subs[uid] = {
            "plan": plan_id,
            "status": "active",
            "stripe_customer_id": session.get("customer"),
            "stripe_subscription_id": session.get("subscription"),
            "created_at": time.time()
        }
        _save_subs(subs)
        _apply_plan_limits(uid, plan_id)
    
    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        for uid, data in subs.items():
            if data.get("stripe_subscription_id") == sub["id"]:
                data["plan"] = "free"
                data["status"] = "cancelled"
                _save_subs(subs)
                _apply_plan_limits(uid, "free")
                break
    
    elif event["type"] == "invoice.payment_failed":
        inv = event["data"]["object"]
        customer_id = inv.get("customer")
        for uid, data in subs.items():
            if data.get("stripe_customer_id") == customer_id:
                data["status"] = "past_due"
                _save_subs(subs)
                break
    
    return {"status": "ok"}

@router.post("/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancels the user's subscription and downgrades to free."""
    subs = _load_subs()
    user_sub = subs.get(user["uid"])
    
    if not user_sub or user_sub["plan"] == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription.")
    
    if stripe and stripe.api_key and user_sub.get("stripe_subscription_id"):
        try:
            stripe.Subscription.delete(user_sub["stripe_subscription_id"])
        except Exception as e:
            print(f"Stripe cancellation error: {e}")
    
    user_sub["plan"] = "free"
    user_sub["status"] = "cancelled"
    _save_subs(subs)
    _apply_plan_limits(user["uid"], "free")
    
    return {"status": "cancelled", "plan": "free"}
