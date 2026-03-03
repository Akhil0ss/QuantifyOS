import os
import firebase_admin
from firebase_admin import credentials, db, auth
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    """
    Initializes Firebase Admin SDK using the service account key.
    """
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    database_url = os.getenv("FIREBASE_DATABASE_URL")
    
    if not cred_path or not os.path.exists(cred_path):
        print(f"Warning: Firebase service account key not found at {cred_path}.")
        return None, auth
    
    if not database_url:
        print("Warning: FIREBASE_DATABASE_URL not set in .env.")
        return None, auth

    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {
            'databaseURL': database_url
        })
    
    return db, auth

# Initialize and export db and auth_admin
db_admin, auth_admin = initialize_firebase()
