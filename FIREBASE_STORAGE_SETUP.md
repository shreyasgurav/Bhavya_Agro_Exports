# Firebase Storage CORS and Access Configuration

## Overview
This document explains how to configure Firebase Storage for proper image upload functionality in both development and production environments.

## Files Created

### 1. `cors.json`
CORS configuration file that allows:
- Local development origins (localhost:8081, localhost:3000)
- Production domains (your actual domains)
- All necessary HTTP methods (GET, POST, PUT, DELETE, HEAD, OPTIONS)
- Required headers for Firebase Storage operations

### 2. `storage.rules`
Firebase Storage security rules that allow:
- Public read access to all images
- Authenticated write access for admin users
- Proper path matching for products folder

### 3. `setup-cors.sh`
Automated script to apply CORS configuration using gsutil

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
./setup-cors.sh
```

### Option 2: Manual Setup

#### Step 1: Install Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
source ~/.bashrc
```

#### Step 2: Authenticate with Google Cloud
```bash
gcloud auth login
gcloud config set project bhavya-agro-d3407
```

#### Step 3: Apply CORS Configuration
```bash
gsutil cors set cors.json gs://bhavya-agro-d3407.appspot.com
```

#### Step 4: Deploy Storage Rules
```bash
firebase deploy --only storage
```

## Environment Configuration

### Development Environment
- **Origin**: `http://localhost:8081`
- **Firebase Config**: Uses development keys from `admin/admin.js`
- **Testing**: Upload works immediately after CORS setup

### Production Environment
- **Origin**: `https://yourdomain.com`
- **Firebase Config**: Uses production Firebase config
- **Deployment**: Apply CORS rules before deploying

## Upload Code Improvements

### Enhanced Error Handling
- **CORS Detection**: Specific error messages for CORS issues
- **Firebase Error Codes**: Detailed handling for all Storage errors
- **File Validation**: Type, size, and name sanitization
- **Progress Tracking**: Real-time upload progress
- **Modern API**: Uses `uploadBytes` instead of deprecated methods

### File Validation
- **Allowed Types**: JPG, PNG, WebP
- **Max Size**: 10MB (increased from 5MB)
- **Filename Sanitization**: Removes special characters
- **Unique Naming**: Timestamp + random suffix

## CORS Configuration Details

### Origins Allowed
```json
[
  "http://localhost:8081",
  "http://localhost:3000", 
  "http://127.0.0.1:8081",
  "http://127.0.0.1:3000",
  "https://bhavyaagroexports.com",
  "https://www.bhavyaagroexports.com",
  "https://bhavya-agro-exports.web.app",
  "https://bhavya-agro-d3407.web.app"
]
```

### Methods Allowed
- GET (for reading images)
- POST (for uploading)
- PUT (for updating)
- DELETE (for removing)
- HEAD (for metadata)
- OPTIONS (for CORS preflight)

### Headers Allowed
- Content-Type (for file uploads)
- Authorization (for authenticated requests)
- X-Requested-With (for AJAX requests)
- Cache-Control (for caching)

## Storage Rules

### Public Read Access
```javascript
match /products/{allPaths=**} {
  allow read: if true;
}
```

### Authenticated Write Access
```javascript
match /products/{allPaths=**} {
  allow write: if request.auth != null;
}
```

## Troubleshooting

### CORS Errors
If you see CORS errors in console:

1. **Check CORS Configuration**
   ```bash
   gsutil cors get gs://bhavya-agro-d3407.appspot.com
   ```

2. **Verify Origins**
   Ensure your domain is listed in allowed origins

3. **Wait for Propagation**
   CORS changes may take 5-15 minutes to propagate

4. **Clear Browser Cache**
   Clear browser cache and reload the page

### Permission Errors
If you see permission errors:

1. **Check Storage Rules**
   ```bash
   firebase deploy --only storage
   ```

2. **Verify Authentication**
   Ensure Firebase auth is properly initialized

3. **Check Bucket Name**
   Verify correct bucket name in gsutil commands

### Upload Failures
If uploads fail:

1. **Check File Size**
   Ensure file is under 10MB limit

2. **Check File Type**
   Only JPG, PNG, WebP are allowed

3. **Check Network**
   Verify internet connection and Firebase accessibility

## Testing

### Development Testing
1. Start local server: `python3 -m http.server 8081`
2. Open admin panel: `http://localhost:8081/admin/`
3. Test image upload with various file types
4. Check browser console for errors

### Production Testing
1. Deploy to production
2. Open admin panel on production domain
3. Test image upload functionality
4. Verify images load correctly on website

## Security Considerations

### Development
- Localhost origins are allowed for development
- Authentication is still required for uploads
- Public read access for images

### Production
- Only specific production domains allowed
- Proper authentication enforcement
- Regular security rule reviews

## Maintenance

### Regular Tasks
- Monitor Firebase Storage usage
- Update CORS rules when adding new domains
- Review storage rules periodically
- Update file size limits as needed

### Backup Strategy
- Firebase provides automatic backups
- Consider additional backup for critical images
- Monitor storage costs and usage

## Support

For issues with Firebase Storage:
1. Check Firebase Console: https://console.firebase.google.com/
2. Review Storage rules in Firebase Console
3. Monitor CORS configuration via gsutil
4. Check browser console for detailed error messages
