# MSYS2 Qt6 Setup Guide

## Install MSYS2

1. Download MSYS2 from https://www.msys2.org/
2. Install to `C:\msys64` (default location)
3. Open MSYS2 terminal and update packages:
   ```bash
   pacman -Syu
   ```

## Install Qt6 Packages

In MSYS2 MinGW64 terminal, install Qt6:

```bash
# Update package database
pacman -Sy

# Install Qt6 base packages
pacman -S mingw-w64-x86_64-qt6-base

# Install Qt6 development tools
pacman -S mingw-w64-x86_64-qt6-tools

# Install additional Qt6 modules (optional)
pacman -S mingw-w64-x86_64-qt6-declarative     # QML
pacman -S mingw-w64-x86_64-qt6-multimedia      # Audio/Video
pacman -S mingw-w64-x86_64-qt6-charts          # Charts
pacman -S mingw-w64-x86_64-qt6-networkauth     # Network
pacman -S mingw-w64-x86_64-qt6-svg             # SVG
pacman -S mingw-w64-x86_64-qt6-serialport      # Serial Port

# Install CMake and Ninja
pacman -S mingw-w64-x86_64-cmake
pacman -S mingw-w64-x86_64-ninja
```

## Configure VS Code Extension

1. Open VS Code
2. Install the Qt Live Preview extension
3. Open Command Palette (Ctrl+Shift+P)
4. Run: `Qt Live Preview: Configure Qt6 Installation`
5. Set path to: `C:/msys64/mingw64`

## Verify Installation

Create a test project and build:

```bash
# In MSYS2 MinGW64 terminal
cd /c/your/project/path
mkdir build && cd build
cmake -G Ninja -DCMAKE_PREFIX_PATH=/mingw64 ..
ninja
```

## Environment Variables

The extension automatically sets these for MSYS2:

- `MSYSTEM=MINGW64`
- `PATH` includes MSYS2 bins
- `CMAKE_PREFIX_PATH=C:\msys64\mingw64`
- `Qt6_DIR=C:\msys64\mingw64\lib\cmake\Qt6`

## Troubleshooting

### Qt6 Not Found
- Ensure packages are installed: `pacman -Qs qt6`
- Check path: `which qml` should return `/mingw64/bin/qml`

### CMake Errors
- Update CMake: `pacman -S mingw-w64-x86_64-cmake`
- Clear build directory and reconfigure

### Missing Libraries
- Install runtime packages: `pacman -S mingw-w64-x86_64-qt6-base`
