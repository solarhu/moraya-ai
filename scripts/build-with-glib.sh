#!/bin/bash

# Build Moraya with glib 2.72.3

set -e

echo "========================================="
echo "Building Moraya with glib 2.72.3"
echo "========================================="
echo ""

# Set PKG_CONFIG_PATH to use glib 2.72.3 from /usr/local
export PKG_CONFIG_PATH=/usr/local/lib64/pkgconfig:/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH

echo "Using glib from: $PKG_CONFIG_PATH"
echo ""

# Verify glib version
echo "Checking glib version..."
pkg-config --modversion glib-2.0
echo ""

# Build project
echo "========================================="
echo "Building Rust backend..."
echo "========================================="
echo ""

cd src-tauri

# Clean previous build if needed
if [ "$1" == "--clean" ]; then
    echo "Cleaning previous build..."
    cargo clean
fi

# Build
cargo build --lib

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Build successful!"
    echo "========================================="
    echo ""
    echo "✓ Rust backend compiled successfully with glib 2.72.3"
    echo ""
else
    echo ""
    echo "✗ Build failed"
    exit 1
fi