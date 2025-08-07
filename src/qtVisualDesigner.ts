import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QMLSyncEngine } from './qmlSyncEngine';

export class QtVisualDesigner implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _syncEngine: QMLSyncEngine;
    private _designerPanel?: vscode.WebviewPanel;
    private _previewPanel?: vscode.WebviewPanel;
    private _propertyPanel?: vscode.WebviewPanel;
    private _toolboxPanel?: vscode.WebviewPanel;
    private _currentFile?: vscode.Uri;
    private _layoutMode: 'split' | 'tabbed' | 'floating' = 'split';

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        this._syncEngine = new QMLSyncEngine();
    }

    private getMainViewHtml(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt Visual Designer</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    font-weight: var(--vscode-font-weight);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    margin: 0;
                    padding: 20px;
                }
                .main-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    height: 100%;
                }
                .header {
                    text-align: center;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: var(--vscode-panel-background);
                }
                .header h1 {
                    margin: 0 0 10px 0;
                    color: var(--vscode-textLink-foreground);
                }
                .header p {
                    margin: 0;
                    color: var(--vscode-descriptionForeground);
                }
                .actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .action-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 12px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                .action-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .action-button.secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .action-button.secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                .features {
                    padding: 15px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: var(--vscode-panel-background);
                }
                .features h3 {
                    margin: 0 0 10px 0;
                    color: var(--vscode-textLink-foreground);
                }
                .features ul {
                    margin: 0;
                    padding-left: 20px;
                    color: var(--vscode-descriptionForeground);
                }
                .features li {
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <div class="header">
                    <h1>🎨 Qt Visual Designer</h1>
                    <p>Professional visual design environment for Qt/QML applications</p>
                </div>
                
                <div class="actions">
                    <button class="action-button" onclick="openDesigner()">
                        🚀 Open Designer Studio
                    </button>
                    <button class="action-button secondary" onclick="newDesign()">
                        📄 New Design
                    </button>
                </div>
                
                <div class="features">
                    <h3>✨ Features</h3>
                    <ul>
                        <li>Drag & Drop Visual Designer</li>
                        <li>Live Preview with Real-time Sync</li>
                        <li>Advanced Property Editor</li>
                        <li>Rich Widget Toolbox</li>
                        <li>QML Code Generation</li>
                        <li>Hot Reload Support</li>
                        <li>Professional UI Templates</li>
                    </ul>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function openDesigner() {
                    vscode.postMessage({
                        command: 'openDesigner'
                    });
                }
                
                function newDesign() {
                    vscode.postMessage({
                        command: 'newDesign'
                    });
                }
            </script>
        </body>
        </html>`;
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

        webviewView.webview.html = this.getMainViewHtml();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message: any) => {
            switch (message.command) {
                case 'openDesigner':
                    await this.openDesigner();
                    break;
                case 'newDesign':
                    await this.openDesigner(); // This will create a new design
                    break;
                case 'openFile':
                    if (message.filePath) {
                        await this.openDesigner(vscode.Uri.file(message.filePath));
                    }
                    break;
            }
        });
    }

    public async openDesigner(uri?: vscode.Uri) {
        // Close existing panels if they exist
        this.closeAllPanels();

        // Create the main designer layout
        await this.createDesignerLayout();

        // Load file if provided
        if (uri) {
            await this.loadFile(uri);
        } else {
            // Create a new design
            await this.createNewDesign();
        }
    }

    private async createDesignerLayout() {
        // Create main designer panel
        this._designerPanel = vscode.window.createWebviewPanel(
            'qtVisualDesigner',
            'Qt Visual Designer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Create preview panel
        this._previewPanel = vscode.window.createWebviewPanel(
            'qtPreview',
            'Qt Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Create property panel
        this._propertyPanel = vscode.window.createWebviewPanel(
            'qtProperties',
            'Properties',
            vscode.ViewColumn.Three,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Create toolbox panel
        this._toolboxPanel = vscode.window.createWebviewPanel(
            'qtToolbox',
            'Qt Toolbox',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Register panels with sync engine
        this._syncEngine.registerDesignerPanel(this._designerPanel);
        this._syncEngine.registerPreviewPanel(this._previewPanel);
        this._syncEngine.registerPropertyPanel(this._propertyPanel);
        this._syncEngine.registerToolboxPanel(this._toolboxPanel);

        // Set up panel content
        this._designerPanel.webview.html = this.getDesignerHtml();
        this._previewPanel.webview.html = this.getPreviewHtml();
        this._propertyPanel.webview.html = this.getPropertyHtml();
        this._toolboxPanel.webview.html = this.getToolboxHtml();

        // Set up message handlers
        this.setupMessageHandlers();

        // Handle panel disposal
        this.setupPanelDisposal();
    }

    private setupMessageHandlers() {
        // Designer panel messages
        this._designerPanel?.webview.onDidReceiveMessage(async (message) => {
            await this.handleDesignerMessage(message);
        });

        // Preview panel messages
        this._previewPanel?.webview.onDidReceiveMessage(async (message) => {
            await this.handlePreviewMessage(message);
        });

        // Property panel messages
        this._propertyPanel?.webview.onDidReceiveMessage(async (message) => {
            await this.handlePropertyMessage(message);
        });

        // Toolbox panel messages
        this._toolboxPanel?.webview.onDidReceiveMessage(async (message) => {
            await this.handleToolboxMessage(message);
        });
    }

    private async handleDesignerMessage(message: any) {
        switch (message.command) {
            case 'widgetSelected':
                this._syncEngine.setSelectedWidget(message.widgetId);
                break;
            case 'widgetMoved':
                await this.updateWidgetPosition(message.widgetId, message.position);
                break;
            case 'widgetResized':
                await this.updateWidgetSize(message.widgetId, message.size);
                break;
            case 'widgetDeleted':
                await this.deleteWidget(message.widgetId);
                break;
            case 'designChanged':
                this._syncEngine.saveToHistory(message.qmlContent);
                await this._syncEngine.syncFromDesigner(message.widgets, message.qmlContent);
                break;
            case 'saveDesign':
                await this.saveCurrentDesign();
                break;
            case 'exportCode':
                await this.exportToCode(message.format);
                break;
        }
    }

    private async handlePreviewMessage(message: any) {
        switch (message.command) {
            case 'refreshPreview':
                // Refresh the preview
                break;
            case 'previewError':
                vscode.window.showErrorMessage(`Preview Error: ${message.error}`);
                break;
        }
    }

    private async handlePropertyMessage(message: any) {
        switch (message.command) {
            case 'propertyChanged':
                await this._syncEngine.syncFromProperties(
                    message.widgetId,
                    message.property,
                    message.value
                );
                break;
        }
    }

    private async handleToolboxMessage(message: any) {
        switch (message.command) {
            case 'dragStart':
                // Handle widget drag start from toolbox
                break;
            case 'addWidget':
                const widget = this._syncEngine.addWidgetToDesign(
                    message.widgetType,
                    message.position || { x: 50, y: 50 }
                );
                break;
        }
    }

    private setupPanelDisposal() {
        this._designerPanel?.onDidDispose(() => {
            this._designerPanel = undefined;
        });

        this._previewPanel?.onDidDispose(() => {
            this._previewPanel = undefined;
        });

        this._propertyPanel?.onDidDispose(() => {
            this._propertyPanel = undefined;
        });

        this._toolboxPanel?.onDidDispose(() => {
            this._toolboxPanel = undefined;
        });
    }

    private async updateWidgetPosition(widgetId: string, position: { x: number, y: number }) {
        await this._syncEngine.syncFromProperties(widgetId, 'x', position.x);
        await this._syncEngine.syncFromProperties(widgetId, 'y', position.y);
    }

    private async updateWidgetSize(widgetId: string, size: { width: number, height: number }) {
        await this._syncEngine.syncFromProperties(widgetId, 'width', size.width);
        await this._syncEngine.syncFromProperties(widgetId, 'height', size.height);
    }

    private async deleteWidget(widgetId: string) {
        // Implementation for deleting a widget
        if (this._designerPanel) {
            this._designerPanel.webview.postMessage({
                command: 'deleteWidget',
                widgetId
            });
        }
    }

    private async loadFile(uri: vscode.Uri) {
        try {
            this._currentFile = uri;
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            
            // Parse QML content and send to designer
            if (this._designerPanel) {
                this._designerPanel.webview.postMessage({
                    command: 'loadDesign',
                    qmlContent: content,
                    fileName: path.basename(uri.fsPath)
                });
            }

            // Update document in sync engine
            const document = await vscode.workspace.openTextDocument(uri);
            this._syncEngine.setActiveDocument(document);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load file: ${error}`);
        }
    }

    private async createNewDesign() {
        const defaultQml = `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "New Qt Design"
    
    // Add your widgets here
}`;

        if (this._designerPanel) {
            this._designerPanel.webview.postMessage({
                command: 'loadDesign',
                qmlContent: defaultQml,
                fileName: 'untitled.qml'
            });
        }
    }

    private async saveCurrentDesign() {
        if (!this._currentFile) {
            // Show save dialog
            const uri = await vscode.window.showSaveDialog({
                filters: {
                    'QML Files': ['qml']
                },
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri
            });

            if (uri) {
                this._currentFile = uri;
            } else {
                return;
            }
        }

        // Get current QML content from designer
        if (this._designerPanel) {
            this._designerPanel.webview.postMessage({
                command: 'getCurrentQML'
            });
        }
    }

    private async exportToCode(format: 'qml' | 'cpp' | 'python') {
        // Implementation for code export
        vscode.window.showInformationMessage(`Exporting to ${format.toUpperCase()}...`);
    }

    private closeAllPanels() {
        this._designerPanel?.dispose();
        this._previewPanel?.dispose();
        this._propertyPanel?.dispose();
        this._toolboxPanel?.dispose();
    }

    private getDesignerHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qt Visual Designer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            overflow: hidden;
        }
        
        .designer-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .toolbar {
            background: #2d2d30;
            color: white;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #464647;
        }
        
        .toolbar button {
            background: #3c3c3c;
            color: white;
            border: 1px solid #555;
            padding: 4px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .toolbar button:hover {
            background: #484848;
        }
        
        .design-canvas {
            flex: 1;
            background: white;
            position: relative;
            overflow: auto;
            border: 1px solid #ddd;
            margin: 8px;
            border-radius: 4px;
        }
        
        .widget {
            position: absolute;
            border: 1px solid transparent;
            cursor: move;
            user-select: none;
        }
        
        .widget:hover {
            border-color: #007acc;
        }
        
        .widget.selected {
            border-color: #007acc;
            border-width: 2px;
        }
        
        .widget-handle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #007acc;
            border: 1px solid white;
            border-radius: 50%;
        }
        
        .handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
        .handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
        .handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
        .handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
        .handle-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
        .handle-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
        .handle-w { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
        .handle-e { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }
        
        .grid {
            background-image: 
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .status-bar {
            background: #f8f8f8;
            border-top: 1px solid #ddd;
            padding: 4px 16px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="designer-container">
        <div class="toolbar">
            <button onclick="saveDesign()">💾 Save</button>
            <button onclick="undo()">↶ Undo</button>
            <button onclick="redo()">↷ Redo</button>
            <button onclick="toggleGrid()">⊞ Grid</button>
            <button onclick="alignLeft()">⫸ Align Left</button>
            <button onclick="alignCenter()">⫼ Center</button>
            <button onclick="alignRight()">⫷ Align Right</button>
            <button onclick="exportCode()">📤 Export</button>
        </div>
        
        <div class="design-canvas grid" id="canvas">
            <!-- Widgets will be added here dynamically -->
        </div>
        
        <div class="status-bar">
            <span id="status">Ready - Drop widgets from toolbox to design</span>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let selectedWidget = null;
        let isDragging = false;
        let isResizing = false;
        let dragOffset = { x: 0, y: 0 };
        let widgets = [];
        let gridEnabled = true;
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadDesign':
                    loadDesign(message.qmlContent, message.fileName);
                    break;
                case 'addWidget':
                    addWidget(message.widget);
                    break;
                case 'updateFromCode':
                    updateFromCode(message.widgets);
                    break;
                case 'deleteWidget':
                    deleteWidget(message.widgetId);
                    break;
                case 'getCurrentQML':
                    getCurrentQML();
                    break;
            }
        });
        
        function loadDesign(qmlContent, fileName) {
            // Parse QML and create widgets
            widgets = parseQMLToWidgets(qmlContent);
            renderWidgets();
            updateStatus(\`Loaded: \${fileName}\`);
        }
        
        function addWidget(widget) {
            widgets.push(widget);
            renderWidget(widget);
            selectWidget(widget.id);
            notifyDesignChanged();
        }
        
        function renderWidgets() {
            const canvas = document.getElementById('canvas');
            canvas.innerHTML = '';
            widgets.forEach(widget => renderWidget(widget));
        }
        
        function renderWidget(widget) {
            const canvas = document.getElementById('canvas');
            const element = document.createElement('div');
            element.className = 'widget';
            element.id = widget.id;
            element.style.left = widget.position.x + 'px';
            element.style.top = widget.position.y + 'px';
            element.style.width = widget.position.width + 'px';
            element.style.height = widget.position.height + 'px';
            
            // Set widget content based on type
            element.innerHTML = getWidgetHTML(widget);
            
            // Add event listeners
            element.addEventListener('mousedown', (e) => startDrag(e, widget.id));
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                selectWidget(widget.id);
            });
            
            canvas.appendChild(element);
            
            // Add resize handles if selected
            if (selectedWidget === widget.id) {
                addResizeHandles(element);
            }
        }
        
        function getWidgetHTML(widget) {
            const style = \`width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px;\`;
            
            switch (widget.type) {
                case 'Button':
                    return \`<button style="\${style}">\${widget.properties.text || 'Button'}</button>\`;
                case 'Label':
                    return \`<div style="\${style}">\${widget.properties.text || 'Label'}</div>\`;
                case 'TextField':
                    return \`<input type="text" placeholder="\${widget.properties.placeholderText || 'Enter text...'}" style="\${style}">\`;
                case 'CheckBox':
                    return \`<label style="\${style}"><input type="checkbox" \${widget.properties.checked ? 'checked' : ''}> \${widget.properties.text || 'CheckBox'}</label>\`;
                case 'Rectangle':
                    return \`<div style="\${style} background-color: \${widget.properties.color || 'lightgray'};">Rectangle</div>\`;
                default:
                    return \`<div style="\${style}">\${widget.type}</div>\`;
            }
        }
        
        function selectWidget(widgetId) {
            // Remove selection from all widgets
            document.querySelectorAll('.widget').forEach(w => {
                w.classList.remove('selected');
                w.querySelectorAll('.widget-handle').forEach(h => h.remove());
            });
            
            if (widgetId) {
                const widget = document.getElementById(widgetId);
                if (widget) {
                    widget.classList.add('selected');
                    addResizeHandles(widget);
                    selectedWidget = widgetId;
                    
                    // Notify extension about selection
                    vscode.postMessage({
                        command: 'widgetSelected',
                        widgetId: widgetId
                    });
                }
            } else {
                selectedWidget = null;
            }
        }
        
        function addResizeHandles(element) {
            const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
            handles.forEach(handle => {
                const handleEl = document.createElement('div');
                handleEl.className = \`widget-handle handle-\${handle}\`;
                handleEl.addEventListener('mousedown', (e) => startResize(e, handle));
                element.appendChild(handleEl);
            });
        }
        
        function startDrag(e, widgetId) {
            if (e.target.classList.contains('widget-handle')) return;
            
            isDragging = true;
            selectWidget(widgetId);
            
            const widget = document.getElementById(widgetId);
            const rect = widget.getBoundingClientRect();
            const canvas = document.getElementById('canvas');
            const canvasRect = canvas.getBoundingClientRect();
            
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        }
        
        function startResize(e, handle) {
            isResizing = true;
            e.stopPropagation();
            e.preventDefault();
        }
        
        // Mouse move handler
        document.addEventListener('mousemove', (e) => {
            if (isDragging && selectedWidget) {
                const canvas = document.getElementById('canvas');
                const canvasRect = canvas.getBoundingClientRect();
                
                let x = e.clientX - canvasRect.left - dragOffset.x;
                let y = e.clientY - canvasRect.top - dragOffset.y;
                
                // Snap to grid if enabled
                if (gridEnabled) {
                    x = Math.round(x / 20) * 20;
                    y = Math.round(y / 20) * 20;
                }
                
                const widget = document.getElementById(selectedWidget);
                widget.style.left = x + 'px';
                widget.style.top = y + 'px';
                
                // Update widget data
                const widgetData = widgets.find(w => w.id === selectedWidget);
                if (widgetData) {
                    widgetData.position.x = x;
                    widgetData.position.y = y;
                }
            }
        });
        
        // Mouse up handler
        document.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                notifyDesignChanged();
            }
            isDragging = false;
            isResizing = false;
        });
        
        // Canvas click handler
        document.getElementById('canvas').addEventListener('click', (e) => {
            if (e.target.id === 'canvas') {
                selectWidget(null);
            }
        });
        
        function notifyDesignChanged() {
            const qmlContent = generateQMLFromWidgets();
            vscode.postMessage({
                command: 'designChanged',
                widgets: widgets,
                qmlContent: qmlContent
            });
        }
        
        function parseQMLToWidgets(qmlContent) {
            // Simple QML parser - in production this would be more robust
            const widgets = [];
            const componentRegex = /(\\w+)\\s*\\{([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)\\}/g;
            let match;
            let widgetId = 1;

            while ((match = componentRegex.exec(qmlContent)) !== null) {
                const componentType = match[1];
                const componentBody = match[2];

                if (['ApplicationWindow', 'Window', 'Item'].includes(componentType)) {
                    continue;
                }

                const widget = {
                    id: extractProperty(componentBody, 'id') || \`\${componentType.toLowerCase()}\${widgetId++}\`,
                    type: componentType,
                    properties: parseComponentProperties(componentBody),
                    position: {
                        x: parseInt(extractProperty(componentBody, 'x') || '0') || 0,
                        y: parseInt(extractProperty(componentBody, 'y') || '0') || 0,
                        width: parseInt(extractProperty(componentBody, 'width') || '100') || 100,
                        height: parseInt(extractProperty(componentBody, 'height') || '30') || 30
                    }
                };

                widgets.push(widget);
            }
            
            return widgets;
        }
        
        function extractProperty(content, property) {
            const regex = new RegExp(\`\${property}:\\\\s*([^\\\\n;]+)\`, 'i');
            const match = content.match(regex);
            return match ? match[1].trim().replace(/["']/g, '') : null;
        }
        
        function parseComponentProperties(content) {
            const properties = {};
            const propertyPatterns = [
                'text', 'color', 'backgroundColor', 'fontSize', 'fontWeight',
                'placeholderText', 'checked', 'enabled', 'visible', 'opacity',
                'value', 'from', 'to', 'source', 'fillMode', 'wrapMode'
            ];

            propertyPatterns.forEach(prop => {
                const value = extractProperty(content, prop);
                if (value !== null) {
                    if (prop === 'checked' || prop === 'enabled' || prop === 'visible') {
                        properties[prop] = value === 'true';
                    } else if (prop === 'fontSize' || prop === 'opacity' || prop === 'value' || prop === 'from' || prop === 'to') {
                        properties[prop] = parseFloat(value) || 0;
                    } else {
                        properties[prop] = value;
                    }
                }
            });

            return properties;
        }
        
        function generateQMLFromWidgets() {
            let qml = \`import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt Design"

\`;

            widgets.forEach(widget => {
                qml += generateWidgetQML(widget, '    ');
            });

            qml += '}\\n';
            return qml;
        }
        
        function generateWidgetQML(widget, indent) {
            const pos = widget.position;
            const props = widget.properties;
            
            let qml = \`\${indent}\${widget.type} {
\${indent}    id: \${widget.id}
\${indent}    x: \${pos.x}
\${indent}    y: \${pos.y}
\${indent}    width: \${pos.width}
\${indent}    height: \${pos.height}
\`;

            Object.keys(props).forEach(key => {
                if (props[key] !== undefined && props[key] !== null) {
                    let value = props[key];
                    if (typeof value === 'string' && !value.startsWith('"') && 
                        !['true', 'false'].includes(value.toLowerCase())) {
                        value = \`"\${value}"\`;
                    }
                    qml += \`\${indent}    \${key}: \${value}
\`;
                }
            });

            qml += \`\${indent}}

\`;
            return qml;
        }
        
        function updateStatus(message) {
            document.getElementById('status').textContent = message;
        }
        
        // Toolbar functions
        function saveDesign() {
            vscode.postMessage({
                command: 'saveDesign'
            });
        }
        
        function undo() {
            vscode.postMessage({
                command: 'undo'
            });
        }
        
        function redo() {
            vscode.postMessage({
                command: 'redo'
            });
        }
        
        function toggleGrid() {
            gridEnabled = !gridEnabled;
            const canvas = document.getElementById('canvas');
            canvas.classList.toggle('grid', gridEnabled);
        }
        
        function exportCode() {
            vscode.postMessage({
                command: 'exportCode',
                format: 'qml'
            });
        }
        
        function alignLeft() {
            // Implementation for align left
        }
        
        function alignCenter() {
            // Implementation for align center
        }
        
        function alignRight() {
            // Implementation for align right
        }
        
        // Initialize
        updateStatus('Designer ready');
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
    <title>Qt Preview</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        
        .preview-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .preview-toolbar {
            background: #2d2d30;
            color: white;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #464647;
        }
        
        .preview-toolbar button {
            background: #3c3c3c;
            color: white;
            border: 1px solid #555;
            padding: 4px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .preview-area {
            flex: 1;
            background: white;
            padding: 20px;
            overflow: auto;
        }
        
        .preview-window {
            background: #f0f0f0;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-toolbar">
            <button onclick="refreshPreview()">🔄 Refresh</button>
            <button onclick="runPreview()">▶️ Run</button>
            <button onclick="toggleFullscreen()">⛶ Fullscreen</button>
            <span style="margin-left: auto; font-size: 12px;">Live Preview</span>
        </div>
        
        <div class="preview-area">
            <div class="preview-window" id="previewWindow">
                <p style="text-align: center; color: #666;">Preview will appear here...</p>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updatePreview':
                    updatePreview(message.qmlContent, message.widgets);
                    break;
            }
        });
        
        function updatePreview(qmlContent, widgets) {
            const previewWindow = document.getElementById('previewWindow');
            
            // Render widgets in preview
            let html = '';
            widgets.forEach(widget => {
                html += renderPreviewWidget(widget);
            });
            
            if (html) {
                previewWindow.innerHTML = \`<div style="position: relative; width: 800px; height: 600px; background: white; border: 1px solid #ddd; margin: 0 auto;">\${html}</div>\`;
            } else {
                previewWindow.innerHTML = '<p style="text-align: center; color: #666;">No widgets to preview</p>';
            }
        }
        
        function renderPreviewWidget(widget) {
            const pos = widget.position;
            const props = widget.properties;
            
            let style = \`position: absolute; left: \${pos.x}px; top: \${pos.y}px; width: \${pos.width}px; height: \${pos.height}px;\`;
            
            switch (widget.type) {
                case 'Button':
                    return \`<button style="\${style} font-size: 14px;">\${props.text || 'Button'}</button>\`;
                case 'Label':
                    return \`<div style="\${style} display: flex; align-items: center; font-size: 14px;">\${props.text || 'Label'}</div>\`;
                case 'TextField':
                    return \`<input type="text" placeholder="\${props.placeholderText || 'Enter text...'}" style="\${style} padding: 4px; border: 1px solid #ccc; font-size: 14px;">\`;
                case 'CheckBox':
                    return \`<label style="\${style} display: flex; align-items: center; font-size: 14px;"><input type="checkbox" \${props.checked ? 'checked' : ''}> \${props.text || 'CheckBox'}</label>\`;
                case 'Rectangle':
                    return \`<div style="\${style} background-color: \${props.color || 'lightgray'}; border: 1px solid #999;"></div>\`;
                default:
                    return \`<div style="\${style} background: #f0f0f0; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">\${widget.type}</div>\`;
            }
        }
        
        function refreshPreview() {
            vscode.postMessage({ command: 'refreshPreview' });
        }
        
        function runPreview() {
            vscode.postMessage({ command: 'runPreview' });
        }
        
        function toggleFullscreen() {
            vscode.postMessage({ command: 'toggleFullscreen' });
        }
    </script>
</body>
</html>`;
    }

    private getPropertyHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Properties</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            font-size: 13px;
        }
        
        .properties-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .properties-header {
            background: #2d2d30;
            color: white;
            padding: 8px 16px;
            border-bottom: 1px solid #464647;
            font-weight: bold;
        }
        
        .properties-content {
            flex: 1;
            overflow: auto;
            background: white;
        }
        
        .property-group {
            border-bottom: 1px solid #eee;
        }
        
        .property-group-header {
            background: #f8f8f8;
            padding: 8px 12px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        
        .property-group-content {
            padding: 8px 0;
        }
        
        .property-row {
            display: flex;
            align-items: center;
            padding: 4px 12px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .property-row:hover {
            background: #f8f8f8;
        }
        
        .property-label {
            flex: 1;
            font-weight: 500;
            color: #333;
        }
        
        .property-value {
            flex: 1.5;
        }
        
        .property-input {
            width: 100%;
            padding: 2px 6px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .property-select {
            width: 100%;
            padding: 2px 6px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .property-checkbox {
            transform: scale(0.9);
        }
        
        .no-selection {
            padding: 20px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="properties-container">
        <div class="properties-header">
            Properties
        </div>
        
        <div class="properties-content" id="propertiesContent">
            <div class="no-selection">
                No widget selected
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let selectedWidget = null;
        let widgets = [];
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'widgetSelected':
                    selectedWidget = message.widgetId;
                    displayProperties();
                    break;
                case 'updateFromCode':
                case 'updateFromDesigner':
                    widgets = message.widgets;
                    displayProperties();
                    break;
            }
        });
        
        function displayProperties() {
            const content = document.getElementById('propertiesContent');
            
            if (!selectedWidget) {
                content.innerHTML = '<div class="no-selection">No widget selected</div>';
                return;
            }
            
            const widget = widgets.find(w => w.id === selectedWidget);
            if (!widget) {
                content.innerHTML = '<div class="no-selection">Widget not found</div>';
                return;
            }
            
            let html = \`
                <div class="property-group">
                    <div class="property-group-header">General</div>
                    <div class="property-group-content">
                        <div class="property-row">
                            <div class="property-label">ID</div>
                            <div class="property-value">
                                <input type="text" class="property-input" value="\${widget.id}" onchange="updateProperty('id', this.value)" readonly>
                            </div>
                        </div>
                        <div class="property-row">
                            <div class="property-label">Type</div>
                            <div class="property-value">
                                <input type="text" class="property-input" value="\${widget.type}" readonly>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="property-group">
                    <div class="property-group-header">Position & Size</div>
                    <div class="property-group-content">
                        <div class="property-row">
                            <div class="property-label">X</div>
                            <div class="property-value">
                                <input type="number" class="property-input" value="\${widget.position.x}" onchange="updateProperty('x', parseInt(this.value))">
                            </div>
                        </div>
                        <div class="property-row">
                            <div class="property-label">Y</div>
                            <div class="property-value">
                                <input type="number" class="property-input" value="\${widget.position.y}" onchange="updateProperty('y', parseInt(this.value))">
                            </div>
                        </div>
                        <div class="property-row">
                            <div class="property-label">Width</div>
                            <div class="property-value">
                                <input type="number" class="property-input" value="\${widget.position.width}" onchange="updateProperty('width', parseInt(this.value))">
                            </div>
                        </div>
                        <div class="property-row">
                            <div class="property-label">Height</div>
                            <div class="property-value">
                                <input type="number" class="property-input" value="\${widget.position.height}" onchange="updateProperty('height', parseInt(this.value))">
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            // Add widget-specific properties
            html += generateWidgetProperties(widget);
            
            content.innerHTML = html;
        }
        
        function generateWidgetProperties(widget) {
            let html = '<div class="property-group"><div class="property-group-header">Widget Properties</div><div class="property-group-content">';
            
            const props = widget.properties;
            
            // Common properties for all widgets
            if (props.hasOwnProperty('text') || widget.type === 'Button' || widget.type === 'Label') {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Text</div>
                        <div class="property-value">
                            <input type="text" class="property-input" value="\${props.text || ''}" onchange="updateProperty('text', this.value)">
                        </div>
                    </div>
                \`;
            }
            
            if (props.hasOwnProperty('color') || widget.type === 'Rectangle' || widget.type === 'Text') {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Color</div>
                        <div class="property-value">
                            <input type="color" class="property-input" value="\${props.color || '#000000'}" onchange="updateProperty('color', this.value)">
                        </div>
                    </div>
                \`;
            }
            
            if (props.hasOwnProperty('checked') || widget.type === 'CheckBox' || widget.type === 'RadioButton') {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Checked</div>
                        <div class="property-value">
                            <input type="checkbox" class="property-checkbox" \${props.checked ? 'checked' : ''} onchange="updateProperty('checked', this.checked)">
                        </div>
                    </div>
                \`;
            }
            
            if (props.hasOwnProperty('placeholderText') || widget.type === 'TextField' || widget.type === 'TextArea') {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Placeholder</div>
                        <div class="property-value">
                            <input type="text" class="property-input" value="\${props.placeholderText || ''}" onchange="updateProperty('placeholderText', this.value)">
                        </div>
                    </div>
                \`;
            }
            
            if (props.hasOwnProperty('enabled')) {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Enabled</div>
                        <div class="property-value">
                            <input type="checkbox" class="property-checkbox" \${props.enabled !== false ? 'checked' : ''} onchange="updateProperty('enabled', this.checked)">
                        </div>
                    </div>
                \`;
            }
            
            if (props.hasOwnProperty('visible')) {
                html += \`
                    <div class="property-row">
                        <div class="property-label">Visible</div>
                        <div class="property-value">
                            <input type="checkbox" class="property-checkbox" \${props.visible !== false ? 'checked' : ''} onchange="updateProperty('visible', this.checked)">
                        </div>
                    </div>
                \`;
            }
            
            html += '</div></div>';
            return html;
        }
        
        function updateProperty(property, value) {
            if (!selectedWidget) return;
            
            vscode.postMessage({
                command: 'propertyChanged',
                widgetId: selectedWidget,
                property: property,
                value: value
            });
        }
    </script>
</body>
</html>`;
    }

    private getToolboxHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qt Toolbox</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            font-size: 13px;
        }
        
        .toolbox-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .toolbox-header {
            background: #2d2d30;
            color: white;
            padding: 8px 16px;
            border-bottom: 1px solid #464647;
            font-weight: bold;
        }
        
        .toolbox-content {
            flex: 1;
            overflow: auto;
            background: white;
        }
        
        .widget-category {
            border-bottom: 1px solid #eee;
        }
        
        .category-header {
            background: #f8f8f8;
            padding: 8px 12px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .category-header:hover {
            background: #f0f0f0;
        }
        
        .category-content {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
            padding: 8px;
        }
        
        .widget-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            background: white;
            transition: all 0.2s;
        }
        
        .widget-item:hover {
            background: #f0f8ff;
            border-color: #007acc;
            transform: translateY(-1px);
        }
        
        .widget-icon {
            font-size: 20px;
            margin-bottom: 2px;
        }
        
        .widget-name {
            font-size: 11px;
            font-weight: 500;
            text-align: center;
        }
        
        .category-collapsed .category-content {
            display: none;
        }
        
        .collapse-icon {
            transition: transform 0.2s;
        }
        
        .category-collapsed .collapse-icon {
            transform: rotate(-90deg);
        }
    </style>
</head>
<body>
    <div class="toolbox-container">
        <div class="toolbox-header">
            Qt Widget Toolbox
        </div>
        
        <div class="toolbox-content">
            <div class="widget-category">
                <div class="category-header" onclick="toggleCategory(this)">
                    <span class="collapse-icon">▼</span>
                    Input Widgets
                </div>
                <div class="category-content">
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Button')">
                        <div class="widget-icon">🔘</div>
                        <div class="widget-name">Button</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'TextField')">
                        <div class="widget-icon">📝</div>
                        <div class="widget-name">TextField</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'TextArea')">
                        <div class="widget-icon">📄</div>
                        <div class="widget-name">TextArea</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'CheckBox')">
                        <div class="widget-icon">☑️</div>
                        <div class="widget-name">CheckBox</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'RadioButton')">
                        <div class="widget-icon">🔘</div>
                        <div class="widget-name">RadioButton</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'ComboBox')">
                        <div class="widget-icon">📋</div>
                        <div class="widget-name">ComboBox</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Slider')">
                        <div class="widget-icon">🎚️</div>
                        <div class="widget-name">Slider</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'SpinBox')">
                        <div class="widget-icon">🔢</div>
                        <div class="widget-name">SpinBox</div>
                    </div>
                </div>
            </div>
            
            <div class="widget-category">
                <div class="category-header" onclick="toggleCategory(this)">
                    <span class="collapse-icon">▼</span>
                    Display Widgets
                </div>
                <div class="category-content">
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Label')">
                        <div class="widget-icon">🏷️</div>
                        <div class="widget-name">Label</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Text')">
                        <div class="widget-icon">📝</div>
                        <div class="widget-name">Text</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Image')">
                        <div class="widget-icon">🖼️</div>
                        <div class="widget-name">Image</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'ProgressBar')">
                        <div class="widget-icon">📊</div>
                        <div class="widget-name">ProgressBar</div>
                    </div>
                </div>
            </div>
            
            <div class="widget-category">
                <div class="category-header" onclick="toggleCategory(this)">
                    <span class="collapse-icon">▼</span>
                    Container Widgets
                </div>
                <div class="category-content">
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Rectangle')">
                        <div class="widget-icon">⬜</div>
                        <div class="widget-name">Rectangle</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Item')">
                        <div class="widget-icon">📦</div>
                        <div class="widget-name">Item</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'Frame')">
                        <div class="widget-icon">🖼️</div>
                        <div class="widget-name">Frame</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'GroupBox')">
                        <div class="widget-icon">📋</div>
                        <div class="widget-name">GroupBox</div>
                    </div>
                </div>
            </div>
            
            <div class="widget-category">
                <div class="category-header" onclick="toggleCategory(this)">
                    <span class="collapse-icon">▼</span>
                    Layout Widgets
                </div>
                <div class="category-content">
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'RowLayout')">
                        <div class="widget-icon">↔️</div>
                        <div class="widget-name">RowLayout</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'ColumnLayout')">
                        <div class="widget-icon">↕️</div>
                        <div class="widget-name">ColumnLayout</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'GridLayout')">
                        <div class="widget-icon">⊞</div>
                        <div class="widget-name">GridLayout</div>
                    </div>
                    <div class="widget-item" draggable="true" ondragstart="startWidgetDrag(event, 'StackLayout')">
                        <div class="widget-icon">📚</div>
                        <div class="widget-name">StackLayout</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function toggleCategory(header) {
            const category = header.parentElement;
            category.classList.toggle('category-collapsed');
        }
        
        function startWidgetDrag(event, widgetType) {
            event.dataTransfer.setData('text/plain', widgetType);
            
            vscode.postMessage({
                command: 'dragStart',
                widgetType: widgetType
            });
        }
        
        // Double-click to add widget to center of canvas
        document.querySelectorAll('.widget-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                const widgetType = item.getAttribute('draggable') ? 
                    item.querySelector('.widget-name').textContent : null;
                
                if (widgetType) {
                    vscode.postMessage({
                        command: 'addWidget',
                        widgetType: widgetType,
                        position: { x: 100, y: 100 }
                    });
                }
            });
        });
    </script>
</body>
</html>`;
    }

    public dispose() {
        this.closeAllPanels();
        this._syncEngine.dispose();
    }
}
