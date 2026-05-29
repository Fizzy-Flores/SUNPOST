#!/bin/bash
# Script to prepare backend for Render deployment

set -e

echo "🚀 Preparing Sunpost backend for Render deployment..."

# Check if running from backend directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Run this script from the backend directory."
    exit 1
fi

# Generate ADMIN_API_KEY if not present
if ! grep -q "ADMIN_API_KEY=" .env 2>/dev/null; then
    echo "📝 Generating ADMIN_API_KEY..."
    ADMIN_KEY=$(openssl rand -hex 32)
    echo "ADMIN_API_KEY=$ADMIN_KEY" >> .env
    echo "✅ API key generated and saved to .env"
fi

# Verify requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found!"
    exit 1
fi

# Verify Procfile exists
if [ ! -f "Procfile" ]; then
    echo "❌ Procfile not found! Create one with:"
    echo "   web: uvicorn main:app --host 0.0.0.0 --port \$PORT"
    exit 1
fi

# Verify runtime.txt exists
if [ ! -f "runtime.txt" ]; then
    echo "❌ runtime.txt not found! Create one with:"
    echo "   python-3.12.0"
    exit 1
fi

echo ""
echo "✅ Backend is ready for Render deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add . && git commit -m 'Prepare backend for Render' && git push"
echo ""
echo "2. Go to https://render.com and create a new Web Service"
echo ""
echo "3. Set these environment variables in Render dashboard:"
echo "   - FIREBASE_DATABASE_URL"
echo "   - FIREBASE_WEB_API_KEY"
echo "   - FIREBASE_STORAGE_BUCKET"
echo "   - ADMIN_API_KEY (already in your .env)"
echo ""
echo "4. For Firebase credentials, use Option A (Base64 encode service-account.json)"
echo "   See RENDER_DEPLOYMENT.md for detailed instructions"
echo ""
