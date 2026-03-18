/**
 * products-service.js
 * Shared Firestore product CRUD module — admin panel + public website.
 */

import {
  db, collection, getDocs, doc,
  setDoc, deleteDoc, serverTimestamp
} from './firebase-config.js';

const COLLECTION = 'products';
const CACHE_KEY = 'bhavya_products_cache';
const CACHE_TTL = 3600000; // 1 hour
let cachedPublicProducts = null;

// ── FALLBACK_PRODUCTS (Mirrors current live site content exactly) ──────────────
export const FALLBACK_PRODUCTS = [
  { id: 'safflower-oil', name: 'Cold Pressed Safflower Oil', category: 'oils', categoryLabel: 'Premium Oils', price: 'On Request', description: 'Pure, natural, and heart-healthy oil extracted at low temperatures to retain its essential nutrients and neutral aroma.', image: 'images/b-safflower-full.png', tag: 'Cold Pressed', status: 'available', order: 1 },
  { id: 'sunflower-oil', name: 'Premium Sunflower Oil', category: 'oils', categoryLabel: 'Premium Oils', price: 'On Request', description: 'Crystal clear, light, and versatile cooking oil. High in Vitamin E and perfect for all culinary needs.', image: 'images/b-sunflower-full.png', tag: '', status: 'available', order: 2 },
  { id: 'soya-oil', name: 'Refined Soya Bean Oil', category: 'oils', categoryLabel: 'Premium Oils', price: 'On Request', description: 'High-quality refined soya bean oil, perfect for cooking, baking, and industrial food applications.', image: 'images/b-soya-full.png', tag: '', status: 'available', order: 3 },
  { id: 'all-types-rice', name: 'All Types of Rice', category: 'grains', categoryLabel: 'Grains & Sugar', price: 'On Request', description: 'A premium selection of diverse rice varieties including Basmati, Jasmine, Sona Masoori, and Brown Rice.', image: 'images/all-types-rice.png', tag: 'Premium Varieties', status: 'available', order: 1 },
  { id: 'gehu-wheat', name: 'Gehu (Golden Wheat)', category: 'grains', categoryLabel: 'Grains & Sugar', price: 'On Request', description: 'Premium quality wheat grains, high in protein and ideal for milling into superior quality flour.', image: 'images/gehu.png', tag: '', status: 'available', order: 2 },
  { id: 'refined-sugar', name: 'Refined White Sugar', category: 'grains', categoryLabel: 'Grains & Sugar', price: 'On Request', description: 'High-grade refined granulated sugar, meeting international standards for purity and sweetness.', image: 'images/sugar.png', tag: '', status: 'available', order: 3 },
  { id: 'peanut-oil-cake', name: 'Peanut Oil Cake', category: 'cakes', categoryLabel: 'Oil Seed Cakes', price: 'On Request', description: 'Protein-rich groundnut cake, an excellent nutritional supplement for livestock and poultry feed.', image: 'images/peanut-oil-cake.png', tag: 'Animal Feed', status: 'available', order: 1 },
  { id: 'cotton-oil-cake', name: 'Cotton Oil Cake', category: 'cakes', categoryLabel: 'Oil Seed Cakes', price: 'On Request', description: 'High-quality kapas cake, processed to ensure maximum nutritional value for dairy industries.', image: 'images/cotton-oil-cake.png', tag: '', status: 'available', order: 2 },
  { id: 'safflower-doc', name: 'Safflower De-oiled Cake (DOC)', category: 'cakes', categoryLabel: 'Oil Seed Cakes', price: 'On Request', description: 'Superior de-oiled cake meal, rich in fiber and protein, ideal for multi-purpose agricultural uses.', image: 'images/safflower-doc.png', tag: '', status: 'available', order: 3 }
];

export function sortProducts(list) {
  return list.sort((a, b) => {
    const ca = a.categoryOrder ?? 99;
    const cb = b.categoryOrder ?? 99;
    if (ca !== cb) return ca - cb;
    return (a.order || 99) - (b.order || 99);
  });
}

export async function fetchAllProducts() {
  try {
    // Fetch both products and categories to apply proper ordering
    const [productsSnap, categoriesSnap] = await Promise.all([
      getDocs(collection(db, COLLECTION)),
      getDocs(collection(db, 'categories'))
    ]);
    
    if (!productsSnap.empty) {
      const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Apply category order if categories exist
      if (!categoriesSnap.empty) {
        const categories = categoriesSnap.docs.map(d => d.data());
        const categoryOrderMap = {};
        
        categories.forEach(cat => {
          categoryOrderMap[cat.name] = cat.order || 999;
        });
        
        // Apply category order to products
        products.forEach(product => {
          product.categoryOrder = categoryOrderMap[product.category] || 999;
        });
      }
      
      return sortProducts(products);
    }
    return sortProducts([...FALLBACK_PRODUCTS]);
  } catch (err) {
    console.warn('[products-service] Firestore read failed, using defaults');
    return sortProducts([...FALLBACK_PRODUCTS]);
  }
}

export async function fetchPublicProducts() {
  if (cachedPublicProducts) return cachedPublicProducts;

  // 1. Try Cloud Firestore (LIVE)
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    if (!snap.empty) {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cachedPublicProducts = sortProducts(data.filter(p => p.status !== 'unavailable'));
      
      // Save to cache for offline/faster subsequent loads
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: cachedPublicProducts,
          timestamp: Date.now()
        }));
      } catch (e) {}
      
      return cachedPublicProducts;
    }
  } catch (err) {
    console.warn('[products-service] Live fetch failed:', err.message);
  }

  // 2. Try LocalStorage Cache (Offline Fallback)
  try {
    const local = localStorage.getItem(CACHE_KEY);
    if (local) {
      const { data, timestamp } = JSON.parse(local);
      if (Date.now() - timestamp < CACHE_TTL) {
        cachedPublicProducts = data;
        return data;
      }
    }
  } catch (e) {}

  // 3. Try JSON Fallback (Static Fallback)
  try {
    const resp = await fetch('/data/products.json');
    if (resp.ok) {
      const data = await resp.json();
      cachedPublicProducts = sortProducts(data.filter(p => p.status !== 'unavailable'));
      return cachedPublicProducts;
    }
  } catch (e) {}

  // 4. Absolute Fallback (Built-in Default)
  cachedPublicProducts = sortProducts(FALLBACK_PRODUCTS.filter(p => p.status !== 'unavailable'));
  return cachedPublicProducts;
}

export function clearProductCache() {
  localStorage.removeItem(CACHE_KEY);
  cachedPublicProducts = null;
}

export function prefetchProducts() {
  fetchPublicProducts().catch(() => {});
}

export async function saveProduct(product) {
  await setDoc(doc(db, COLLECTION, product.id), { ...product, updatedAt: serverTimestamp() }, { merge: true });
  clearProductCache();
}

export async function deleteProductById(id) {
  await deleteDoc(doc(db, COLLECTION, id));
  clearProductCache();
}

export async function updateProductStatus(id, status) {
  await setDoc(doc(db, COLLECTION, id), { status, updatedAt: serverTimestamp() }, { merge: true });
  clearProductCache();
}
