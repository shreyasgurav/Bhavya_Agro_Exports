// Initialize Firebase and populate with complete product data
const firebaseConfig = {
    apiKey: "AIzaSyDDgkJZA6BpTYLoCfVFdcvHbLzp6D_0bU4",
    authDomain: "bhavya-agro-d3407.firebaseapp.com",
    projectId: "bhavya-agro-d3407",
    storageBucket: "bhavya-agro-d3407.appspot.com",
    messagingSenderId: "701815969630",
    appId: "1:701815969630:web:d38ef87a8204b72f2f61cf",
    measurementId: "G-GMV0NN4VKR"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();

// Complete product data from main website (exact match)
const COMPLETE_PRODUCTS = [
    {
        name: "Cold Pressed Safflower Oil",
        category: "oils",
        categoryLabel: "Premium Oils",
        price: "On Request",
        description: "Pure, natural, and heart-healthy oil extracted at low temperatures to retain its essential nutrients and neutral aroma.",
        image: "images/b-safflower-full.png",
        tag: "Cold Pressed",
        status: "available",
        order: 1
    },
    {
        name: "Premium Sunflower Oil",
        category: "oils",
        categoryLabel: "Premium Oils",
        price: "On Request",
        description: "Crystal clear, light, and versatile cooking oil. High in Vitamin E and perfect for all culinary needs.",
        image: "images/b-sunflower-full.png",
        tag: "",
        status: "available",
        order: 2
    },
    {
        name: "Refined Soya Bean Oil",
        category: "oils",
        categoryLabel: "Premium Oils",
        price: "On Request",
        description: "High-quality refined soya bean oil, perfect for cooking, baking, and industrial food applications.",
        image: "images/b-soya-full.png",
        tag: "",
        status: "available",
        order: 3
    },
    {
        name: "All Types of Rice",
        category: "grains",
        categoryLabel: "Grains & Sugar",
        price: "On Request",
        description: "A premium selection of diverse rice varieties including Basmati, Jasmine, Sona Masoori, and Brown Rice.",
        image: "images/all-types-rice.png",
        tag: "Premium Varieties",
        status: "available",
        order: 1
    },
    {
        name: "Gehu (Golden Wheat)",
        category: "grains",
        categoryLabel: "Grains & Sugar",
        price: "On Request",
        description: "Premium quality wheat grains, high in protein and ideal for milling into superior quality flour.",
        image: "images/gehu.png",
        tag: "",
        status: "available",
        order: 2
    },
    {
        name: "Refined White Sugar",
        category: "grains",
        categoryLabel: "Grains & Sugar",
        price: "On Request",
        description: "High-grade refined granulated sugar, meeting international standards for purity and sweetness.",
        image: "images/sugar.png",
        tag: "",
        status: "available",
        order: 3
    },
    {
        name: "Peanut Oil Cake",
        category: "cakes",
        categoryLabel: "Oil Seed Cakes",
        price: "On Request",
        description: "Protein-rich groundnut cake, an excellent nutritional supplement for livestock and poultry feed.",
        image: "images/peanut-oil-cake.png",
        tag: "Animal Feed",
        status: "available",
        order: 1
    },
    {
        name: "Cotton Oil Cake",
        category: "cakes",
        categoryLabel: "Oil Seed Cakes",
        price: "On Request",
        description: "High-quality kapas cake, processed to ensure maximum nutritional value for dairy industries.",
        image: "images/cotton-oil-cake.png",
        tag: "",
        status: "available",
        order: 2
    },
    {
        name: "Safflower De-oiled Cake (DOC)",
        category: "cakes",
        categoryLabel: "Oil Seed Cakes",
        price: "On Request",
        description: "Superior de-oiled cake meal, rich in fiber and protein, ideal for multi-purpose agricultural uses.",
        image: "images/safflower-doc.png",
        tag: "",
        status: "available",
        order: 3
    }
];

// Complete categories data (exact match from main website)
const COMPLETE_CATEGORIES = [
    {
        name: "oils",
        description: "Premium edible oils including safflower, sunflower, and soya bean oil",
        label: "Premium Oils",
        order: 1
    },
    {
        name: "grains",
        description: "Wholesome grains and sugar including rice, wheat, and refined sugar",
        label: "Grains & Sugar",
        order: 2
    },
    {
        name: "cakes",
        description: "Nutritional oil seed cakes for animal feed and agricultural use",
        label: "Oil Seed Cakes",
        order: 3
    }
];

// Function to populate Firebase with complete data
async function populateFirebaseData() {
    console.log('🚀 Starting Firebase data population...');
    
    try {
        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        const productsSnapshot = await db.collection('products').get();
        const categoriesSnapshot = await db.collection('categories').get();
        
        // Delete existing products
        const productDeleteBatch = db.batch();
        productsSnapshot.docs.forEach(doc => {
            productDeleteBatch.delete(doc.ref);
        });
        await productDeleteBatch.commit();
        console.log('✅ Cleared existing products');
        
        // Delete existing categories
        const categoryDeleteBatch = db.batch();
        categoriesSnapshot.docs.forEach(doc => {
            categoryDeleteBatch.delete(doc.ref);
        });
        await categoryDeleteBatch.commit();
        console.log('✅ Cleared existing categories');
        
        // Add categories
        console.log('📂 Adding categories...');
        for (const category of COMPLETE_CATEGORIES) {
            await db.collection('categories').add({
                ...category,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log('✅ Categories added successfully');
        
        // Add products
        console.log('📦 Adding products...');
        for (const product of COMPLETE_PRODUCTS) {
            await db.collection('products').add({
                ...product,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log('✅ Products added successfully');
        
        console.log('🎉 Firebase data population complete!');
        console.log(`📊 Added ${COMPLETE_CATEGORIES.length} categories and ${COMPLETE_PRODUCTS.length} products`);
        console.log('📋 Categories added:');
        COMPLETE_CATEGORIES.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.label})`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error populating Firebase:', error);
        return false;
    }
}

// Function to verify data was populated correctly
async function verifyData() {
    console.log('🔍 Verifying Firebase data...');
    
    try {
        const productsSnapshot = await db.collection('products').get();
        const categoriesSnapshot = await db.collection('categories').get();
        
        console.log(`📦 Products in Firebase: ${productsSnapshot.size}`);
        console.log(`📂 Categories in Firebase: ${categoriesSnapshot.size}`);
        
        // List all categories
        console.log('📋 Available categories:');
        categoriesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.name} (${data.label})`);
        });
        
        // List all products by category
        console.log('📦 Products by category:');
        const productsByCategory = {};
        productsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!productsByCategory[data.category]) {
                productsByCategory[data.category] = [];
            }
            productsByCategory[data.category].push(data.name);
        });
        
        Object.keys(productsByCategory).forEach(category => {
            console.log(`  ${category}: ${productsByCategory[category].join(', ')}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error verifying data:', error);
        return false;
    }
}

// Auto-run when script loads
window.populateFirebaseData = populateFirebaseData;
window.verifyData = verifyData;

console.log('📋 Firebase data population script loaded');
console.log('🔥 Categories to be added:');
COMPLETE_CATEGORIES.forEach(cat => {
    console.log(`  - ${cat.name} → ${cat.label}`);
});
console.log('Run populateFirebaseData() to populate Firebase with complete data');
console.log('Run verifyData() to verify current data');
