#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[BUILD]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

check_deps() {
    command -v pnpm >/dev/null 2>&1 || error "pnpm not found"
    command -v cargo >/dev/null 2>&1 || error "cargo not found"
}

build_frontend() {
    log "Building frontend..."
    pnpm install && pnpm build
}

build_macos() {
    log "Building macOS Universal Binary..."
    rustup target add aarch64-apple-darwin x86_64-apple-darwin 2>/dev/null || true
    pnpm tauri build --target universal-apple-darwin
    log "Output: src-tauri/target/universal-apple-darwin/release/bundle/"
}

build_windows() {
    log "Building Windows x64..."
    rustup target add x86_64-pc-windows-msvc 2>/dev/null || true

    if command -v cargo-xwin >/dev/null 2>&1; then
        cd src-tauri && cargo xwin build --release --target x86_64-pc-windows-msvc && cd ..
        log "Output: src-tauri/target/x86_64-pc-windows-msvc/release/"
    else
        warn "cargo-xwin not found. Install: cargo install cargo-xwin"
        warn "Skipping Windows build."
    fi
}

case "${1:-all}" in
    all)     check_deps && build_frontend && build_macos && build_windows ;;
    macos)   check_deps && build_frontend && build_macos ;;
    windows) check_deps && build_frontend && build_windows ;;
    -h|--help) echo "Usage: $0 [all|macos|windows]" ;;
    *) error "Unknown: $1" ;;
esac

log "Done!"
