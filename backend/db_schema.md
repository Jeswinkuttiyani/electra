# Database Schema Documentation

## MongoDB Collections

### Users Collection (`users`)

The `users` collection stores all user account information for both voters and admins.

#### Schema:

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  voter_id: String (unique, sparse), // Voter ID (for voters only)
  name: String,                     // Display name
  full_name: String,                // Full name (for voters)
  email: String (unique),           // Email address
  password: String,                 // Hashed password
  user_type: String,                // "voter" or "admin"
  phone_no: String,                 // Phone number (for voters)
  address: String,                  // Address (for voters)
  date_of_birth: String,            // Date of birth (for voters)
  branch_name: String,              // Branch name (for voters)
  photo_url: String,                // Photo URL (for voters)
  fingerprint_template: Object,     // Fingerprint template (for voters)
  has_account: Boolean,             // Whether account has been created (for voters)
  created_at: ISODate,              // Account creation timestamp
  updated_at: ISODate               // Last update timestamp
}
```

#### Indexes:
```javascript
// Create these indexes for optimal performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ voter_id: 1 }, { unique: true, sparse: true })
db.users.createIndex({ user_type: 1 })
db.users.createIndex({ created_at: -1 })
```

#### Example Document (Voter):
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  voter_id: "VOT001234",
  name: "John Doe",
  full_name: "John Doe",
  email: "john@example.com",
  password: "$2b$12$...", // Hashed with werkzeug.security
  user_type: "voter",
  phone_no: "+1234567890",
  address: "123 Main St",
  date_of_birth: "1990-01-01",
  branch_name: "Branch A",
  photo_url: "uploads/photos/VOT001234_photo.jpg",
  fingerprint_template: {...},
  has_account: true,
  created_at: ISODate("2025-12-16T10:30:00Z"),
  updated_at: ISODate("2025-12-16T10:30:00Z")
}
```

#### Field Descriptions:

- **voter_id**: Unique identifier for each voter (provided by admin, only for voters)
- **name**: User's display name
- **full_name**: Full name of the voter (from admin records)
- **email**: User's email address (must be unique)
- **password**: Bcrypt hashed password (never store plaintext)
- **user_type**: Role designation ("voter" for regular users, "admin" for administrators)
- **phone_no**: Phone number (for voters, used for OTP verification)
- **address**: Address (for voters)
- **date_of_birth**: Date of birth (for voters)
- **branch_name**: Branch name (for voters)
- **photo_url**: URL to voter's photo (for voters)
- **fingerprint_template**: Fingerprint biometric data (for voters)
- **has_account**: Whether the voter has created an account (for voters)
- **created_at**: Timestamp when the account was created
- **updated_at**: Timestamp of the last update to the account

---

## To Setup Indexes in MongoDB:

Run these commands in your MongoDB shell or compass:

```javascript
use voting_system  // Replace with your DB_NAME

// Create unique index for email
db.users.createIndex({ email: 1 }, { unique: true })

// Create unique index for voter_id (sparse - only for documents with voter_id)
db.users.createIndex({ voter_id: 1 }, { unique: true, sparse: true })

// Create index for user_type (for faster queries)
db.users.createIndex({ user_type: 1 })

// Create index for created_at (for sorting)
db.users.createIndex({ created_at: -1 })
```

---

## API Endpoints

### 1. Signup (POST `/api/signup`)

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "voter_id": "VOT001234",
  "password": "123456",
  "otp": "123456",
  "userType": "voter"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Signup successful",
  "user_id": "507f1f77bcf86cd799439011"
}
```

### 2. Login (POST `/api/login`)

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "userType": "voter"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "name": "John Doe",
  "voter_id": "VOT001234",
  "full_name": "John Doe",
  "user_type": "voter",
  "user_id": "507f1f77bcf86cd799439011"
}
```

### 3. Verify Token (POST `/api/verify-token`)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token is valid",
  "user_id": "507f1f77bcf86cd799439011"
}
```

---

## Notes:

- All passwords are hashed using `werkzeug.security.generate_password_hash`
- JWT tokens expire after the time specified in `JWT_EXPIRES_MINUTES` env variable
- Voter IDs must be unique across the system (sparse index - only for voters)
- Emails must be unique across the system
- User types are restricted to "voter" and "admin"
- Voters must be added by admin before they can sign up
- Voter signup requires OTP verification via phone number
