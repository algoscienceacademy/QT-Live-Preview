# 🔄 Real-time Sync Feature

## Overview
The Qt Live Preview extension now includes **bidirectional real-time synchronization** between the visual UI Designer and the QML code editor, similar to Qt Designer and Slint VS Code extension.

## ✨ Key Features

### 🔄 Bidirectional Sync
- **Code to Designer**: When you edit QML code, changes instantly appear in the visual designer
- **Designer to Code**: When you drag/drop widgets or modify properties in the designer, the code updates automatically

### 🎯 What Syncs
- **Widget Addition**: Add widgets in designer → Code updates with new QML elements
- **Property Changes**: Modify properties in designer → Code reflects the changes
- **Position & Size**: Drag/resize widgets → Code updates x, y, width, height
- **Deletion**: Remove widgets → Code removes corresponding elements
- **Text & Values**: Change text, colors, values → Code syncs instantly

### ⚡ Real-time Updates
- **Instant sync**: Changes appear immediately (no delays)
- **Loop prevention**: Smart sync prevents infinite update cycles
- **Conflict resolution**: Handles simultaneous changes gracefully

## 🚀 How to Use

### 1. Open QML file in UI Designer
```
1. Right-click any .qml file
2. Select "Open in UI Designer"
3. Real-time sync starts automatically
```

### 2. Manual Sync Control
```
Command Palette (Ctrl+Shift+P):
- "Qt: Start Real-time Sync"
- "Qt: Stop Real-time Sync" 
- "Qt: Toggle Real-time Sync"
```

### 3. Designer Toolbar
Click the 🔄 Sync button in the designer toolbar to toggle sync on/off

## 🎮 Demo Workflow

### Try This:
1. Open `realtime-sync-demo.qml` in VS Code
2. Right-click → "Open in UI Designer"
3. **Edit the code**: Change text in the QML file → Watch designer update
4. **Use the designer**: Drag widgets, change properties → Watch code update
5. **Toggle sync**: Use the 🔄 button to enable/disable real-time sync

### Example Changes:
**In Code Editor:**
```qml
Label {
    text: qsTr("Hello World")  // Change this text
    color: "#ff0000"           // Change this color
}
```

**In UI Designer:**
- Drag the label to new position → Code updates x, y properties
- Change text in properties panel → Code updates text property
- Resize widget → Code updates width, height

## 🔧 Technical Details

### Supported Elements
- **Basic Widgets**: Button, Label, TextField, TextArea
- **Input Controls**: CheckBox, RadioButton, Slider, SpinBox
- **Containers**: Rectangle, Row, Column, Grid
- **Advanced**: ScrollView, TabView, StackView
- **Properties**: All standard QML properties (text, color, size, position, etc.)

### Sync Architecture
- **QMLSyncManager**: Handles bidirectional synchronization
- **QML Parser**: Converts code to widget data structure  
- **Code Generator**: Converts widget data back to QML code
- **Change Detection**: Monitors file changes and designer interactions

### Performance
- **Optimized parsing**: Fast QML-to-widget conversion
- **Debounced updates**: Prevents excessive sync operations
- **Memory efficient**: Minimal overhead during editing

## 🛡️ Error Handling

### Sync Conflicts
- **Auto-resolution**: Last change wins in conflict situations
- **Error recovery**: Graceful handling of invalid QML syntax
- **Fallback mode**: Manual sync if auto-sync fails

### Status Indicators
- **Sync Status**: Designer status bar shows sync state
- **Error Messages**: Clear feedback for sync issues
- **Visual Feedback**: Sync button shows current state

## 🎯 Best Practices

### For Optimal Sync Experience:
1. **Use standard QML syntax**: Avoid complex expressions in synced properties
2. **Structure code clearly**: Well-formatted QML syncs better
3. **Save frequently**: Manual save preserves your work
4. **Monitor status**: Watch designer status bar for sync feedback

### When to Disable Sync:
- **Performance concerns**: For very large QML files
- **Manual control**: When you want to prevent automatic updates
- **Debugging**: To isolate code vs designer changes

## 🔮 Coming Soon
- **Live Preview**: Real-time preview of running application
- **Layout Guides**: Visual alignment helpers in designer
- **Property Validation**: Real-time property validation
- **Undo/Redo Sync**: Synchronized undo history between code and designer

---

**Experience the future of QML development with seamless real-time synchronization between code and visual design!** 🚀
