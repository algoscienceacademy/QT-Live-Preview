# Qt Visual Designer for VS Code

A comprehensive visual design environment for Qt applications in Visual Studio Code, providing drag-and-drop interface design with live preview capabilities.

## Features

### 🎨 Visual Design Environment
- **Drag & Drop Interface**: Intuitive widget placement from toolbox to canvas
- **WYSIWYG Editor**: Real-time visual editing with immediate feedback
- **Grid Snapping**: Precise widget alignment with optional grid system
- **Multi-selection**: Select and manipulate multiple widgets simultaneously

### 🔧 Widget Toolbox
- **Input Widgets**: Button, TextField, TextArea, CheckBox, RadioButton, ComboBox, Slider, SpinBox
- **Display Widgets**: Label, Text, Image, ProgressBar
- **Container Widgets**: Rectangle, Item, Frame, GroupBox
- **Layout Widgets**: RowLayout, ColumnLayout, GridLayout, StackLayout

### ⚡ Real-time Features
- **Live Preview**: Instant preview of your design as you build
- **Code Synchronization**: Two-way sync between visual design and QML code
- **Hot Reload**: See changes immediately without recompiling
- **Property Editor**: Rich property editing with type-specific controls

### 🛠️ Professional Tools
- **Undo/Redo**: Full history management with 50-level undo stack
- **Alignment Tools**: Align left, center, right, top, bottom, distribute
- **Resize Handles**: Precise widget resizing with visual feedback
- **Selection Tools**: Rectangle selection, multi-selection, keyboard navigation

### 📱 Multi-Panel Layout
- **Designer Canvas**: Main visual design area with grid and rulers
- **Live Preview**: Real-time preview of your running application
- **Property Panel**: Comprehensive property editor for selected widgets
- **Widget Toolbox**: Organized widget palette for easy access

## Getting Started

### Opening the Visual Designer

1. **From Command Palette**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Qt Visual Designer"
   - Select "🎨 Open Qt Visual Designer"

2. **From Context Menu**:
   - Right-click on a `.qml` file in Explorer
   - Select "🎯 Open in Visual Designer"

3. **From Editor**:
   - Open a `.qml` file
   - Right-click in editor
   - Select "🎯 Open in Visual Designer"

### Creating a New Design

1. Use Command Palette: "✨ New Visual Design"
2. Or open Visual Designer without a file for a blank canvas

## Using the Designer

### Adding Widgets

1. **Drag and Drop**:
   - Select widget from toolbox
   - Drag to desired position on canvas
   - Drop to place widget

2. **Double-click**:
   - Double-click widget in toolbox
   - Widget appears at default position (100, 100)

### Selecting and Moving Widgets

- **Select**: Click on widget
- **Multi-select**: Ctrl+click multiple widgets
- **Move**: Drag selected widget(s)
- **Resize**: Drag resize handles on selected widget

### Editing Properties

1. Select a widget
2. Use Property Panel on the right
3. Modify properties like:
   - Text content
   - Colors and fonts
   - Position and size
   - Behavior flags
   - Widget-specific properties

### Layout and Alignment

- **Grid Snapping**: Toggle grid for precise alignment
- **Alignment Tools**: Use toolbar buttons for alignment
- **Manual Positioning**: Use Property Panel for exact coordinates

## Advanced Features

### Code Synchronization

The Visual Designer maintains real-time synchronization with your QML code:

- **Visual to Code**: Changes in designer update QML automatically
- **Code to Visual**: Manual code changes reflect in designer
- **Conflict Resolution**: Smart merging of simultaneous changes

### Export Options

- **QML Export**: Generate clean, formatted QML code
- **C++ Integration**: Export for Qt Widgets applications
- **Template Generation**: Create reusable component templates

### Keyboard Shortcuts

- `Ctrl+S`: Save design
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Delete`: Delete selected widget(s)
- `Ctrl+A`: Select all widgets
- `Ctrl+C/V`: Copy/paste widgets (coming soon)
- `Arrow Keys`: Move selected widget(s)
- `Shift+Arrow`: Resize selected widget

## Widget Reference

### Input Widgets

#### Button
- **Properties**: text, enabled, highlighted
- **Events**: clicked, pressed, released
- **Use Cases**: Actions, navigation, form submission

#### TextField
- **Properties**: text, placeholderText, readOnly, maximumLength
- **Events**: textChanged, editingFinished, accepted
- **Use Cases**: Single-line text input, search boxes

#### TextArea
- **Properties**: text, placeholderText, wrapMode, readOnly
- **Events**: textChanged, editingFinished
- **Use Cases**: Multi-line text input, comments, descriptions

#### CheckBox
- **Properties**: text, checked, tristate
- **Events**: toggled, clicked
- **Use Cases**: Options, preferences, boolean values

#### RadioButton
- **Properties**: text, checked, autoExclusive
- **Events**: toggled, clicked
- **Use Cases**: Exclusive selections, option groups

#### ComboBox
- **Properties**: model, currentIndex, currentText, editable
- **Events**: currentIndexChanged, currentTextChanged
- **Use Cases**: Dropdown selections, lists of options

#### Slider
- **Properties**: from, to, value, orientation, stepSize
- **Events**: valueChanged, moved
- **Use Cases**: Numeric input, volume controls, progress

### Display Widgets

#### Label
- **Properties**: text, color, font, wordWrap
- **Use Cases**: Static text, field labels, descriptions

#### Text
- **Properties**: text, color, font, wrapMode
- **Use Cases**: Formatted text, rich content

#### Image
- **Properties**: source, fillMode, smooth
- **Use Cases**: Icons, photos, graphics

#### ProgressBar
- **Properties**: from, to, value, indeterminate
- **Use Cases**: Loading indicators, progress tracking

### Container Widgets

#### Rectangle
- **Properties**: color, border, radius, gradient
- **Use Cases**: Backgrounds, visual separators, custom shapes

#### Item
- **Properties**: width, height, visible, opacity
- **Use Cases**: Invisible containers, grouping elements

### Layout Widgets

#### RowLayout
- **Properties**: spacing, layoutDirection
- **Use Cases**: Horizontal arrangement of widgets

#### ColumnLayout
- **Properties**: spacing
- **Use Cases**: Vertical arrangement of widgets

#### GridLayout
- **Properties**: rows, columns, rowSpacing, columnSpacing
- **Use Cases**: Table-like arrangements

## Best Practices

### Design Guidelines

1. **Consistent Spacing**: Use grid snapping for consistent layouts
2. **Logical Grouping**: Group related controls together
3. **Clear Hierarchy**: Use size and position to show importance
4. **Accessibility**: Provide clear labels and sufficient contrast

### Performance Tips

1. **Minimize Nesting**: Avoid excessive widget hierarchies
2. **Optimize Images**: Use appropriate image sizes and formats
3. **Efficient Layouts**: Choose the right layout type for your needs

### Code Organization

1. **Meaningful IDs**: Use descriptive widget IDs
2. **Property Organization**: Group related properties together
3. **Comments**: Add comments for complex interactions

## Troubleshooting

### Common Issues

**Designer doesn't open**:
- Check that the extension is properly installed
- Restart VS Code if necessary

**Changes not syncing**:
- Ensure real-time sync is enabled
- Check for QML syntax errors

**Widgets not appearing**:
- Verify widget placement within visible area
- Check if widgets are hidden behind others

**Performance issues**:
- Reduce number of widgets in complex designs
- Use simpler widget types where possible

### Getting Help

- Use VS Code's Command Palette: "Qt Live Preview: Help"
- Check the extension's GitHub repository for issues
- Join the Qt community for support

## Contributing

We welcome contributions to improve the Qt Visual Designer:

1. **Bug Reports**: Submit detailed bug reports with reproduction steps
2. **Feature Requests**: Suggest new features or improvements
3. **Code Contributions**: Submit pull requests with tests
4. **Documentation**: Help improve this documentation

## License

This extension is licensed under the MIT License. See LICENSE file for details.

## Changelog

### Version 1.0.0
- Initial release of Qt Visual Designer
- Full visual design environment
- Real-time preview and code synchronization
- Comprehensive widget toolbox
- Professional editing tools

---

**Happy designing with Qt Visual Designer!** 🎨✨
