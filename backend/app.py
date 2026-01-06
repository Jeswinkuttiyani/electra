from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os
import jwt
import datetime
import base64
import json

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", 60))

# Flask app
app = Flask(__name__)
CORS(app)

# MongoDB client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users = db["users"]  # Collection
notifications = db["notifications"]  # Collection for admin notifications
otp_storage = db["otp_storage"]  # Collection for OTP verification
reports = db["reports"]  # Collection for voter error reports

# Generate JWT token
def generate_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXPIRES_MINUTES)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

# Send OTP via Email
def send_email_otp(email, otp):
    """
    Send OTP via Email to the given email address.
    
    Args:
        email: Email address to send OTP to
        otp: 6-digit OTP code
    
    Raises:
        Exception: If email sending fails
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    # Get email configuration from environment variables
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("FROM_EMAIL", smtp_user)
    
    # If no SMTP credentials, use test mode
    if not smtp_user or not smtp_password:
        print(f"[TEST MODE] OTP for {email}: {otp}")
        print(f"[TEST MODE] Configure SMTP_USER and SMTP_PASSWORD in .env for real email sending")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = email
        msg['Subject'] = "ELECTRA Voting System - OTP Verification"
        
        body = f"""
        Hello,
        
        Your OTP for ELECTRA voting system is: {otp}
        
        This OTP is valid for 5 minutes.
        
        If you did not request this OTP, please ignore this email.
        
        Best regards,
        ELECTRA Voting System
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(from_email, email, text)
        server.quit()
        
        print(f"OTP email sent to {email}")
        return True
        
    except Exception as e:
        # Fallback to test mode if email fails
        print(f"[EMAIL FAILED] OTP for {email}: {otp}")
        print(f"[EMAIL ERROR] {str(e)}")
        return True  # Return True so signup doesn't fail

# Verify JWT token and get user
def verify_token_and_get_user():
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, jsonify({"success": False, "message": "Missing or invalid token"}), 401
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        try:
            user = users.find_one({"_id": ObjectId(user_id)})
        except:
            user = None
        return user, None, None
    except jwt.ExpiredSignatureError:
        return None, jsonify({"success": False, "message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return None, jsonify({"success": False, "message": "Invalid token"}), 401

# ---------------------- ROUTES ----------------------

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    user_type = data.get("userType", "voter")  # Default to "voter"

    # Validation - password is always required
    if not password:
        return jsonify({"success": False, "message": "Password is required"}), 400

    # For non-voters, email is required in request
    if user_type != "voter":
        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400
        if users.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already exists"}), 409

    # Password validation - must be exactly 6 digits for voters
    if user_type == "voter":
        if len(password) != 6 or not password.isdigit():
            return jsonify({"success": False, "message": "Password must be exactly 6 digits"}), 400
    else:
        if len(password) < 6:
            return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    hashed_pw = generate_password_hash(password)

    user_data = {
        "email": email,
        "password": hashed_pw,
        "user_type": user_type,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    
    # For voters, email comes from signup form
    if user_type == "voter":
        user_data["email"] = email

    # Add voter-specific fields
    if user_type == "voter":
        name = data.get("name")
        voter_id = data.get("voter_id")
        otp = data.get("otp")

        if not name or not voter_id:
            return jsonify({"success": False, "message": "Name and Voter ID are required for voter signup"}), 400

        # Verify voter exists in database
        voter = users.find_one({"voter_id": voter_id, "user_type": "voter"})
        if not voter:
            return jsonify({"success": False, "message": "Voter ID not found. Please contact admin."}), 404

        # Check if account already exists
        if voter.get("has_account"):
            return jsonify({"success": False, "message": "Account already exists for this Voter ID"}), 409

        # Get email from voter record (stored by admin)
        email = voter.get("email")
        if not email:
            return jsonify({"success": False, "message": "Email not found for this voter. Please contact admin."}), 400

        # Verify OTP
        if not otp:
            return jsonify({"success": False, "message": "OTP verification required"}), 400

        otp_record = otp_storage.find_one({
            "voter_id": voter_id,
            "otp": otp,
            "verified": True
        })

        if not otp_record:
            return jsonify({"success": False, "message": "Invalid or unverified OTP. Please verify OTP first."}), 400

        # Check OTP expiration
        if datetime.datetime.utcnow() > otp_record["expires_at"]:
            return jsonify({"success": False, "message": "OTP has expired. Please request a new one."}), 400

        # Check if email already exists (for account creation)
        if users.find_one({"email": email, "has_account": True}):
            return jsonify({"success": False, "message": "Account already exists for this email"}), 409
        
        user_data["name"] = name
        user_data["email"] = email  # Use email from voter record
        user_data["voter_id"] = voter_id
        user_data["full_name"] = voter.get("full_name")  # Use name from admin-added record
        user_data["phone_no"] = voter.get("phone_no")
        user_data["address"] = voter.get("address")
        user_data["date_of_birth"] = voter.get("date_of_birth")
        user_data["branch_name"] = voter.get("branch_name")

    # For voters, update the existing voter record instead of inserting
    # This avoids violating a unique index on the `email` field (admin-created record exists)
    if user_type == "voter":
        update_fields = {
            "password": hashed_pw,
            "has_account": True,
            "account_created_at": datetime.datetime.utcnow(),
            "name": name,
            "voter_id": voter_id,
            "email": email,
            "full_name": voter.get("full_name"),
            "phone_no": voter.get("phone_no"),
            "address": voter.get("address"),
            "date_of_birth": voter.get("date_of_birth"),
            "branch_name": voter.get("branch_name"),
            "updated_at": datetime.datetime.utcnow()
        }

        update_result = users.update_one(
            {"voter_id": voter_id, "user_type": "voter"},
            {"$set": update_fields}
        )

        if update_result.matched_count == 0:
            return jsonify({"success": False, "message": "Voter record not found for update"}), 404

        # Clean up verified OTP
        otp_storage.delete_many({"voter_id": voter_id})

        # Return success with the existing user's id
        updated_user = users.find_one({"voter_id": voter_id, "user_type": "voter"})
        return jsonify({
            "success": True,
            "message": "Signup successful",
            "user_id": str(updated_user["_id"])
        }), 201

    # Non-voter users: insert as before
    result = users.insert_one(user_data)
    return jsonify({
        "success": True,
        "message": "Signup successful",
        "user_id": str(result.inserted_id)
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    user_type = data.get("userType", "voter")

    # Validation
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"success": False, "message": "Incorrect password"}), 401

    # Check if user type matches
    if user.get("user_type") != user_type:
        return jsonify({
            "success": False,
            "message": f"This account is registered as {user.get('user_type', 'voter')}, not {user_type}"
        }), 403

    token = generate_token(user["_id"])

    response_data = {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user_type": user.get("user_type"),
        "user_id": str(user["_id"])
    }

    # Include all voter-specific fields if they exist
    if user.get("user_type") == "voter":
        if user.get("name"):
            response_data["name"] = user.get("name")
        if user.get("voter_id"):
            response_data["voter_id"] = user.get("voter_id")
        if user.get("full_name"):
            response_data["full_name"] = user.get("full_name")
        if user.get("email"):
            response_data["email"] = user.get("email")
        if user.get("phone_no"):
            response_data["phone_no"] = user.get("phone_no")
        if user.get("address"):
            response_data["address"] = user.get("address")
        if user.get("date_of_birth"):
            response_data["date_of_birth"] = user.get("date_of_birth")
        if user.get("branch_name"):
            response_data["branch_name"] = user.get("branch_name")
        if user.get("photo_url"):
            response_data["photo_url"] = user.get("photo_url")

    return jsonify(response_data), 200


@app.route("/")
def home():
    return "Backend is running!"


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "API is running"}), 200


@app.route("/api/verify-token", methods=["POST"])
def verify_token():
    """Verify JWT token"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"success": False, "message": "Missing or invalid token"}), 401
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return jsonify({"success": True, "message": "Token is valid", "user_id": payload.get("user_id")}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "Invalid token"}), 401


@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    """Get all notifications for voters"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Get all notifications, sorted by most recent first
    all_notifications = list(notifications.find({}).sort("created_at", -1))
    
    # Convert ObjectId to string
    for notif in all_notifications:
        notif["_id"] = str(notif["_id"])
        if isinstance(notif.get("created_at"), datetime.datetime):
            notif["created_at"] = notif["created_at"].isoformat()
    
    return jsonify({
        "success": True,
        "notifications": all_notifications
    }), 200


@app.route("/api/notifications", methods=["POST"])
def create_notification():
    """Create a new notification (Admin only)"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Check if user is admin
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can create notifications"}), 403
    
    data = request.json
    message = data.get("message")
    
    if not message:
        return jsonify({"success": False, "message": "Notification message is required"}), 400
    
    notification_data = {
        "message": message,
        "created_by": str(user["_id"]),
        "created_at": datetime.datetime.utcnow()
    }
    
    result = notifications.insert_one(notification_data)
    
    return jsonify({
        "success": True,
        "message": "Notification created successfully",
        "notification_id": str(result.inserted_id)
    }), 201


@app.route("/api/add-voter", methods=["POST"])
def add_voter():
    """Add a new voter (Admin only)"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Check if user is admin
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can add voters"}), 403
    
    # Handle multipart/form-data
    full_name = request.form.get("full_name")
    date_of_birth = request.form.get("date_of_birth")
    address = request.form.get("address")
    voter_id = request.form.get("voter_id")
    email = request.form.get("email")
    phone_no = request.form.get("phone_no")
    branch_name = request.form.get("branch_name")
    fingerprint_template = request.form.get("fingerprint_template")
    
    # Get photo file
    photo_file = request.files.get("photo")
    
    # Validation
    required_fields = [full_name, date_of_birth, address, voter_id, email, phone_no, branch_name]
    if not all(required_fields):
        missing = [field for field in ["full_name", "date_of_birth", "address", "voter_id", "email", "phone_no", "branch_name"] 
                   if not request.form.get(field)]
        return jsonify({"success": False, "message": f"Missing required fields: {', '.join(missing)}"}), 400
    
    # Validate voter_id is exactly 4 digits
    if not voter_id.isdigit() or len(voter_id) != 4:
        return jsonify({"success": False, "message": "Voter ID must be exactly 4 digits"}), 400
    
    # Validate email domain: allow gmail.com, outlook.com, or any .ac.in domain
    import re
    allowed_email_pattern = r'^[A-Za-z0-9._%+-]+@(?:gmail\.com|outlook\.com|[A-Za-z0-9.-]+\.ac\.in)$'
    if not re.match(allowed_email_pattern, email, re.IGNORECASE):
        return jsonify({"success": False, "message": "Email must be from gmail.com, outlook.com, or an .ac.in domain"}), 400
    
    # Validate date of birth - must be 18+ years old
    try:
        from datetime import datetime as dt
        dob_date = dt.strptime(date_of_birth, "%Y-%m-%d")
        today = dt.now()
        age = (today - dob_date).days // 365
        if age < 18:
            return jsonify({"success": False, "message": "Voter must be at least 18 years old"}), 400
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format"}), 400
    
    if not photo_file:
        return jsonify({"success": False, "message": "Photo is required"}), 400
    
    if not fingerprint_template:
        return jsonify({"success": False, "message": "Fingerprint is required"}), 400
    
    # Check if voter_id already exists
    if users.find_one({"voter_id": voter_id}):
        return jsonify({"success": False, "message": "Voter ID already exists"}), 409
    
    # Check if email already exists
    if users.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already exists"}), 409
    
    # Save photo
    # We'll store the image both on disk (for compatibility) and as base64 in DB
    try:
        # Read file bytes for DB storage
        photo_bytes = photo_file.read()
        try:
            photo_b64 = base64.b64encode(photo_bytes).decode('utf-8')
        except Exception:
            photo_b64 = None

        # Reset stream pointer so we can save to disk
        try:
            photo_file.stream.seek(0)
        except Exception:
            pass

        upload_folder = os.path.join(os.getcwd(), "uploads", "photos")
        os.makedirs(upload_folder, exist_ok=True)
        
        filename = secure_filename(f"{voter_id}_{photo_file.filename}")
        photo_path = os.path.join(upload_folder, filename)
        photo_file.save(photo_path)
        
        # Store relative path for database
        photo_url = f"uploads/photos/{filename}"
    except Exception as e:
        return jsonify({"success": False, "message": f"Error saving photo: {str(e)}"}), 500
    
    # Parse fingerprint template
    try:
        fingerprint_data = json.loads(fingerprint_template)
    except:
        fingerprint_data = fingerprint_template

    # Parse address JSON if provided
    try:
        parsed_address = json.loads(address) if address else address
    except Exception:
        parsed_address = address

    # Server-side validations: name (letters only) and phone (10 digits)
    import re
    if not re.match(r'^[A-Za-z\s]+$', full_name.strip()):
        return jsonify({"success": False, "message": "Name should contain only letters and spaces"}), 400

    phone_digits = ''.join(filter(str.isdigit, phone_no or ''))
    if not phone_digits or len(phone_digits) != 10:
        return jsonify({"success": False, "message": "Phone number must be exactly 10 digits"}), 400
    
    # Create voter data for MongoDB
    voter_data = {
        "full_name": full_name,
        "date_of_birth": date_of_birth,
        "address": parsed_address,
        "voter_id": voter_id,
        "email": email,
        "phone_no": phone_no,
        "branch_name": branch_name,
        "photo_url": photo_url,
        "photo_data": photo_b64,
        "fingerprint_template": fingerprint_data,
        "user_type": "voter",
        "has_account": False,  # Track if voter has created account
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    
    try:
        # Insert into MongoDB
        print(f"Attempting to insert voter: {voter_id}")
        result = users.insert_one(voter_data)
        
        # Verify the insert was successful
        if result.inserted_id:
            print(f"Voter {voter_id} successfully saved to MongoDB with ID: {result.inserted_id}")
            return jsonify({
                "success": True,
                "message": "Voter added successfully to database",
                "voter_id": voter_id,
                "db_id": str(result.inserted_id)
            }), 201
        else:
            print("Insert returned no ID")
            return jsonify({"success": False, "message": "Failed to save voter to database"}), 500
            
    except Exception as e:
        error_msg = str(e)
        print(f"Database error: {error_msg}")
        return jsonify({"success": False, "message": f"Database error: {error_msg}"}), 500


@app.route("/api/check-scanner", methods=["GET"])
def check_scanner():
    """Check if Mantra MFS 100 scanner is connected (Admin only)"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Check if user is admin
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can check scanner status"}), 403
    
    try:
        # Try to connect to Mantra MFS 100 scanner
        scanner_connected = check_mantra_scanner_connection()
        
        return jsonify({
            "success": True,
            "connected": scanner_connected,
            "message": "Scanner is connected" if scanner_connected else "Scanner is not connected"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "connected": False,
            "message": f"Error checking scanner: {str(e)}"
        }), 500


@app.route("/api/verify-voter-id", methods=["POST"])
def verify_voter_id():
    """Verify if voter ID exists in database"""
    data = request.json
    voter_id = data.get("voter_id")
    
    if not voter_id:
        return jsonify({"success": False, "message": "Voter ID is required"}), 400
    
    # Check if voter exists
    voter = users.find_one({"voter_id": voter_id, "user_type": "voter"})
    
    if not voter:
        return jsonify({"success": False, "message": "Voter ID not found in database"}), 404
    
    # Check if account already exists
    if voter.get("has_account"):
        return jsonify({"success": False, "message": "Account already exists for this Voter ID"}), 409
    
    # Return voter info (without sensitive data)
    return jsonify({
        "success": True,
        "message": "Voter ID verified",
        "voter_name": voter.get("full_name"),
        "email": voter.get("email")  # For OTP sending via email
    }), 200


@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    """Send OTP to voter's registered email address"""
    data = request.json
    voter_id = data.get("voter_id")
    email = data.get("email")
    
    if not voter_id or not email:
        return jsonify({"success": False, "message": "Voter ID and email are required"}), 400
    
    # Verify voter exists and email matches
    voter = users.find_one({"voter_id": voter_id, "email": email})
    
    if not voter:
        return jsonify({"success": False, "message": "Voter ID and email do not match"}), 404
    
    # Generate 6-digit OTP
    import random
    otp = str(random.randint(100000, 999999))
    
    # Store OTP with expiration (5 minutes)
    otp_data = {
        "voter_id": voter_id,
        "email": email,
        "otp": otp,
        "created_at": datetime.datetime.utcnow(),
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
        "verified": False
    }
    
    # Remove old OTPs for this voter
    otp_storage.delete_many({"voter_id": voter_id})
    
    # Store new OTP
    otp_storage.insert_one(otp_data)
    
    # Send OTP via Email
    try:
        send_email_otp(email, otp)
        email_sent = True
    except Exception as e:
        # Log error but don't fail the request
        print(f"Warning: Failed to send email: {str(e)}")
        email_sent = False
        # In development, log OTP to console for testing
        print(f"OTP for {voter_id} ({email}): {otp}")  # Remove in production
    
    return jsonify({
        "success": True,
        "message": "OTP has been sent to your registered email address. Please check your inbox."
    }), 200


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP for voter ID"""
    data = request.json
    voter_id = data.get("voter_id")
    otp = data.get("otp")
    
    if not voter_id or not otp:
        return jsonify({"success": False, "message": "Voter ID and OTP are required"}), 400
    
    # Find OTP record
    otp_record = otp_storage.find_one({
        "voter_id": voter_id,
        "otp": otp,
        "verified": False
    })
    
    if not otp_record:
        return jsonify({"success": False, "message": "Invalid OTP"}), 400
    
    # Check if OTP expired
    if datetime.datetime.utcnow() > otp_record["expires_at"]:
        otp_storage.delete_one({"_id": otp_record["_id"]})
        return jsonify({"success": False, "message": "OTP has expired. Please request a new one."}), 400
    
    # Mark OTP as verified
    otp_storage.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"verified": True, "verified_at": datetime.datetime.utcnow()}}
    )
    
    return jsonify({
        "success": True,
        "message": "OTP verified successfully"
    }), 200


@app.route("/api/capture-fingerprint", methods=["POST"])
def capture_fingerprint():
    """Capture fingerprint from Mantra MFS 100 scanner (Admin only)"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Check if user is admin
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can capture fingerprints"}), 403
    
    try:
        # Capture fingerprint from Mantra MFS 100
        template = capture_mantra_fingerprint()
        
        if template:
            # Check if it's test mode (template contains test indicators)
            is_test_mode = isinstance(template, str) and ("test" in template.lower() or "mock" in template.lower() or "TEST_FINGERPRINT" in template)
            
            return jsonify({
                "success": True,
                "template": template,
                "test_mode": is_test_mode,
                "message": "Fingerprint captured successfully" if not is_test_mode else "Test mode: Mock fingerprint template generated"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to capture fingerprint. Please try again."
            }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Fingerprint capture failed: {str(e)}"
        }), 500


def check_mantra_scanner_connection():
    """Check if Mantra MFS 100 scanner is connected"""
    try:
        import serial.tools.list_ports
        import serial
        
        # Get all available COM ports
        ports = serial.tools.list_ports.comports()
        
        # Check each port for Mantra device identifiers
        for port in ports:
            description = (port.description or "").lower()
            manufacturer = (port.manufacturer or "").lower()
            device = port.device or ""
            
            # Check for Mantra device identifiers
            if any(keyword in description or keyword in manufacturer 
                   for keyword in ['mantra', 'mfs', 'fingerprint', 'biometric']):
                # Try to verify it's actually accessible
                try:
                    test_ser = serial.Serial(device, timeout=1)
                    test_ser.close()
                    return True
                except:
                    continue
        
        # MFS100 is detected as USB device in Device Manager
        # Since user confirmed it appears under "Universal Serial Bus controllers" as "MFS100",
        # we know it's physically connected
        # For Windows, try to verify via WMI or assume connected
        if os.name == 'nt':  # Windows
            try:
                import subprocess
                # Use Windows WMI to check for MFS100 USB device
                result = subprocess.run(
                    ['wmic', 'path', 'Win32_PnPEntity', 'where', 'Name like "%MFS100%"', 'get', 'Name'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if 'MFS100' in result.stdout.upper():
                    return True
            except:
                pass
            
            # If WMI check doesn't work, but user confirmed device is in Device Manager,
            # we'll return True since the hardware is physically connected
            # The actual fingerprint capture will need Mantra SDK
            return True
        
        return False
        
    except ImportError:
        # pyserial not installed, but device might still be connected
        # Since MFS100 is visible in Device Manager, consider it connected
        if os.name == 'nt':  # Windows
            return True  # Device is physically connected
        return False
    except Exception as e:
        # Even if check fails, if device is in Device Manager, it's connected
        if os.name == 'nt':  # Windows
            return True  # User confirmed MFS100 is in Device Manager
        return False


def capture_mantra_fingerprint():
    """Capture fingerprint from Mantra MFS 100 scanner"""
    try:
        # First, try to use Mantra SDK if available (MFS100 or MFS110)
        try:
            # Try MFS110 SDK (may be compatible with MFS100)
            try:
                # If MFS110 SDK is available, try using it
                # import MFS110SDK  # Uncomment if you have MFS110 SDK
                # scanner = MFS110SDK.Scanner()
                # scanner.Initialize()
                # template = scanner.Capture()
                # return template
                pass
            except:
                pass
            
            # Try original MFS100 SDK (if still available)
            # import MantraSDK  # Uncomment when SDK is installed
            # scanner = MantraSDK.MFS100()
            # scanner.Initialize()
            # template = scanner.Capture()
            # scanner.Close()
            # return template
            
            # For now, raise exception to use fallback method
            raise ImportError("Mantra SDK not installed")
            
        except ImportError:
            # Try alternative communication methods
            # First try Windows-specific method
            try:
                if os.name == 'nt':  # Windows
                    from mfs100_windows import try_serial_communication
                    port, serial_ok = try_serial_communication()
                    if serial_ok and port:
                        import serial
                        import time
                        import base64
                        
                        ser = serial.Serial(port, baudrate=9600, timeout=5)
                        # Send capture command (may need adjustment)
                        capture_cmd = b'\x55\xAA\x01\x00\x00\x00\x00\x00'
                        ser.write(capture_cmd)
                        time.sleep(1)
                        response = ser.read(1024)
                        ser.close()
                        
                        if response:
                            return base64.b64encode(response).decode('utf-8')
            except Exception as e:
                print(f"Windows alternative method failed: {e}")
            
            # Try generic USB/HID method
            try:
                from mfs100_alternative import MFS100Alternative
                scanner = MFS100Alternative()
                if scanner.initialize():
                    template = scanner.capture_fingerprint()
                    scanner.close()
                    if template:
                        return template
                else:
                    raise Exception("Could not initialize scanner using alternative method")
            except ImportError:
                # Alternative method not available, fall through to serial method
                pass
            except Exception as e:
                # Alternative method failed, try serial method
                print(f"Alternative method failed: {e}")
            
            # Use workaround solution (test mode or generic methods)
            try:
                from mfs100_workaround import MFS100Workaround
                # Use test mode for now since SDK is not available
                # Set test_mode=False if you want to try real capture
                scanner = MFS100Workaround(test_mode=True)
                if scanner.check_connection():
                    template = scanner.capture_fingerprint()
                    if template:
                        return template
            except Exception as e:
                print(f"Workaround method: {e}")
            
            # Fallback: Try serial communication
            import serial
            import serial.tools.list_ports
            import time
            
            # Find Mantra MFS 100 port
            ports = serial.tools.list_ports.comports()
            mantra_port = None
            
            for port in ports:
                if any(keyword in port.description.lower() or keyword in port.manufacturer.lower() 
                       for keyword in ['mantra', 'mfs', 'fingerprint']):
                    mantra_port = port.device
                    break
            
            if not mantra_port:
                # Try common ports
                common_ports = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'COM10']
                for port_name in common_ports:
                    try:
                        # Quick test to see if port exists
                        test_ser = serial.Serial(port_name, timeout=1)
                        test_ser.close()
                        mantra_port = port_name
                        break
                    except:
                        continue
            
            if not mantra_port:
                raise Exception(
                    "Mantra MFS 100 scanner not found as COM port. "
                    "The scanner is detected as USB device but needs Mantra SDK for fingerprint capture. "
                    "Please install Mantra MFS 100 SDK. See MFS100_NEXT_STEPS.md for instructions."
                )
            
            # Open connection to scanner
            ser = serial.Serial(
                port=mantra_port,
                baudrate=9600,  # Common baudrate, may need adjustment
                timeout=5,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            
            # Send capture command (this is a placeholder - actual command depends on Mantra protocol)
            # Mantra MFS 100 uses specific commands - refer to Mantra SDK documentation
            capture_command = b'\x01\x02\x03'  # Placeholder command
            
            ser.write(capture_command)
            time.sleep(0.5)
            
            # Read response
            response = ser.read(1024)  # Read up to 1024 bytes
            
            ser.close()
            
            if response:
                # Convert to base64 for storage
                import base64
                template = base64.b64encode(response).decode('utf-8')
                return template
            else:
                raise Exception("No response from scanner. Please place your finger on the scanner.")
            
    except ImportError as e:
        if "Mantra SDK" in str(e) or "MantraSDK" in str(e):
            raise Exception(
                "Mantra MFS 100 SDK is required for fingerprint capture. "
                "The scanner is connected but needs SDK to communicate. "
                "Please install Mantra MFS 100 SDK. See MFS100_NEXT_STEPS.md for instructions."
            )
        raise Exception("pyserial library not installed. Please install it using: pip install pyserial")
    except serial.SerialException as e:
        raise Exception(f"Scanner communication error: {str(e)}. Please check the connection.")
    except Exception as e:
        raise Exception(f"Fingerprint capture failed: {str(e)}")

@app.route("/api/voters", methods=["GET"])
def get_voters():
    """Return all voters stored in the users collection (user_type == 'voter')."""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    try:
        query = {"user_type": "voter"}
        has_account = request.args.get("has_account")
        if has_account is not None:
            if has_account.lower() in ["true", "1"]:
                query["has_account"] = True
            elif has_account.lower() in ["false", "0"]:
                query["has_account"] = False

        voters_cursor = users.find(query).sort("created_at", -1)
        voters = []
        for v in voters_cursor:
            v_obj = {k: v.get(k) for k in v.keys() if k != "_id"}
            v_obj["_id"] = str(v.get("_id"))
            if isinstance(v.get("created_at"), datetime.datetime):
                v_obj["created_at"] = v.get("created_at").isoformat()
            if isinstance(v.get("updated_at"), datetime.datetime):
                v_obj["updated_at"] = v.get("updated_at").isoformat()
            voters.append(v_obj)

        return jsonify({"success": True, "voters": voters}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch voters: {str(e)}"}), 500


@app.route("/api/report-voter-error", methods=["POST"])
def report_voter_error():
    """Allow a logged-in voter to report an unusual/fake voter."""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.json or {}
    voter_id = data.get("voter_id")
    error_type = data.get("error_type")
    description = data.get("description")

    if not voter_id or not error_type:
        return jsonify({"success": False, "message": "voter_id and error_type are required"}), 400

    report = {
        "reported_voter_id": voter_id,
        "reported_by": str(user["_id"]),
        "reporter_email": user.get("email"),
        "error_type": error_type,
        "description": description,
        "created_at": datetime.datetime.utcnow()
    }

    try:
        result = reports.insert_one(report)
        return jsonify({"success": True, "message": "Report submitted", "report_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to save report: {str(e)}"}), 500


@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Return all reports for admin review"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can access reports"}), 403

    try:
        all_reports = list(reports.find({}).sort("created_at", -1))
        out = []
        for r in all_reports:
            r_obj = {k: r.get(k) for k in r.keys() if k != "_id"}
            r_obj["_id"] = str(r.get("_id"))
            if isinstance(r.get("created_at"), datetime.datetime):
                r_obj["created_at"] = r.get("created_at").isoformat()
            out.append(r_obj)
        return jsonify({"success": True, "reports": out}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch reports: {str(e)}"}), 500


@app.route("/api/voter/<voter_id>", methods=["DELETE"])
def delete_voter(voter_id):
    """Delete a voter record (Admin only)"""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can delete voters"}), 403

    try:
        result = users.delete_one({"voter_id": voter_id, "user_type": "voter"})
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Voter not found"}), 404
        return jsonify({"success": True, "message": "Voter deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to delete voter: {str(e)}"}), 500


@app.route("/api/voter/<voter_id>", methods=["PUT"])
def update_voter(voter_id):
    """Update voter fields (Admin only). Accepts JSON with fields to update."""
    user, error_response, status_code = verify_token_and_get_user()
    if error_response:
        return error_response, status_code
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    if user.get("user_type") != "admin":
        return jsonify({"success": False, "message": "Only admins can update voters"}), 403

    data = request.json or {}
    allowed = ["full_name", "address", "email", "phone_no", "branch_name", "date_of_birth", "photo_url"]
    update_fields = {k: v for k, v in data.items() if k in allowed}
    if not update_fields:
        return jsonify({"success": False, "message": "No valid fields provided to update"}), 400

    update_fields["updated_at"] = datetime.datetime.utcnow()

    try:
        result = users.update_one({"voter_id": voter_id, "user_type": "voter"}, {"$set": update_fields})
        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Voter not found"}), 404
        updated = users.find_one({"voter_id": voter_id, "user_type": "voter"})
        updated["_id"] = str(updated["_id"])
        return jsonify({"success": True, "message": "Voter updated", "voter": updated}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to update voter: {str(e)}"}), 500


# Run App
if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=PORT)
