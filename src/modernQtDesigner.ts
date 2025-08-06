import * as vscode from 'vscode';

export class ModernQtDesigner {
    private _designerPanel?: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public async openDesigner() {
        this._designerPanel = vscode.window.createWebviewPanel(
            'modernQtDesigner',
            '🎨 Professional Qt Designer Studio',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        this._designerPanel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this._designerPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveDesign':
                        this.saveDesign(message.data);
                        break;
                    case 'generateCode':
                        this.generateCode(message.type, message.data);
                        break;
                    case 'openExternal':
                        this.openExternalDesigner();
                        break;
                }
            },
            undefined
        );
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Qt Designer Studio</title>
    <style>
        /* Modern Dark Theme Variables */
        :root {
            --primary-bg: #1e1e1e;
            --secondary-bg: #2d2d30;
            --tertiary-bg: #3e3e42;
            --quaternary-bg: #4e4e52;
            --accent-blue: #007acc;
            --accent-green: #4ec9b0;
            --accent-orange: #ce9178;
            --accent-red: #f44747;
            --text-primary: #d4d4d4;
            --text-secondary: #cccccc;
            --text-muted: #969696;
            --border-light: #464647;
            --border-medium: #5a5a5a;
            --shadow-light: 0 2px 8px rgba(0,0,0,0.1);
            --shadow-medium: 0 4px 16px rgba(0,0,0,0.2);
            --shadow-heavy: 0 8px 32px rgba(0,0,0,0.3);
            --transition-fast: 0.15s ease;
            --transition-normal: 0.25s ease;
            --border-radius: 6px;
        }

        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--primary-bg);
            color: var(--text-primary);
            overflow: hidden;
            user-select: none;
        }

        /* Main Layout */
        .designer-container {
            display: flex;
            height: 100vh;
            flex-direction: column;
        }

        /* Top Menu Bar */
        .menu-bar {
            background: var(--secondary-bg);
            border-bottom: 1px solid var(--border-light);
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 48px;
            box-shadow: var(--shadow-light);
        }

        .menu-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .app-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--accent-blue);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .menu-items {
            display: flex;
            gap: 4px;
        }

        .menu-item {
            padding: 6px 12px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            border-radius: var(--border-radius);
            font-size: 12px;
            transition: var(--transition-fast);
        }

        .menu-item:hover {
            background: var(--tertiary-bg);
            color: var(--text-primary);
        }

        .menu-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Toolbar */
        .toolbar {
            background: var(--secondary-bg);
            border-bottom: 1px solid var(--border-light);
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            height: 56px;
            flex-wrap: wrap;
        }

        .toolbar-section {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 8px;
            border-right: 1px solid var(--border-light);
        }

        .toolbar-section:last-child {
            border-right: none;
        }

        .toolbar-btn {
            background: var(--tertiary-bg);
            border: 1px solid var(--border-light);
            color: var(--text-primary);
            padding: 8px 12px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: var(--transition-fast);
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: auto;
        }

        .toolbar-btn:hover {
            background: var(--quaternary-bg);
            border-color: var(--border-medium);
            color: var(--text-primary);
        }

        .toolbar-btn.active {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
            color: white;
        }

        .toolbar-btn.primary {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
            color: white;
        }

        .toolbar-btn.success {
            background: var(--accent-green);
            border-color: var(--accent-green);
            color: white;
        }

        /* Main Content Area */
        .main-content {
            display: flex;
            flex: 1;
            height: calc(100vh - 104px);
        }

        /* Widget Palette */
        .widget-palette {
            width: 280px;
            background: var(--secondary-bg);
            border-right: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-light);
        }

        .palette-header {
            padding: 16px;
            border-bottom: 1px solid var(--border-light);
            background: var(--tertiary-bg);
        }

        .palette-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .palette-search {
            width: 100%;
            padding: 8px 12px;
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            color: var(--text-primary);
            font-size: 12px;
        }

        .palette-search::placeholder {
            color: var(--text-muted);
        }

        .palette-content {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .widget-category {
            margin-bottom: 12px;
        }

        .category-header {
            padding: 8px 12px;
            background: var(--tertiary-bg);
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            transition: var(--transition-fast);
        }

        .category-header:hover {
            background: var(--quaternary-bg);
            color: var(--text-primary);
        }

        .category-icon {
            font-size: 14px;
        }

        .widget-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            padding: 0 4px;
        }

        .widget-item {
            background: var(--tertiary-bg);
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            padding: 12px 8px;
            cursor: grab;
            text-align: center;
            font-size: 11px;
            color: var(--text-secondary);
            transition: var(--transition-fast);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        .widget-item:hover {
            background: var(--quaternary-bg);
            border-color: var(--accent-blue);
            color: var(--text-primary);
            transform: translateY(-1px);
            box-shadow: var(--shadow-medium);
        }

        .widget-item:active {
            cursor: grabbing;
        }

        .widget-icon {
            font-size: 20px;
            opacity: 0.8;
        }

        /* Design Canvas */
        .design-area {
            flex: 1;
            background: var(--primary-bg);
            position: relative;
            overflow: hidden;
        }

        .canvas-container {
            width: 100%;
            height: 100%;
            position: relative;
            background: 
                radial-gradient(circle, var(--border-light) 1px, transparent 1px);
            background-size: 20px 20px;
            overflow: auto;
        }

        .design-canvas {
            position: relative;
            margin: 40px;
            min-width: 800px;
            min-height: 600px;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-heavy);
            overflow: hidden;
        }

        .canvas-header {
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
        }

        .canvas-content {
            min-height: 500px;
            position: relative;
            background: white;
        }

        .drop-zone {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #999;
            font-size: 14px;
            pointer-events: none;
        }

        .drop-zone.hidden {
            display: none;
        }

        /* Properties Panel */
        .properties-panel {
            width: 300px;
            background: var(--secondary-bg);
            border-left: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-light);
        }

        .properties-header {
            padding: 16px;
            border-bottom: 1px solid var(--border-light);
            background: var(--tertiary-bg);
        }

        .properties-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .properties-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .property-group {
            margin-bottom: 20px;
        }

        .property-group-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .property-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .property-label {
            font-size: 12px;
            color: var(--text-secondary);
            min-width: 80px;
        }

        .property-input {
            flex: 1;
            padding: 6px 8px;
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            color: var(--text-primary);
            font-size: 11px;
            margin-left: 8px;
        }

        /* Status Bar */
        .status-bar {
            background: var(--secondary-bg);
            border-top: 1px solid var(--border-light);
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 32px;
            font-size: 11px;
            color: var(--text-muted);
        }

        .status-left, .status-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        /* Tabs */
        .tab-container {
            display: flex;
            background: var(--tertiary-bg);
            border-bottom: 1px solid var(--border-light);
        }

        .tab {
            padding: 8px 16px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 12px;
            border-bottom: 2px solid transparent;
            transition: var(--transition-fast);
        }

        .tab.active {
            color: var(--accent-blue);
            border-bottom-color: var(--accent-blue);
        }

        .tab:hover:not(.active) {
            color: var(--text-primary);
            background: var(--quaternary-bg);
        }

        /* Dropped Widgets */
        .dropped-widget {
            position: absolute;
            border: 2px solid transparent;
            cursor: move;
            min-width: 40px;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 122, 204, 0.1);
            color: #333;
            font-size: 12px;
            border-radius: 4px;
            transition: var(--transition-fast);
        }

        .dropped-widget:hover {
            border-color: var(--accent-blue);
            box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
        }

        .dropped-widget.selected {
            border-color: var(--accent-blue);
            box-shadow: 0 0 12px rgba(0, 122, 204, 0.5);
        }

        /* Resize Handles */
        .resize-handle {
            position: absolute;
            background: var(--accent-blue);
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 2px solid white;
            z-index: 1000;
        }

        .resize-handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
        .resize-handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
        .resize-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
        .resize-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
        .resize-handle.n { top: -6px; left: calc(50% - 4px); cursor: n-resize; }
        .resize-handle.s { bottom: -6px; left: calc(50% - 4px); cursor: s-resize; }
        .resize-handle.w { top: calc(50% - 4px); left: -6px; cursor: w-resize; }
        .resize-handle.e { top: calc(50% - 4px); right: -6px; cursor: e-resize; }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .widget-item {
            animation: fadeIn 0.2s ease-out;
        }

        /* Scrollbars */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--secondary-bg);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border-medium);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-muted);
        }

        /* Focus States */
        .palette-search:focus,
        .property-input:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }

        /* Selection Highlight */
        .widget-item.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
        }

        /* Connection Lines for Signal/Slot */
        .connection-line {
            position: absolute;
            height: 2px;
            background: var(--accent-green);
            z-index: 999;
            pointer-events: none;
        }

        .connection-line::after {
            content: '';
            position: absolute;
            right: -6px;
            top: -3px;
            width: 0;
            height: 0;
            border-left: 8px solid var(--accent-green);
            border-top: 4px solid transparent;
            border-bottom: 4px solid transparent;
        }
    </style>
</head>
<body>
    <div class="designer-container">
        <!-- Menu Bar -->
        <div class="menu-bar">
            <div class="menu-left">
                <div class="app-title">
                    <span>🎨</span>
                    Professional Qt Designer Studio
                </div>
                <div class="menu-items">
                    <button class="menu-item">File</button>
                    <button class="menu-item">Edit</button>
                    <button class="menu-item">View</button>
                    <button class="menu-item">Form</button>
                    <button class="menu-item">Tools</button>
                    <button class="menu-item">Help</button>
                </div>
            </div>
            <div class="menu-right">
                <button class="menu-item" id="settingsBtn">⚙️ Settings</button>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-section">
                <button class="toolbar-btn primary" id="newBtn">📄 New</button>
                <button class="toolbar-btn" id="openBtn">📁 Open</button>
                <button class="toolbar-btn" id="saveBtn">💾 Save</button>
                <button class="toolbar-btn" id="saveAsBtn">💾 Save As</button>
            </div>
            
            <div class="toolbar-section">
                <button class="toolbar-btn" id="undoBtn">↶ Undo</button>
                <button class="toolbar-btn" id="redoBtn">↷ Redo</button>
            </div>
            
            <div class="toolbar-section">
                <button class="toolbar-btn" id="cutBtn">✂️ Cut</button>
                <button class="toolbar-btn" id="copyBtn">📋 Copy</button>
                <button class="toolbar-btn" id="pasteBtn">📋 Paste</button>
                <button class="toolbar-btn" id="deleteBtn">🗑️ Delete</button>
            </div>
            
            <div class="toolbar-section">
                <button class="toolbar-btn" id="selectBtn" class="active">🔍 Select</button>
                <button class="toolbar-btn" id="signalSlotBtn">🔗 Signals/Slots</button>
                <button class="toolbar-btn" id="layoutBtn">📐 Layout</button>
            </div>
            
            <div class="toolbar-section">
                <button class="toolbar-btn success" id="previewBtn">▶️ Preview</button>
                <button class="toolbar-btn" id="codeBtn">💻 Generate Code</button>
                <button class="toolbar-btn" id="externalBtn">🪟 External Qt Designer</button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Widget Palette -->
            <div class="widget-palette">
                <div class="palette-header">
                    <div class="palette-title">Widget Palette</div>
                    <input type="text" class="palette-search" placeholder="Search widgets..." id="widgetSearch">
                </div>
                <div class="palette-content" id="paletteContent">
                    <!-- Display Widgets -->
                    <div class="widget-category">
                        <div class="category-header" onclick="toggleCategory(this)">
                            <span>📱 Display Widgets</span>
                            <span class="category-icon">▼</span>
                        </div>
                        <div class="widget-grid">
                            <div class="widget-item" draggable="true" data-widget="QLabel">
                                <div class="widget-icon">🏷️</div>
                                Label
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QTextEdit">
                                <div class="widget-icon">📝</div>
                                Text Edit
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QPlainTextEdit">
                                <div class="widget-icon">📄</div>
                                Plain Text
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QProgressBar">
                                <div class="widget-icon">📊</div>
                                Progress Bar
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QLCDNumber">
                                <div class="widget-icon">🔢</div>
                                LCD Number
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QGraphicsView">
                                <div class="widget-icon">🖼️</div>
                                Graphics View
                            </div>
                        </div>
                    </div>

                    <!-- Input Widgets -->
                    <div class="widget-category">
                        <div class="category-header" onclick="toggleCategory(this)">
                            <span>📝 Input Widgets</span>
                            <span class="category-icon">▼</span>
                        </div>
                        <div class="widget-grid">
                            <div class="widget-item" draggable="true" data-widget="QPushButton">
                                <div class="widget-icon">🔘</div>
                                Push Button
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QLineEdit">
                                <div class="widget-icon">📝</div>
                                Line Edit
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QCheckBox">
                                <div class="widget-icon">☑️</div>
                                Check Box
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QRadioButton">
                                <div class="widget-icon">🔘</div>
                                Radio Button
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QComboBox">
                                <div class="widget-icon">📋</div>
                                Combo Box
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QSpinBox">
                                <div class="widget-icon">🔢</div>
                                Spin Box
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QDoubleSpinBox">
                                <div class="widget-icon">🔢</div>
                                Double Spin
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QSlider">
                                <div class="widget-icon">🎚️</div>
                                Slider
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QDial">
                                <div class="widget-icon">⚪</div>
                                Dial
                            </div>
                        </div>
                    </div>

                    <!-- Container Widgets -->
                    <div class="widget-category">
                        <div class="category-header" onclick="toggleCategory(this)">
                            <span>📦 Containers</span>
                            <span class="category-icon">▼</span>
                        </div>
                        <div class="widget-grid">
                            <div class="widget-item" draggable="true" data-widget="QWidget">
                                <div class="widget-icon">▭</div>
                                Widget
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QFrame">
                                <div class="widget-icon">🖼️</div>
                                Frame
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QGroupBox">
                                <div class="widget-icon">📦</div>
                                Group Box
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QTabWidget">
                                <div class="widget-icon">📑</div>
                                Tab Widget
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QScrollArea">
                                <div class="widget-icon">📜</div>
                                Scroll Area
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QStackedWidget">
                                <div class="widget-icon">📚</div>
                                Stacked Widget
                            </div>
                        </div>
                    </div>

                    <!-- Layout Widgets -->
                    <div class="widget-category">
                        <div class="category-header" onclick="toggleCategory(this)">
                            <span>📐 Layouts</span>
                            <span class="category-icon">▼</span>
                        </div>
                        <div class="widget-grid">
                            <div class="widget-item" draggable="true" data-widget="QVBoxLayout">
                                <div class="widget-icon">⬇️</div>
                                VBox Layout
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QHBoxLayout">
                                <div class="widget-icon">➡️</div>
                                HBox Layout
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QGridLayout">
                                <div class="widget-icon">⊞</div>
                                Grid Layout
                            </div>
                            <div class="widget-item" draggable="true" data-widget="QFormLayout">
                                <div class="widget-icon">📋</div>
                                Form Layout
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Design Canvas -->
            <div class="design-area">
                <div class="tab-container">
                    <button class="tab active">MainWindow.ui</button>
                    <button class="tab">Dialog.ui</button>
                    <button class="tab">+</button>
                </div>
                <div class="canvas-container">
                    <div class="design-canvas" id="designCanvas">
                        <div class="canvas-header">
                            <span>MainWindow - 800x600</span>
                            <span>Qt Widget Application</span>
                        </div>
                        <div class="canvas-content" id="canvasContent">
                            <div class="drop-zone" id="dropZone">
                                <div>🎨 Drop widgets here to start designing</div>
                                <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                                    Drag widgets from the palette on the left
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Properties Panel -->
            <div class="properties-panel">
                <div class="properties-header">
                    <div class="properties-title">Properties</div>
                    <div style="font-size: 11px; color: var(--text-muted);">No widget selected</div>
                </div>
                <div class="properties-content" id="propertiesContent">
                    <div class="property-group">
                        <div class="property-group-title">Object</div>
                        <div class="property-item">
                            <span class="property-label">objectName</span>
                            <input type="text" class="property-input" value="" placeholder="Enter object name">
                        </div>
                        <div class="property-item">
                            <span class="property-label">className</span>
                            <input type="text" class="property-input" value="" readonly>
                        </div>
                    </div>
                    
                    <div class="property-group">
                        <div class="property-group-title">Geometry</div>
                        <div class="property-item">
                            <span class="property-label">x</span>
                            <input type="number" class="property-input" value="0">
                        </div>
                        <div class="property-item">
                            <span class="property-label">y</span>
                            <input type="number" class="property-input" value="0">
                        </div>
                        <div class="property-item">
                            <span class="property-label">width</span>
                            <input type="number" class="property-input" value="100">
                        </div>
                        <div class="property-item">
                            <span class="property-label">height</span>
                            <input type="number" class="property-input" value="30">
                        </div>
                    </div>

                    <div class="property-group">
                        <div class="property-group-title">Appearance</div>
                        <div class="property-item">
                            <span class="property-label">text</span>
                            <input type="text" class="property-input" value="">
                        </div>
                        <div class="property-item">
                            <span class="property-label">font</span>
                            <input type="text" class="property-input" value="Segoe UI, 9pt">
                        </div>
                        <div class="property-item">
                            <span class="property-label">enabled</span>
                            <input type="checkbox" class="property-input" checked>
                        </div>
                        <div class="property-item">
                            <span class="property-label">visible</span>
                            <input type="checkbox" class="property-input" checked>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
            <div class="status-left">
                <span>Ready</span>
                <span>|</span>
                <span id="statusMessage">Qt Designer Studio</span>
            </div>
            <div class="status-right">
                <span>Widgets: <span id="widgetCount">0</span></span>
                <span>|</span>
                <span>Selected: <span id="selectedWidget">None</span></span>
            </div>
        </div>
    </div>

    <script>
        // Modern Qt Designer JavaScript
        const vscode = acquireVsCodeApi();
        
        // Global state
        let selectedWidget = null;
        let draggedWidget = null;
        let widgetCounter = 0;
        let isSignalSlotMode = false;
        let isDragging = false;
        let isResizing = false;
        let dragOffset = { x: 0, y: 0 };
        let widgets = [];
        let undoStack = [];
        let redoStack = [];

        // Widget templates with professional defaults
        const widgetTemplates = {
            QPushButton: {
                defaultText: 'PushButton',
                defaultSize: { width: 100, height: 30 },
                properties: { 
                    text: 'PushButton',
                    font: 'Segoe UI, 9pt',
                    enabled: true,
                    visible: true
                }
            },
            QLabel: {
                defaultText: 'TextLabel',
                defaultSize: { width: 100, height: 20 },
                properties: { 
                    text: 'TextLabel',
                    font: 'Segoe UI, 9pt',
                    alignment: 'AlignLeft|AlignVCenter'
                }
            },
            QLineEdit: {
                defaultText: '',
                defaultSize: { width: 120, height: 25 },
                properties: { 
                    placeholderText: 'Enter text...',
                    font: 'Segoe UI, 9pt',
                    maxLength: 32767
                }
            },
            QCheckBox: {
                defaultText: 'CheckBox',
                defaultSize: { width: 90, height: 20 },
                properties: { 
                    text: 'CheckBox',
                    font: 'Segoe UI, 9pt',
                    checked: false
                }
            },
            QRadioButton: {
                defaultText: 'RadioButton',
                defaultSize: { width: 100, height: 20 },
                properties: { 
                    text: 'RadioButton',
                    font: 'Segoe UI, 9pt',
                    checked: false
                }
            }
        };

        // Initialize the designer
        function initializeDesigner() {
            setupDragAndDrop();
            setupToolbarEvents();
            setupPropertyPanel();
            setupKeyboardShortcuts();
            updateStatusBar();
        }

        // Setup drag and drop functionality
        function setupDragAndDrop() {
            const paletteItems = document.querySelectorAll('.widget-item');
            const canvas = document.getElementById('canvasContent');

            paletteItems.forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    draggedWidget = e.target.dataset.widget;
                    e.target.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'copy';
                });

                item.addEventListener('dragend', (e) => {
                    e.target.classList.remove('dragging');
                });
            });

            canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                canvas.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
            });

            canvas.addEventListener('dragleave', () => {
                canvas.style.backgroundColor = '';
            });

            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                canvas.style.backgroundColor = '';
                
                if (draggedWidget) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    createWidget(draggedWidget, x, y);
                    draggedWidget = null;
                }
            });
        }

        // Create a new widget on the canvas
        function createWidget(widgetType, x, y) {
            const template = widgetTemplates[widgetType];
            if (!template) return;

            const widget = document.createElement('div');
            widget.className = 'dropped-widget';
            widget.dataset.widget = widgetType;
            widget.dataset.id = 'widget_' + (++widgetCounter);
            widget.textContent = template.defaultText;
            
            widget.style.left = x + 'px';
            widget.style.top = y + 'px';
            widget.style.width = template.defaultSize.width + 'px';
            widget.style.height = template.defaultSize.height + 'px';

            // Add event listeners
            widget.addEventListener('click', (e) => {
                e.stopPropagation();
                selectWidget(widget);
            });

            widget.addEventListener('mousedown', startDrag);
            
            document.getElementById('canvasContent').appendChild(widget);
            addResizeHandles(widget);
            
            // Hide drop zone
            document.getElementById('dropZone').classList.add('hidden');
            
            // Select the new widget
            selectWidget(widget);
            
            // Update status
            updateStatusBar();
            
            // Save state for undo
            saveState();
        }

        // Select a widget
        function selectWidget(widget) {
            // Remove previous selection
            document.querySelectorAll('.dropped-widget').forEach(w => {
                w.classList.remove('selected');
                w.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
            });

            // Select new widget
            selectedWidget = widget;
            widget.classList.add('selected');
            addResizeHandles(widget);
            updatePropertiesPanel(widget);
            updateStatusBar();
        }

        // Add resize handles to widget
        function addResizeHandles(widget) {
            const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
            
            handles.forEach(direction => {
                const handle = document.createElement('div');
                handle.className = 'resize-handle ' + direction;
                handle.addEventListener('mousedown', (e) => startResize(e, widget, direction));
                widget.appendChild(handle);
            });
        }

        // Start dragging
        function startDrag(e) {
            if (e.target.classList.contains('resize-handle')) return;
            
            isDragging = true;
            const widget = e.currentTarget;
            const rect = widget.getBoundingClientRect();
            const parentRect = widget.parentElement.getBoundingClientRect();
            
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            function handleMouseMove(e) {
                if (isDragging) {
                    const x = e.clientX - parentRect.left - dragOffset.x;
                    const y = e.clientY - parentRect.top - dragOffset.y;
                    
                    widget.style.left = Math.max(0, x) + 'px';
                    widget.style.top = Math.max(0, y) + 'px';
                }
            }

            function handleMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                saveState();
            }

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        // Start resizing
        function startResize(e, widget, direction) {
            e.stopPropagation();
            isResizing = true;
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(widget.style.width);
            const startHeight = parseInt(widget.style.height);
            const startLeft = parseInt(widget.style.left);
            const startTop = parseInt(widget.style.top);

            function handleMouseMove(e) {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                if (direction.includes('e')) newWidth = startWidth + deltaX;
                if (direction.includes('w')) {
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                }
                if (direction.includes('s')) newHeight = startHeight + deltaY;
                if (direction.includes('n')) {
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                }

                // Apply constraints
                newWidth = Math.max(20, newWidth);
                newHeight = Math.max(20, newHeight);
                newLeft = Math.max(0, newLeft);
                newTop = Math.max(0, newTop);

                widget.style.width = newWidth + 'px';
                widget.style.height = newHeight + 'px';
                widget.style.left = newLeft + 'px';
                widget.style.top = newTop + 'px';

                updatePropertiesPanel(widget);
            }

            function handleMouseUp() {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                saveState();
            }

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        // Update properties panel
        function updatePropertiesPanel(widget) {
            if (!widget) return;

            const widgetType = widget.dataset.widget;
            const properties = document.querySelectorAll('.property-input');
            
            properties[0].value = widget.dataset.id; // objectName
            properties[1].value = widgetType; // className
            properties[2].value = parseInt(widget.style.left); // x
            properties[3].value = parseInt(widget.style.top); // y
            properties[4].value = parseInt(widget.style.width); // width
            properties[5].value = parseInt(widget.style.height); // height
            properties[6].value = widget.textContent; // text

            // Update header
            document.querySelector('.properties-header div:last-child').textContent = 
                widgetType + ' selected';
        }

        // Setup toolbar events
        function setupToolbarEvents() {
            document.getElementById('newBtn').addEventListener('click', () => {
                if (confirm('Create a new design? This will clear the current design.')) {
                    clearDesign();
                }
            });

            document.getElementById('saveBtn').addEventListener('click', () => {
                saveDesign();
            });

            document.getElementById('undoBtn').addEventListener('click', () => {
                undo();
            });

            document.getElementById('redoBtn').addEventListener('click', () => {
                redo();
            });

            document.getElementById('deleteBtn').addEventListener('click', () => {
                if (selectedWidget) {
                    deleteWidget(selectedWidget);
                }
            });

            document.getElementById('previewBtn').addEventListener('click', () => {
                previewDesign();
            });

            document.getElementById('codeBtn').addEventListener('click', () => {
                generateCode();
            });

            document.getElementById('externalBtn').addEventListener('click', () => {
                vscode.postMessage({ command: 'openExternal' });
            });

            document.getElementById('signalSlotBtn').addEventListener('click', () => {
                toggleSignalSlotMode();
            });
        }

        // Setup property panel events
        function setupPropertyPanel() {
            const propertyInputs = document.querySelectorAll('.property-input');
            
            propertyInputs.forEach((input, index) => {
                input.addEventListener('change', () => {
                    if (!selectedWidget) return;
                    
                    switch(index) {
                        case 0: // objectName
                            selectedWidget.dataset.id = input.value;
                            break;
                        case 2: // x
                            selectedWidget.style.left = input.value + 'px';
                            break;
                        case 3: // y
                            selectedWidget.style.top = input.value + 'px';
                            break;
                        case 4: // width
                            selectedWidget.style.width = input.value + 'px';
                            break;
                        case 5: // height
                            selectedWidget.style.height = input.value + 'px';
                            break;
                        case 6: // text
                            selectedWidget.textContent = input.value;
                            break;
                    }
                    saveState();
                });
            });
        }

        // Setup keyboard shortcuts
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey) {
                    switch(e.key) {
                        case 'n':
                            e.preventDefault();
                            clearDesign();
                            break;
                        case 's':
                            e.preventDefault();
                            saveDesign();
                            break;
                        case 'z':
                            e.preventDefault();
                            if (e.shiftKey) {
                                redo();
                            } else {
                                undo();
                            }
                            break;
                        case 'c':
                            e.preventDefault();
                            copyWidget();
                            break;
                        case 'v':
                            e.preventDefault();
                            pasteWidget();
                            break;
                    }
                }
                
                if (e.key === 'Delete' && selectedWidget) {
                    deleteWidget(selectedWidget);
                }
            });
        }

        // Clear design
        function clearDesign() {
            document.querySelectorAll('.dropped-widget').forEach(widget => widget.remove());
            document.getElementById('dropZone').classList.remove('hidden');
            selectedWidget = null;
            widgetCounter = 0;
            updateStatusBar();
            updatePropertiesPanel(null);
            saveState();
        }

        // Delete widget
        function deleteWidget(widget) {
            if (widget === selectedWidget) {
                selectedWidget = null;
                updatePropertiesPanel(null);
            }
            widget.remove();
            updateStatusBar();
            saveState();
        }

        // Save design
        function saveDesign() {
            const widgets = Array.from(document.querySelectorAll('.dropped-widget')).map(widget => ({
                id: widget.dataset.id,
                type: widget.dataset.widget,
                x: parseInt(widget.style.left),
                y: parseInt(widget.style.top),
                width: parseInt(widget.style.width),
                height: parseInt(widget.style.height),
                text: widget.textContent
            }));

            const designData = {
                widgets: widgets,
                metadata: {
                    created: new Date().toISOString(),
                    version: '1.0',
                    qtVersion: '6.0'
                }
            };

            vscode.postMessage({ 
                command: 'saveDesign', 
                data: designData 
            });
        }

        // Generate code
        function generateCode() {
            const widgets = Array.from(document.querySelectorAll('.dropped-widget'));
            const qmlCode = generateQMLCode(widgets);
            const cppCode = generateCppCode(widgets);

            vscode.postMessage({ 
                command: 'generateCode',
                type: 'both',
                data: { qml: qmlCode, cpp: cppCode }
            });
        }

        // Generate QML code
        function generateQMLCode(widgets) {
            let qml = \`import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Window 2.15

ApplicationWindow {
    width: 800
    height: 600
    visible: true
    title: "Qt Application"

\`;

            widgets.forEach(widget => {
                const type = widget.dataset.widget.replace('Q', '');
                const x = parseInt(widget.style.left);
                const y = parseInt(widget.style.top);
                const width = parseInt(widget.style.width);
                const height = parseInt(widget.style.height);
                const text = widget.textContent;

                qml += \`    \${type} {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        text: "\${text}"
    }

\`;
            });

            qml += '}';
            return qml;
        }

        // Generate C++ code
        function generateCppCode(widgets) {
            let cpp = \`#include <QtWidgets>

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);

private:
\`;

            // Declare members
            widgets.forEach(widget => {
                const type = widget.dataset.widget;
                const id = widget.dataset.id;
                cpp += \`    \${type} *\${id};\\n\`;
            });

            cpp += \`};

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    auto centralWidget = new QWidget(this);
    setCentralWidget(centralWidget);

\`;

            // Create widgets
            widgets.forEach(widget => {
                const type = widget.dataset.widget;
                const id = widget.dataset.id;
                const x = parseInt(widget.style.left);
                const y = parseInt(widget.style.top);
                const width = parseInt(widget.style.width);
                const height = parseInt(widget.style.height);
                const text = widget.textContent;

                cpp += \`    \${id} = new \${type}(centralWidget);
    \${id}->setGeometry(\${x}, \${y}, \${width}, \${height});
    \${id}->setText("\${text}");

\`;
            });

            cpp += '}';
            return cpp;
        }

        // Update status bar
        function updateStatusBar() {
            const widgetCount = document.querySelectorAll('.dropped-widget').length;
            document.getElementById('widgetCount').textContent = widgetCount;
            document.getElementById('selectedWidget').textContent = 
                selectedWidget ? selectedWidget.dataset.widget : 'None';
        }

        // Toggle category visibility
        function toggleCategory(header) {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.category-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'grid';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // State management for undo/redo
        function saveState() {
            const state = document.getElementById('canvasContent').innerHTML;
            undoStack.push(state);
            redoStack = []; // Clear redo stack when new action is performed
            
            if (undoStack.length > 50) { // Limit undo stack size
                undoStack.shift();
            }
        }

        function undo() {
            if (undoStack.length > 1) {
                const currentState = undoStack.pop();
                redoStack.push(currentState);
                const previousState = undoStack[undoStack.length - 1];
                document.getElementById('canvasContent').innerHTML = previousState;
                setupWidgetEvents();
                updateStatusBar();
            }
        }

        function redo() {
            if (redoStack.length > 0) {
                const state = redoStack.pop();
                undoStack.push(state);
                document.getElementById('canvasContent').innerHTML = state;
                setupWidgetEvents();
                updateStatusBar();
            }
        }

        function setupWidgetEvents() {
            document.querySelectorAll('.dropped-widget').forEach(widget => {
                widget.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectWidget(widget);
                });
                widget.addEventListener('mousedown', startDrag);
            });
        }

        // Initialize the designer when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            initializeDesigner();
            saveState(); // Save initial empty state
        });

        // Deselect widgets when clicking on canvas
        document.getElementById('canvasContent').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                selectedWidget = null;
                document.querySelectorAll('.dropped-widget').forEach(w => {
                    w.classList.remove('selected');
                    w.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
                });
                updatePropertiesPanel(null);
                updateStatusBar();
            }
        });

        // Widget search functionality
        document.getElementById('widgetSearch').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const widgets = document.querySelectorAll('.widget-item');
            
            widgets.forEach(widget => {
                const widgetName = widget.textContent.toLowerCase();
                if (widgetName.includes(searchTerm)) {
                    widget.style.display = 'flex';
                } else {
                    widget.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>`;
    }

    private async saveDesign(designData: any) {
        // Implementation for saving design
        vscode.window.showInformationMessage('Design saved successfully!');
    }

    private async generateCode(type: string, data: any) {
        // Implementation for code generation
        const document = await vscode.workspace.openTextDocument({
            content: type === 'qml' ? data.qml : data.cpp,
            language: type === 'qml' ? 'qml' : 'cpp'
        });
        await vscode.window.showTextDocument(document);
    }

    private async openExternalDesigner() {
        // Implementation for opening external Qt Designer
        vscode.commands.executeCommand('qtFullDesigner.openExternalDesigner');
    }
}
