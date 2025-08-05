# Qt Live Preview for VS Code

![Qt Logo](images/icon.png)

A comprehensive Visual Studio Code extension for Qt6 development with live preview, hot reload, **visual drag-and-drop UI designer with real-time sync**, and full module support for both Qt Widgets and QML applications.

> 🔥 **NEW**: Real-time bidirectional sync between code editor and visual UI designer, just like Qt Designer and Slint extension!

## 🚀 Features

### ⚡ Real-time Bidirectional Sync
- **Code ↔ Designer Sync**: Changes in code instantly appear in designer, and vice versa
- **Live Updates**: Drag widgets in designer → code updates automatically
- **Property Sync**: Edit properties in designer → see code changes in real-time
- **Seamless Experience**: Switch between code and visual design without losing context

### 🔥 Live Preview & Hot Reload
- **Real-time Preview**: Instantly see changes in your QML and Qt Widgets applications
- **Hot Reload**: Automatic reloading when files are modified
- **Error Detection**: Real-time syntax validation and error reporting
- **Multi-format Support**: Works with `.qml`, `.ui`, and `.cpp` files

### 🎨 Visual UI Designer
- **Drag & Drop Interface**: Visual design tool similar to Qt Designer and Slint extension
- **Component Palette**: Rich set of Qt widgets and controls (30+ components)
- **Property Editor**: Real-time property editing with immediate visual feedback
- **Template Library**: Pre-built layouts and UI patterns (7 templates)
- **Code Generation**: Automatic QML code generation from visual designs
- **UI Export**: Export designs to `.ui` files for Qt Designer compatibility
- **Undo/Redo**: Full undo/redo support for design operations

### 🛠️ Project Management
- **Project Templates**: Pre-built templates for various Qt6 application types
- **Full Qt6 Module Support**: All Qt6 modules including Core, Widgets, Quick, Network, Multimedia, Charts, WebEngine, 3D, and more
- **CMake Integration**: Automatic CMake configuration generation
- **Build System**: Integrated build, run, and debug commands

### 📱 Application Types Supported
- **Qt Widgets Applications**: Traditional desktop GUI applications
- **QML Applications**: Modern, declarative UI applications with **visual designer**
- **Qt Quick Controls**: Mobile-ready applications with Material Design
- **Multimedia Applications**: Audio/video players and recorders
- **Network Applications**: Client-server applications
- **Chart Applications**: Data visualization with Qt Charts
- **3D Applications**: OpenGL and Qt 3D applications
- **Web Applications**: Qt WebEngine-based browsers

## 📦 Installation

### Method 1: From Source (Development)

#### Prerequisites
- Visual Studio Code 1.74.0 or higher
- Node.js 16.x or higher
- npm or yarn package manager
- Qt6 installed on your system
- CMake 3.16 or higher
- C++ compiler (MSVC, GCC, or Clang)

#### Build and Install Steps
```bash
# 1. Clone or navigate to the project directory
cd C:\Users\shahrear\Documents\QTLivePreview

# 2. Install dependencies
npm install

# 3. Install TypeScript and vsce globally if not already installed
npm install -g typescript vsce

# 4. Ensure Qt logo is in place
node create-icon.js

# 5. Compile TypeScript to JavaScript
npm run compile

# 6. Package the extension
vsce package

# 7. Install the generated .vsix file
code --install-extension qt-live-preview-1.0.0.vsix
```

### Method 2: Development Mode
```bash
# 1. Navigate to project directory
cd C:\Users\shahrear\Documents\QTLivePreview

# 2. Install dependencies
npm install

# 3. Open in VS Code
code .

# 4. Press F5 to launch Extension Development Host
# This opens a new VS Code window with the extension loaded
```

### Method 3: From VS Code Marketplace (Future)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Qt Live Preview"
4. Click Install

### Configure Qt6 Path
1. Open VS Code Settings (Ctrl+,)
2. Search for "qtLivePreview"
3. Set `Qt6 Path` to your Qt6 installation directory
   ```
   Example: C:/Qt/6.5.0/msvc2019_64
   ```

## 🎯 Quick Start

### Create a New Qt6 Project
1. Open Command Palette (Ctrl+Shift+P)
2. Type `Qt Live Preview: Create QT6 Project`
3. Select project type:
   - **Basic Qt6 Application**
   - **Advanced Qt Widgets Application**
   - **Advanced QML Application**
   - **Qt Multimedia Application**
   - **Qt Charts Application**
   - **Qt Network Application**
   - **Qt WebEngine Application**
   - **Qt 3D Application**
4. Choose Qt6 modules to include
5. Enter project name and location

### Use the Visual UI Designer
1. Open Command Palette (Ctrl+Shift+P)
2. Type `Qt Live Preview: Open UI Designer`
3. Drag widgets from the palette to the canvas
4. Edit properties in the properties panel
5. Save design to generate QML code automatically
6. Use templates for common layouts

### Start Live Preview
1. Open a `.qml` or `.ui` file
2. Right-click in editor → `Start Live Preview`
3. Or use Command Palette: `Qt Live Preview: Start Live Preview`

### Enable Hot Reload
- Hot reload is enabled by default
- Toggle with Command Palette: `Qt Live Preview: Toggle Hot Reload`
- Status shown in status bar

## 🔧 Configuration

### Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `qtLivePreview.qt6Path` | string | "" | Path to Qt6 installation directory |
| `qtLivePreview.cmakePath` | string | "cmake" | Path to CMake executable |
| `qtLivePreview.autoReload` | boolean | true | Enable automatic hot reload |
| `qtLivePreview.errorReporting` | boolean | true | Enable error detection and reporting |
| `qtLivePreview.enabledModules` | array | ["Core", "Widgets", "Quick", "QuickControls2"] | Default Qt6 modules |
| `qtLivePreview.buildConfiguration` | string | "Debug" | Build configuration (Debug/Release) |
| `qtLivePreview.qmlEngine` | string | "qml" | QML engine executable |

### Supported Qt6 Modules

#### Core Modules
- **Core**: Essential Qt functionality
- **Widgets**: Traditional desktop GUI components
- **Quick**: QML engine and Quick components
- **QuickControls2**: Modern QML controls

#### Graphics & Multimedia
- **Multimedia**: Audio/video/camera functionality
- **Charts**: Chart and graph components
- **DataVisualization**: 3D data visualization
- **Svg**: SVG rendering classes
- **OpenGL**: OpenGL integration

#### Network & Communication
- **Network**: Network programming classes
- **WebEngine**: Chromium-based web engine
- **WebSockets**: WebSocket communication
- **Bluetooth**: Bluetooth connectivity
- **SerialPort**: Serial port communication

#### Database & Storage
- **Sql**: Database integration classes
- **Xml**: XML parsing and generation

#### System Integration
- **PrintSupport**: Printing functionality
- **Sensors**: Device sensor API
- **Positioning**: GPS and location services
- **Concurrent**: Multi-threading support

#### Development Tools
- **Test**: Unit testing framework
- **Help**: Help system integration
- **Designer**: Qt Designer integration
- **UiTools**: UI form loading

#### 3D Graphics
- **3DCore**: 3D engine core functionality
- **3DRender**: 3D rendering classes
- **3DInput**: 3D input handling
- **3DLogic**: 3D logic components
- **3DAnimation**: 3D animation support
- **3DExtras**: Additional 3D components

## 🎨 Project Templates

### Advanced Qt Widgets Application
```cpp
// Full-featured desktop application with:
- Main window with menus and toolbars
- Status bar and dock widgets
- Settings persistence
- File operations
- Professional UI layout
```

### Advanced QML Application
```qml
// Modern QML application with:
- Material Design styling
- Navigation drawer
- Multiple pages/views
- Dark/light theme support
- Responsive layout
- Custom components
```

### Qt Multimedia Application
```qml
// Media player with:
- Video/audio playback
- Media controls
- Playlist management
- Volume control
- Seek functionality
```

### Qt Charts Application
```qml
// Data visualization with:
- Line charts
- Bar charts
- Pie charts
- Real-time data updates
- Interactive charts
```

### Qt Network Application
```cpp
// Network client with:
- HTTP requests
- REST API integration
- JSON parsing
- Error handling
- Progress indication
```

## 🚀 Commands

| Command | Description |
|---------|-------------|
| `Qt Live Preview: Create QT6 Project` | Create a new Qt6 project |
| `Qt Live Preview: Create QT6 Module Project` | Create project with specific modules |
| `Qt Live Preview: Start Live Preview` | Start live preview for current file |
| `Qt Live Preview: Stop Live Preview` | Stop live preview |
| `Qt Live Preview: Toggle Hot Reload` | Enable/disable hot reload |
| `Qt Live Preview: Build QT6 Project` | Build the current project |
| `Qt Live Preview: Run QT6 Project` | Run the current project |
| `Qt Live Preview: Debug QT6 Project` | Debug the current project |
| `Qt Live Preview: Configure Qt6 Installation` | Configure Qt6 paths |
| `Qt Live Preview: Open UI Designer` | Open the visual UI designer |
| `Qt Live Preview: New UI Design` | Create a new UI design |
| `Qt Live Preview: Open in UI Designer` | Open current file in designer |
| `Qt Live Preview: Analyze QML File` | Analyze QML syntax and structure |
| `Qt Live Preview: Clear QML Errors` | Clear error markers from QML files |

## 🔍 File Support

### QML Files (.qml)
- Syntax highlighting
- Live preview
- Hot reload
- Error detection
- Auto-completion (with Qt6 modules)
- **Visual UI Designer**: Drag-and-drop interface design

### UI Files (.ui)
- Qt Designer form files
- Preview support
- Hot reload
- Form-to-code generation
- **Open in UI Designer**: Edit visually

## 🎨 Visual UI Designer

The Qt Live Preview extension includes a powerful visual UI designer that works similarly to Qt Designer and the Slint VS Code extension.

### Features
- **Drag & Drop Interface**: Drag widgets from the palette directly onto the canvas
- **Rich Widget Palette**: Comprehensive set of Qt widgets organized by category:
  - **Basic Widgets**: Button, Label, TextField, TextArea
  - **Layout Containers**: Row, Column, Grid layouts
  - **Input Controls**: CheckBox, RadioButton, Slider, ProgressBar, ComboBox
  - **Advanced Widgets**: ListView, TreeView, TabView, ScrollView
- **Real-time Property Editing**: Edit widget properties with immediate visual feedback
- **Template Library**: Pre-built UI templates for common patterns:
  - Form layouts
  - Navigation drawers
  - Tab views
  - Dashboard layouts
  - Master-detail views
  - Login forms
  - Media player interfaces
- **Code Generation**: Automatically generates clean, modern QML code
- **Export Options**: Export to QML files or UI files for Qt Designer compatibility
- **Undo/Redo Support**: Full history management for design operations
- **Grid Snapping**: Optional grid for precise widget alignment
- **Live Preview Integration**: Seamlessly integrates with the live preview system

### How to Use
1. **Open Designer**: Use Command Palette → `Qt Live Preview: Open UI Designer`
2. **Create Design**: Drag widgets from the palette to the canvas
3. **Edit Properties**: Select widgets and edit properties in the properties panel
4. **Use Templates**: Start with pre-built templates for common layouts
5. **Save & Preview**: Save your design to generate QML code and see live preview
6. **Export**: Export to UI files for Qt Designer compatibility

### Keyboard Shortcuts
- **Ctrl+S**: Save design
- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z**: Redo
- **Delete**: Delete selected widget

### C++ Files (.cpp, .h)
- Qt6 class templates
- MOC integration
- Build system integration

### CMakeLists.txt
- Qt6 CMake integration
- Automatic module configuration
- Build configuration

## 🐛 Troubleshooting

### Common Issues

#### Extension Package Not Found
```bash
Error: ENOENT: no such file or directory, open 'qtlivepreview.vsix'
```
**Solution**: Build the extension package first:
```bash
# Install dependencies
npm install

# Install vsce if not already installed
npm install -g vsce

# Compile TypeScript
npm run compile

# Package extension
vsce package

# Install the generated .vsix file
code --install-extension qt-live-preview-1.0.0.vsix
```

#### TypeScript Compilation Errors
```bash
Error: Cannot find module or its type declarations
```
**Solution**: Ensure all dependencies are installed:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or using yarn
rm -rf node_modules yarn.lock
yarn install
```

#### Qt6 Not Found
```bash
Error: Qt6 installation not found
```
**Solution**: Set the correct Qt6 path in settings:
- Open Settings → Extensions → Qt Live Preview
- Set "Qt6 Path" to your Qt installation directory

#### CMake Not Found
```bash
Error: CMake executable not found
```
**Solution**: Install CMake or set the correct path:
- Download CMake from https://cmake.org/
- Add CMake to PATH or set `qtLivePreview.cmakePath`

#### QML Engine Not Found
```bash
Error: QML engine not found
```
**Solution**: Ensure Qt6 bin directory is in PATH:
- Add `[Qt6Path]/bin` to system PATH
- Or set full path to qml executable in settings

#### Hot Reload Not Working
**Solution**: Check file permissions and project structure:
- Ensure files are writable
- Check if project is in a valid workspace
- Verify Qt6 installation is complete

#### TypeScript Not Found
```bash
'tsc' is not recognized as an internal or external command
```
**Solution**: Install TypeScript globally:
```bash
# Install TypeScript globally
npm install -g typescript

# Verify installation
tsc --version

# Then compile the project
npm run compile
```

#### Icon File Not Found
```bash
ERROR  The specified icon 'extension/images/icon.png' wasn't found in the extension.
```
**Solution**: Either create the icon file or remove the icon reference from package.json:
```bash
# Option 1: Create the images directory and add an icon
mkdir images
# Add a PNG icon file to images/icon.png

# Option 2: Remove icon reference from package.json (temporary fix)
# Edit package.json and remove or comment out the "icon" line
```

### Debug Mode
Enable debug output:
1. Open Output panel (Ctrl+Shift+U)
2. Select "Qt Live Preview" from dropdown
3. Check for error messages and warnings

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/algosciencecademy/qt-live-preview.git

# Navigate to project directory
cd qt-live-preview

# Install dependencies
npm install

# Install vsce globally for packaging
npm install -g vsce

# Open in VS Code
code .

# Press F5 to launch extension development host
```

### Building and Testing
```bash
# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Run linting
npm run lint

# Run tests
npm test

# Package extension for distribution
vsce package

# Install packaged extension locally
code --install-extension qt-live-preview-1.0.0.vsix
```

### Project Structure
```
C:\Users\shahrear\Documents\QTLivePreview\
├── src/                          # TypeScript source files
│   ├── extension.ts              # Main extension entry point
│   ├── qtProjectManager.ts       # Project creation and management
│   ├── livePreviewProvider.ts    # Live preview functionality
│   ├── hotReloadManager.ts       # Hot reload implementation
│   ├── errorReporter.ts          # Error detection and reporting
│   ├── qt6ModuleManager.ts       # Qt6 module management
│   └── qt6ProjectTemplates.ts    # Project templates
├── out/                          # Compiled JavaScript files
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # This file
└── images/                       # Extension icons and assets
```

### Release Process
```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Commit changes
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0

# 4. Build and test
npm run compile
npm test

# 5. Package extension
vsce package

# 6. Publish to VS Code Marketplace (requires publisher account)
vsce publish

# 7. Push to repository
git push origin main --tags
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Qt Framework team for the amazing Qt6 toolkit
- VS Code team for the excellent extension API
- Community contributors and testers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/algosciencecademy/qt-live-preview/issues)
- **Discussions**: [GitHub Discussions](https://github.com/algosciencecademy/qt-live-preview/discussions)
- **Email**: support@algosciencecademy.com

## 🔗 Links

- [Qt6 Documentation](https://doc.qt.io/qt-6/)
- [QML Guide](https://doc.qt.io/qt-6/qml-tutorial.html)
- [Qt Widgets Guide](https://doc.qt.io/qt-6/qtwidgets-index.html)
- [CMake Qt6 Integration](https://doc.qt.io/qt-6/cmake-manual.html)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**Made with ❤️ by AlgoScience Academy**

*Transform your Qt6 development experience with live preview and hot reload!*
