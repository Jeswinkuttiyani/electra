# Mantra MFS 100 Scanner Setup Guide

## Step-by-Step Connection Instructions

### Step 1: Physical Connection
1. **Connect the Scanner:**
   - Plug the Mantra MFS 100 scanner into a USB port on your computer
   - Ensure the scanner is powered on (LED should light up)
   - Wait for Windows to detect the device

### Step 2: Install Drivers
1. **Download Drivers:**
   - Visit the official Mantra website or contact Mantra support
   - Download the Windows drivers for MFS 100
   - Extract the driver files

2. **Install Drivers:**
   - Open Device Manager (Right-click Start → Device Manager)
   - Look for "Unknown Device" or "Mantra MFS 100" under "Ports (COM & LPT)"
   - Right-click → Update Driver → Browse my computer → Select driver folder
   - Follow the installation wizard

3. **Verify Installation:**
   - In Device Manager, you should see "Mantra MFS 100" under "Ports (COM & LPT)"
   - Note the COM port number (e.g., COM3, COM4)

### Step 3: Install Python Dependencies
Open a terminal/command prompt in the `backend` folder and run:

```bash
pip install pyserial
```

Or if using virtual environment:

```bash
# Activate virtual environment first
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Then install
pip install pyserial
```

### Step 4: Test Scanner Connection

1. **Check COM Port:**
   - Open Device Manager
   - Find "Mantra MFS 100" under "Ports (COM & LPT)"
   - Note the COM port (e.g., COM3)

2. **Test Connection (Optional):**
   - You can test using Python:
   ```python
   import serial
   import serial.tools.list_ports
   
   # List all ports
   ports = serial.tools.list_ports.comports()
   for port in ports:
       print(f"Port: {port.device}, Description: {port.description}")
   ```

### Step 5: Configure Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   python app.py
   ```

2. **Check Scanner Status:**
   - The application will automatically check for the scanner
   - In the Add Voter page, click "Check Connection" button
   - If connected, you'll see "✓ Scanner is connected and ready"

### Step 6: Capture Fingerprint

1. **In the Add Voter Form:**
   - Fill in all required fields
   - Click "Capture Fingerprint" button
   - Place your finger on the scanner when prompted
   - Wait for capture confirmation

## Troubleshooting

### Scanner Not Detected

**Problem:** Scanner shows as "Not Connected"

**Solutions:**
1. **Check USB Connection:**
   - Unplug and replug the USB cable
   - Try a different USB port
   - Use a USB 2.0 port (avoid USB 3.0 hubs)

2. **Check Device Manager:**
   - Open Device Manager
   - Look for yellow warning icons
   - If found, update/reinstall drivers

3. **Check COM Port:**
   - Note the COM port number
   - Ensure no other application is using the port
   - Close other programs that might use the scanner

4. **Restart Services:**
   - Restart your computer
   - Restart the backend server

### Driver Installation Issues

**Problem:** Drivers won't install

**Solutions:**
1. Run installer as Administrator
2. Disable Windows Driver Signature Enforcement (temporary)
3. Contact Mantra support for latest drivers
4. Check Windows compatibility (Windows 10/11)

### Permission Errors

**Problem:** "Access Denied" or "Permission Error"

**Solutions:**
1. Run backend server as Administrator
2. Check Windows Firewall settings
3. Ensure no antivirus is blocking the connection

### Port Already in Use

**Problem:** "Port is already in use"

**Solutions:**
1. Close other applications using the scanner
2. Restart the backend server
3. Check Task Manager for processes using the port

## Manual Port Configuration

If automatic detection doesn't work, you can manually specify the COM port:

1. Edit `backend/app.py`
2. Find the `capture_mantra_fingerprint()` function
3. Modify the port detection section:

```python
# Manually set the COM port
mantra_port = 'COM3'  # Change to your actual COM port
```

## Testing Without Physical Scanner

For development/testing, you can temporarily bypass the scanner requirement:

1. Comment out the fingerprint validation in the form
2. Or use a mock template for testing

**Note:** This should only be used for development, not production.

## Additional Resources

- Mantra Official Website: [Check Mantra website]
- Mantra SDK Documentation: [Contact Mantra support]
- PySerial Documentation: https://pyserial.readthedocs.io/

## Support

If you continue to have issues:
1. Check Mantra MFS 100 documentation
2. Contact Mantra technical support
3. Verify scanner is not damaged
4. Try scanner on a different computer to isolate the issue

