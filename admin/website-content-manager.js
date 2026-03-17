// Website Content Management System for Admin Panel
// This will control all static content on the main website

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDDgkJZA6BpTYLoCfVFdcvHbLzp6D_0bU4",
    authDomain: "bhavya-agro-d3407.firebaseapp.com",
    projectId: "bhavya-agro-d3407",
    storageBucket: "bhavya-agro-d3407.firebasestorage.app",
    messagingSenderId: "701815969630",
    appId: "1:701815969630:web:d38ef87a8204b72f2f61cf",
    measurementId: "G-GMV0NN4VKR"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Website content structure
const WEBSITE_CONTENT = {
    hero: {
        title: "Bhavya Agro Exports",
        subtitle: "Three Decades of Global Trade Excellence",
        description: "From 1990s Safflower oil trading to a multi-sector global empire—we don't just export produce, we export three decades of Indian trade integrity.",
        ctaButton: "Explore Products",
        backgroundImage: "images/hero_produce.png"
    },
    about: {
        title: "About Bhavya Agro Exports",
        subtitle: "Since the 1990s",
        sections: [
            {
                title: "Our Heritage",
                content: "Founded in the 1990s, Bhavya Agro Exports carries 30+ years of trade credibility. From our roots in Safflower oil to a global multi-sector export powerhouse.",
                image: "images/about-heritage.png"
            },
            {
                title: "Our Mission", 
                content: "To deliver premium Indian agricultural products to global markets while maintaining the highest standards of quality, sustainability, and trade ethics.",
                image: "images/about-mission.png"
            }
        ]
    },
    whyChooseUs: {
        title: "Why Choose Us",
        subtitle: "30 Years of Credibility",
        reasons: [
            {
                title: "Nationwide Distribution",
                description: "Extensive network across India with reliable sourcing and supply chain management.",
                icon: "bx-map"
            },
            {
                title: "30+ Years Legacy",
                description: "Three decades of established relationships and proven track record in international trade.",
                icon: "bx-time-five"
            },
            {
                title: "Certified Quality",
                description: "APEDA & FSSAI certified ensuring compliance with international food safety standards.",
                icon: "bx-certified"
            },
            {
                title: "Global Logistics",
                description: "End-to-end logistics support from farm to destination with real-time tracking.",
                icon: "bx-ship"
            }
        ]
    },
    certificates: {
        title: "Our Certifications",
        subtitle: "Quality & Compliance Assured",
        certificates: [
            {
                name: "APEDA",
                description: "Agricultural and Processed Food Products Export Development Authority",
                image: "images/apeda-cert.png"
            },
            {
                name: "FSSAI",
                description: "Food Safety and Standards Authority of India Certification",
                image: "images/fssai-cert.png"
            },
            {
                name: "ISO 9001",
                description: "International Quality Management System Certification",
                image: "images/iso-cert.png"
            },
            {
                name: "Organic Certification",
                description: "Certified Organic Production and Processing Standards",
                image: "images/organic-cert.png"
            }
        ]
    },
    contact: {
        title: "Get in Touch",
        subtitle: "We respond within 24 hours",
        email: "info@bhavyaagroexports.com",
        phone: "+91-9876543210",
        address: "123 Trade Center, Mumbai, Maharashtra 400001, India",
        workingHours: "Monday - Friday: 9:00 AM - 6:00 PM IST"
    },
    seo: {
        metaTitle: "Bhavya Agro Exports | Premium Indian Agricultural Products Since 1990s",
        metaDescription: "Established in the 1990s, Bhavya Agro Exports is a trusted global supplier of premium agricultural products. 30+ years of trade excellence in oils, grains, and more.",
        keywords: "agricultural exports, safflower oil, indian exports, premium oils, global trade",
        ogImage: "images/og-cover.jpg"
    }
};

// Function to populate Firebase with complete website content
async function populateWebsiteContent() {
    console.log('🚀 Populating Firebase with complete website content...');
    
    try {
        // Clear existing website content
        const contentSnapshot = await db.collection('website_content').get();
        const deleteBatch = db.batch();
        contentSnapshot.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        console.log('✅ Cleared existing website content');
        
        // Add all content sections
        for (const [section, data] of Object.entries(WEBSITE_CONTENT)) {
            await db.collection('website_content').doc(section).set({
                ...data,
                updatedAt: new Date(),
                updatedBy: 'admin'
            });
        }
        
        console.log('✅ Website content populated successfully');
        console.log('📊 Added content sections:', Object.keys(WEBSITE_CONTENT));
        
        return true;
    } catch (error) {
        console.error('❌ Error populating website content:', error);
        return false;
    }
}

// Function to update specific content section
async function updateContentSection(section, data) {
    try {
        await db.collection('website_content').doc(section).update({
            ...data,
            updatedAt: new Date(),
            updatedBy: 'admin'
        });
        console.log(`✅ Updated ${section} content`);
        
        // Clear cache for real-time sync
        if (typeof clearWebsiteCache === 'function') {
            clearWebsiteCache();
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Error updating ${section}:`, error);
        return false;
    }
}

// Function to get content section
async function getContentSection(section) {
    try {
        const doc = await db.collection('website_content').doc(section).get();
        if (doc.exists) {
            return doc.data();
        } else {
            console.warn(`⚠️ Content section ${section} not found, using fallback`);
            return WEBSITE_CONTENT[section] || null;
        }
    } catch (error) {
        console.error(`❌ Error getting ${section} content:`, error);
        return WEBSITE_CONTENT[section] || null;
    }
}

// Function to clear website cache
window.clearWebsiteCache = function() {
    console.log('🔄 Clearing website cache for real-time sync...');
    
    // Clear localStorage
    localStorage.removeItem('bhavya_website_cache');
    
    // Send broadcast message
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('bhavya-website-updates');
        channel.postMessage({ type: 'content-updated', timestamp: Date.now() });
        channel.close();
    }
    
    // Notify parent window
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'content-updated', timestamp: Date.now() }, '*');
    }
};

// Export functions for use in admin panel
window.populateWebsiteContent = populateWebsiteContent;
window.updateContentSection = updateContentSection;
window.getContentSection = getContentSection;
window.WEBSITE_CONTENT = WEBSITE_CONTENT;

console.log('📋 Website content management system loaded');
