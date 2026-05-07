#!/bin/bash

# Install dependencies for libsoup-3.0 compilation

set -e

echo "========================================="
echo "Installing libsoup-3.0 dependencies"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    echo ""
    echo "Required packages:"
    echo "  - libnghttp2-devel"
    echo ""
    echo "Please run:"
    echo "  sudo dnf install -y libnghttp2-devel"
    exit 1
fi

echo "Installing libnghttp2-devel..."
dnf install -y libnghttp2-devel

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ libnghttp2-devel installed successfully"
    echo ""
    echo "Now you can compile libsoup-3.0:"
    echo "  cd libsoup-3.0.8"
    echo "  export PKG_CONFIG_PATH=/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig:\$PKG_CONFIG_PATH"
    echo "  meson setup build --prefix=/usr/local"
    echo "  ninja -C build"
    echo "  sudo ninja -C build install"
else
    echo ""
    echo "✗ Installation failed"
    exit 1
fi