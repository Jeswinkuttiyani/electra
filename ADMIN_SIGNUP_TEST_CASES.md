 Admin Signup - Test Cases & Examples

## 🧪 Test Cases

### Valid Signup Examples

#### Test Case 1: Basic Valid Admin
```
Email: admin@example.com
Password: Admin123!
Expected: ✅ Success (201)
```

#### Test Case 2: Complex Email
```
Email: john.smith@company.co.uk
Password: MyPass@2025
Expected: ✅ Success (201)
```

#### Test Case 3: Special Characters in Password
```
Email: admin@test.org
Password: Pass@123#456
Expected: ✅ Success (201)
```

#### Test Case 4: Longer Password
```
Email: superadmin@voting.com
Password: VeryLongPassword123!@#
Expected: ✅ Success (201)
```

---

### Invalid Email Examples

#### Test Case 5: Missing Email
```
Email: (empty)
Password: ValidPass123!
Expected: ❌ Error (400) "Email is required"
```

#### Test Case 6: Invalid Email Format
```
Email: notanemail
Password: ValidPass123!
Expected: ❌ Error (400) "Invalid email format"
```

#### Test Case 7: Email Without Domain
```
Email: user@
Password: ValidPass123!
Expected: ❌ Error (400) "Invalid email format"
```

#### Test Case 8: Email Without Domain Extension
```
Email: user@domain
Password: ValidPass123!
Expected: ❌ Error (400) "Invalid email format"
```

#### Test Case 9: Duplicate Email
```
Email: admin@example.com (previously registered)
Password: AnotherPass123!
Expected: ❌ Error (409) "Email already registered"
```

---

### Invalid Password Examples

#### Test Case 10: Missing Password
```
Email: admin@example.com
Password: (empty)
Expected: ❌ Error (400) "Password is required"
```

#### Test Case 11: Too Short (< 8 chars)
```
Email: admin@example.com
Password: Pass12!
Expected: ❌ Error (400) Missing uppercase/requirements
```

#### Test Case 12: No Uppercase Letter
```
Email: admin@example.com
Password: password123!
Expected: ❌ Error (400) "Password must contain at least one uppercase letter"
```

#### Test Case 13: No Lowercase Letter
```
Email: admin@example.com
Password: PASSWORD123!
Expected: ❌ Error (400) "Password must contain at least one lowercase letter"
```

#### Test Case 14: No Number
```
Email: admin@example.com
Password: Password!
Expected: ❌ Error (400) "Password must contain at least one number"
```

#### Test Case 15: No Special Character
```
Email: admin@example.com
Password: Password123
Expected: ❌ Error (400) "Password must contain at least one special character"
```

#### Test Case 16: Exactly 7 Characters (< 8)
```
Email: admin@example.com
Password: Pass1!a
Expected: ❌ Error (400) "Password must be at least 8 characters long"
```

#### Test Case 17: Exactly 8 Characters (valid)
```
Email: admin@example.com
Password: Pass1!ab
Expected: ✅ Success (201)
```

---

### Database Verification Examples

#### Test Case 18: Verify Hashed Password
```javascript
// After signup with: password = "Admin123!"

// Query database
db.users.findOne({ email: "admin@example.com" })

// Expected output:
{
  _id: ObjectId("..."),
  email: "admin@example.com",
  password: "$2b$12$...",  // NOT "Admin123!" - must be hashed
  user_type: "admin",
  created_at: ISODate(...),
  updated_at: ISODate(...)
}
```

#### Test Case 19: Verify Email Uniqueness
```javascript
// Try to insert same email twice
// First signup: admin@example.com ✅ Success
// Second signup: admin@example.com ❌ Error (409) - Email already exists
```

#### Test Case 20: Count Admin Accounts
```javascript
// After 3 successful admin signups
db.users.countDocuments({ user_type: "admin" })
// Expected: 3
```

---

## 📊 Test Data Sets

### Minimal Valid Password
```
Password: Aa1!bb
Analysis:
✓ 8 characters (minimum)
✓ Uppercase: A
✓ Lowercase: a, b, b
✓ Number: 1
✓ Special: !
Status: ✅ PASS
```

### Strong Password
```
Password: MySecurePassword123!@#
Analysis:
✓ 22 characters (very long)
✓ Uppercase: M, S, P
✓ Lowercase: y, e, c, u, r, e, a, s, s, w, o, r, d
✓ Numbers: 1, 2, 3
✓ Special: !, @, #
Status: ✅ PASS
```

### Common Weak Passwords (Should Fail)
```
1. "12345678" - Only numbers ❌
2. "password" - Lowercase only ❌
3. "PASSWORD" - Uppercase only ❌
4. "Pass1234" - No special char ❌
5. "Pass!@#$" - No number ❌
6. "Pass1!" - Too short (6 chars) ❌
7. "Pass123" - No special char ❌
```

---

## 🔄 Complete User Flow Test

### Step 1: Signup
```
Navigate to: http://localhost:5173/admin-signup

Input:
- Email: testadmin@voting.com
- Password: TestAdmin123!

Expected: Success message, redirect to login
```

### Step 2: Login
```
Navigate to: http://localhost:5173/login

Select: Admin (from dropdown)

Input:
- Email: testadmin@voting.com
- Password: TestAdmin123!

Expected: Success, redirect to /admin-dashboard
```

### Step 3: Verify Database
```javascript
use voting_system
db.users.findOne({ email: "testadmin@voting.com" })

Expected output:
{
  _id: ObjectId("..."),
  email: "testadmin@voting.com",
  password: "$2b$12$...",
  user_type: "admin",
  created_at: ISODate("2025-01-05T..."),
  updated_at: ISODate("2025-01-05T...")
}
```

---

## ⚡ Performance Test

### Test Case: Bulk Admin Creation
```
Goal: Create 100 admin accounts and verify

Steps:
1. Loop 100 times with unique emails
2. Create admin accounts via API
3. Verify all created in database

Expected:
- All requests complete < 2 seconds
- All 100 documents in users collection
- All have user_type: "admin"
- All passwords hashed (not plaintext)
```

---

## 🔐 Security Test Cases

### Test Case 21: SQL Injection (Should Fail Safely)
```
Email: admin@test.com"; DROP TABLE users; --
Password: ValidPass123!

Expected: ❌ Invalid email format error
Result: Database remains intact
```

### Test Case 22: XSS Attack (Should Be Escaped)
```
Email: <script>alert('xss')</script>@test.com
Password: ValidPass123!

Expected: ❌ Invalid email format error
Result: No script executed
```

### Test Case 23: Password Not Logged
```
Process: Create admin account with "SecurePass123!"

Verify:
1. Check backend logs - password NOT printed
2. Check database - password is hashed
3. Check network requests - password transmitted securely

Expected: Password never visible in logs
```

---

## 📱 Frontend Validation Test

### Test Case 24: Real-time Validation Feedback
```
User Action: Type password character by character

Expected Behavior:
- As "P" typed: "Password must contain at least one lowercase letter"
- As "Pa" typed: Still invalid
- As "Pas" typed: "Password must contain at least one number"
- As "Pass1!" typed: All requirements met ✅

Verification: Requirements list updates in real-time
```

### Test Case 25: Password Mismatch Warning
```
User Action: Type different passwords

Password 1: Admin123!
Confirm: Admin124!

Expected: "Passwords do not match" error message appears
Verify: Form cannot be submitted
```

### Test Case 26: Show/Hide Password Toggle
```
User Action: Click "Show" button while in password field

Expected:
1. Password text visible (not dots)
2. Button text changes to "Hide"
3. Click "Hide" - text hidden again
4. Button text changes to "Show"

Verification: Both password fields work independently
```

---

## 🎯 API Response Test

### Test Case 27: Success Response Format
```
Request:
POST /api/admin-signup
{
  "email": "admin@test.com",
  "password": "ValidPass123!"
}

Expected Response (201):
{
  "success": true,
  "message": "Admin account created successfully. Please login.",
  "user_id": "507f1f77bcf86cd799439014"
}

Verify:
- Status code: 201 (Created)
- success: true
- Has user_id (MongoDB ObjectId as string)
```

### Test Case 28: Error Response Format
```
Request:
POST /api/admin-signup
{
  "email": "invalid-email",
  "password": "ValidPass123!"
}

Expected Response (400):
{
  "success": false,
  "message": "Invalid email format"
}

Verify:
- Status code: 400 (Bad Request)
- success: false
- Clear error message
```

---

## ✅ Pre-Deployment Checklist

- [ ] All test cases pass
- [ ] Frontend validation working
- [ ] Backend validation working
- [ ] Database operations successful
- [ ] Password hashing verified
- [ ] Email uniqueness enforced
- [ ] Error messages clear
- [ ] Responsive design verified
- [ ] No console errors
- [ ] Security measures in place
- [ ] Login redirects work
- [ ] User can login after signup

---

**Test Cases Complete - Ready for Deployment!** ✨
