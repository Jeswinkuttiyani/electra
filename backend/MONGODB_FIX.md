# MongoDB Atlas SSL Connection Issue - Solutions

## Problem
Your MongoDB Atlas cluster is refusing SSL/TLS connections with `tlsv1 alert internal error`.

## Root Causes (in order of likelihood):
1. **Network/Firewall Issue** - MongoDB Atlas may be blocking your IP
2. **MongoDB Atlas Settings** - Cluster might not be accessible
3. **SSL Certificate Issue** - Windows/Python SSL configuration

## Immediate Actions Required:

### ✅ Step 1: Check MongoDB Atlas Network Whitelist
1. Go to https://cloud.mongodb.com/
2. Select your organization/project
3. Click on your **"electra"** cluster
4. Click **Network Access** in the left sidebar
5. Check if your IP address is whitelisted
   - If not, click **+ Add IP Address**
   - Choose one of:
     - **Allow from anywhere** (0.0.0.0/0) - For development only
     - Your current IP address
6. Click **Confirm**

### ✅ Step 2: Verify Database User Credentials
1. Go to **Database Access** in MongoDB Atlas
2. Check if user `Electra_db` exists
3. Verify the password: `xdXGFut3KKyiViOG`
4. Reset password if needed

### ✅ Step 3: Test Connection After Changes
```bash
cd backend
python test_mongo_connection.py
```

## If Step 1-3 Don't Work:

### Option A: Use Local MongoDB (Recommended for Development)
1. Install MongoDB Community Edition on Windows
2. Update `.env`:
```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=voting_system
```
3. Test connection

### Option B: Switch to Different Database
Use SQLite instead (minimal changes):
```bash
pip install flask-sqlalchemy
# Update app.py to use SQLite instead of MongoDB
```

## For Production:
Contact MongoDB Atlas support or check:
- IP whitelist status
- Cluster tier (free tier has connectivity issues)
- Regional availability
- IP allow-list rules
