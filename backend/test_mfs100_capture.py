"""
Test script to try capturing fingerprint from MFS100
Uses the detected Vendor/Product IDs
"""

import os
import sys

def test_capture():
    """Test fingerprint capture"""
    print("=" * 60)
    print("Testing MFS100 Fingerprint Capture")
    print("=" * 60)
    print()
    print("Device Info:")
    print("  Vendor ID:  0x2C0F")
    print("  Product ID: 0x1005")
    print()
    
    # Try USB communication
    print("Attempting USB communication...")
    try:
        import usb.core
        import usb.util
        
        # Find device
        device = usb.core.find(idVendor=0x2C0F, idProduct=0x1005)
        
        if device is None:
            print("[ERROR] Device not found via USB")
            print("You may need to install libusb drivers")
            print("Or use Mantra SDK")
            return False
        
        print("[OK] Device found!")
        print(f"  Manufacturer: {usb.util.get_string(device, device.iManufacturer)}")
        print(f"  Product: {usb.util.get_string(device, device.iProduct)}")
        print()
        
        # Try to set configuration
        try:
            device.set_configuration()
            print("[OK] Device configuration set")
        except Exception as e:
            print(f"[WARNING] Could not set configuration: {e}")
            print("This is normal if device is already configured")
        
        # Get endpoint
        try:
            cfg = device.get_active_configuration()
            intf = cfg[(0, 0)]
            ep = usb.util.find_descriptor(intf, custom_match=lambda e: usb.util.endpoint_direction(e.bEndpointAddress) == usb.util.ENDPOINT_IN)
            
            if ep:
                print(f"[OK] Found endpoint: {ep.bEndpointAddress}")
                print()
                print("Ready to capture fingerprint!")
                print("Place your finger on the scanner and press Enter...")
                input()
                
                # Try to read data
                try:
                    data = device.read(ep.bEndpointAddress, 1024, timeout=5000)
                    if data:
                        import base64
                        template = base64.b64encode(bytes(data)).decode('utf-8')
                        print(f"[SUCCESS] Received {len(data)} bytes")
                        print(f"Template (first 50 chars): {template[:50]}...")
                        return True
                    else:
                        print("[INFO] No data received. Device may need specific commands.")
                except Exception as e:
                    print(f"[INFO] Read attempt: {e}")
                    print("Device may need specific capture commands from Mantra SDK")
            else:
                print("[WARNING] Could not find input endpoint")
                
        except Exception as e:
            print(f"[INFO] Endpoint detection: {e}")
            print("Device communication may require Mantra SDK")
        
        print()
        print("[CONCLUSION]")
        print("Device is connected and accessible, but fingerprint capture")
        print("requires specific commands from Mantra MFS100 SDK.")
        print()
        print("Recommendation: Download Mantra SDK from:")
        print("  http://download.mantratecapp.com")
        
        return False
        
    except ImportError:
        print("[ERROR] pyusb not installed or libusb backend not available")
        print("On Windows, you need libusb drivers for USB communication")
        print()
        print("Alternative: Use Mantra SDK (recommended)")
        return False
    except Exception as e:
        print(f"[ERROR] {e}")
        return False


if __name__ == "__main__":
    if os.name != 'nt':
        print("This test is for Windows")
        sys.exit(1)
    
    test_capture()

