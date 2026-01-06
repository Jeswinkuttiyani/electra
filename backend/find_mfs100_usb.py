"""
Script to find MFS100 USB device and get its Vendor/Product IDs
Run this to identify the correct IDs for the alternative communication
"""

try:
    import usb.core
    import usb.util
    import usb.backend.libusb1
except ImportError:
    print("ERROR: pyusb not installed. Install with: pip install pyusb")
    exit(1)

def find_mfs100():
    """Find MFS100 device and display its information"""
    print("=" * 60)
    print("Searching for MFS100 USB Device...")
    print("=" * 60)
    print()
    
    # Get all USB devices
    devices = usb.core.find(find_all=True)
    
    mfs100_found = False
    
    print("Scanning USB devices...")
    print("-" * 60)
    
    for device in devices:
        try:
            # Get device information
            vendor_id = device.idVendor
            product_id = device.idProduct
            
            # Try to get manufacturer and product strings
            try:
                manufacturer = usb.util.get_string(device, device.iManufacturer)
            except:
                manufacturer = "Unknown"
            
            try:
                product = usb.util.get_string(device, device.iProduct)
            except:
                product = "Unknown"
            
            # Check if it might be MFS100
            is_mfs100 = False
            if 'mfs' in product.lower() or 'mfs' in manufacturer.lower():
                is_mfs100 = True
                mfs100_found = True
            
            # Display device info
            if is_mfs100:
                print(f"[FOUND] MFS100 Device:")
                print(f"  Vendor ID:  0x{vendor_id:04X} ({vendor_id})")
                print(f"  Product ID: 0x{product_id:04X} ({product_id})")
                print(f"  Manufacturer: {manufacturer}")
                print(f"  Product: {product}")
                print()
                print("Use these IDs in mfs100_alternative.py:")
                print(f"  VENDOR_ID = 0x{vendor_id:04X}")
                print(f"  PRODUCT_ID = 0x{product_id:04X}")
                print()
            else:
                # Show all devices for debugging
                print(f"Device: 0x{vendor_id:04X}:0x{product_id:04X} - {manufacturer} / {product}")
                
        except Exception as e:
            # Skip devices that can't be accessed
            continue
    
    print("-" * 60)
    
    if not mfs100_found:
        print("[WARNING] MFS100 not found by name")
        print("The device might be connected but not recognized by name")
        print()
        print("All USB devices found:")
        print("(Look for devices with Vendor ID that might be Mantra)")
        print()
        print("You can also check Device Manager -> MFS100 -> Properties -> Details")
        print("Look for 'Hardware Ids' to find Vendor/Product IDs")
    
    return mfs100_found

if __name__ == "__main__":
    try:
        find_mfs100()
    except Exception as e:
        print(f"Error: {e}")
        print("\nNote: On Windows, you may need to install libusb drivers")
        print("Or run as Administrator")

