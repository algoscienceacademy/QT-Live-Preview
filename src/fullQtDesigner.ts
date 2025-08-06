import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FullQtDesigner {
    private _designerPanel?: vscode.WebviewPanel;
    private _previewPanel?: vscode.WebviewPanel;
    private _propertyPanel?: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;
    private _currentQmlContent: string = '';
    private _selectedWidget?: any;
    private _isExternalMode: boolean = false;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public async openFullDesigner(external: boolean = false) {
        this._isExternalMode = external;
        
        // Create Designer Panel
        this._designerPanel = vscode.window.createWebviewPanel(
            'qtFullDesigner',
            'Qt Designer',
            external ? vscode.ViewColumn.Active : vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        // Create Live Preview Panel
        this._previewPanel = vscode.window.createWebviewPanel(
            'qtLivePreview',
            'Live Preview',
            external ? vscode.ViewColumn.Beside : vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        // Create Property Panel
        this._propertyPanel = vscode.window.createWebviewPanel(
            'qtPropertyPanel',
            'Properties',
            external ? vscode.ViewColumn.Three : vscode.ViewColumn.Three,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        // Set up the UI
        this._designerPanel.webview.html = this.getDesignerHtml();
        this._previewPanel.webview.html = this.getPreviewHtml();
        this._propertyPanel.webview.html = this.getPropertyPanelHtml();

        // Set up message handlers
        this.setupMessageHandlers();

        // Initialize with empty QML application
        this.initializeDefaultApplication();
    }

    private getDesignerHtml(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt Designer</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #f5f5f5;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .toolbar {
                    background: #2d2d30;
                    color: white;
                    padding: 8px;
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid #3e3e42;
                }
                
                .toolbar button {
                    background: #3c3c3c;
                    color: white;
                    border: 1px solid #555;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .toolbar button:hover { background: #505050; }
                .toolbar button.active { background: #007acc; }
                
                .main-container {
                    display: flex;
                    flex: 1;
                    height: calc(100vh - 50px);
                }
                
                .widget-palette {
                    width: 200px;
                    background: #f8f8f8;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .design-area {
                    flex: 1;
                    background: white;
                    position: relative;
                    overflow: auto;
                    margin: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                .canvas {
                    width: 100%;
                    min-height: 600px;
                    position: relative;
                    background: 
                        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
                        linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                
                .widget-group {
                    margin-bottom: 16px;
                }
                
                .widget-group h3 {
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 8px;
                    padding: 4px 0;
                    border-bottom: 1px solid #ddd;
                }
                
                .widget-item {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    margin: 2px 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    cursor: grab;
                    transition: all 0.2s;
                    font-size: 12px;
                }
                
                .widget-item:hover {
                    background: #e3f2fd;
                    border-color: #2196f3;
                    transform: translateX(2px);
                }
                
                .widget-item:active { cursor: grabbing; }
                
                .widget-icon {
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                    background-size: contain;
                }
                
                .dropped-widget {
                    position: absolute;
                    border: 2px solid #2196f3;
                    background: rgba(33, 150, 243, 0.1);
                    cursor: move;
                    min-width: 80px;
                    min-height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    border-radius: 4px;
                }
                
                .dropped-widget.selected {
                    border-color: #ff5722;
                    background: rgba(255, 87, 34, 0.1);
                }
                
                .dropped-widget:hover {
                    border-color: #4caf50;
                }
                
                .resize-handle {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #2196f3;
                    border: 1px solid white;
                    border-radius: 2px;
                }
                
                .resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
                .resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
                .resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
                .resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
                .resize-handle.n { top: -4px; left: calc(50% - 4px); cursor: n-resize; }
                .resize-handle.s { bottom: -4px; left: calc(50% - 4px); cursor: s-resize; }
                .resize-handle.w { top: calc(50% - 4px); left: -4px; cursor: w-resize; }
                .resize-handle.e { top: calc(50% - 4px); right: -4px; cursor: e-resize; }
                
                .status-bar {
                    background: #f0f0f0;
                    padding: 4px 8px;
                    border-top: 1px solid #ddd;
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                }
                
                .form-container {
                    margin: 20px;
                    min-height: 400px;
                    background: white;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    position: relative;
                }
                
                .form-container.has-content {
                    border: 1px solid #ddd;
                    border-style: solid;
                }
                
                .drop-zone-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #999;
                    font-size: 14px;
                    pointer-events: none;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button id="newBtn">📄 New</button>
                <button id="openBtn">📁 Open</button>
                <button id="saveBtn">💾 Save</button>
                <div style="width: 1px; background: #555; margin: 0 8px;"></div>
                <button id="undoBtn">↶ Undo</button>
                <button id="redoBtn">↷ Redo</button>
                <div style="width: 1px; background: #555; margin: 0 8px;"></div>
                <button id="previewBtn">▶️ Preview</button>
                <button id="codeBtn">📝 Code</button>
                <div style="width: 1px; background: #555; margin: 0 8px;"></div>
                <button id="externalBtn">🪟 External Mode</button>
            </div>
            
            <div class="main-container">
                <div class="widget-palette">
                    <div class="widget-group">
                        <h3>📱 Display Widgets</h3>
                        <div class="widget-item" draggable="true" data-widget="Label">
                            <div class="widget-icon">🏷️</div>
                            Label
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Text">
                            <div class="widget-icon">📝</div>
                            Text
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Image">
                            <div class="widget-icon">🖼️</div>
                            Image
                        </div>
                    </div>
                    
                    <div class="widget-group">
                        <h3>🎛️ Input Widgets</h3>
                        <div class="widget-item" draggable="true" data-widget="TextField">
                            <div class="widget-icon">📝</div>
                            TextField
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Button">
                            <div class="widget-icon">🔘</div>
                            Button
                        </div>
                        <div class="widget-item" draggable="true" data-widget="CheckBox">
                            <div class="widget-icon">☑️</div>
                            CheckBox
                        </div>
                        <div class="widget-item" draggable="true" data-widget="RadioButton">
                            <div class="widget-icon">🔘</div>
                            RadioButton
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Slider">
                            <div class="widget-icon">🎚️</div>
                            Slider
                        </div>
                        <div class="widget-item" draggable="true" data-widget="SpinBox">
                            <div class="widget-icon">🔢</div>
                            SpinBox
                        </div>
                    </div>
                    
                    <div class="widget-group">
                        <h3>📋 Containers</h3>
                        <div class="widget-item" draggable="true" data-widget="Rectangle">
                            <div class="widget-icon">▭</div>
                            Rectangle
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Row">
                            <div class="widget-icon">↔️</div>
                            Row
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Column">
                            <div class="widget-icon">↕️</div>
                            Column
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Grid">
                            <div class="widget-icon">⊞</div>
                            Grid
                        </div>
                        <div class="widget-item" draggable="true" data-widget="ScrollView">
                            <div class="widget-icon">📜</div>
                            ScrollView
                        </div>
                    </div>
                    
                    <div class="widget-group">
                        <h3>📊 Advanced</h3>
                        <div class="widget-item" draggable="true" data-widget="ListView">
                            <div class="widget-icon">📋</div>
                            ListView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TableView">
                            <div class="widget-icon">📊</div>
                            TableView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="WebView">
                            <div class="widget-icon">🌐</div>
                            WebView
                        </div>
                    </div>
                </div>
                
                <div class="design-area">
                    <div class="canvas" id="designCanvas">
                        <div class="form-container" id="formContainer">
                            <div class="drop-zone-text">
                                🎨 Drag widgets here to start designing
                                <br><small>or double-click to add a layout</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="status-bar">
                <span id="statusText">Ready - Qt Designer</span>
                <span id="positionInfo">No selection</span>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let selectedWidget = null;
                let draggedWidget = null;
                let widgetCounter = 0;
                let isDragging = false;
                let isResizing = false;
                let dragOffset = { x: 0, y: 0 };
                
                // Widget templates with default properties
                const widgetTemplates = {
                    Label: { width: 100, height: 30, text: 'Label', color: '#333' },
                    Text: { width: 200, height: 100, text: 'Lorem ipsum...', wrapMode: 'WordWrap' },
                    Image: { width: 100, height: 100, source: '', fillMode: 'PreserveAspectFit' },
                    TextField: { width: 150, height: 30, text: '', placeholderText: 'Enter text...' },
                    Button: { width: 100, height: 35, text: 'Button', enabled: true },
                    CheckBox: { width: 120, height: 25, text: 'CheckBox', checked: false },
                    RadioButton: { width: 120, height: 25, text: 'RadioButton', checked: false },
                    Slider: { width: 150, height: 25, value: 50, from: 0, to: 100 },
                    SpinBox: { width: 80, height: 30, value: 0, from: 0, to: 100 },
                    Rectangle: { width: 200, height: 150, color: '#f0f0f0', border: { width: 1, color: '#ccc' } },
                    Row: { width: 300, height: 50, spacing: 10 },
                    Column: { width: 200, height: 300, spacing: 10 },
                    Grid: { width: 300, height: 200, rows: 2, columns: 2 },
                    ScrollView: { width: 200, height: 300, contentHeight: 500 },
                    ListView: { width: 200, height: 300, model: [] },
                    TableView: { width: 400, height: 300, columnCount: 3 },
                    WebView: { width: 400, height: 300, url: 'about:blank' }
                };
                
                // Initialize drag and drop
                function initializeDragDrop() {
                    const canvas = document.getElementById('designCanvas');
                    const formContainer = document.getElementById('formContainer');
                    
                    // Widget palette drag start
                    document.querySelectorAll('.widget-item').forEach(item => {
                        item.addEventListener('dragstart', (e) => {
                            draggedWidget = e.target.dataset.widget;
                            e.dataTransfer.effectAllowed = 'copy';
                            updateStatus('Dragging ' + draggedWidget);
                        });
                    });
                    
                    // Canvas drop handling
                    formContainer.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                    });
                    
                    formContainer.addEventListener('drop', (e) => {
                        e.preventDefault();
                        if (draggedWidget) {
                            const rect = formContainer.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            createWidget(draggedWidget, x, y);
                            draggedWidget = null;
                            formContainer.classList.add('has-content');
                            formContainer.querySelector('.drop-zone-text').style.display = 'none';
                        }
                    });
                }
                
                // Create widget on canvas
                function createWidget(type, x, y) {
                    const template = widgetTemplates[type];
                    if (!template) return;
                    
                    widgetCounter++;
                    const widget = document.createElement('div');
                    widget.className = 'dropped-widget';
                    widget.id = type.toLowerCase() + widgetCounter;
                    widget.dataset.type = type;
                    widget.dataset.properties = JSON.stringify(template);
                    
                    widget.style.left = Math.max(0, x - template.width/2) + 'px';
                    widget.style.top = Math.max(0, y - template.height/2) + 'px';
                    widget.style.width = template.width + 'px';
                    widget.style.height = template.height + 'px';
                    
                    // Set widget content
                    if (template.text) {
                        widget.textContent = template.text;
                    } else {
                        widget.textContent = type;
                    }
                    
                    // Add resize handles
                    addResizeHandles(widget);
                    
                    // Add to canvas
                    document.getElementById('formContainer').appendChild(widget);
                    
                    // Select the new widget
                    selectWidget(widget);
                    
                    // Setup widget interaction
                    setupWidgetInteraction(widget);
                    
                    updateStatus('Added ' + type + ' widget');
                    generateQMLCode();
                }
                
                // Add resize handles to widget
                function addResizeHandles(widget) {
                    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
                    handles.forEach(handle => {
                        const div = document.createElement('div');
                        div.className = 'resize-handle ' + handle;
                        div.dataset.handle = handle;
                        widget.appendChild(div);
                    });
                }
                
                // Setup widget interaction (move, select)
                function setupWidgetInteraction(widget) {
                    widget.addEventListener('mousedown', (e) => {
                        if (e.target.classList.contains('resize-handle')) {
                            startResize(e, widget);
                            return;
                        }
                        
                        selectWidget(widget);
                        startDrag(e, widget);
                    });
                    
                    widget.addEventListener('dblclick', () => {
                        // Open property editor
                        editWidgetProperties(widget);
                    });
                }
                
                // Widget selection
                function selectWidget(widget) {
                    // Clear previous selection
                    document.querySelectorAll('.dropped-widget.selected').forEach(w => {
                        w.classList.remove('selected');
                    });
                    
                    widget.classList.add('selected');
                    selectedWidget = widget;
                    
                    // Update property panel
                    updatePropertyPanel(widget);
                    updatePositionInfo(widget);
                }
                
                // Start dragging widget
                function startDrag(e, widget) {
                    isDragging = true;
                    const rect = widget.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    document.addEventListener('mousemove', onDragMove);
                    document.addEventListener('mouseup', onDragEnd);
                    e.preventDefault();
                }
                
                function onDragMove(e) {
                    if (!isDragging || !selectedWidget) return;
                    
                    const container = document.getElementById('formContainer');
                    const rect = container.getBoundingClientRect();
                    
                    let x = e.clientX - rect.left - dragOffset.x;
                    let y = e.clientY - rect.top - dragOffset.y;
                    
                    // Snap to grid (optional)
                    const gridSize = 10;
                    x = Math.round(x / gridSize) * gridSize;
                    y = Math.round(y / gridSize) * gridSize;
                    
                    // Boundaries
                    x = Math.max(0, Math.min(x, container.clientWidth - selectedWidget.offsetWidth));
                    y = Math.max(0, Math.min(y, container.clientHeight - selectedWidget.offsetHeight));
                    
                    selectedWidget.style.left = x + 'px';
                    selectedWidget.style.top = y + 'px';
                    
                    updatePositionInfo(selectedWidget);
                }
                
                function onDragEnd() {
                    isDragging = false;
                    document.removeEventListener('mousemove', onDragMove);
                    document.removeEventListener('mouseup', onDragEnd);
                    generateQMLCode();
                }
                
                // Update status bar
                function updateStatus(text) {
                    document.getElementById('statusText').textContent = text;
                }
                
                function updatePositionInfo(widget) {
                    const info = 'x: ' + widget.style.left + ', y: ' + widget.style.top + 
                                ', w: ' + widget.style.width + ', h: ' + widget.style.height;
                    document.getElementById('positionInfo').textContent = info;
                }
                
                // Update property panel
                function updatePropertyPanel(widget) {
                    const properties = JSON.parse(widget.dataset.properties || '{}');
                    vscode.postMessage({
                        command: 'updateProperties',
                        widget: {
                            id: widget.id,
                            type: widget.dataset.type,
                            properties: properties,
                            position: {
                                x: parseInt(widget.style.left),
                                y: parseInt(widget.style.top),
                                width: parseInt(widget.style.width),
                                height: parseInt(widget.style.height)
                            }
                        }
                    });
                }
                
                // Generate QML code
                function generateQMLCode() {
                    const widgets = Array.from(document.querySelectorAll('.dropped-widget')).map(widget => {
                        return {
                            id: widget.id,
                            type: widget.dataset.type,
                            properties: JSON.parse(widget.dataset.properties || '{}'),
                            position: {
                                x: parseInt(widget.style.left),
                                y: parseInt(widget.style.top),
                                width: parseInt(widget.style.width),
                                height: parseInt(widget.style.height)
                            }
                        };
                    });
                    
                    vscode.postMessage({
                        command: 'generateQML',
                        widgets: widgets
                    });
                }
                
                // Toolbar handlers
                document.getElementById('newBtn').addEventListener('click', () => {
                    if (confirm('Create new form? This will clear the current design.')) {
                        document.getElementById('formContainer').innerHTML = 
                            '<div class="drop-zone-text">🎨 Drag widgets here to start designing<br><small>or double-click to add a layout</small></div>';
                        document.getElementById('formContainer').classList.remove('has-content');
                        selectedWidget = null;
                        widgetCounter = 0;
                        generateQMLCode();
                    }
                });
                
                document.getElementById('previewBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'showPreview' });
                });
                
                document.getElementById('codeBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'showCode' });
                });
                
                document.getElementById('externalBtn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'toggleExternalMode' });
                });
                
                // Initialize
                initializeDragDrop();
                updateStatus('Qt Designer Ready');
                
                // Listen for messages from VS Code
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'loadDesign':
                            // Load existing design
                            break;
                        case 'updateFromCode':
                            // Update designer from code changes
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private getPreviewHtml(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Live Preview</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #f5f5f5;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .preview-toolbar {
                    background: #2d2d30;
                    color: white;
                    padding: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #3e3e42;
                }
                
                .preview-container {
                    flex: 1;
                    padding: 20px;
                    overflow: auto;
                    background: white;
                    margin: 8px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
                
                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }
                
                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: #4caf50;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .preview-frame {
                    width: 100%;
                    height: 500px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .preview-content {
                    padding: 20px;
                    height: 100%;
                    position: relative;
                }
                
                /* QML Component Styles */
                .qml-label { color: #333; font-size: 14px; }
                .qml-button { 
                    background: #0078d4; color: white; border: none; 
                    padding: 8px 16px; border-radius: 4px; cursor: pointer;
                }
                .qml-button:hover { background: #106ebe; }
                .qml-textfield { 
                    border: 1px solid #ccc; padding: 8px; border-radius: 4px;
                    font-size: 14px;
                }
                .qml-checkbox { margin-right: 8px; }
                .qml-rectangle { 
                    border-radius: 4px; 
                    border: 1px solid #ddd;
                }
                .qml-row { display: flex; gap: 10px; align-items: center; }
                .qml-column { display: flex; flex-direction: column; gap: 10px; }
            </style>
        </head>
        <body>
            <div class="preview-toolbar">
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    Live Preview
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="refreshPreview()" style="background: #3c3c3c; color: white; border: 1px solid #555; padding: 4px 8px; border-radius: 3px; cursor: pointer;">🔄 Refresh</button>
                    <button onclick="toggleFullscreen()" style="background: #3c3c3c; color: white; border: 1px solid #555; padding: 4px 8px; border-radius: 3px; cursor: pointer;">⛶ Fullscreen</button>
                </div>
            </div>
            
            <div class="preview-container">
                <div class="preview-frame" id="previewFrame">
                    <div class="preview-content" id="previewContent">
                        <div style="text-align: center; color: #999; font-size: 16px; margin-top: 50px;">
                            👁️ Live Preview
                            <br><br>
                            <small>Your QML interface will appear here in real-time</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function refreshPreview() {
                    vscode.postMessage({ command: 'refreshPreview' });
                }
                
                function toggleFullscreen() {
                    vscode.postMessage({ command: 'toggleFullscreen' });
                }
                
                function renderQMLPreview(widgets) {
                    const content = document.getElementById('previewContent');
                    content.innerHTML = '';
                    
                    if (!widgets || widgets.length === 0) {
                        content.innerHTML = '<div style="text-align: center; color: #999; font-size: 16px; margin-top: 50px;">👁️ Live Preview<br><br><small>Your QML interface will appear here in real-time</small></div>';
                        return;
                    }
                    
                    widgets.forEach(widget => {
                        const element = createPreviewElement(widget);
                        content.appendChild(element);
                    });
                }
                
                function createPreviewElement(widget) {
                    const element = document.createElement('div');
                    element.style.position = 'absolute';
                    element.style.left = widget.position.x + 'px';
                    element.style.top = widget.position.y + 'px';
                    element.style.width = widget.position.width + 'px';
                    element.style.height = widget.position.height + 'px';
                    
                    switch (widget.type) {
                        case 'Label':
                            element.className = 'qml-label';
                            element.textContent = widget.properties.text || 'Label';
                            break;
                            
                        case 'Button':
                            element.className = 'qml-button';
                            element.textContent = widget.properties.text || 'Button';
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.justifyContent = 'center';
                            break;
                            
                        case 'TextField':
                            const input = document.createElement('input');
                            input.className = 'qml-textfield';
                            input.type = 'text';
                            input.placeholder = widget.properties.placeholderText || '';
                            input.value = widget.properties.text || '';
                            input.style.width = '100%';
                            input.style.height = '100%';
                            element.appendChild(input);
                            break;
                            
                        case 'Rectangle':
                            element.className = 'qml-rectangle';
                            element.style.backgroundColor = widget.properties.color || '#f0f0f0';
                            if (widget.properties.border) {
                                element.style.borderWidth = widget.properties.border.width + 'px';
                                element.style.borderColor = widget.properties.border.color;
                            }
                            break;
                            
                        case 'CheckBox':
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.className = 'qml-checkbox';
                            checkbox.checked = widget.properties.checked || false;
                            
                            const label = document.createElement('label');
                            label.appendChild(checkbox);
                            label.appendChild(document.createTextNode(widget.properties.text || 'CheckBox'));
                            label.style.display = 'flex';
                            label.style.alignItems = 'center';
                            
                            element.appendChild(label);
                            break;
                            
                        default:
                            element.textContent = widget.type;
                            element.style.border = '1px solid #ccc';
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.justifyContent = 'center';
                            element.style.backgroundColor = '#f9f9f9';
                    }
                    
                    return element;
                }
                
                // Listen for messages from VS Code
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updatePreview':
                            renderQMLPreview(message.widgets);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private getPropertyPanelHtml(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Properties</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #f5f5f5;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .property-header {
                    background: #2d2d30;
                    color: white;
                    padding: 8px;
                    border-bottom: 1px solid #3e3e42;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .property-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .property-group {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }
                
                .property-group-header {
                    background: #f8f9fa;
                    padding: 8px 12px;
                    border-bottom: 1px solid #e9ecef;
                    font-weight: bold;
                    font-size: 12px;
                    color: #495057;
                }
                
                .property-item {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    border-bottom: 1px solid #f1f3f4;
                    font-size: 12px;
                }
                
                .property-item:last-child {
                    border-bottom: none;
                }
                
                .property-label {
                    flex: 1;
                    color: #333;
                    font-weight: 500;
                }
                
                .property-input {
                    flex: 1.5;
                    margin-left: 8px;
                }
                
                .property-input input,
                .property-input select,
                .property-input textarea {
                    width: 100%;
                    padding: 4px 6px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    font-size: 11px;
                }
                
                .property-input input[type="checkbox"] {
                    width: auto;
                }
                
                .property-input input[type="color"] {
                    width: 40px;
                    height: 24px;
                    padding: 0;
                    border: none;
                }
                
                .no-selection {
                    text-align: center;
                    color: #999;
                    padding: 40px 20px;
                    font-size: 14px;
                }
                
                .object-inspector {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                
                .object-tree {
                    padding: 8px;
                }
                
                .object-item {
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    border-radius: 3px;
                }
                
                .object-item:hover {
                    background: #f0f0f0;
                }
                
                .object-item.selected {
                    background: #e3f2fd;
                    color: #1976d2;
                }
            </style>
        </head>
        <body>
            <div class="property-header">
                🔧 Properties Panel
            </div>
            
            <div class="property-content">
                <div class="object-inspector">
                    <div class="property-group-header">📋 Object Inspector</div>
                    <div class="object-tree" id="objectTree">
                        <div style="text-align: center; color: #999; padding: 20px; font-size: 12px;">
                            No objects in form
                        </div>
                    </div>
                </div>
                
                <div id="propertyEditor">
                    <div class="no-selection">
                        🎯 Select a widget to edit properties
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentWidget = null;
                
                function updateProperties(widget) {
                    currentWidget = widget;
                    updateObjectTree();
                    renderPropertyEditor(widget);
                }
                
                function updateObjectTree() {
                    // This would show all widgets in the form
                    const tree = document.getElementById('objectTree');
                    tree.innerHTML = '<div class="object-item selected">🎨 ' + (currentWidget?.type || 'Form') + ' (' + (currentWidget?.id || 'root') + ')</div>';
                }
                
                function renderPropertyEditor(widget) {
                    const editor = document.getElementById('propertyEditor');
                    
                    if (!widget) {
                        editor.innerHTML = '<div class="no-selection">🎯 Select a widget to edit properties</div>';
                        return;
                    }
                    
                    editor.innerHTML = '';
                    
                    // Object properties
                    const objectGroup = createPropertyGroup('📋 Object', [
                        { label: 'ID', key: 'id', type: 'text', value: widget.id },
                        { label: 'Type', key: 'type', type: 'text', value: widget.type, readonly: true }
                    ]);
                    editor.appendChild(objectGroup);
                    
                    // Position properties
                    const positionGroup = createPropertyGroup('📍 Position', [
                        { label: 'X', key: 'x', type: 'number', value: widget.position?.x || 0 },
                        { label: 'Y', key: 'y', type: 'number', value: widget.position?.y || 0 },
                        { label: 'Width', key: 'width', type: 'number', value: widget.position?.width || 100 },
                        { label: 'Height', key: 'height', type: 'number', value: widget.position?.height || 30 }
                    ]);
                    editor.appendChild(positionGroup);
                    
                    // Widget-specific properties
                    const specificProps = getWidgetSpecificProperties(widget);
                    if (specificProps.length > 0) {
                        const specificGroup = createPropertyGroup('⚙️ ' + widget.type + ' Properties', specificProps);
                        editor.appendChild(specificGroup);
                    }
                    
                    // Style properties
                    const styleGroup = createPropertyGroup('🎨 Style', [
                        { label: 'Color', key: 'color', type: 'color', value: widget.properties?.color || '#333333' },
                        { label: 'Background', key: 'backgroundColor', type: 'color', value: widget.properties?.backgroundColor || '#ffffff' },
                        { label: 'Font Size', key: 'fontSize', type: 'number', value: widget.properties?.fontSize || 14 },
                        { label: 'Font Weight', key: 'fontWeight', type: 'select', value: widget.properties?.fontWeight || 'normal', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] }
                    ]);
                    editor.appendChild(styleGroup);
                }
                
                function getWidgetSpecificProperties(widget) {
                    const props = [];
                    
                    switch (widget.type) {
                        case 'Label':
                        case 'Text':
                        case 'Button':
                            props.push({ label: 'Text', key: 'text', type: 'text', value: widget.properties?.text || '' });
                            break;
                            
                        case 'TextField':
                            props.push(
                                { label: 'Text', key: 'text', type: 'text', value: widget.properties?.text || '' },
                                { label: 'Placeholder', key: 'placeholderText', type: 'text', value: widget.properties?.placeholderText || '' },
                                { label: 'Read Only', key: 'readOnly', type: 'checkbox', value: widget.properties?.readOnly || false }
                            );
                            break;
                            
                        case 'CheckBox':
                        case 'RadioButton':
                            props.push(
                                { label: 'Text', key: 'text', type: 'text', value: widget.properties?.text || '' },
                                { label: 'Checked', key: 'checked', type: 'checkbox', value: widget.properties?.checked || false }
                            );
                            break;
                            
                        case 'Slider':
                            props.push(
                                { label: 'Value', key: 'value', type: 'number', value: widget.properties?.value || 0 },
                                { label: 'From', key: 'from', type: 'number', value: widget.properties?.from || 0 },
                                { label: 'To', key: 'to', type: 'number', value: widget.properties?.to || 100 }
                            );
                            break;
                            
                        case 'Image':
                            props.push(
                                { label: 'Source', key: 'source', type: 'text', value: widget.properties?.source || '' },
                                { label: 'Fill Mode', key: 'fillMode', type: 'select', value: widget.properties?.fillMode || 'PreserveAspectFit', options: ['Stretch', 'PreserveAspectFit', 'PreserveAspectCrop', 'Tile', 'TileVertically', 'TileHorizontally'] }
                            );
                            break;
                    }
                    
                    return props;
                }
                
                function createPropertyGroup(title, properties) {
                    const group = document.createElement('div');
                    group.className = 'property-group';
                    
                    const header = document.createElement('div');
                    header.className = 'property-group-header';
                    header.textContent = title;
                    group.appendChild(header);
                    
                    properties.forEach(prop => {
                        const item = document.createElement('div');
                        item.className = 'property-item';
                        
                        const label = document.createElement('div');
                        label.className = 'property-label';
                        label.textContent = prop.label;
                        
                        const input = document.createElement('div');
                        input.className = 'property-input';
                        
                        let inputElement;
                        
                        switch (prop.type) {
                            case 'checkbox':
                                inputElement = document.createElement('input');
                                inputElement.type = 'checkbox';
                                inputElement.checked = prop.value;
                                break;
                                
                            case 'select':
                                inputElement = document.createElement('select');
                                prop.options?.forEach(option => {
                                    const optElement = document.createElement('option');
                                    optElement.value = option;
                                    optElement.textContent = option;
                                    optElement.selected = option === prop.value;
                                    inputElement.appendChild(optElement);
                                });
                                break;
                                
                            case 'color':
                                inputElement = document.createElement('input');
                                inputElement.type = 'color';
                                inputElement.value = prop.value;
                                break;
                                
                            case 'number':
                                inputElement = document.createElement('input');
                                inputElement.type = 'number';
                                inputElement.value = prop.value;
                                break;
                                
                            default:
                                inputElement = document.createElement('input');
                                inputElement.type = 'text';
                                inputElement.value = prop.value;
                                inputElement.readOnly = prop.readonly || false;
                        }
                        
                        // Add change listener
                        inputElement.addEventListener('input', () => {
                            updateWidgetProperty(prop.key, inputElement.type === 'checkbox' ? inputElement.checked : inputElement.value);
                        });
                        
                        input.appendChild(inputElement);
                        item.appendChild(label);
                        item.appendChild(input);
                        group.appendChild(item);
                    });
                    
                    return group;
                }
                
                function updateWidgetProperty(key, value) {
                    vscode.postMessage({
                        command: 'updateWidgetProperty',
                        widgetId: currentWidget?.id,
                        property: key,
                        value: value
                    });
                }
                
                // Listen for messages from VS Code
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateProperties':
                            updateProperties(message.widget);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    private setupMessageHandlers() {
        // Designer panel messages
        this._designerPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'generateQML':
                    const qmlCode = this.generateQMLFromWidgets(message.widgets);
                    this._currentQmlContent = qmlCode;
                    
                    // Update preview
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: message.widgets
                    });
                    
                    // Show in code editor if needed
                    await this.updateCodeEditor(qmlCode);
                    break;
                    
                case 'updateProperties':
                    this._propertyPanel?.webview.postMessage({
                        command: 'updateProperties',
                        widget: message.widget
                    });
                    break;
                    
                case 'showPreview':
                    this._previewPanel?.reveal();
                    break;
                    
                case 'showCode':
                    await this.openCodeEditor();
                    break;
                    
                case 'toggleExternalMode':
                    if (this._isExternalMode) {
                        vscode.window.showInformationMessage('External mode already active');
                    } else {
                        await this.openExternalWindows();
                    }
                    break;
            }
        });

        // Property panel messages
        this._propertyPanel?.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'updateWidgetProperty':
                    this._designerPanel?.webview.postMessage({
                        command: 'updateProperty',
                        widgetId: message.widgetId,
                        property: message.property,
                        value: message.value
                    });
                    break;
            }
        });
    }

    private generateQMLFromWidgets(widgets: any[]): string {
        let qml = `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt Live Preview"

`;

        widgets.forEach(widget => {
            qml += this.generateWidgetQML(widget, '    ');
        });

        qml += '}\n';
        return qml;
    }

    private generateWidgetQML(widget: any, indent: string): string {
        const pos = widget.position;
        const props = widget.properties;
        
        let qml = `${indent}${widget.type} {
${indent}    id: ${widget.id}
${indent}    x: ${pos.x}
${indent}    y: ${pos.y}
${indent}    width: ${pos.width}
${indent}    height: ${pos.height}
`;

        // Add widget-specific properties
        Object.keys(props).forEach(key => {
            if (props[key] !== undefined && props[key] !== null) {
                if (typeof props[key] === 'string') {
                    qml += `${indent}    ${key}: "${props[key]}"
`;
                } else {
                    qml += `${indent}    ${key}: ${props[key]}
`;
                }
            }
        });

        qml += `${indent}}
`;
        return qml;
    }

    private async updateCodeEditor(qmlContent: string) {
        // Update the active QML file or create a new one
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.languageId === 'qml') {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(activeEditor.document.uri, new vscode.Range(0, 0, activeEditor.document.lineCount, 0), qmlContent);
            await vscode.workspace.applyEdit(edit);
        }
    }

    private async openCodeEditor() {
        // Create or show code editor
        const doc = await vscode.workspace.openTextDocument({
            content: this._currentQmlContent,
            language: 'qml'
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }

    private async openExternalWindows() {
        this._isExternalMode = true;
        
        // Close current panels and reopen as external
        this._designerPanel?.dispose();
        this._previewPanel?.dispose();
        this._propertyPanel?.dispose();
        
        await this.openFullDesigner(true);
        
        vscode.window.showInformationMessage('🪟 Qt Designer opened in external mode! You can now position windows on multiple monitors.');
    }

    private initializeDefaultApplication() {
        // Initialize with a simple default layout
        const defaultWidgets = [
            {
                id: 'welcomeLabel',
                type: 'Label',
                properties: { text: 'Welcome to Qt Designer', fontSize: 16 },
                position: { x: 50, y: 50, width: 200, height: 30 }
            }
        ];
        
        this._previewPanel?.webview.postMessage({
            command: 'updatePreview',
            widgets: defaultWidgets
        });
    }
}
