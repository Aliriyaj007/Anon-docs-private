// Main Application Controller

class AnonDocsApp {
    constructor() {
        this.currentDocument = null;
        this.isEditing = false;
        this.settings = {
            theme: 'light',
            autoLock: false,
            autoLockTime: 5,
            biometricEnabled: false
        };
        this.inactivityTimer = null;
        this.isLocked = false;
        this.currentFolder = 'all';
        this.allDocuments = []; // Cache all documents
    }

    // Initialize app
    async init() {
        try {
            // Initialize storage
            await storageManager.init();
            
            // Load settings
            await this.loadSettings();
            
            // Apply theme
            this.applyTheme();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load documents
            await this.loadDocuments();
            
            // Handle URL parameters for shared documents
            this.handleUrlParameters();
            
            // Hide loading screen
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            // Start inactivity timer if enabled
            if (this.settings.autoLock) {
                this.startInactivityTimer();
            }
            
            console.log('Anon Docs initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            Utils.showNotification('Welcome to Anon Docs!', 'info');
            // Hide loading screen even if there's an error
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
        }
    }

    // Load settings from storage
    async loadSettings() {
        try {
            const savedSettings = await storageManager.getSetting('appSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    }

    // Save settings to storage
    async saveSettings() {
        try {
            await storageManager.saveSetting('appSettings', this.settings);
        } catch (error) {
            console.warn('Could not save settings:', error);
        }
    }

    // Apply theme
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = this.settings.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Document events
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Button events
        this.setupButtonEvents();
        
        // Form events
        this.setupFormEvents();
        
        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Mouse movement for inactivity detection
        document.addEventListener('mousemove', this.resetInactivityTimer.bind(this));
        document.addEventListener('keypress', this.resetInactivityTimer.bind(this));
    }

    // Setup button events
    setupButtonEvents() {
        // New document
        const newDocBtn = document.getElementById('new-doc-btn');
        if (newDocBtn) {
            newDocBtn.addEventListener('click', () => this.createDocument());
            this.addButtonAnimation(newDocBtn);
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            this.addButtonAnimation(themeToggle);
        }
        
        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
            this.addButtonAnimation(settingsBtn);
        }
        
        // Close editor
        const closeEditorBtn = document.getElementById('close-editor-btn');
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => this.closeEditor());
            this.addButtonAnimation(closeEditorBtn);
        }
        
        // Save document
        const saveDocBtn = document.getElementById('save-doc-btn');
        if (saveDocBtn) {
            saveDocBtn.addEventListener('click', () => this.saveDocument());
            this.addButtonAnimation(saveDocBtn);
        }
        
        // Encrypt document
        const encryptBtn = document.getElementById('encrypt-btn');
        if (encryptBtn) {
            encryptBtn.addEventListener('click', () => this.openEncryptModal());
            this.addButtonAnimation(encryptBtn);
        }
        
        // Fullscreen
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => Utils.toggleFullscreen());
            this.addButtonAnimation(fullscreenBtn);
        }
        
        // Share document
        const shareBtn = document.getElementById('share-doc-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareDocument());
            this.addButtonAnimation(shareBtn);
        }
        
        // Export as TXT
        const exportTxtBtn = document.getElementById('export-txt-btn');
        if (exportTxtBtn) {
            exportTxtBtn.addEventListener('click', () => this.exportAsTxt());
            this.addButtonAnimation(exportTxtBtn);
        }
        
        // Export as PDF
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportAsPdf());
            this.addButtonAnimation(exportPdfBtn);
        }
        
        // Toolbar buttons
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolbarCommand(e));
            this.addButtonAnimation(btn);
        });
        
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchDocuments(searchInput.value);
            }, 300));
        }
        
        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortDocuments());
        }
        
        // Analytics
        const analyticsBtn = document.getElementById('analytics-btn');
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => this.openAnalytics());
            this.addButtonAnimation(analyticsBtn);
        }
        
        // Backup
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.backupData());
            this.addButtonAnimation(backupBtn);
        }
        
        // Restore
        const restoreBtn = document.getElementById('restore-btn');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => this.restoreData());
            this.addButtonAnimation(restoreBtn);
        }
        
        // Lock app
        const lockBtn = document.getElementById('lock-btn');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => this.lockApp());
            this.addButtonAnimation(lockBtn);
        }
        
        // View shared documents
        const viewSharedBtn = document.getElementById('view-shared-btn');
        if (viewSharedBtn) {
            viewSharedBtn.addEventListener('click', () => this.viewSharedDocuments());
            this.addButtonAnimation(viewSharedBtn);
        }
        
        // Folder navigation
        this.setupFolderNavigation();
        
        // Tag navigation
        this.setupTagNavigation();
    }

    // Add button animation
    addButtonAnimation(button) {
        button.addEventListener('mousedown', () => {
            button.classList.add('pulse');
        });
        
        button.addEventListener('mouseup', () => {
            setTimeout(() => {
                button.classList.remove('pulse');
            }, 200);
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('pulse');
        });
    }

    // Setup folder navigation
    setupFolderNavigation() {
        const folderLinks = document.querySelectorAll('[data-folder]');
        folderLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const folder = e.target.getAttribute('data-folder');
                this.currentFolder = folder;
                this.filterDocumentsByFolder(folder);
                
                // Update active state
                document.querySelectorAll('[data-folder]').forEach(el => {
                    el.parentElement.classList.remove('active');
                });
                e.target.parentElement.classList.add('active');
            });
            
            this.addButtonAnimation(link);
        });
    }

    // Setup tag navigation
    setupTagNavigation() {
        const tagsContainer = document.getElementById('tags-list');
        if (tagsContainer) {
            tagsContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.parentElement.tagName === 'A') {
                    e.preventDefault();
                    const target = e.target.tagName === 'A' ? e.target : e.target.parentElement;
                    const tag = target.getAttribute('data-tag');
                    if (tag) {
                        this.filterByTag(tag);
                        
                        // Update active state
                        document.querySelectorAll('#tags-list a').forEach(el => {
                            el.classList.remove('active');
                        });
                        target.classList.add('active');
                    }
                }
            });
        }
    }

    // Setup form events
    setupFormEvents() {
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
            this.addButtonAnimation(btn);
        });
        
        // Modal overlay
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeModal());
        }
        
        // Theme selector
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.changeTheme(theme);
            });
            this.addButtonAnimation(btn);
        });
        
        // Settings form
        const autoLockToggle = document.getElementById('auto-lock-toggle');
        if (autoLockToggle) {
            autoLockToggle.addEventListener('change', (e) => {
                this.settings.autoLock = e.target.checked;
                this.saveSettings();
                if (this.settings.autoLock) {
                    this.startInactivityTimer();
                } else {
                    this.stopInactivityTimer();
                }
            });
        }
        
        const autoLockTime = document.getElementById('auto-lock-time');
        if (autoLockTime) {
            autoLockTime.addEventListener('change', (e) => {
                this.settings.autoLockTime = parseInt(e.target.value);
                this.saveSettings();
                if (this.settings.autoLock) {
                    this.restartInactivityTimer();
                }
            });
        }
        
        // Encrypt modal
        const confirmEncrypt = document.getElementById('confirm-encrypt');
        if (confirmEncrypt) {
            confirmEncrypt.addEventListener('click', () => this.encryptDocument());
            this.addButtonAnimation(confirmEncrypt);
        }
        
        const cancelEncrypt = document.getElementById('cancel-encrypt');
        if (cancelEncrypt) {
            cancelEncrypt.addEventListener('click', () => this.closeModal());
            this.addButtonAnimation(cancelEncrypt);
        }
    }

    // Handle document click
    handleDocumentClick(e) {
        // Close modals when clicking outside
        if (e.target.classList.contains('modal-overlay')) {
            this.closeModal();
        }
        
        // Handle document card clicks
        if (e.target.closest('.document-card')) {
            const card = e.target.closest('.document-card');
            const docId = card.getAttribute('data-id');
            this.openDocument(docId);
        }
    }

    // Handle keyboard shortcuts
    handleKeyDown(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (this.isEditing) {
                this.saveDocument();
            }
        }
        
        // Escape to close editor
        if (e.key === 'Escape') {
            if (this.isEditing) {
                this.closeEditor();
            } else {
                this.closeModal();
            }
        }
        
        // Ctrl+N to create new document
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.createDocument();
        }
    }

    // Handle before unload
    handleBeforeUnload(e) {
        if (this.isEditing && this.currentDocument) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }

    // Handle online/offline
    handleOnline() {
        Utils.showNotification('You are back online', 'success');
    }

    handleOffline() {
        Utils.showNotification('You are offline. Working in offline mode.', 'warning');
    }

    // Create new document
    createDocument() {
        const newDoc = {
            id: Utils.generateId(),
            title: 'Untitled Document',
            content: '<p>Start writing your document here...</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            encrypted: false,
            tags: []
        };
        
        this.openDocumentEditor(newDoc);
        analyticsManager.trackDocumentEvent('created', newDoc);
    }

    // Open document
    async openDocument(docId) {
        try {
            const doc = await storageManager.getDocument(docId);
            if (!doc) {
                Utils.showNotification('Document not found', 'error');
                return;
            }
            
            if (doc.encrypted) {
                // Show password prompt
                this.promptForPassword(doc);
            } else {
                this.openDocumentEditor(doc);
            }
        } catch (error) {
            console.error('Failed to open document:', error);
            Utils.showNotification('Failed to open document', 'error');
        }
    }

    // Prompt for password
    promptForPassword(doc) {
        const password = prompt('Enter password to decrypt this document:');
        if (password) {
            this.decryptAndOpenDocument(doc, password);
        }
    }

    // Decrypt and open document
    async decryptAndOpenDocument(doc, password) {
        try {
            Utils.showLoading(document.body);
            const decryptedContent = await encryptionManager.decrypt(doc.content, password);
            doc.content = decryptedContent;
            doc.encrypted = false;
            this.openDocumentEditor(doc);
            Utils.hideLoading(document.body);
        } catch (error) {
            Utils.hideLoading(document.body);
            Utils.showNotification('Incorrect password', 'error');
        }
    }

    // Open document editor
    openDocumentEditor(doc) {
        this.currentDocument = doc;
        this.isEditing = true;
        
        // Fill editor fields
        document.getElementById('doc-title').value = doc.title;
        document.getElementById('doc-editor').innerHTML = doc.content;
        document.getElementById('doc-tags').value = Utils.tagsToString(doc.tags);
        document.getElementById('doc-created').textContent = `Created: ${Utils.formatDate(doc.createdAt)}`;
        document.getElementById('doc-modified').textContent = `Modified: ${Utils.formatDate(doc.updatedAt)}`;
        
        // Show editor panel
        document.getElementById('editor-panel').classList.remove('hidden');
        document.getElementById('editor-panel').classList.add('slide-in-right');
        
        // Focus title
        document.getElementById('doc-title').focus();
    }

    // Close editor
    closeEditor() {
        if (this.isEditing && this.currentDocument) {
            if (confirm('Are you sure you want to close without saving?')) {
                this.isEditing = false;
                this.currentDocument = null;
                document.getElementById('editor-panel').classList.add('hidden');
            }
        } else {
            this.isEditing = false;
            this.currentDocument = null;
            document.getElementById('editor-panel').classList.add('hidden');
        }
    }

    // Save document
    async saveDocument() {
        if (!this.currentDocument) return;
        
        try {
            Utils.showLoading(document.getElementById('save-doc-btn'));
            
            // Update document data
            this.currentDocument.title = document.getElementById('doc-title').value;
            this.currentDocument.content = document.getElementById('doc-editor').innerHTML;
            this.currentDocument.tags = Utils.parseTags(document.getElementById('doc-tags').value);
            this.currentDocument.updatedAt = new Date().toISOString();
            
            // Save to storage
            await storageManager.saveDocument(this.currentDocument);
            
            // Update tags
            await this.updateTags(this.currentDocument.tags);
            
            // Update UI
            await this.loadDocuments();
            
            Utils.hideLoading(document.getElementById('save-doc-btn'));
            Utils.showNotification('Document saved successfully', 'success');
            
            analyticsManager.trackDocumentEvent('saved', this.currentDocument);
        } catch (error) {
            Utils.hideLoading(document.getElementById('save-doc-btn'));
            console.error('Failed to save document:', error);
            Utils.showNotification('Failed to save document', 'error');
        }
    }

    // Update tags
    async updateTags(tags) {
        try {
            // Update tag counts in storage
            const allTags = await storageManager.getAllTags();
            const existingTagNames = allTags.map(tag => tag.name);
            
            // Add new tags
            for (const tag of tags) {
                if (!existingTagNames.includes(tag)) {
                    await storageManager.updateTagCount(tag, true);
                }
            }
            
            // Update tags list in UI
            this.updateTagsList();
        } catch (error) {
            console.warn('Failed to update tags:', error);
        }
    }

    // Load documents
    async loadDocuments() {
        try {
            this.allDocuments = await storageManager.getAllDocuments();
            this.renderDocuments(this.allDocuments);
            this.updateTagsList();
            await analyticsManager.updateAnalyticsDisplay(this.allDocuments);
        } catch (error) {
            console.error('Failed to load documents:', error);
            // Don't show error notification on first load
            if (this.allDocuments && this.allDocuments.length > 0) {
                Utils.showNotification('Failed to load documents', 'error');
            }
        }
    }

    // Filter documents by folder
    filterDocumentsByFolder(folder) {
        if (folder === 'all') {
            this.renderDocuments(this.allDocuments);
        } else if (folder === 'uncategorized') {
            const uncategorizedDocs = this.allDocuments.filter(doc => !doc.tags || doc.tags.length === 0);
            this.renderDocuments(uncategorizedDocs);
        }
        
        // Reset search placeholder
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = folder === 'all' ? 'Search all documents...' : `Search in ${folder}...`;
        }
    }

    // Filter documents by tag
    async filterByTag(tag) {
        try {
            const documents = await storageManager.getDocumentsByTag(tag);
            this.renderDocuments(documents);
            
            // Update UI to show we're filtering
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.placeholder = `Showing documents with tag: ${tag}`;
            }
        } catch (error) {
            console.error('Failed to filter by tag:', error);
            Utils.showNotification('Failed to filter documents', 'error');
        }
    }

    // Render documents
    renderDocuments(documents) {
        const container = document.getElementById('documents-container');
        if (!container) return;
        
        // Sort documents
        const sortValue = document.getElementById('sort-select')?.value || 'modified';
        documents = this.sortDocumentsArray(documents, sortValue);
        
        // Render documents
        if (documents.length === 0) {
            container.innerHTML = '<div class="empty-state">No documents found</div>';
            return;
        }
        
        container.innerHTML = documents.map(doc => `
            <div class="document-card ${doc.encrypted ? 'encrypted' : ''}" data-id="${doc.id}">
                <h3>${this.escapeHtml(doc.title)}</h3>
                <div class="doc-meta">
                    <span>${Utils.formatDate(doc.updatedAt)}</span>
                    <span>${doc.encrypted ? '<i class="fas fa-lock"></i>' : ''}</span>
                </div>
                ${doc.tags && doc.tags.length > 0 ? `
                    <div class="tags">
                        ${doc.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Sort documents array
    sortDocumentsArray(documents, sortType) {
        return documents.sort((a, b) => {
            switch (sortType) {
                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'modified':
                default:
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });
    }

    // Update tags list
    async updateTagsList() {
        const tagsList = document.getElementById('tags-list');
        if (!tagsList) return;
        
        try {
            const tags = await storageManager.getAllTags();
            if (tags.length === 0) {
                tagsList.innerHTML = '<li><span class="no-tags">No tags yet</span></li>';
                return;
            }
            
            tagsList.innerHTML = tags.map(tag => `
                <li><a href="#" data-tag="${tag.name}">${tag.name} (${tag.documentCount})</a></li>
            `).join('');
            
            // Re-setup tag navigation after updating
            this.setupTagNavigation();
        } catch (error) {
            console.error('Failed to load tags:', error);
            tagsList.innerHTML = '<li><span class="no-tags">Error loading tags</span></li>';
        }
    }

    // Search documents
    async searchDocuments(query) {
        if (!query.trim()) {
            await this.loadDocuments();
            return;
        }
        
        try {
            const results = await storageManager.searchDocuments(query);
            this.renderDocuments(results);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    // Sort documents
    async sortDocuments() {
        await this.loadDocuments();
    }

    // Handle toolbar commands
    handleToolbarCommand(e) {
        const command = e.target.getAttribute('data-command');
        if (command) {
            document.execCommand(command, false, null);
            document.getElementById('doc-editor').focus();
        }
    }

    // Share document
    shareDocument() {
        if (!this.currentDocument) {
            Utils.showNotification('No document to share', 'error');
            return;
        }
        
        if (this.currentDocument.encrypted) {
            // For encrypted documents, show sharing options
            this.openShareEncryptedModal();
        } else {
            // For unencrypted documents, use regular sharing
            this.openShareModal();
        }
    }

    // Open share modal for unencrypted documents
    openShareModal() {
        const shareUrl = `${window.location.origin}${window.location.pathname}#view=${this.currentDocument.id}`;
        
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-share-alt"></i> Share Document</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Share Link:</label>
                        <div class="input-group">
                            <input type="text" id="share-link" value="${shareUrl}" readonly>
                            <button id="copy-link-btn" class="btn secondary">Copy</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <p><i class="fas fa-info-circle"></i> Anyone with this link can view the document</p>
                    </div>
                    <div class="modal-actions">
                        <button id="close-share-modal" class="btn secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('share-modal') || this.createModal('share-modal');
        modal.innerHTML = modalContent;
        this.openModal('share-modal');
        
        // Setup event listeners
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            Utils.copyToClipboard(shareUrl);
            Utils.showNotification('Link copied to clipboard!', 'success');
        });
        
        document.getElementById('close-share-modal').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Open share modal for encrypted documents
    openShareEncryptedModal() {
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-lock"></i> Share Encrypted Document</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <p>This document is password-protected. Choose how to share it:</p>
                    </div>
                    
                    <div class="share-options">
                        <div class="share-option">
                            <input type="radio" id="share-link-option" name="share-method" value="link" checked>
                            <label for="share-link-option">
                                <strong>Share Link + Password</strong>
                                <br>Recipient needs both the link and password
                            </label>
                        </div>
                        
                        <div class="share-option">
                            <input type="radio" id="share-key-option" name="share-method" value="key">
                            <label for="share-key-option">
                                <strong>Generate Shared Key</strong>
                                <br>Create a unique key that acts as both link and password
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" id="password-section">
                        <label for="share-password">Document Password:</label>
                        <input type="password" id="share-password" placeholder="Enter document password">
                        <small>Required to generate sharing link</small>
                    </div>
                    
                    <div class="form-group hidden" id="shared-key-section">
                        <label>Generated Shared Key:</label>
                        <div class="input-group">
                            <input type="text" id="shared-key" readonly>
                            <button id="copy-key-btn" class="btn secondary">Copy</button>
                        </div>
                        <small>This key contains both the document reference and decryption key</small>
                    </div>
                    
                    <div class="form-group hidden" id="link-section">
                        <label>Share Link:</label>
                        <div class="input-group">
                            <input type="text" id="encrypted-share-link" readonly>
                            <button id="copy-encrypted-link-btn" class="btn secondary">Copy</button>
                        </div>
                        <small>Send this link along with the password to the recipient</small>
                    </div>
                    
                    <div class="modal-actions">
                        <button id="generate-share-btn" class="btn primary">Generate Share Link</button>
                        <button id="close-encrypted-share-modal" class="btn secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('share-encrypted-modal') || this.createModal('share-encrypted-modal');
        modal.innerHTML = modalContent;
        this.openModal('share-encrypted-modal');
        
        // Setup event listeners
        this.setupEncryptedShareEvents();
    }

    // Setup encrypted share events
    setupEncryptedShareEvents() {
        // Method selection
        const methodInputs = document.querySelectorAll('input[name="share-method"]');
        methodInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.toggleShareMethod();
            });
        });
        
        // Generate button
        document.getElementById('generate-share-btn').addEventListener('click', () => {
            this.generateEncryptedShareLink();
        });
        
        // Copy buttons
        document.getElementById('copy-key-btn')?.addEventListener('click', () => {
            const key = document.getElementById('shared-key').value;
            if (key) {
                Utils.copyToClipboard(key);
                Utils.showNotification('Shared key copied!', 'success');
            }
        });
        
        document.getElementById('copy-encrypted-link-btn')?.addEventListener('click', () => {
            const link = document.getElementById('encrypted-share-link').value;
            if (link) {
                Utils.copyToClipboard(link);
                Utils.showNotification('Link copied!', 'success');
            }
        });
        
        // Close button
        document.getElementById('close-encrypted-share-modal').addEventListener('click', () => {
            this.closeModal();
        });
    }

    // Toggle share method
    toggleShareMethod() {
        const method = document.querySelector('input[name="share-method"]:checked').value;
        
        if (method === 'key') {
            document.getElementById('password-section').classList.add('hidden');
            document.getElementById('shared-key-section').classList.remove('hidden');
            document.getElementById('link-section').classList.add('hidden');
        } else {
            document.getElementById('password-section').classList.remove('hidden');
            document.getElementById('shared-key-section').classList.add('hidden');
            document.getElementById('link-section').classList.remove('hidden');
        }
    }

    // Generate encrypted share link
    async generateEncryptedShareLink() {
        const method = document.querySelector('input[name="share-method"]:checked').value;
        
        if (method === 'key') {
            // Generate shared key approach
            await this.generateSharedKey();
        } else {
            // Generate link + password approach
            const password = document.getElementById('share-password').value;
            if (!password) {
                Utils.showNotification('Please enter the document password', 'error');
                return;
            }
            
            try {
                // Verify password by attempting to decrypt
                await encryptionManager.decrypt(this.currentDocument.content, password);
                
                // Generate share link
                const shareId = Utils.generateId().substring(0, 12); // Shorter ID for sharing
                const shareLink = `${window.location.origin}${window.location.pathname}#encrypted=${this.currentDocument.id}&share=${shareId}`;
                
                document.getElementById('encrypted-share-link').value = shareLink;
                Utils.showNotification('Share link generated successfully!', 'success');
            } catch (error) {
                Utils.showNotification('Invalid password', 'error');
            }
        }
    }

    // Generate shared key
    async generateSharedKey() {
        try {
            // In a real implementation, you would:
            // 1. Generate a unique share key
            // 2. Store the mapping between share key and document ID securely
            // 3. Return the share key to the user
            
            const shareKey = `anon-${Utils.generateId().substring(0, 16)}`;
            
            // For demo purposes, we'll store this in localStorage
            // In production, this would be stored server-side or in a secure database
            const shareData = {
                documentId: this.currentDocument.id,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            };
            
            localStorage.setItem(`share_${shareKey}`, JSON.stringify(shareData));
            
            document.getElementById('shared-key').value = shareKey;
            Utils.showNotification('Shared key generated successfully!', 'success');
        } catch (error) {
            Utils.showNotification('Failed to generate shared key', 'error');
        }
    }

    // Create modal element
    createModal(modalId) {
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal hidden';
        document.body.appendChild(modal);
        return modal;
    }

    // Export as TXT
    exportAsTxt() {
        if (!this.currentDocument) {
            Utils.showNotification('No document to export', 'error');
            return;
        }
        
        try {
            // Strip HTML tags for plain text
            const plainText = this.currentDocument.content.replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            const blob = new Blob([plainText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentDocument.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showNotification('Document exported as TXT', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            Utils.showNotification('Failed to export document', 'error');
        }
    }

    // Export as PDF
    exportAsPdf() {
        if (!this.currentDocument) {
            Utils.showNotification('No document to export', 'error');
            return;
        }
        
        try {
            // Create a simple PDF-like text export
            const content = `Title: ${this.currentDocument.title}
Created: ${Utils.formatDate(this.currentDocument.createdAt)}
Modified: ${Utils.formatDate(this.currentDocument.updatedAt)}

${this.currentDocument.content.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()}`;
            
            const blob = new Blob([content], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentDocument.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showNotification('Document exported as PDF', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            Utils.showNotification('Failed to export document', 'error');
        }
    }

    // Open encrypt modal
    openEncryptModal() {
        if (!this.currentDocument) return;
        
        document.getElementById('encrypt-password').value = '';
        document.getElementById('confirm-password').value = '';
        this.openModal('encrypt-modal');
    }

    // Encrypt document
    async encryptDocument() {
        if (!this.currentDocument) return;
        
        const password = document.getElementById('encrypt-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!password || !confirmPassword) {
            Utils.showNotification('Please enter both passwords', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            Utils.showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (!Utils.validatePassword(password)) {
            Utils.showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        try {
            Utils.showLoading(document.getElementById('confirm-encrypt'));
            
            // Encrypt content
            const encryptedContent = await encryptionManager.encrypt(this.currentDocument.content, password);
            
            // Update document
            this.currentDocument.content = encryptedContent;
            this.currentDocument.encrypted = true;
            this.currentDocument.updatedAt = new Date().toISOString();
            
            // Save document
            await storageManager.saveDocument(this.currentDocument);
            
            // Update UI
            await this.loadDocuments();
            this.closeModal();
            this.closeEditor();
            
            Utils.hideLoading(document.getElementById('confirm-encrypt'));
            Utils.showNotification('Document encrypted successfully', 'success');
            
            analyticsManager.trackDocumentEvent('encrypted', this.currentDocument);
        } catch (error) {
            Utils.hideLoading(document.getElementById('confirm-encrypt'));
            console.error('Encryption failed:', error);
            Utils.showNotification('Failed to encrypt document', 'error');
        }
    }

    // Open settings modal
    openSettings() {
        // Set current settings in form
        document.getElementById('auto-lock-toggle').checked = this.settings.autoLock;
        document.getElementById('auto-lock-time').value = this.settings.autoLockTime;
        document.getElementById('biometric-toggle').checked = this.settings.biometricEnabled;
        
        // Highlight current theme
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-theme') === this.settings.theme) {
                btn.classList.add('active');
            }
        });
        
        this.openModal('settings-modal');
    }

    // Change theme
    changeTheme(theme) {
        this.settings.theme = theme;
        this.applyTheme();
        this.saveSettings();
        
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            }
        });
        
        Utils.showNotification(`Theme changed to ${theme}`, 'success');
    }

    // Toggle theme
    toggleTheme() {
        const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.changeTheme(newTheme);
    }

    // Open analytics modal
    async openAnalytics() {
        this.openModal('analytics-modal');
        if (this.allDocuments.length > 0) {
            await analyticsManager.updateAnalyticsDisplay(this.allDocuments);
        }
    }

    // Backup data
    async backupData() {
        try {
            Utils.showLoading(document.getElementById('backup-btn'));
            
            const data = await storageManager.exportData();
            const jsonData = JSON.stringify(data, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            Utils.downloadFile(jsonData, `anon-docs-backup-${timestamp}.json`);
            
            Utils.hideLoading(document.getElementById('backup-btn'));
            Utils.showNotification('Backup created successfully', 'success');
        } catch (error) {
            Utils.hideLoading(document.getElementById('backup-btn'));
            console.error('Backup failed:', error);
            Utils.showNotification('Failed to create backup', 'error');
        }
    }

    // Restore data
    async restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                
                Utils.showLoading(document.body);
                
                const content = await Utils.readFile(file);
                const data = JSON.parse(content);
                
                await storageManager.importData(data);
                await this.loadDocuments();
                
                Utils.hideLoading(document.body);
                Utils.showNotification('Data restored successfully', 'success');
            } catch (error) {
                Utils.hideLoading(document.body);
                console.error('Restore failed:', error);
                Utils.showNotification('Failed to restore data', 'error');
            }
        };
        
        input.click();
    }

    // Lock app
    lockApp() {
        this.isLocked = true;
        Utils.showNotification('App locked', 'info');
    }

    // Open modal
    openModal(modalId) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById(modalId).classList.remove('hidden');
    }

    // Close modal
    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Reset search placeholder
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = 'Search documents...';
        }
        
        // Reset tag active states
        document.querySelectorAll('#tags-list a').forEach(el => {
            el.classList.remove('active');
        });
    }

    // Start inactivity timer
    startInactivityTimer() {
        this.stopInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.lockApp();
        }, this.settings.autoLockTime * 60 * 1000);
    }

    // Stop inactivity timer
    stopInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    // Restart inactivity timer
    restartInactivityTimer() {
        this.stopInactivityTimer();
        if (this.settings.autoLock) {
            this.startInactivityTimer();
        }
    }

    // Reset inactivity timer
    resetInactivityTimer() {
        if (this.settings.autoLock) {
            this.restartInactivityTimer();
        }
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle URL parameters for document viewing
    async handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Handle encrypted document sharing
        if (urlParams.has('encrypted') && urlParams.has('share')) {
            const docId = urlParams.get('encrypted');
            await this.openSharedEncryptedDocument(docId);
        }
        
        // Handle shared key
        if (urlParams.has('key')) {
            const shareKey = urlParams.get('key');
            await this.openDocumentByShareKey(shareKey);
        }
        
        // Handle regular document viewing
        if (urlParams.has('view')) {
            const docId = urlParams.get('view');
            await this.openDocument(docId);
        }
    }

    // Open shared encrypted document
    async openSharedEncryptedDocument(docId) {
        try {
            const doc = await storageManager.getDocument(docId);
            if (!doc || !doc.encrypted) {
                Utils.showNotification('Document not found or not encrypted', 'error');
                return;
            }
            
            // Show password prompt for shared document
            this.promptForSharedDocumentPassword(doc);
        } catch (error) {
            Utils.showNotification('Failed to load shared document', 'error');
        }
    }

    // Prompt for shared document password
    promptForSharedDocumentPassword(doc) {
        const modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-lock"></i> Enter Document Password</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <p>You've been shared an encrypted document. Please enter the password to view it.</p>
                    </div>
                    <div class="form-group">
                        <label for="shared-doc-password">Password:</label>
                        <input type="password" id="shared-doc-password" placeholder="Enter document password">
                        <input type="hidden" id="shared-doc-id" value="${doc.id}">
                    </div>
                    <div class="modal-actions">
                        <button id="open-shared-doc-btn" class="btn primary">Open Document</button>
                        <button id="cancel-shared-doc-btn" class="btn secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('shared-password-modal') || this.createModal('shared-password-modal');
        modal.innerHTML = modalContent;
        this.openModal('shared-password-modal');
        
        // Setup event listeners
        document.getElementById('open-shared-doc-btn').addEventListener('click', () => {
            const password = document.getElementById('shared-doc-password').value;
            const docId = document.getElementById('shared-doc-id').value;
            this.decryptAndOpenSharedDocument(docId, password);
        });
        
        document.getElementById('cancel-shared-doc-btn').addEventListener('click', () => {
            this.closeModal();
            window.location.hash = ''; // Clear hash
        });
    }

    // Decrypt and open shared document
    async decryptAndOpenSharedDocument(docId, password) {
        try {
            const doc = await storageManager.getDocument(docId);
            if (!doc) {
                Utils.showNotification('Document not found', 'error');
                return;
            }
            
            Utils.showLoading(document.body);
            const decryptedContent = await encryptionManager.decrypt(doc.content, password);
            doc.content = decryptedContent;
            doc.encrypted = false;
            
            this.openDocumentEditor(doc);
            this.closeModal();
            Utils.hideLoading(document.body);
            
            Utils.showNotification('Document opened successfully!', 'success');
        } catch (error) {
            Utils.hideLoading(document.body);
            Utils.showNotification('Incorrect password', 'error');
        }
    }

    // Open document by share key
    async openDocumentByShareKey(shareKey) {
        try {
            // Retrieve share data
            const shareDataStr = localStorage.getItem(`share_${shareKey}`);
            if (!shareDataStr) {
                Utils.showNotification('Invalid or expired share key', 'error');
                return;
            }
            
            const shareData = JSON.parse(shareDataStr);
            
            // Check expiration
            if (new Date(shareData.expiresAt) < new Date()) {
                Utils.showNotification('Share key has expired', 'error');
                localStorage.removeItem(`share_${shareKey}`);
                return;
            }
            
            // Load document
            const doc = await storageManager.getDocument(shareData.documentId);
            if (!doc) {
                Utils.showNotification('Document not found', 'error');
                return;
            }
            
            if (doc.encrypted) {
                // For shared key approach, we could embed the password in the key
                // But for security, we'll still prompt for password
                this.promptForSharedDocumentPassword(doc);
            } else {
                this.openDocumentEditor(doc);
                Utils.showNotification('Document opened successfully!', 'success');
            }
        } catch (error) {
            Utils.showNotification('Failed to open shared document', 'error');
        }
    }

    // View shared documents
    async viewSharedDocuments() {
        try {
            const shares = sharingManager.listUserShares();
            
            const modalContent = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2><i class="fas fa-share-alt"></i> My Shared Documents</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${shares.length > 0 ? `
                            <div class="shared-documents-list">
                                ${shares.map(share => `
                                    <div class="shared-document-item">
                                        <div class="shared-document-info">
                                            <h3>Shared Document</h3>
                                            <p>Share Key: ${share.shareKey}</p>
                                            <p>Created: ${Utils.formatDate(share.createdAt)}</p>
                                            <p>Expires: ${Utils.formatDate(share.expiresAt)}</p>
                                            <p>Status: ${new Date(share.expiresAt) > new Date() ? 'Active' : 'Expired'}</p>
                                        </div>
                                        <div class="shared-document-actions">
                                            <button class="btn secondary copy-share-link" data-key="${share.shareKey}">
                                                <i class="fas fa-copy"></i> Copy Link
                                            </button>
                                            <button class="btn danger revoke-share" data-key="${share.shareKey}">
                                                <i class="fas fa-trash"></i> Revoke
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-share-alt fa-3x"></i>
                                <p>You haven't shared any documents yet</p>
                                <p>Create a document and use the share button to get started</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            const modal = document.getElementById('shared-documents-modal') || this.createModal('shared-documents-modal');
            modal.innerHTML = modalContent;
            this.openModal('shared-documents-modal');
            
            // Setup event listeners
            document.querySelectorAll('.copy-share-link').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const shareKey = e.target.closest('.copy-share-link').getAttribute('data-key');
                    const shareUrl = sharingManager.createShareableUrl(shareKey);
                    Utils.copyToClipboard(shareUrl);
                    Utils.showNotification('Share link copied!', 'success');
                });
            });
            
            document.querySelectorAll('.revoke-share').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const shareKey = e.target.closest('.revoke-share').getAttribute('data-key');
                    sharingManager.revokeShareKey(shareKey);
                    Utils.showNotification('Share revoked successfully', 'success');
                    // Refresh the list
                    this.viewSharedDocuments();
                });
            });
        } catch (error) {
            Utils.showNotification('Failed to load shared documents', 'error');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new AnonDocsApp();
    window.anonDocsApp = app; // Make available globally for debugging
    await app.init();
});