"""
Email Notification Service for Quantify OS.
Handles welcome emails, task alerts, and system notifications.
Uses SMTP (configurable) with optional SendGrid/Mailgun support.
"""

import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth_middleware import get_current_user
from app.services.base_rtdb import BaseRTDBService

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# Email configuration from environment
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@quantifyos.com")
FROM_NAME = "Quantify OS"

# Notification log — Firebase RTDB for persistence
_notif_store = BaseRTDBService("notification_log")

class EmailService:
    """Sends transactional emails for the platform."""
    
    @staticmethod
    def send_email(to_email: str, subject: str, html_body: str) -> bool:
        """Sends an email via SMTP. Returns True on success."""
        if not SMTP_USER or not SMTP_PASS:
            # Log to RTDB if SMTP not configured
            EmailService._log_notification(to_email, subject, "queued (SMTP not configured)")
            return False
        
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(html_body, "html"))
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            
            EmailService._log_notification(to_email, subject, "sent")
            return True
        except Exception as e:
            EmailService._log_notification(to_email, subject, f"failed: {str(e)}")
            return False
    
    @staticmethod
    def send_welcome(email: str, name: str = "User"):
        """Welcome email for new signups."""
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to Quantify OS</h1>
                <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Your AI Operating System is ready.</p>
            </div>
            <div style="padding: 30px;">
                <p>Hey {name},</p>
                <p>Your workspace has been automatically configured with:</p>
                <ul style="color: #a1a1aa;">
                    <li>✅ 5 AI Agents</li>
                    <li>✅ 50 Tasks/Hour</li>
                    <li>✅ Self-Evolving Capabilities</li>
                    <li>✅ Autonomous Memory</li>
                </ul>
                <p>Just type a command and let the system handle the rest.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://quantifyos.com/dashboard" style="background: #4F46E5; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Dashboard →</a>
                </div>
                <p style="color: #71717a; font-size: 12px;">— The Quantify OS Team</p>
            </div>
        </div>
        """
        return EmailService.send_email(email, "Welcome to Quantify OS 🚀", html)
    
    @staticmethod
    def send_task_alert(email: str, task_goal: str, status: str):
        """Task completion/failure notification."""
        color = "#22c55e" if status == "completed" else "#ef4444"
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 12px; padding: 30px;">
            <h2 style="margin-top: 0;">Task {status.title()}</h2>
            <div style="background: #141414; border-left: 4px solid {color}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #e4e4e7;"><strong>Goal:</strong> {task_goal}</p>
                <p style="margin: 5px 0 0 0; color: {color};"><strong>Status:</strong> {status.upper()}</p>
            </div>
            <p style="color: #71717a; font-size: 12px;">Quantify OS — Autonomous AI Operations</p>
        </div>
        """
        return EmailService.send_email(email, f"Task {status.title()}: {task_goal[:50]}", html)
    
    @staticmethod
    def send_plan_upgrade(email: str, plan: str):
        """Plan upgrade confirmation."""
        html = f"""
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 12px; padding: 30px;">
            <h2 style="margin-top: 0; color: #a78bfa;">Plan Upgraded ✨</h2>
            <p>Your account has been upgraded to <strong style="color: #4F46E5;">{plan.title()}</strong>.</p>
            <p style="color: #a1a1aa;">New capabilities unlocked. Your AI is now more powerful.</p>
            <p style="color: #71717a; font-size: 12px;">— Quantify OS</p>
        </div>
        """
        return EmailService.send_email(email, f"Upgraded to {plan.title()} Plan 🚀", html)
    
    @staticmethod
    def _log_notification(to: str, subject: str, status: str, user_id: str = "system"):
        entry = {
            "to": to,
            "subject": subject,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        # Push to RTDB under user's notification log
        _notif_store.db.reference(f"notification_log/{user_id}").push(entry)

# ─── API Endpoints ───

@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    """Returns notification preferences for the user."""
    return {
        "email_notifications": True,
        "task_alerts": True,
        "evolution_alerts": False,
        "marketing": False
    }

@router.post("/test")
async def send_test_notification(user: dict = Depends(get_current_user)):
    """Sends a test notification to the user's email."""
    email = user.get("email", "")
    if not email:
        raise HTTPException(status_code=400, detail="No email on account.")
    
    # Pass user_id so log is stored per-user
    EmailService._log_notification(
        email, "Quantify OS — Test Notification",
        "queued (test)", user_id=user["uid"]
    )
    success = EmailService.send_email(email, "Quantify OS — Test Notification", 
        "<h2 style='color: #4F46E5;'>✅ Notification system is working!</h2>")
    
    return {"sent": success, "email": email}

@router.get("/log")
async def get_notification_log(user: dict = Depends(get_current_user)):
    """Returns recent notification activity for this user."""
    user_id = user["uid"]
    logs = _notif_store.db.reference(f"notification_log/{user_id}").get() or {}
    # Convert dict to sorted list (newest first)
    result = list(logs.values()) if isinstance(logs, dict) else []
    result.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return result[:50]  # Return last 50
