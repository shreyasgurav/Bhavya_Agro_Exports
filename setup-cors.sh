#!/bin/bash

# Firebase Storage CORS Configuration Script
# This script applies CORS settings to Firebase Storage bucket

echo "🔧 Configuring Firebase Storage CORS..."

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil not found. Installing Google Cloud SDK..."
    echo "Please install gsutil first:"
    echo "  1. Visit: https://cloud.google.com/sdk/docs/install"
    echo "  2. Download and install Google Cloud SDK"
    echo "  3. Run: gcloud init"
    exit 1
fi

# Get the Firebase project ID from config
PROJECT_ID=$(grep -o 'projectId: "[^"]*"' admin/admin.js | sed 's/.*projectId: "\([^"]*\)".*/\1/')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not extract project ID from admin.js"
    echo "Please ensure Firebase config is properly set in admin/admin.js"
    exit 1
fi

echo "📋 Using project ID: $PROJECT_ID"

# Apply CORS configuration
echo "🌐 Applying CORS configuration to Firebase Storage..."

gsutil cors set cors.json gs://bhavya-agro-d3407.appspot.com

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "📊 Current CORS configuration:"
    gsutil cors get gs://$PROJECT_ID.appspot.com
    echo ""
    echo "🔄 You may need to wait a few minutes for changes to propagate."
    echo "🌍 Test image upload in admin panel:"
    echo "   http://localhost:8081/admin/"
else
    echo "❌ Failed to apply CORS configuration"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Ensure you're authenticated: gcloud auth login"
    echo "  2. Check project permissions: gcloud projects list"
    echo "  3. Verify bucket exists: gsutil ls gs://$PROJECT_ID.appspot.com"
    exit 1
fi
