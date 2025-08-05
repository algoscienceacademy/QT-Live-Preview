# Qt UI Designer - Visual Design Tool

The Qt Live Preview extension includes a comprehensive visual UI designer that allows you to create Qt applications using a drag-and-drop interface, similar to Qt Designer and modern visual design tools.

## Features

### 🎨 Visual Design Interface
- **Drag & Drop**: Intuitive widget placement from palette to canvas
- **Real-time Editing**: Immediate visual feedback when modifying properties
- **Grid Snapping**: Optional grid for precise widget alignment
- **Selection & Resizing**: Click to select, drag to move, resize with handles
- **Multi-selection**: Select multiple widgets for bulk operations

### 📦 Comprehensive Widget Library
Organized into categories for easy discovery:

#### Basic Widgets
- **Button**: Clickable buttons with customizable text and styling
- **Label**: Text display with rich formatting options
- **TextField**: Single-line text input with placeholder support
- **TextArea**: Multi-line text input with word wrapping
- **Image**: Image display with various fill modes

#### Layout Containers
- **Rectangle**: Basic container with color, borders, and corner radius
- **Row/Column**: Linear layouts for horizontal/vertical arrangement
- **Grid**: Grid-based layout with configurable rows and columns
- **Anchored Layouts**: RowLayout, ColumnLayout, GridLayout with size policies

#### Input Controls
- **CheckBox**: Boolean selection with customizable text
- **RadioButton**: Exclusive selection option
- **Slider**: Numeric value selection with customizable range
- **ProgressBar**: Visual progress indication
- **ComboBox**: Dropdown selection with multiple options
- **SpinBox**: Numeric input with increment/decrement buttons
- **Switch**: Modern toggle control

#### Advanced Widgets
- **ListView**: Scrollable list of items with custom delegates
- **TreeView**: Hierarchical data display
- **TabView**: Tabbed interface for multiple pages
- **ScrollView**: Scrollable container for large content
- **SwipeView**: Touch-friendly page navigation
- **StackView**: Navigation stack for page transitions

#### Containers & Navigation
- **GroupBox**: Grouped controls with title border
- **Frame**: Visual frame container
- **Page**: Application page with title
- **Drawer**: Slide-out navigation panel
- **Dialog**: Modal dialog windows
- **Popup**: Overlay popups
- **ToolBar**: Application toolbar
- **MenuBar**: Application menu bar

### 🎯 Template Library
Pre-built UI patterns to jumpstart development:

- **Form Layout**: Traditional form with labels and input fields
- **Navigation Drawer**: Modern side navigation pattern
- **Tab View**: Multi-tab interface layout
- **Dashboard**: Card-based dashboard with metrics
- **Master-Detail**: Split view for list and detail panes
- **Login Form**: Complete authentication interface
- **Media Player**: Audio/video player with controls

### ⚙️ Property Editor
Context-sensitive property editing:

- **Basic Properties**: Position (x, y), size (width, height)
- **Text Properties**: Content, placeholder text, formatting
- **Appearance**: Colors, backgrounds, borders, styling
- **Behavior**: Enabled state, visibility, interaction properties
- **Layout**: Anchoring, margins, spacing, alignment
- **Type-specific**: Slider ranges, list models, tab titles, etc.

### 🔧 Code Generation
Automatic QML code generation with:

- **Clean Output**: Well-formatted, readable QML code
- **Modern Imports**: Proper Qt 6.x import statements
- **Best Practices**: Following Qt QML coding conventions
- **Internationalization**: qsTr() for translatable text
- **Layout Optimization**: Efficient layout structures

## Getting Started

### Opening the Designer
1. **Command Palette**: Press `Ctrl+Shift+P` and type "Qt Live Preview: Open UI Designer"
2. **Context Menu**: Right-click on a .qml or .ui file and select "Open in UI Designer"
3. **New Design**: Use "Qt Live Preview: New UI Design" to start fresh

### Basic Workflow
1. **Select Template** (optional): Choose from the template dropdown for common layouts
2. **Add Widgets**: Drag widgets from the palette to the canvas
3. **Position & Resize**: Click and drag widgets to position, use resize handles for sizing
4. **Edit Properties**: Select widgets and modify properties in the properties panel
5. **Preview**: Use the "Preview Code" button to see generated QML
6. **Save**: Save your design to generate a .qml file
7. **Live Preview**: Automatically integrates with the live preview system

### Design Tips
- **Start with Layout**: Use Row, Column, or Grid layouts as containers
- **Use Templates**: Templates provide proven UI patterns and save time
- **Property Context**: Different widgets show relevant properties in the editor
- **Grid Alignment**: Enable grid for precise widget positioning
- **Hierarchy**: Use containers to create organized widget hierarchies

### Keyboard Shortcuts
- **Ctrl+S**: Save design
- **Ctrl+Z**: Undo last action
- **Ctrl+Shift+Z**: Redo action
- **Delete**: Remove selected widget
- **Ctrl+D**: Duplicate selected widget (coming soon)
- **Ctrl+A**: Select all widgets (coming soon)

## Integration with Live Preview

The UI Designer seamlessly integrates with the Qt Live Preview system:

- **Automatic Preview**: Saving a design automatically triggers live preview
- **Hot Reload**: Changes are reflected in real-time in the preview window
- **Error Detection**: QML syntax errors are highlighted immediately
- **Multi-format**: Generated QML works with the existing preview infrastructure

## Export Options

### QML Export
- **Standard Output**: Clean, modern QML code
- **Custom Styling**: Material Design or Universal styling options
- **Modular Code**: Separated components for complex layouts

### UI File Export
- **Qt Designer Compatibility**: Export to .ui files for use in Qt Designer
- **Roundtrip Support**: Open exported .ui files back in the designer
- **C++ Integration**: Generated .ui files work with Qt C++ applications

## Best Practices

### Layout Design
- Use layout containers (Row, Column, Grid) instead of absolute positioning
- Set appropriate spacing and margins for visual hierarchy
- Consider responsive design with anchoring and size policies

### Widget Hierarchy
- Group related widgets in containers
- Use descriptive IDs for widgets you'll reference in code
- Organize complex layouts with nested containers

### Property Management
- Set meaningful text for buttons and labels
- Configure appropriate ranges for sliders and progress bars
- Use placeholder text for input fields

### Code Quality
- Generated code follows Qt QML best practices
- Proper indentation and formatting
- Internationalization support with qsTr()
- Modern Qt 6.x syntax and features

## Advanced Features

### Custom Properties
- Add custom properties to widgets for dynamic behavior
- Configure bindings between widget properties
- Set up animations and transitions

### Signal Handling
- Configure basic signal handlers (onClick, onChanged, etc.)
- Connect widgets for interactive behavior
- Integrate with application logic

### Styling & Theming
- Apply Material Design or Universal styling
- Custom color schemes and typography
- Consistent visual design across components

The Qt UI Designer makes creating beautiful, functional Qt applications accessible to developers of all skill levels, from beginners learning QML to experienced developers who want to prototype quickly.
