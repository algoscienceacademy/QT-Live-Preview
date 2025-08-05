import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QMLCodeGenerator, WidgetData } from './qmlCodeGenerator';
import { QtComponentLibrary } from './qtComponentLibrary';
import { QtUITemplates } from './qtUITemplates';
import { QMLSyncManager } from './qmlSyncManager';

export class QtUIDesigner implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _currentFile?: vscode.Uri;
    private _undoStack: string[] = [];
    private _redoStack: string[] = [];
    private _maxUndoLevels = 50;
    private _syncManager?: QMLSyncManager;
    private _isRealtimeSyncEnabled = true;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message: any) => {
            switch (message.command) {
                case 'saveDesign':
                    await this.saveDesign(message.qmlContent);
                    break;
                case 'updateCode':
                    if (this._isRealtimeSyncEnabled && this._syncManager) {
                        this._syncManager.updateCodeFromDesigner(message.qmlContent);
                    }
                    break;
                case 'loadFile':
                    if (message.filePath) {
                        await this.loadFile(vscode.Uri.file(message.filePath));
                    }
                    break;
                case 'exportUiFile':
                    await this.exportToUiFile(message.qmlContent);
                    break;
                case 'previewCode':
                    await this.previewGeneratedCode(message.qmlContent);
                    break;
                case 'loadTemplate':
                    await this.loadTemplate(message.templateName);
                    break;
                case 'undo':
                    this.undo();
                    break;
                case 'redo':
                    this.redo();
                    break;
                case 'addToUndoStack':
                    this.addToUndoStack(message.content);
                    break;
            }
        });
    }

    public async openDesigner(uri?: vscode.Uri) {
        if (!this._view) {
            await vscode.commands.executeCommand('qtUIDesigner.designer.focus');
        }

        if (uri) {
            await this.loadFile(uri);
            // Auto-start real-time sync for QML files
            if (uri.path.endsWith('.qml')) {
                const document = await vscode.workspace.openTextDocument(uri);
                this.startRealtimeSync(document);
            }
        }
    }

    private async loadFile(uri: vscode.Uri) {
        try {
            this._currentFile = uri;
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'loadDesign',
                    content: content,
                    fileName: path.basename(uri.fsPath)
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load file: ${error}`);
        }
    }

    private async saveDesign(content: string) {
        if (!this._currentFile) {
            const uri = await vscode.window.showSaveDialog({
                filters: {
                    'QML Files': ['qml'],
                    'All Files': ['*']
                },
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri
            });

            if (uri) {
                this._currentFile = uri;
            } else {
                return;
            }
        }

        try {
            fs.writeFileSync(this._currentFile.fsPath, content, 'utf8');
            vscode.window.showInformationMessage('Design saved successfully!');
            
            // Trigger live preview if available
            vscode.commands.executeCommand('qtLivePreview.startPreview', this._currentFile);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save design: ${error}`);
        }
    }

    private async exportToUiFile(qmlContent: string) {
        const uiContent = this.convertQmlToUi(qmlContent);
        
        const uri = await vscode.window.showSaveDialog({
            filters: {
                'UI Files': ['ui'],
                'All Files': ['*']
            },
            defaultUri: this._currentFile ? 
                vscode.Uri.file(this._currentFile.fsPath.replace('.qml', '.ui')) :
                vscode.workspace.workspaceFolders?.[0]?.uri
        });

        if (uri) {
            try {
                fs.writeFileSync(uri.fsPath, uiContent, 'utf8');
                vscode.window.showInformationMessage('UI file exported successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export UI file: ${error}`);
            }
        }
    }

    private async previewGeneratedCode(qmlContent: string) {
        const doc = await vscode.workspace.openTextDocument({
            content: qmlContent,
            language: 'qml'
        });
        await vscode.window.showTextDocument(doc);
    }

    private async loadTemplate(templateName: string) {
        try {
            const widgets = QtUITemplates.createTemplate(templateName);
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'loadTemplate',
                    widgets: widgets,
                    templateName: templateName
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load template: ${error}`);
        }
    }

    private addToUndoStack(content: string) {
        this._undoStack.push(content);
        if (this._undoStack.length > this._maxUndoLevels) {
            this._undoStack.shift();
        }
        this._redoStack = []; // Clear redo stack when new action is performed
    }

    private undo() {
        if (this._undoStack.length > 0) {
            const current = this._undoStack.pop()!;
            this._redoStack.push(current);
            
            const previous = this._undoStack[this._undoStack.length - 1] || '';
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'restoreState',
                    content: previous
                });
            }
        }
    }

    private redo() {
        if (this._redoStack.length > 0) {
            const content = this._redoStack.pop()!;
            this._undoStack.push(content);
            
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'restoreState',
                    content: content
                });
            }
        }
    }

    private convertQmlToUi(qmlContent: string): string {
        // Basic QML to UI file conversion
        // This is a simplified converter - in a real implementation, you'd want a more sophisticated parser
        return `<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>Form</class>
 <widget class="QWidget" name="Form">
  <property name="geometry">
   <rect>
    <x>0</x>
    <y>0</y>
    <width>400</width>
    <height>300</height>
   </rect>
  </property>
  <property name="windowTitle">
   <string>Form</string>
  </property>
  <!-- Generated from QML content -->
  <!-- ${qmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->
 </widget>
 <resources/>
 <connections/>
</ui>`;
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt UI Designer</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    overflow: hidden;
                }
                
                .designer-container {
                    display: flex;
                    height: 100vh;
                    flex-direction: column;
                }
                
                .toolbar {
                    background-color: var(--vscode-panel-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 8px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .toolbar-btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background-color 0.2s;
                }
                
                .toolbar-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .toolbar-select {
                    background-color: var(--vscode-dropdown-background);
                    color: var(--vscode-dropdown-foreground);
                    border: 1px solid var(--vscode-dropdown-border);
                    border-radius: 4px;
                    padding: 6px 8px;
                    font-size: 12px;
                    cursor: pointer;
                }
                
                .main-content {
                    flex: 1;
                    display: flex;
                    min-height: 0;
                }
                
                .sidebar {
                    width: 250px;
                    background-color: var(--vscode-sideBar-background);
                    border-right: 1px solid var(--vscode-panel-border);
                    display: flex;
                    flex-direction: column;
                }
                
                .widget-palette {
                    flex: 1;
                    padding: 10px;
                    overflow-y: auto;
                }
                
                .properties-panel {
                    max-height: 40%;
                    border-top: 1px solid var(--vscode-panel-border);
                    padding: 10px;
                    overflow-y: auto;
                }
                
                .design-area {
                    flex: 1;
                    background-color: var(--vscode-editor-background);
                    position: relative;
                    overflow: auto;
                }
                
                .canvas {
                    width: 100%;
                    height: 100%;
                    min-height: 600px;
                    position: relative;
                    background: 
                        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
                    background-size: 20px 20px;
                    cursor: crosshair;
                }
                
                .widget-category {
                    margin-bottom: 15px;
                }
                
                .category-title {
                    font-weight: bold;
                    color: var(--vscode-charts-blue);
                    margin-bottom: 8px;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .widget-item {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 8px 12px;
                    margin: 4px 0;
                    border-radius: 4px;
                    cursor: move;
                    font-size: 12px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .widget-item:hover {
                    background-color: var(--vscode-button-hoverBackground);
                    transform: scale(1.02);
                }
                
                .widget-item.dragging {
                    opacity: 0.5;
                    transform: scale(0.95);
                }
                
                .dropped-widget {
                    position: absolute;
                    border: 2px solid var(--vscode-charts-blue);
                    background-color: var(--vscode-button-background);
                    padding: 8px;
                    border-radius: 4px;
                    cursor: move;
                    user-select: none;
                    min-width: 80px;
                    min-height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                
                .dropped-widget:hover {
                    border-color: var(--vscode-charts-orange);
                }
                
                .dropped-widget.selected {
                    border-color: var(--vscode-charts-green);
                    box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.3);
                }
                
                .property-group {
                    margin-bottom: 12px;
                }
                
                .property-label {
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: var(--vscode-charts-purple);
                }
                
                .property-input {
                    width: 100%;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 6px 8px;
                    font-size: 12px;
                    box-sizing: border-box;
                }
                
                .property-input:focus {
                    outline: none;
                    border-color: var(--vscode-charts-blue);
                }
                
                .drop-zone {
                    border: 2px dashed var(--vscode-charts-green);
                    background-color: rgba(0, 255, 0, 0.1);
                    border-radius: 8px;
                }
                
                .code-preview {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--vscode-editor-background);
                    z-index: 1000;
                    display: none;
                    overflow: auto;
                }
                
                .code-content {
                    padding: 20px;
                    font-family: monospace;
                    font-size: 12px;
                    line-height: 1.4;
                }
                
                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .status-bar {
                    background-color: var(--vscode-statusBar-background);
                    color: var(--vscode-statusBar-foreground);
                    padding: 4px 12px;
                    font-size: 12px;
                    border-top: 1px solid var(--vscode-panel-border);
                }
                
                .resize-handle {
                    position: absolute;
                    bottom: -5px;
                    right: -5px;
                    width: 10px;
                    height: 10px;
                    background-color: var(--vscode-charts-blue);
                    cursor: se-resize;
                    border-radius: 2px;
                }
                
                .widget-icon {
                    font-size: 14px;
                }
                
                @keyframes highlight {
                    0% { box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
                }
                
                .highlight {
                    animation: highlight 0.6s ease-out;
                }
            </style>
        </head>
        <body>
            <div class="designer-container">
                <div class="toolbar">
                    <button class="toolbar-btn" onclick="saveDesign()">💾 Save</button>
                    <button class="toolbar-btn" onclick="undo()">↶ Undo</button>
                    <button class="toolbar-btn" onclick="redo()">↷ Redo</button>
                    <button class="toolbar-btn" onclick="clearCanvas()">🗑️ Clear</button>
                    <button class="toolbar-btn" onclick="previewCode()">👁️ Preview Code</button>
                    <button class="toolbar-btn" onclick="exportUi()">📤 Export UI</button>
                    <button class="toolbar-btn" onclick="toggleGrid()">⊞ Grid</button>
                    <button class="toolbar-btn" id="syncBtn" onclick="toggleRealtimeSync()" title="Toggle Real-time Sync with Code Editor">
                        🔄 Sync
                    </button>
                    <select class="toolbar-select" id="templateSelect" onchange="loadTemplate()">
                        <option value="">📋 Load Template</option>
                        <option value="Form Layout">📝 Form Layout</option>
                        <option value="Navigation Drawer">🗂️ Navigation Drawer</option>
                        <option value="Tab View">📑 Tab View</option>
                        <option value="Dashboard">📊 Dashboard</option>
                        <option value="Master-Detail">📋 Master-Detail</option>
                        <option value="Login Form">🔐 Login Form</option>
                        <option value="Media Player">🎵 Media Player</option>
                    </select>
                </div>
                
                <div class="main-content">
                    <div class="sidebar">
                        <div class="widget-palette">
                            <h3 style="margin-top: 0; color: var(--vscode-charts-orange);">Widget Palette</h3>
                            
                            <div class="widget-category">
                                <div class="category-title">Basic Widgets</div>
                                <div class="widget-item" draggable="true" data-widget="Button">
                                    <span class="widget-icon">🔘</span> Button
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Label">
                                    <span class="widget-icon">🏷️</span> Label
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TextField">
                                    <span class="widget-icon">📝</span> Text Field
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TextArea">
                                    <span class="widget-icon">📄</span> Text Area
                                </div>
                            </div>
                            
                            <div class="widget-category">
                                <div class="category-title">Layout</div>
                                <div class="widget-item" draggable="true" data-widget="Rectangle">
                                    <span class="widget-icon">⬛</span> Rectangle
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Row">
                                    <span class="widget-icon">↔️</span> Row Layout
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Column">
                                    <span class="widget-icon">↕️</span> Column Layout
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Grid">
                                    <span class="widget-icon">⊞</span> Grid Layout
                                </div>
                            </div>
                            
                            <div class="widget-category">
                                <div class="category-title">Controls</div>
                                <div class="widget-item" draggable="true" data-widget="CheckBox">
                                    <span class="widget-icon">☑️</span> CheckBox
                                </div>
                                <div class="widget-item" draggable="true" data-widget="RadioButton">
                                    <span class="widget-icon">🔘</span> RadioButton
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Slider">
                                    <span class="widget-icon">🎚️</span> Slider
                                </div>
                                <div class="widget-item" draggable="true" data-widget="ProgressBar">
                                    <span class="widget-icon">📊</span> ProgressBar
                                </div>
                                <div class="widget-item" draggable="true" data-widget="ComboBox">
                                    <span class="widget-icon">📋</span> ComboBox
                                </div>
                            </div>
                            
                            <div class="widget-category">
                                <div class="category-title">Advanced</div>
                                <div class="widget-item" draggable="true" data-widget="ListView">
                                    <span class="widget-icon">📋</span> List View
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TreeView">
                                    <span class="widget-icon">🌳</span> Tree View
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TabView">
                                    <span class="widget-icon">📑</span> Tab View
                                </div>
                                <div class="widget-item" draggable="true" data-widget="ScrollView">
                                    <span class="widget-icon">📜</span> Scroll View
                                </div>
                            </div>
                        </div>
                        
                        <div class="properties-panel">
                            <h4 style="margin-top: 0; color: var(--vscode-charts-green);">Properties</h4>
                            <div id="properties-content">
                                <p style="color: var(--vscode-descriptionForeground); font-size: 12px;">
                                    Select a widget to edit its properties
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="design-area">
                        <div class="canvas" id="canvas" ondrop="drop(event)" ondragover="allowDrop(event)">
                            <!-- Widgets will be placed here -->
                        </div>
                    </div>
                </div>
                
                <div class="status-bar">
                    <span id="status">Ready - Drag widgets from the palette to the canvas</span>
                </div>
            </div>
            
            <div class="code-preview" id="codePreview">
                <button class="close-btn" onclick="closeCodePreview()">✕ Close</button>
                <div class="code-content" id="codeContent"></div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let selectedWidget = null;
                let widgets = [];
                let widgetCounter = 0;
                let dragOffsetX = 0;
                let dragOffsetY = 0;
                let isResizing = false;
                let isRealtimeSyncEnabled = true; // Real-time sync state
                let syncInProgress = false; // Prevent sync loops
                
                // Drag and drop functionality
                function allowDrop(ev) {
                    ev.preventDefault();
                    const canvas = document.getElementById('canvas');
                    canvas.classList.add('drop-zone');
                }
                
                function drag(ev) {
                    ev.dataTransfer.setData("text", ev.target.getAttribute('data-widget'));
                    ev.target.classList.add('dragging');
                }
                
                function drop(ev) {
                    ev.preventDefault();
                    const canvas = document.getElementById('canvas');
                    canvas.classList.remove('drop-zone');
                    
                    const widgetType = ev.dataTransfer.getData("text");
                    if (widgetType) {
                        const rect = canvas.getBoundingClientRect();
                        const x = ev.clientX - rect.left;
                        const y = ev.clientY - rect.top;
                        createWidget(widgetType, x, y);
                    }
                    
                    // Remove dragging class from all items
                    document.querySelectorAll('.widget-item').forEach(item => {
                        item.classList.remove('dragging');
                    });
                }
                
                function createWidget(type, x, y) {
                    const widget = {
                        id: 'widget_' + (++widgetCounter),
                        type: type,
                        x: x,
                        y: y,
                        width: getDefaultWidth(type),
                        height: getDefaultHeight(type),
                        properties: getDefaultProperties(type)
                    };
                    
                    widgets.push(widget);
                    renderWidget(widget);
                    selectWidget(widget.id);
                    updateStatus('Added ' + type + ' widget');
                    syncToCode(); // Real-time sync when widget added
                    saveToUndoStack();
                }
                
                function renderWidget(widget) {
                    const canvas = document.getElementById('canvas');
                    const element = document.createElement('div');
                    element.className = 'dropped-widget';
                    element.id = widget.id;
                    element.style.left = widget.x + 'px';
                    element.style.top = widget.y + 'px';
                    element.style.width = widget.width + 'px';
                    element.style.height = widget.height + 'px';
                    element.textContent = widget.properties.text || widget.type;
                    
                    // Add resize handle
                    const resizeHandle = document.createElement('div');
                    resizeHandle.className = 'resize-handle';
                    element.appendChild(resizeHandle);
                    
                    // Event listeners
                    element.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectWidget(widget.id);
                    });
                    
                    element.addEventListener('mousedown', startDragging);
                    resizeHandle.addEventListener('mousedown', startResizing);
                    
                    canvas.appendChild(element);
                }
                
                function startDragging(e) {
                    if (isResizing) return;
                    
                    const widget = e.currentTarget;
                    const rect = widget.getBoundingClientRect();
                    dragOffsetX = e.clientX - rect.left;
                    dragOffsetY = e.clientY - rect.top;
                    
                    function handleMouseMove(e) {
                        const canvas = document.getElementById('canvas');
                        const canvasRect = canvas.getBoundingClientRect();
                        const x = e.clientX - canvasRect.left - dragOffsetX;
                        const y = e.clientY - canvasRect.top - dragOffsetY;
                        
                        widget.style.left = Math.max(0, x) + 'px';
                        widget.style.top = Math.max(0, y) + 'px';
                        
                        // Update widget data
                        const widgetData = widgets.find(w => w.id === widget.id);
                        if (widgetData) {
                            widgetData.x = Math.max(0, x);
                            widgetData.y = Math.max(0, y);
                        }
                    }
                    
                    function handleMouseUp() {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        syncToCode(); // Real-time sync when widget moved
                        saveToUndoStack();
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
                
                function startResizing(e) {
                    e.stopPropagation();
                    isResizing = true;
                    
                    const widget = e.currentTarget.parentElement;
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = parseInt(widget.style.width);
                    const startHeight = parseInt(widget.style.height);
                    
                    function handleMouseMove(e) {
                        const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                        const newHeight = Math.max(30, startHeight + (e.clientY - startY));
                        
                        widget.style.width = newWidth + 'px';
                        widget.style.height = newHeight + 'px';
                        
                        // Update widget data
                        const widgetData = widgets.find(w => w.id === widget.id);
                        if (widgetData) {
                            widgetData.width = newWidth;
                            widgetData.height = newHeight;
                        }
                    }
                    
                    function handleMouseUp() {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        isResizing = false;
                        syncToCode(); // Real-time sync when widget resized
                        saveToUndoStack();
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
                
                function selectWidget(widgetId) {
                    // Remove previous selection
                    document.querySelectorAll('.dropped-widget').forEach(w => {
                        w.classList.remove('selected');
                    });
                    
                    // Select new widget
                    const element = document.getElementById(widgetId);
                    if (element) {
                        element.classList.add('selected');
                        selectedWidget = widgets.find(w => w.id === widgetId);
                        showProperties(selectedWidget);
                    }
                }
                
                function showProperties(widget) {
                    const container = document.getElementById('properties-content');
                    container.innerHTML = '';
                    
                    if (!widget) return;
                    
                    // Common properties
                    addPropertyInput(container, 'Text', 'text', widget.properties.text || widget.type);
                    addPropertyInput(container, 'Width', 'width', widget.width);
                    addPropertyInput(container, 'Height', 'height', widget.height);
                    addPropertyInput(container, 'X Position', 'x', widget.x);
                    addPropertyInput(container, 'Y Position', 'y', widget.y);
                    
                    // Widget-specific properties
                    if (widget.type === 'Button') {
                        addPropertyInput(container, 'Enabled', 'enabled', widget.properties.enabled !== false);
                    } else if (widget.type === 'TextField') {
                        addPropertyInput(container, 'Placeholder', 'placeholder', widget.properties.placeholder || '');
                    } else if (widget.type === 'Rectangle') {
                        addPropertyInput(container, 'Color', 'color', widget.properties.color || '#ffffff');
                        addPropertyInput(container, 'Border Width', 'borderWidth', widget.properties.borderWidth || 1);
                    }
                }
                
                function addPropertyInput(container, label, property, value) {
                    const group = document.createElement('div');
                    group.className = 'property-group';
                    
                    const labelEl = document.createElement('div');
                    labelEl.className = 'property-label';
                    labelEl.textContent = label;
                    
                    const input = document.createElement('input');
                    input.className = 'property-input';
                    input.type = typeof value === 'boolean' ? 'checkbox' : 
                                 property === 'color' ? 'color' : 'text';
                    
                    if (typeof value === 'boolean') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                    
                    input.addEventListener('change', () => {
                        updateWidgetProperty(property, input.type === 'checkbox' ? input.checked : input.value);
                    });
                    
                    group.appendChild(labelEl);
                    group.appendChild(input);
                    container.appendChild(group);
                }
                
                function updateWidgetProperty(property, value) {
                    if (!selectedWidget) return;
                    
                    // Update widget data
                    if (['width', 'height', 'x', 'y'].includes(property)) {
                        selectedWidget[property] = parseInt(value) || 0;
                    } else {
                        selectedWidget.properties[property] = value;
                    }
                    
                    // Update visual element
                    const element = document.getElementById(selectedWidget.id);
                    if (element) {
                        if (property === 'text') {
                            element.textContent = value;
                        } else if (property === 'width') {
                            element.style.width = value + 'px';
                        } else if (property === 'height') {
                            element.style.height = value + 'px';
                        } else if (property === 'x') {
                            element.style.left = value + 'px';
                        } else if (property === 'y') {
                            element.style.top = value + 'px';
                        } else if (property === 'color') {
                            element.style.backgroundColor = value;
                        }
                    }
                    
                    // Real-time sync: Update code editor when properties change
                    syncToCode();
                    saveToUndoStack();
                }

                function syncToCode() {
                    // Only sync if enabled and not already syncing
                    if (!isRealtimeSyncEnabled || syncInProgress) return;
                    
                    // Generate QML and send to VS Code for real-time sync
                    const qmlContent = generateQML();
                    vscode.postMessage({
                        command: 'updateCode',
                        qmlContent: qmlContent
                    });
                }

                function syncFromCode(codeWidgets, qmlContent) {
                    // Update designer from code changes
                    if (!codeWidgets || !isRealtimeSyncEnabled) return;
                    
                    syncInProgress = true; // Prevent sync loops
                    
                    // Clear current widgets
                    document.getElementById('canvas').innerHTML = '';
                    widgets = codeWidgets;
                    
                    // Render widgets from code
                    widgets.forEach(widget => {
                        renderWidget(widget);
                        if (widget.children) {
                            widget.children.forEach(child => {
                                renderWidget(child);
                            });
                        }
                    });
                    
                    updateStatus('Synced from code editor');
                    
                    // Re-enable sync after a short delay
                    setTimeout(() => {
                        syncInProgress = false;
                    }, 100);
                }

                function toggleRealtimeSync() {
                    isRealtimeSyncEnabled = !isRealtimeSyncEnabled;
                    const syncBtn = document.getElementById('syncBtn');
                    
                    if (isRealtimeSyncEnabled) {
                        syncBtn.textContent = '🔄 Sync';
                        syncBtn.style.backgroundColor = 'var(--vscode-button-background)';
                        syncBtn.style.color = 'var(--vscode-button-foreground)';
                        updateStatus('Real-time sync enabled');
                        
                        // Trigger initial sync
                        syncToCode();
                    } else {
                        syncBtn.textContent = '⏸️ Sync';
                        syncBtn.style.backgroundColor = 'var(--vscode-button-secondaryBackground)';
                        syncBtn.style.color = 'var(--vscode-button-secondaryForeground)';
                        updateStatus('Real-time sync disabled');
                    }
                }
                
                function getDefaultWidth(type) {
                    const widths = {
                        Button: 120,
                        Label: 100,
                        TextField: 200,
                        TextArea: 250,
                        Rectangle: 150,
                        CheckBox: 120,
                        RadioButton: 120,
                        Slider: 200,
                        ProgressBar: 200,
                        ComboBox: 150
                    };
                    return widths[type] || 100;
                }
                
                function getDefaultHeight(type) {
                    const heights = {
                        Button: 30,
                        Label: 25,
                        TextField: 30,
                        TextArea: 100,
                        Rectangle: 100,
                        CheckBox: 25,
                        RadioButton: 25,
                        Slider: 25,
                        ProgressBar: 25,
                        ComboBox: 30
                    };
                    return heights[type] || 30;
                }
                
                function getDefaultProperties(type) {
                    const properties = {
                        Button: { text: 'Button', enabled: true },
                        Label: { text: 'Label' },
                        TextField: { text: '', placeholder: 'Enter text' },
                        TextArea: { text: 'Text Area' },
                        Rectangle: { color: '#f0f0f0', borderWidth: 1 },
                        CheckBox: { text: 'CheckBox', checked: false },
                        RadioButton: { text: 'RadioButton', checked: false },
                        Slider: { value: 50, minimum: 0, maximum: 100 },
                        ProgressBar: { value: 50, minimum: 0, maximum: 100 },
                        ComboBox: { currentText: 'Option 1' }
                    };
                    return properties[type] || { text: type };
                }
                
                // Toolbar functions
                function saveDesign() {
                    const qmlContent = generateQML();
                    vscode.postMessage({
                        command: 'saveDesign',
                        qmlContent: qmlContent
                    });
                    updateStatus('Design saved');
                }
                
                function clearCanvas() {
                    if (confirm('Clear all widgets from the canvas?')) {
                        document.getElementById('canvas').innerHTML = '';
                        widgets = [];
                        selectedWidget = null;
                        document.getElementById('properties-content').innerHTML = 
                            '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                        updateStatus('Canvas cleared');
                        saveToUndoStack();
                    }
                }
                
                function previewCode() {
                    const qmlContent = generateQML();
                    document.getElementById('codeContent').textContent = qmlContent;
                    document.getElementById('codePreview').style.display = 'block';
                }
                
                function closeCodePreview() {
                    document.getElementById('codePreview').style.display = 'none';
                }
                
                function exportUi() {
                    const qmlContent = generateQML();
                    vscode.postMessage({
                        command: 'exportUiFile',
                        qmlContent: qmlContent
                    });
                    updateStatus('Exported to UI file');
                }
                
                function undo() {
                    vscode.postMessage({ command: 'undo' });
                }
                
                function redo() {
                    vscode.postMessage({ command: 'redo' });
                }
                
                function toggleGrid() {
                    const canvas = document.getElementById('canvas');
                    canvas.style.backgroundImage = canvas.style.backgroundImage ? '' : 
                        'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)';
                    updateStatus('Grid toggled');
                }
                
                function loadTemplate() {
                    const select = document.getElementById('templateSelect');
                    const templateName = select.value;
                    if (templateName) {
                        vscode.postMessage({
                            command: 'loadTemplate',
                            templateName: templateName
                        });
                        select.value = ''; // Reset selection
                        updateStatus('Loading template: ' + templateName);
                    }
                }
                
                function generateQML() {
                    let qml = 'import QtQuick 2.15\\nimport QtQuick.Controls 2.15\\nimport QtQuick.Layouts 1.15\\n\\nApplicationWindow {\\n';
                    qml += '    width: 800\\n    height: 600\\n    visible: true\\n    title: "Qt Designer"\\n\\n';
                    
                    widgets.forEach(widget => {
                        qml += generateWidgetQML(widget);
                    });
                    
                    qml += '}\\n';
                    return qml;
                }
                
                function generateWidgetQML(widget) {
                    let qml = '    ' + getQMLWidgetType(widget.type) + ' {\\n';
                    qml += '        id: ' + widget.id + '\\n';
                    qml += '        x: ' + widget.x + '\\n';
                    qml += '        y: ' + widget.y + '\\n';
                    qml += '        width: ' + widget.width + '\\n';
                    qml += '        height: ' + widget.height + '\\n';
                    
                    // Add widget-specific properties
                    for (const [key, value] of Object.entries(widget.properties)) {
                        if (key === 'text' && value) {
                            qml += '        text: qsTr("' + value + '")\\n';
                        } else if (key === 'color' && value) {
                            qml += '        color: "' + value + '"\\n';
                        } else if (key === 'enabled' && typeof value === 'boolean') {
                            qml += '        enabled: ' + value + '\\n';
                        } else if (key === 'placeholderText' && value) {
                            qml += '        placeholderText: qsTr("' + value + '")\\n';
                        } else if (key === 'checked' && typeof value === 'boolean') {
                            qml += '        checked: ' + value + '\\n';
                        } else if (key === 'value' && typeof value === 'number') {
                            qml += '        value: ' + value + '\\n';
                        } else if (key === 'from' && typeof value === 'number') {
                            qml += '        from: ' + value + '\\n';
                        } else if (key === 'to' && typeof value === 'number') {
                            qml += '        to: ' + value + '\\n';
                        } else if (key === 'spacing' && typeof value === 'number') {
                            qml += '        spacing: ' + value + '\\n';
                        }
                    }
                    
                    // Add children
                    if (widget.children && widget.children.length > 0) {
                        qml += '\\n';
                        widget.children.forEach(child => {
                            qml += generateWidgetQML(child).replace(/^    /gm, '        '); // Add extra indentation
                        });
                    }
                    
                    qml += '    }\\n\\n';
                    return qml;
                }
                
                function getQMLWidgetType(type) {
                    const mapping = {
                        Button: 'Button',
                        Label: 'Label',
                        TextField: 'TextField',
                        TextArea: 'TextArea',
                        Rectangle: 'Rectangle',
                        CheckBox: 'CheckBox',
                        RadioButton: 'RadioButton',
                        Slider: 'Slider',
                        ProgressBar: 'ProgressBar',
                        ComboBox: 'ComboBox',
                        Row: 'Row',
                        Column: 'Column',
                        Grid: 'Grid',
                        ListView: 'ListView',
                        TreeView: 'TreeView',
                        TabView: 'TabView',
                        ScrollView: 'ScrollView'
                    };
                    return mapping[type] || 'Rectangle';
                }
                
                function saveToUndoStack() {
                    const state = JSON.stringify(widgets);
                    vscode.postMessage({
                        command: 'addToUndoStack',
                        content: state
                    });
                }
                
                function updateStatus(message) {
                    document.getElementById('status').textContent = message;
                }
                
                // Canvas click to deselect
                document.getElementById('canvas').addEventListener('click', (e) => {
                    if (e.target.id === 'canvas') {
                        selectedWidget = null;
                        document.querySelectorAll('.dropped-widget').forEach(w => {
                            w.classList.remove('selected');
                        });
                        document.getElementById('properties-content').innerHTML = 
                            '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                    }
                });
                
                // Add drag listeners to widget items
                document.querySelectorAll('.widget-item').forEach(item => {
                    item.addEventListener('dragstart', drag);
                });
                
                // Handle keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        switch (e.key) {
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
                            case 'Delete':
                            case 'Backspace':
                                if (selectedWidget) {
                                    deleteSelectedWidget();
                                }
                                break;
                        }
                    }
                });
                
                function deleteSelectedWidget() {
                    if (!selectedWidget) return;
                    
                    const element = document.getElementById(selectedWidget.id);
                    if (element) {
                        element.remove();
                    }
                    
                    widgets = widgets.filter(w => w.id !== selectedWidget.id);
                    selectedWidget = null;
                    document.getElementById('properties-content').innerHTML = 
                        '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                    
                    updateStatus('Widget deleted');
                    syncToCode(); // Real-time sync when widget deleted
                    saveToUndoStack();
                }
                
                // Message handling from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'loadDesign':
                            loadDesignFromQML(message.content);
                            updateStatus('Design loaded: ' + message.fileName);
                            break;
                        case 'loadTemplate':
                            loadTemplateWidgets(message.widgets);
                            updateStatus('Template loaded: ' + message.templateName);
                            break;
                        case 'syncFromCode':
                            syncFromCode(message.widgets, message.qmlContent);
                            break;
                        case 'restoreState':
                            restoreState(message.content);
                            break;
                    }
                });
                
                function loadTemplateWidgets(templateWidgets) {
                    // Clear current widgets
                    document.getElementById('canvas').innerHTML = '';
                    widgets = templateWidgets || [];
                    
                    // Render template widgets
                    widgets.forEach(widget => {
                        renderWidget(widget);
                        if (widget.children) {
                            widget.children.forEach(child => {
                                renderWidget(child);
                            });
                        }
                    });
                    
                    selectedWidget = null;
                    document.getElementById('properties-content').innerHTML = 
                        '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                        
                    saveToUndoStack();
                }
                
                function loadDesignFromQML(qmlContent) {
                    // This would parse QML and recreate widgets
                    // For now, show a message
                    updateStatus('QML loading not fully implemented - use manual design');
                }
                
                function restoreState(stateJson) {
                    if (!stateJson) return;
                    
                    try {
                        const restoredWidgets = JSON.parse(stateJson);
                        
                        // Clear current widgets
                        document.getElementById('canvas').innerHTML = '';
                        widgets = restoredWidgets;
                        
                        // Render restored widgets
                        widgets.forEach(widget => {
                            renderWidget(widget);
                        });
                        
                        updateStatus('State restored');
                    } catch (error) {
                        updateStatus('Failed to restore state');
                    }
                }
                
                // Initialize
                updateStatus('Qt UI Designer ready - Drag widgets to start designing');
            </script>
        </body>
        </html>`;
    }

    public startRealtimeSync(document?: vscode.TextDocument) {
        if (!this._view) {
            return;
        }

        // Get active QML document if not provided
        if (!document) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.languageId === 'qml') {
                document = activeEditor.document;
            }
        }

        if (!document) {
            vscode.window.showWarningMessage('Please open a QML file to enable real-time sync');
            return;
        }

        // Initialize sync manager
        this._syncManager = new QMLSyncManager(this._view, document);
        this._syncManager.startSync(document, this._view);
        this._isRealtimeSyncEnabled = true;

        vscode.window.showInformationMessage(`Real-time sync enabled for ${path.basename(document.fileName)}`);
    }

    public stopRealtimeSync() {
        if (this._syncManager) {
            this._syncManager.stopSync();
            this._syncManager = undefined;
        }
        this._isRealtimeSyncEnabled = false;
        vscode.window.showInformationMessage('Real-time sync disabled');
    }

    public toggleRealtimeSync() {
        if (this._isRealtimeSyncEnabled) {
            this.stopRealtimeSync();
        } else {
            this.startRealtimeSync();
        }
    }
}
