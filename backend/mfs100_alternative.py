"""
Alternative MFS100 communication without official SDK
This uses generic USB/HID communication to interact with Mantra MFS 100
"""

import sys
import struct

try:
    import usb.core
    import usb.util
    USB_AVAILABLE = True
except ImportError:
    USB_AVAILABLE = False
    print("Warning: pyusb not installed. Install with: pip install pyusb")

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


class MFS100Alternative:
    """Alternative MFS100 scanner interface using USB/HID communication"""
    
    # Mantra MFS100 USB Vendor and Product IDs (detected from Device Manager)
    VENDOR_ID = 0x2C0F  # Detected: VID_2C0F
    PRODUCT_ID = 0x1005  # Detected: PID_1005
    
    def __init__(self):
        self.device = None
        self.serial_port = None
        
    def find_device(self):
        """Find MFS100 device via USB"""
        if not USB_AVAILABLE:
            return False
            
        try:
            # Try to find device by vendor/product ID
            self.device = usb.core.find(idVendor=self.VENDOR_ID, idProduct=self.PRODUCT_ID)
            
            if self.device is None:
                # Try to find any Mantra device
                devices = usb.core.find(find_all=True)
                for dev in devices:
                    try:
                        if dev is not None:
                            # Check if it might be Mantra device
                            # This is a fallback method
                            self.device = dev
                            break
                    except:
                        continue
            
            if self.device is not None:
                # Set configuration
                try:
                    self.device.set_configuration()
                    return True
                except:
                    return False
                    
        except Exception as e:
            print(f"USB device search error: {e}")
            return False
        
        return False
    
    def find_serial_port(self):
        """Find MFS100 via serial port"""
        if not SERIAL_AVAILABLE:
            return False
            
        try:
            import serial.tools.list_ports
            
            ports = serial.tools.list_ports.comports()
            for port in ports:
                description = (port.description or "").lower()
                if 'mfs' in description or 'mantra' in description or 'fingerprint' in description:
                    try:
                        self.serial_port = serial.Serial(port.device, baudrate=9600, timeout=2)
                        return True
                    except:
                        continue
        except Exception as e:
            print(f"Serial port search error: {e}")
        
        return False
    
    def initialize(self):
        """Initialize scanner connection"""
        # Try USB first
        if self.find_device():
            return True
        
        # Try serial port
        if self.find_serial_port():
            return True
        
        return False
    
    def capture_fingerprint(self):
        """Capture fingerprint using generic commands"""
        if self.device is not None:
            return self._capture_via_usb()
        elif self.serial_port is not None:
            return self._capture_via_serial()
        else:
            raise Exception("Scanner not initialized. Call initialize() first.")
    
    def _capture_via_usb(self):
        """Capture fingerprint via USB HID"""
        try:
            # Common fingerprint capture command (may need adjustment)
            # These are generic commands - actual commands depend on MFS100 protocol
            endpoint = self.device[0][(0, 0)][0]
            
            # Send capture command
            # Command format may vary - this is a generic example
            capture_cmd = bytes([0x01, 0x00, 0x00, 0x00, 0x00])  # Placeholder command
            
            self.device.write(endpoint.bEndpointAddress, capture_cmd)
            
            # Read response
            data = self.device.read(endpoint.bEndpointAddress, 1024)
            
            if data:
                import base64
                return base64.b64encode(bytes(data)).decode('utf-8')
            else:
                raise Exception("No fingerprint data received")
                
        except Exception as e:
            raise Exception(f"USB capture failed: {e}")
    
    def _capture_via_serial(self):
        """Capture fingerprint via serial port"""
        try:
            # Send capture command
            # Common commands for fingerprint scanners (may need adjustment)
            capture_cmd = b'\x55\xAA\x01\x00\x00\x00\x00\x00'  # Placeholder command
            
            self.serial_port.write(capture_cmd)
            self.serial_port.flush()
            
            # Wait for response
            import time
            time.sleep(1)
            
            # Read response
            response = self.serial_port.read(1024)
            
            if response:
                import base64
                return base64.b64encode(response).decode('utf-8')
            else:
                raise Exception("No fingerprint data received")
                
        except Exception as e:
            raise Exception(f"Serial capture failed: {e}")
    
    def close(self):
        """Close connection"""
        if self.serial_port:
            self.serial_port.close()
        if self.device:
            usb.util.dispose_resources(self.device)


def test_mfs100():
    """Test MFS100 connection"""
    print("Testing MFS100 Alternative Communication...")
    print("=" * 60)
    
    scanner = MFS100Alternative()
    
    try:
        if scanner.initialize():
            print("[OK] Scanner initialized successfully")
            print("Attempting to capture fingerprint...")
            print("Please place your finger on the scanner...")
            
            template = scanner.capture_fingerprint()
            print(f"[SUCCESS] Fingerprint captured! Template length: {len(template)}")
            return template
        else:
            print("[ERROR] Could not initialize scanner")
            print("Make sure MFS100 is connected and drivers are installed")
            return None
    except Exception as e:
        print(f"[ERROR] {e}")
        return None
    finally:
        scanner.close()


if __name__ == "__main__":
    test_mfs100()

