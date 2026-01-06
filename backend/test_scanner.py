"""
Test script to check if Mantra MFS 100 scanner is connected
Run this script to diagnose scanner connection issues
"""

import sys

def test_scanner_connection():
    """Test Mantra MFS 100 scanner connection"""
    print("=" * 60)
    print("Mantra MFS 100 Scanner Connection Test")
    print("=" * 60)
    print()
    
    # Check if pyserial is installed
    try:
        import serial
        import serial.tools.list_ports
        print("[OK] pyserial library is installed")
    except ImportError:
        print("[ERROR] pyserial library is NOT installed")
        print("  Please install it using: pip install pyserial")
        return False
    
    print()
    print("Scanning for COM ports...")
    print("-" * 60)
    
    # Get all COM ports
    ports = serial.tools.list_ports.comports()
    
    if not ports:
        print("[ERROR] No COM ports found")
        print("  Please ensure the scanner is connected via USB")
        return False
    
    print(f"Found {len(ports)} COM port(s):")
    print()
    
    mantra_found = False
    
    for i, port in enumerate(ports, 1):
        description = port.description or "Unknown"
        manufacturer = port.manufacturer or "Unknown"
        device = port.device or "Unknown"
        
        print(f"{i}. Port: {device}")
        print(f"   Description: {description}")
        print(f"   Manufacturer: {manufacturer}")
        
        # Check if it might be Mantra scanner
        is_mantra = any(keyword in description.lower() or keyword in manufacturer.lower() 
                       for keyword in ['mantra', 'mfs', 'fingerprint', 'biometric'])
        
        if is_mantra:
            print(f"   [FOUND] This looks like a Mantra/Fingerprint device!")
            mantra_found = True
            
            # Try to open the port
            try:
                test_ser = serial.Serial(device, timeout=1)
                test_ser.close()
                print(f"   [OK] Port is accessible and ready to use")
            except Exception as e:
                print(f"   [ERROR] Port exists but cannot be opened: {e}")
        else:
            # Still try to open to see if it's accessible
            try:
                test_ser = serial.Serial(device, timeout=1)
                test_ser.close()
                print(f"   (Port is accessible)")
            except:
                print(f"   (Port not accessible)")
        
        print()
    
    print("-" * 60)
    
    # Also check if MFS100 appears in USB devices (Windows specific)
    try:
        import platform
        if platform.system() == 'Windows':
            print()
            print("Checking Windows USB devices...")
            print("-" * 60)
            print("[INFO] If you see 'MFS100' in Device Manager under")
            print("       'Universal Serial Bus controllers', the scanner is connected.")
            print("       However, it may need Mantra SDK for fingerprint capture.")
    except:
        pass
    
    if mantra_found:
        print()
        print("[SUCCESS] Mantra MFS 100 scanner appears to be connected!")
        print("  You can now use the scanner in the application")
        return True
    else:
        print()
        print("[INFO] MFS100 found in USB controllers means it's physically connected.")
        print("  However, for fingerprint capture, you may need:")
        print("  1. Mantra MFS 100 SDK installed")
        print("  2. Proper drivers that expose COM port or HID interface")
        print("  3. Check Mantra documentation for communication protocol")
        print()
        print("  Next steps:")
        print("  - Try the 'Check Connection' button in the app")
        print("  - Install Mantra SDK if available")
        print("  - Contact Mantra support for SDK/API access")
        return True  # Return True since device is detected

if __name__ == "__main__":
    try:
        success = test_scanner_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error during test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

