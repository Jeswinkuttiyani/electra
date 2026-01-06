# Mantra MFS 100 Fingerprint Scanner Setup

## Overview
This application integrates with the Mantra MFS 100 fingerprint scanner to capture voter fingerprints during registration.

## Setup Instructions

### 1. Hardware Connection
- Connect the Mantra MFS 100 scanner to your computer via USB
- Ensure the device is powered on and recognized by Windows

### 2. Install Mantra SDK
1. Download the Mantra MFS 100 SDK from the official Mantra website
2. Install the SDK following the manufacturer's instructions
3. Install any required drivers

### 3. Integration Options

#### Option A: Browser Plugin (Legacy - Not Recommended)
- Install Mantra browser plugin
- Load plugin in the frontend application

#### Option B: WebUSB/WebSerial API (Recommended for Modern Browsers)
- Use WebUSB API to communicate directly with the scanner
- Requires HTTPS connection (or localhost)

#### Option C: Backend Service (Recommended)
- Install Mantra SDK on the backend server
- Create a local service/daemon that communicates with the scanner
- Frontend calls backend API which communicates with the scanner

### 4. Frontend Integration

The frontend code includes placeholder functions for fingerprint capture. You need to:

1. **If using Mantra Web SDK:**
   - Include the Mantra SDK script in `index.html`:
   ```html
   <script src="path/to/mantra-sdk.js"></script>
   ```

2. **If using WebUSB:**
   - The browser will prompt for device access
   - Ensure you're using HTTPS or localhost

3. **If using Backend API:**
   - The `/api/capture-fingerprint` endpoint is already set up
   - Configure the backend to communicate with Mantra SDK

### 5. Backend Configuration

Update `backend/app.py` in the `capture_fingerprint()` function to integrate with Mantra SDK:

```python
# Example integration (adjust based on actual Mantra SDK)
import mantra_sdk  # Import Mantra SDK

@app.route("/api/capture-fingerprint", methods=["POST"])
def capture_fingerprint():
    try:
        # Initialize scanner
        scanner = mantra_sdk.MFS100()
        scanner.connect()
        
        # Capture fingerprint
        template = scanner.capture_template()
        
        return jsonify({
            "success": True,
            "template": template
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
```

### 6. Testing

1. Ensure the scanner is connected
2. Navigate to Add Voter page
3. Click "Capture Fingerprint" button
4. Place finger on scanner
5. Verify fingerprint is captured and stored

## Troubleshooting

- **Scanner not detected:** Check USB connection and drivers
- **SDK not found:** Ensure Mantra SDK is properly installed
- **Permission errors:** Check browser permissions for device access
- **Template format:** Verify fingerprint template format matches database schema

## Security Notes

- Fingerprint templates are stored securely in the database
- Never store raw fingerprint images, only templates
- Use encryption for sensitive biometric data
- Follow local data protection regulations

