"""
Create an Admin Account

This script creates an admin account directly in the MongoDB database.

Usage:
    python create_admin.py
"""

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv
import os
import datetime

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

def create_admin():
    """Create an admin account"""
    try:
        # Get admin credentials from user
        email = input("Enter admin email: ").strip()
        password = input("Enter admin password (min 6 characters): ").strip()
        name = input("Enter admin name (optional): ").strip() or "Admin"
        
        # Validation
        if not email or "@" not in email:
            print("❌ Invalid email format!")
            return
        
        if len(password) < 6:
            print("❌ Password must be at least 6 characters!")
            return
        
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db["users"]
        
        # Check if email already exists
        existing_user = users.find_one({"email": email})
        if existing_user:
            print(f"❌ Email '{email}' already exists in the database!")
            client.close()
            return
        
        # Create admin user
        hashed_password = generate_password_hash(password)
        
        admin_data = {
            "email": email,
            "password": hashed_password,
            "name": name,
            "user_type": "admin",
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }
        
        result = users.insert_one(admin_data)
        
        print("\n✅ Admin account created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   User ID: {result.inserted_id}")
        print("\n🔐 You can now login with these credentials!")
        
        # Show database stats
        print(f"\n📊 Database Stats:")
        print(f"  - Total users: {users.count_documents({})}")
        print(f"  - Voters: {users.count_documents({'user_type': 'voter'})}")
        print(f"  - Admins: {users.count_documents({'user_type': 'admin'})}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error creating admin account: {str(e)}")
        raise

if __name__ == "__main__":
    create_admin()
