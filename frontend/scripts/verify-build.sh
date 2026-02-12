#!/bin/bash
# Verify build output for different deployment targets

set -e

echo "🔍 Verifying build configuration..."

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found. Run 'npm run build' first."
  exit 1
fi

# Check index.html exists
if [ ! -f "dist/index.html" ]; then
  echo "❌ dist/index.html not found"
  exit 1
fi

# Check for asset files
if [ ! -d "dist/assets" ]; then
  echo "❌ dist/assets/ directory not found"
  exit 1
fi

# Count JS and CSS files
JS_COUNT=$(find dist/assets -name "*.js" | wc -l | tr -d ' ')
CSS_COUNT=$(find dist/assets -name "*.css" | wc -l | tr -d ' ')

if [ "$JS_COUNT" -lt 1 ]; then
  echo "❌ No JavaScript files found in dist/assets/"
  exit 1
fi

if [ "$CSS_COUNT" -lt 1 ]; then
  echo "❌ No CSS files found in dist/assets/"
  exit 1
fi

# Check base path in index.html
BASE_PATH=${VITE_BASE_PATH:-/}
echo "📍 Expected base path: $BASE_PATH"

if grep -q "src=\"${BASE_PATH}assets/" dist/index.html; then
  echo "✅ JavaScript paths correct"
else
  echo "⚠️  JavaScript paths may not match expected base path"
  echo "   Found in index.html:"
  grep -o 'src="[^"]*"' dist/index.html | head -3
fi

if grep -q "href=\"${BASE_PATH}assets/" dist/index.html; then
  echo "✅ CSS paths correct"
else
  echo "⚠️  CSS paths may not match expected base path"
fi

echo ""
echo "📦 Build contents:"
echo "   - JavaScript files: $JS_COUNT"
echo "   - CSS files: $CSS_COUNT"
echo "   - Total size: $(du -sh dist | cut -f1)"
echo ""
echo "✅ Build verification complete!"
