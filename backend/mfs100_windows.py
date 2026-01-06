"""
Windows-specific MFS100 communication
Uses Windows APIs to communicate with MFS100 without requiring libusb
"""

import os
import sys

def get_device_info_from_device_manager():
    """Get MFS100 device info from Windows Device Manager"""
    try:
        import subprocess
        
        # Use PowerShell to query device manager
        ps_command = """
        Get-PnpDevice | Where-Object {$_.FriendlyName -like '*MFS*' -or $_.FriendlyName -like '*Mantra*'} | 
        Select-Object FriendlyName, InstanceId, Status | Format-List
        """
        
        result = subprocess.run(
            ['powershell', '-Command', ps_command],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            print("MFS100 Device Information:")
            print(result.stdout)
            return True
        else:
            print("MFS100 not found in Device Manager query")
            return False
            
    except Exception as e:
        print(f"Error querying device: {e}")
        return False


def try_serial_communication():
    """Try to communicate via serial port (if MFS100 appears as COM port)"""
    try:
        import serial
        import serial.tools.list_ports
        import time
        
        ports = serial.tools.list_ports.comports()
        
        print("\nChecking COM ports...")
        for port in ports:
            description = (port.description or "").lower()
            if 'mfs' in description or 'mantra' in description:
                print(f"Found potential MFS100 on {port.device}")
                try:
                    ser = serial.Serial(port.device, baudrate=9600, timeout=2)
                    print(f"Successfully opened {port.device}")
                    
                    # Try a simple command
                    # Common fingerprint scanner commands (may need adjustment)
                    test_commands = [
                        b'\x55\xAA\x01\x00',  # Common test command
                        b'\x01\x00\x00\x00',  # Alternative command
                        b'\xFF\xFF\xFF\xFF',  # Reset command
                    ]
                    
                    for cmd in test_commands:
                        try:
                            ser.write(cmd)
                            time.sleep(0.5)
                            response = ser.read(100)
                            if response:
                                print(f"Got response from {port.device}: {len(response)} bytes")
                                ser.close()
                                return port.device, True
                        except:
                            continue
                    
                    ser.close()
                except Exception as e:
                    print(f"Could not communicate with {port.device}: {e}")
        
        return None, False
        
    except ImportError:
        print("pyserial not available")
        return None, False
    except Exception as e:
        print(f"Serial communication error: {e}")
        return None, False


def capture_fingerprint_simple():
    """Simple fingerprint capture attempt"""
    print("=" * 60)
    print("MFS100 Alternative Capture (Windows)")
    print("=" * 60)
    print()
    
    # Step 1: Check Device Manager
    print("Step 1: Checking Device Manager...")
    device_found = get_device_info_from_device_manager()
    print()
    
    # Step 2: Try serial communication
    print("Step 2: Trying serial communication...")
    port, serial_ok = try_serial_communication()
    print()
    
    if serial_ok and port:
        print(f"[SUCCESS] Found MFS100 on {port}")
        print("Serial communication is possible")
        print()
        print("Note: Actual fingerprint capture commands may need adjustment")
        print("based on Mantra MFS100 protocol documentation")
        return True
    elif device_found:
        print("[INFO] MFS100 is detected in Device Manager")
        print("However, it's not accessible via serial port")
        print()
        print("Options:")
        print("1. Install Mantra MFS100 SDK (recommended)")
        print("2. Install libusb drivers and use USB communication")
        print("3. Check if MFS100 needs specific drivers to expose COM port")
        return False
    else:
        print("[ERROR] MFS100 not found")
        return False


if __name__ == "__main__":
    if os.name != 'nt':
        print("This script is for Windows only")
        sys.exit(1)
    
    capture_fingerprint_simple()

