# How to Get Mantra MFS 100 SDK

## Official Sources

### Option 1: Mantra Softech Website
1. Visit: **https://www.mantratech.com/**
2. Go to "Downloads" or "Support" section
3. Look for "MFS 100 SDK" or "Developer Tools"
4. Register/login if required
5. Download the SDK for Windows

### Option 2: Contact Mantra Support
1. **Email:** support@mantratech.com (or check their website for current email)
2. **Phone:** Check their website for support phone number
3. **Request:** Ask for "MFS 100 SDK for Windows" and mention you need it for integration

### Option 3: Check with Your Scanner Vendor
- If you bought the scanner from a vendor/reseller, contact them
- They may have SDK access or can provide it

### Option 4: Mantra Developer Portal
- Some manufacturers have developer portals
- Check if Mantra has a developer registration system
- Register and get SDK access

## Alternative Solution (Without Official SDK)

I've created an alternative solution (`mfs100_alternative.py`) that uses generic USB/HID communication. This might work but:

⚠️ **Limitations:**
- May not work perfectly without official SDK
- Commands may need adjustment based on actual MFS100 protocol
- Some features might not be available

✅ **To try the alternative:**
1. Install required library:
   ```bash
   pip install pyusb
   ```

2. Test it:
   ```bash
   python backend/mfs100_alternative.py
   ```

3. If it works, we can integrate it into the main application

## What the SDK Usually Contains

- DLL files (for Windows)
- API documentation
- Sample code
- Driver files
- Integration examples

## Important Notes

- **SDK is usually free** but requires registration
- **You may need to sign an NDA** (Non-Disclosure Agreement)
- **SDK version matters** - get the one compatible with your MFS100 model
- **Documentation is crucial** - make sure you get API documentation

## Quick Steps to Get SDK

1. **Visit Mantra website** → Support/Downloads
2. **Register/Login** if required
3. **Download MFS 100 SDK**
4. **Install SDK** on your system
5. **Let me know** and I'll help integrate it!

## If You Can't Get SDK

We can try the alternative USB communication method I created. It may work for basic fingerprint capture, though it might not have all features of the official SDK.

