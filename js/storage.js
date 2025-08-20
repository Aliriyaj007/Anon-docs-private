// IndexedDB Storage Manager

class StorageManager {
    constructor() {
        this.dbName = 'AnonDocsDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create documents store
                if (!db.objectStoreNames.contains('documents')) {
                    const docStore = db.createObjectStore('documents', { keyPath: 'id' });
                    docStore.createIndex('title', 'title', { unique: false });
                    docStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    docStore.createIndex('createdAt', 'createdAt', { unique: false });
                    docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
                
                // Create tags store
                if (!db.objectStoreNames.contains('tags')) {
                    const tagStore = db.createObjectStore('tags', { keyPath: 'name' });
                    tagStore.createIndex('documentCount', 'documentCount', { unique: false });
                }
                
                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                console.log('Database structure created');
            };
        });
    }

    // Get database connection
    getDB() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }

    // Add or update document
    async saveDocument(document) {
        const db = this.getDB();
        const transaction = db.transaction(['documents', 'tags'], 'readwrite');
        const docStore = transaction.objectStore('documents');
        const tagStore = transaction.objectStore('tags');
        
        return new Promise((resolve, reject) => {
            const request = docStore.put(document);
            
            request.onsuccess = () => {
                console.log('Document saved:', document.id);
                resolve(document);
            };
            
            request.onerror = () => {
                console.error('Failed to save document:', request.error);
                reject(request.error);
            };
        });
    }

    // Get document by ID
    async getDocument(id) {
        const db = this.getDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('Failed to get document:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all documents
    async getAllDocuments() {
        const db = this.getDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                console.log('Loaded', request.result.length, 'documents');
                resolve(request.result || []);
            };
            request.onerror = () => {
                console.error('Failed to load documents:', request.error);
                resolve([]); // Return empty array instead of rejecting
            };
        });
    }

    // Delete document
    async deleteDocument(id) {
        const db = this.getDB();
        const transaction = db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Failed to delete document:', request.error);
                reject(request.error);
            };
        });
    }

    // Search documents
    async searchDocuments(query) {
        const db = this.getDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const results = [];
        
        return new Promise((resolve, reject) => {
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const doc = cursor.value;
                    if (doc.title.toLowerCase().includes(query.toLowerCase()) ||
                        doc.content.toLowerCase().includes(query.toLowerCase())) {
                        results.push(doc);
                    }
                    cursor.continue();
                } else {
                    console.log('Search found', results.length, 'results');
                    resolve(results);
                }
            };
            request.onerror = () => {
                console.error('Search failed:', request.error);
                resolve([]); // Return empty array instead of rejecting
            };
        });
    }

    // Get documents by tag
    async getDocumentsByTag(tag) {
        const db = this.getDB();
        const transaction = db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const index = store.index('tags');
        const results = [];
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(IDBKeyRange.only(tag));
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    console.log('Found', results.length, 'documents with tag:', tag);
                    resolve(results);
                }
            };
            request.onerror = () => {
                console.error('Failed to get documents by tag:', request.error);
                resolve([]); // Return empty array instead of rejecting
            };
        });
    }

    // Get all tags with document counts
    async getAllTags() {
        const db = this.getDB();
        const transaction = db.transaction(['tags'], 'readonly');
        const store = transaction.objectStore('tags');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                // Sort by document count descending
                const tags = (request.result || []).sort((a, b) => b.documentCount - a.documentCount);
                console.log('Loaded', tags.length, 'tags');
                resolve(tags);
            };
            request.onerror = () => {
                console.error('Failed to load tags:', request.error);
                resolve([]); // Return empty array instead of rejecting
            };
        });
    }

    // Update tag count
    async updateTagCount(tagName, increment = true) {
        const db = this.getDB();
        const transaction = db.transaction(['tags'], 'readwrite');
        const store = transaction.objectStore('tags');
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(tagName);
            getRequest.onsuccess = () => {
                let tag = getRequest.result;
                if (!tag) {
                    tag = { name: tagName, documentCount: increment ? 1 : 0 };
                } else {
                    tag.documentCount += increment ? 1 : -1;
                    if (tag.documentCount < 0) tag.documentCount = 0;
                }
                
                const putRequest = store.put(tag);
                putRequest.onsuccess = () => resolve(tag);
                putRequest.onerror = () => {
                    console.error('Failed to update tag count:', putRequest.error);
                    resolve(tag); // Resolve anyway to prevent breaking the flow
                };
            };
            getRequest.onerror = () => {
                console.error('Failed to get tag:', getRequest.error);
                resolve({ name: tagName, documentCount: increment ? 1 : 0 }); // Create new tag
            };
        });
    }

    // Save setting
    async saveSetting(key, value) {
        const db = this.getDB();
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Failed to save setting:', request.error);
                resolve(); // Resolve anyway to prevent breaking the flow
            };
        });
    }

    // Get setting
    async getSetting(key) {
        const db = this.getDB();
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => {
                console.error('Failed to get setting:', request.error);
                resolve(null); // Return null instead of rejecting
            };
        });
    }

    // Export all data
    async exportData() {
        try {
            const documents = await this.getAllDocuments();
            const tags = await this.getAllTags();
            
            const settings = await new Promise((resolve, reject) => {
                try {
                    const db = this.getDB();
                    const transaction = db.transaction(['settings'], 'readonly');
                    const store = transaction.objectStore('settings');
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => resolve([]);
                } catch (error) {
                    resolve([]);
                }
            });
            
            return { documents, tags, settings };
        } catch (error) {
            console.error('Export failed:', error);
            return { documents: [], tags: [], settings: [] };
        }
    }

    // Import data
    async importData(data) {
        try {
            const db = this.getDB();
            const transaction = db.transaction(['documents', 'tags', 'settings'], 'readwrite');
            const docStore = transaction.objectStore('documents');
            const tagStore = transaction.objectStore('tags');
            const settingsStore = transaction.objectStore('settings');
            
            // Clear existing data
            await Promise.all([
                new Promise((resolve, reject) => {
                    const req = docStore.clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve(); // Continue anyway
                }),
                new Promise((resolve, reject) => {
                    const req = tagStore.clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve(); // Continue anyway
                }),
                new Promise((resolve, reject) => {
                    const req = settingsStore.clear();
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve(); // Continue anyway
                })
            ]);
            
            // Add new data
            if (data.documents) {
                data.documents.forEach(doc => {
                    try {
                        docStore.put(doc);
                    } catch (error) {
                        console.warn('Failed to import document:', error);
                    }
                });
            }
            
            if (data.tags) {
                data.tags.forEach(tag => {
                    try {
                        tagStore.put(tag);
                    } catch (error) {
                        console.warn('Failed to import tag:', error);
                    }
                });
            }
            
            if (data.settings) {
                data.settings.forEach(setting => {
                    try {
                        settingsStore.put(setting);
                    } catch (error) {
                        console.warn('Failed to import setting:', error);
                    }
                });
            }
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => resolve(); // Continue anyway
            });
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    // Get storage usage estimate
    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                    percentage: estimate.usage && estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
                };
            } catch (error) {
                console.warn('Storage estimation not supported:', error);
                return { usage: 0, quota: 0, percentage: 0 };
            }
        }
        return { usage: 0, quota: 0, percentage: 0 };
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Initialize storage manager
const storageManager = new StorageManager();