import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet, InvalidToken

def _derive_key(pin: str, salt: bytes) -> bytes:
    """Derive a 32-byte key from a 6-digit PIN and salt."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(pin.encode()))

def encrypt_private_key(private_key: str, pin: str) -> str:
    """
    Encrypt an Ethereum private key using a 6-digit PIN.
    Returns a string containing: base64(salt) + ":" + base64(ciphertext)
    """
    salt = os.urandom(16)
    key = _derive_key(pin, salt)
    f = Fernet(key)
    ciphertext = f.encrypt(private_key.encode())
    
    return f"{base64.b64encode(salt).decode()}:{ciphertext.decode()}"

def decrypt_private_key(encrypted_data: str, pin: str) -> str:
    """
    Decrypt an Ethereum private key using a 6-digit PIN.
    Raises ValueError if the PIN is incorrect.
    """
    try:
        salt_b64, ciphertext = encrypted_data.split(":")
        salt = base64.b64decode(salt_b64)
        key = _derive_key(pin, salt)
        f = Fernet(key)
        decrypted = f.decrypt(ciphertext.encode())
        return decrypted.decode()
    except (InvalidToken, ValueError, base64.binascii.Error):
        raise ValueError("Invalid Voting PIN or corrupted key data")
