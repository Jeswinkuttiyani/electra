# Environment Variables Setup Guide

## Location
Create a file named `.env` in the `backend` folder (same folder as `app.py`)

## Required Variables (Must Have)

Add these to your `.env` file:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017
DB_NAME=voting_system

# JWT Authentication
JWT_SECRET=your-secret-key-here-change-this-to-random-string
JWT_EXPIRES_MINUTES=60

# Server Port (optional, defaults to 5000)
PORT=5000
```

## SMS Configuration (Choose ONE Option)

### Option 1: Test Mode (Default - No SMS sent, OTP logged to console)
```env
SMS_PROVIDER=test
```
**Use this for:** Development and testing. OTP will be printed in console/terminal.

---

### Option 2: Twilio SMS (Recommended for Production)

**Step 1:** Sign up at [Twilio.com](https://www.twilio.com) (free trial available)

**Step 2:** Get your credentials from Twilio Dashboard:
- Account SID
- Auth Token  
- Phone Number (from Twilio)

**Step 3:** Add to `.env`:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

**Step 4:** Install Twilio library:
```bash
pip install twilio
```

---

### Option 3: AWS SNS SMS

**Step 1:** Set up AWS account and get credentials

**Step 2:** Add to `.env`:
```env
SMS_PROVIDER=aws_sns
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

**Step 3:** Install AWS SDK:
```bash
pip install boto3
```

---

## Complete Example `.env` File

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017
DB_NAME=voting_system

# JWT Authentication
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_MINUTES=60

# Server Port
PORT=5000

# SMS Configuration (Choose one)
# For testing (OTP in console):
SMS_PROVIDER=test

# For Twilio (uncomment and fill):
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your_auth_token_here
# TWILIO_FROM_NUMBER=+1234567890

# For AWS SNS (uncomment and fill):
# SMS_PROVIDER=aws_sns
# AWS_ACCESS_KEY_ID=your_access_key_id
# AWS_SECRET_ACCESS_KEY=your_secret_access_key
# AWS_REGION=us-east-1
```

## Quick Start (Testing Mode)

If you just want to test the application without setting up SMS:

1. Create `.env` file in `backend` folder
2. Copy this minimal configuration:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=voting_system
JWT_SECRET=change-this-to-random-secret-key
SMS_PROVIDER=test
```

3. OTP will be printed in your terminal/console when sent

## Important Notes

- ⚠️ **Never commit `.env` file to Git** - it contains sensitive information
- 🔒 **Change JWT_SECRET** to a random string in production
- 📱 **Phone numbers must be in E.164 format** (e.g., +1234567890) for SMS to work
- 🧪 **Use `SMS_PROVIDER=test`** during development to see OTP in console

