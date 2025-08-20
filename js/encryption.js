// AES-256-GCM Encryption Manager

class EncryptionManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyDerivation = 'PBKDF2';
        this.hash = 'SHA-256';
        this.iterations = 100000;
    }

    // Generate key from password
    async generateKey(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        
        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            data,
            { name: this.keyDerivation },
            false,
            ['deriveKey']
        );
        
        // Derive key using PBKDF2
        return await crypto.subtle.deriveKey(
            {
                name: this.keyDerivation,
                salt: salt,
                iterations: this.iterations,
                hash: this.hash
            },
            keyMaterial,
            { name: this.algorithm, length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Generate random salt
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    // Generate random IV
    generateIV() {
        return crypto.getRandomValues(new Uint8Array(12));
    }

    // Encrypt data
    async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(data);
            
            // Generate salt and IV
            const salt = this.generateSalt();
            const iv = this.generateIV();
            
            // Generate key
            const key = await this.generateKey(password, salt);
            
            // Encrypt data
            const encryptedData = await crypto.subtle.encrypt(
                { name: this.algorithm, iv: iv },
                key,
                encodedData
            );
            
            // Combine salt, IV, and encrypted data
            const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);
            
            // Convert to base64 for storage
            return btoa(String.fromCharCode(...result));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    // Decrypt data
    async decrypt(encryptedData, password) {
        try {
            // Convert from base64
            const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract salt, IV, and encrypted content
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encryptedContent = data.slice(28);
            
            // Generate key
            const key = await this.generateKey(password, salt);
            
            // Decrypt data
            const decryptedData = await crypto.subtle.decrypt(
                { name: this.algorithm, iv: iv },
                key,
                encryptedContent
            );
            
            // Convert to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data - incorrect password');
        }
    }

    // Check if data is encrypted
    isEncrypted(data) {
        try {
            // Try to decode base64
            const decoded = atob(data);
            // Encrypted data should have at least salt (16) + IV (12) bytes
            return decoded.length >= 28;
        } catch {
            return false;
        }
    }

    // Hash data for integrity check
    async hashData(data) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest(this.hash, encoder.encode(data));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify data integrity
    async verifyIntegrity(data, expectedHash) {
        const actualHash = await this.hashData(data);
        return actualHash === expectedHash;
    }
}

// Initialize encryption manager
const encryptionManager = new EncryptionManager();