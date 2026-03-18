# Drag & Drop Reordering Feature

## Overview
The admin panel now has full drag-and-drop functionality to reorder both **categories** and **products**. Changes made in the admin panel automatically reflect on the main website in real-time.

## How to Use

### Reordering Categories
1. Log into the admin panel at `/admin/`
2. Navigate to the **Categories** tab
3. **Drag any category card** up or down to reorder
4. The order is saved automatically to Firebase
5. Changes reflect immediately on the main website

### Reordering Products Within Categories
1. In the **Categories** tab, click the **"View Products"** button on any category
2. The products list will expand
3. **Drag any product** up or down within that category
4. The order is saved automatically to Firebase
5. Changes reflect immediately on the main website

## Technical Details

### What Was Updated

#### Admin Panel (`admin/admin.js`)
- ✅ Products now load sorted by `order` field (instead of alphabetically)
- ✅ Categories load sorted by `order` field
- ✅ Product rows are now draggable (`draggable="true"`)
- ✅ Products sorted by order before rendering in category lists
- ✅ Broadcast mechanism added to notify website of changes

#### Styling (`admin/style.css`)
- ✅ Added `drag-over` visual feedback for product rows
- ✅ Improved border transitions for category cards
- ✅ Better visual indicators during drag operations

#### Admin UI (`admin/index.html`)
- ✅ Added instructional banner explaining drag-and-drop
- ✅ Fixed admin.js path issue

### How It Works

1. **Drag Start**: When you start dragging, the element gets a `dragging` class (semi-transparent)
2. **Drag Over**: When hovering over a drop target, it gets a `drag-over` class (gold dashed border)
3. **Drop**: Elements are reordered in the DOM
4. **Firebase Update**: Each affected item's `order` field is updated in Firestore
5. **Broadcast**: A message is sent via BroadcastChannel to notify the website
6. **Website Refresh**: The main website listens for these broadcasts and refreshes product data

### Database Fields

Both `products` and `categories` collections now use:
- `order` (number): Determines display order (lower = appears first)
- `updatedAt` (timestamp): Tracks when the order was last changed

### Real-time Sync

The system uses **BroadcastChannel API** to sync changes:
- Admin panel broadcasts on channel: `bhavya-updates`
- Main website listens on the same channel
- When a change is detected, the website refreshes product data from Firestore

## Visual Indicators

- **Drag Handle**: `⋮⋮` symbol on categories and products
- **Dragging**: Semi-transparent with slight rotation
- **Drop Target**: Gold dashed border when hovering
- **Hover**: Slight transform/highlight effect

## Browser Compatibility

Uses HTML5 Drag & Drop API - supported in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Notes

- Order changes are **immediate** - no save button needed
- Products are ordered **within their category** only
- Categories are ordered **globally** across the website
- The main Products page respects both category order and product order
