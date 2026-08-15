#!/bin/bash

# Script to update all chart components to remove useQuery and use initialData directly

echo "🔄 Updating chart components to use SSR data directly..."

# List of chart component files to update
COMPONENTS=(
  "components/demography-charts.tsx"
  "components/socio-economic-charts.tsx"
  "components/land-charts.tsx"
  "components/admin-charts.tsx"
)

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "  ✓ Processing $component..."
    
    # Remove useQuery import
    sed -i '/import.*useQuery.*from.*@tanstack\/react-query/d' "$component"
    
    # Note: Manual updates needed for each component's specific useQuery usage
    # This script marks them for review
  else
    echo "  ⚠ File not found: $component"
  fi
done

echo ""
echo "✅ Import cleanup complete!"
echo "⚠️  Manual updates still needed:"
echo "   - Replace useQuery logic with direct initialData usage"
echo "   - Update Props interface to make initialData required"
echo "   - Remove buildQueryParams functions"
echo ""
