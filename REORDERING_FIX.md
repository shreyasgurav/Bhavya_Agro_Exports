# Reordering Fix - What Was Changed

## Problem
Changes made in the admin panel (reordering categories and products) were not reflecting on the products.html page.

## Root Cause
The products.html page was using real-time Firestore listeners for products, but it wasn't fetching the category order data. The `sortProducts()` function requires each product to have a `categoryOrder` property to properly sort products by category first, then by product order within each category.

## Changes Made

### 1. **products.html** - Added Category Order Listener
**Before:** Only listened to products collection
**After:** Now listens to both categories and products collections

```javascript
// Added category listener to fetch order
let categoryOrderMap = {};

onSnapshot(collection(db, 'categories'), (categoriesSnapshot) => {
  categoryOrderMap = {};
  categoriesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name) {
      categoryOrderMap[data.name] = data.order !== undefined ? data.order : 999;
    }
  });
});

// Products listener now applies category order
onSnapshot(collection(db, 'products'), (snapshot) => {
  let freshProducts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.status !== 'unavailable') {
      const product = { id: doc.id, ...data };
      // Apply category order from the map
      product.categoryOrder = categoryOrderMap[product.category] || 999;
      freshProducts.push(product);
    }
  });
  
  // Sort using both category order and product order
  freshProducts = sortProducts(freshProducts);
  renderCatalog(freshProducts);
});
```

### 2. **index.html** - Real-time Category Updates
**Before:** Used one-time `.get()` to fetch categories
**After:** Uses `.onSnapshot()` for real-time updates

```javascript
// Changed from:
db.collection('categories').orderBy('order', 'asc').get()

// To:
db.collection('categories').orderBy('order', 'asc').onSnapshot()
```

### 3. **admin/admin.js** - Enhanced Broadcasting
**Before:** Only broadcasted after full category reorder
**After:** Broadcasts after each individual category order update

```javascript
async function updateCategoryOrder(categoryId, newOrder) {
  await db.collection("categories").doc(categoryId).update({
    order: newOrder,
    updatedAt: new Date()
  });
  
  // Added: Broadcast to notify website
  broadcastCategoryOrderChange();
}
```

## How It Works Now

### Category Reordering Flow:
1. **Admin Panel:** User drags category card
2. **Firebase Update:** `order` field updated in Firestore
3. **Real-time Sync:** 
   - index.html listener detects change → re-renders categories
   - products.html listener detects change → updates categoryOrderMap
4. **Website Updates:** Categories appear in new order immediately

### Product Reordering Flow:
1. **Admin Panel:** User expands category and drags product
2. **Firebase Update:** `order` field updated in Firestore
3. **Real-time Sync:** products.html listener detects change
4. **Sorting:** Products sorted by:
   - First: Category order (from categoryOrderMap)
   - Then: Product order within category
5. **Website Updates:** Products appear in new order immediately

## Testing Steps

1. **Open two browser windows:**
   - Window 1: Admin panel (http://localhost:8080/admin/)
   - Window 2: Main website (http://localhost:8080/products.html)

2. **Test Category Reordering:**
   - In admin panel, go to Categories tab
   - Drag a category card to a new position
   - Check Window 2 - categories should reorder immediately
   - Check browser console for: `📊 Category order map updated`

3. **Test Product Reordering:**
   - In admin panel, click "View Products" on a category
   - Drag a product to a new position
   - Check Window 2 - products should reorder immediately
   - Check browser console for: `📦 Products loaded and sorted`

## Console Debugging

You should see these logs in the browser console:

**products.html:**
- `📊 Category order map updated: {oils: 0, grains: 1, cakes: 2}`
- `📦 Products loaded and sorted: 9 products`

**admin panel:**
- `✅ Updated category [id] order to [number]`
- `✅ Updated product [id] order to [number]`
- `📡 Broadcasted product order change to website`

## Key Points

✅ **Real-time sync** - No page refresh needed
✅ **Category order** - Properly fetched and applied to products
✅ **Product order** - Respects both category order and product order
✅ **Fallback handling** - Uses default order (999) if not set
✅ **Error handling** - Falls back to static categories if Firebase fails

## If It Still Doesn't Work

1. **Check Firebase Console:**
   - Verify products have `order` field
   - Verify categories have `order` field

2. **Check Browser Console:**
   - Look for error messages
   - Verify the debug logs appear

3. **Clear Cache:**
   - Clear localStorage: `localStorage.clear()`
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Verify Firebase Rules:**
   - Ensure read access is allowed for products and categories collections
