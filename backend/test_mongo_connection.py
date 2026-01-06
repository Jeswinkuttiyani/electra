"""Test MongoDB connection without SSL"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("MONGODB CONNECTION DIAGNOSTICS")
print("=" * 60)

# Test 1: Standard connection with SRV
print("\n1. Testing standard SRV connection...")
try:
    uri = "mongodb+srv://Electra_db:xdXGFut3KKyiViOG@electra.pwsruvj.mongodb.net/voting_system?retryWrites=true&w=majority"
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("   ✓ SUCCESS!")
    db = client.voting_system
    print(f"   Users: {db.users.count_documents({})}")
    print(f"   Admins: {db.users.count_documents({'user_type': 'admin'})}")
except Exception as e:
    print(f"   ✗ FAILED: {type(e).__name__}")

# Test 2: Try with DNS resolution disabled
print("\n2. Testing with direct host resolution...")
try:
    uri = "mongodb://Electra_db:xdXGFut3KKyiViOG@ac-xcux0m2-shard-00-00.pwsruvj.mongodb.net:27017,ac-xcux0m2-shard-00-01.pwsruvj.mongodb.net:27017,ac-xcux0m2-shard-00-02.pwsruvj.mongodb.net:27017/voting_system?replicaSet=atlas-pwsruvj-shard-0&retryWrites=true&w=majority&authSource=admin"
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("   ✓ SUCCESS!")
except Exception as e:
    print(f"   ✗ FAILED: {type(e).__name__}")

# Test 3: Check network connectivity
print("\n3. Checking network connectivity to MongoDB...")
try:
    import socket
    socket.create_connection(("ac-xcux0m2-shard-00-00.pwsruvj.mongodb.net", 27017), timeout=5)
    print("   ✓ Network connection OK")
except Exception as e:
    print(f"   ✗ Network error: {e}")

# Test 4: Check SSL/TLS
print("\n4. Checking SSL/TLS support...")
try:
    import ssl
    print(f"   OpenSSL version: {ssl.OPENSSL_VERSION}")
    import certifi
    print(f"   CA bundle: {certifi.where()}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
