from cryptography.fernet import Fernet
import os

class CredentialEncryption:
    """Encrypt and decrypt user credentials for secure storage"""
    
    def __init__(self):
        # Get encryption key from environment variable
        key = os.getenv('ENCRYPTION_KEY')
        
        if not key:
            # Generate a new key if not set (for development)
            key = Fernet.generate_key()
            print(f"[WARNING] No ENCRYPTION_KEY environment variable set!")
            print(f"[WARNING] Generated temporary key: {key.decode()}")
            print(f"[WARNING] Add this to your environment variables for production!")
        
        # Ensure key is bytes
        if isinstance(key, str):
            key = key.encode()
        
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plaintext string and return base64 encoded ciphertext"""
        if not plaintext:
            raise ValueError("Cannot encrypt empty string")
        
        encrypted = self.cipher.encrypt(plaintext.encode())
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a base64 encoded ciphertext and return plaintext"""
        if not ciphertext:
            raise ValueError("Cannot decrypt empty string")
        
        decrypted = self.cipher.decrypt(ciphertext.encode())
        return decrypted.decode()

# Global instance
_encryptor = None

def get_encryptor() -> CredentialEncryption:
    """Get or create the global encryptor instance"""
    global _encryptor
    if _encryptor is None:
        _encryptor = CredentialEncryption()
    return _encryptor
