#!/bin/bash

# Phase 1 Optimization Script
# This script applies quick performance optimizations

echo "🚀 Starting Phase 1 Performance Optimizations..."

# 1. Remove console.log statements from production code
echo "📝 Removing console.log statements..."
find components lib server app -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -exec sed -i '/console\.log/d' {} \;

echo "✅ Removed console.log statements"

# 2. Run database migration
echo "📊 Applying database indexes..."
echo "Please run: psql -h localhost -U odoo17 -d me -f migrations/001_add_performance_indexes.sql"
echo "   (This requires database password)"

# 3. Restart dev server to apply Next.js config changes
echo "🔄 Please restart your dev server (bun run dev) to apply compression settings"

echo ""
echo "✨ Phase 1 optimizations complete!"
echo ""
echo "Next steps:"
echo "1. Run the database migration command above"
echo "2. Restart your dev server"
echo "3. Test the dashboard performance"
