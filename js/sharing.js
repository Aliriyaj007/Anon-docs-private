// Document Sharing Manager

class SharingManager {
    constructor() {
        this.sharePrefix = 'anon_share_';
    }

    // Generate share key for document
    async generateShareKey(documentId, password = null) {
        try {
            // Generate unique share key
            const shareKey = this.generateUniqueKey();
            
            // Create share metadata
            const shareMetadata = {
                documentId: documentId,
                shareKey: shareKey,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                requiresPassword: !!password,
                // In a real implementation, you might encrypt the document ID with the password
                // For demo, we'll store it plainly
            };
            
            // Store share metadata (in localStorage for demo, would be server-side in production)
            localStorage.setItem(`${this.sharePrefix}${shareKey}`, JSON.stringify(shareMetadata));
            
            return shareKey;
        } catch (error) {
            console.error('Failed to generate share key:', error);
            throw new Error('Failed to generate share key');
        }
    }

    // Generate unique key
    generateUniqueKey(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Get share metadata by key
    getShareMetadata(shareKey) {
        try {
            const metadataStr = localStorage.getItem(`${this.sharePrefix}${shareKey}`);
            return metadataStr ? JSON.parse(metadataStr) : null;
        } catch (error) {
            console.error('Failed to get share meta', error);
            return null;
        }
    }

    // Validate share key
    validateShareKey(shareKey) {
        const metadata = this.getShareMetadata(shareKey);
        if (!metadata) {
            return { valid: false, reason: 'Share key not found' };
        }
        
        if (new Date(metadata.expiresAt) < new Date()) {
            // Clean up expired share
            this.removeShareKey(shareKey);
            return { valid: false, reason: 'Share key has expired' };
        }
        
        return { valid: true, metadata };
    }

    // Remove share key
    removeShareKey(shareKey) {
        localStorage.removeItem(`${this.sharePrefix}${shareKey}`);
    }

    // List all shared documents for current user
    listUserShares() {
        const shares = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.sharePrefix)) {
                try {
                    const metadata = JSON.parse(localStorage.getItem(key));
                    shares.push({
                        shareKey: key.replace(this.sharePrefix, ''),
                        ...metadata
                    });
                } catch (error) {
                    console.warn('Invalid share meta', key);
                }
            }
        }
        
        // Sort by creation date (newest first)
        return shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Revoke share key
    revokeShareKey(shareKey) {
        this.removeShareKey(shareKey);
        return true;
    }

    // Create shareable URL
    createShareableUrl(shareKey, baseUrl = window.location.origin + window.location.pathname) {
        return `${baseUrl}#key=${shareKey}`;
    }

    // Create encrypted share URL (separate link and password)
    createEncryptedShareUrl(documentId, shareId, baseUrl = window.location.origin + window.location.pathname) {
        return `${baseUrl}#encrypted=${documentId}&share=${shareId}`;
    }
}

// Initialize sharing manager
const sharingManager = new SharingManager();