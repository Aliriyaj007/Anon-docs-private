// Analytics Manager

class AnalyticsManager {
    constructor() {
        // No chart instances needed
    }

    // Get document statistics
    async getDocumentStats(documents) {
        const totalDocs = documents.length;
        const encryptedDocs = documents.filter(doc => doc.encrypted).length;
        
        let totalWords = 0;
        let totalTags = 0;
        const tagCounts = {};
        
        documents.forEach(doc => {
            if (doc.content && !doc.encrypted) {
                // Strip HTML tags for word count
                const textContent = doc.content.replace(/<[^>]*>/g, ' ');
                totalWords += Utils.getWordCount(textContent);
            }
            
            if (doc.tags && Array.isArray(doc.tags)) {
                totalTags += doc.tags.length;
                doc.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        // Find most popular tag
        let popularTag = '-';
        let maxCount = 0;
        for (const [tag, count] of Object.entries(tagCounts)) {
            if (count > maxCount) {
                maxCount = count;
                popularTag = tag;
            }
        }
        
        // Recent documents (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentDocs = documents.filter(doc => 
            new Date(doc.createdAt) > sevenDaysAgo
        ).length;
        
        // Average document length
        const avgLength = totalDocs > 0 ? Math.round(totalWords / totalDocs) : 0;
        
        const storageUsage = await storageManager.getStorageUsage();
        
        return {
            totalDocs,
            encryptedDocs,
            totalWords,
            totalTags: Object.keys(tagCounts).length,
            popularTag,
            recentDocs,
            avgLength,
            storageUsage: storageUsage.usage
        };
    }

    // Update analytics display
    async updateAnalyticsDisplay(documents) {
        const stats = await this.getDocumentStats(documents);
        
        // Update stat elements
        const elements = {
            'total-docs': stats.totalDocs,
            'encrypted-docs': stats.encryptedDocs,
            'total-words': stats.totalWords,
            'total-tags': stats.totalTags,
            'storage-used': Utils.formatBytes(stats.storageUsage),
            'recent-docs': stats.recentDocs,
            'popular-tag': stats.popularTag,
            'avg-length': `${stats.avgLength} words`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Track document creation
    trackDocumentEvent(eventType, document) {
        // In a real app, this would send to analytics service
        console.log(`Document ${eventType}:`, document.title);
    }

    // Track user session
    trackSession() {
        // Track session duration, features used, etc.
        console.log('Session tracked');
    }
}

// Initialize analytics manager
const analyticsManager = new AnalyticsManager();