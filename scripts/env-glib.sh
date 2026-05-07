# Environment configuration for building with glib 2.72.3
# Source this file before building: source scripts/env-glib.sh

export PKG_CONFIG_PATH=/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH

echo "✓ glib 2.72.3 environment configured"
echo "  PKG_CONFIG_PATH=$PKG_CONFIG_PATH"
echo ""
echo "Current glib version:"
pkg-config --modversion glib-2.0
echo ""
echo "To build, run:"
echo "  cargo build --lib (in src-tauri directory)"
echo ""