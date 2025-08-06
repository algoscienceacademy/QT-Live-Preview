import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QMLCodeGenerator, WidgetData } from './qmlCodeGenerator';
import { QtComponentLibrary } from './qtComponentLibrary';
import { QtUITemplates } from './qtUITemplates';
import { QMLSyncManager } from './qmlSyncManager';

export class CombinedDesignerPreview implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _currentFile?: vscode.Uri;
    private _undoStack: string[] = [];
    private _redoStack: string[] = [];
    private _maxUndoLevels = 50;
    private _syncManager?: QMLSyncManager;
    private _isRealtimeSyncEnabled = true;
    private _externalEditorPanel?: vscode.WebviewPanel;

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

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveDesign':
                    await this.saveDesign(message.qmlContent);
                    break;
                case 'updateCode':
                    if (this._isRealtimeSyncEnabled && this._syncManager) {
                        this._syncManager.updateCodeFromDesigner(message.qmlContent);
                    }
                    // Also update external editor if open
                    if (this._externalEditorPanel) {
                        this._externalEditorPanel.webview.postMessage({
                            command: 'updateCode',
                            qmlContent: message.qmlContent
                        });
                    }
                    break;
                case 'openExternalEditor':
                    await this.openExternalEditor(message.qmlContent);
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

    private async openExternalEditor(qmlContent?: string) {
        if (this._externalEditorPanel) {
            // Bring existing panel to front
            this._externalEditorPanel.reveal();
            return;
        }

        // Create external editor panel
        this._externalEditorPanel = vscode.window.createWebviewPanel(
            'qtCodeEditor',
            'Qt Code Editor',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Handle panel disposal
        this._externalEditorPanel.onDidDispose(() => {
            this._externalEditorPanel = undefined;
        });

        // Set up code editor HTML
        this._externalEditorPanel.webview.html = this.getCodeEditorHtml(qmlContent || '');

        // Handle messages from external editor
        this._externalEditorPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'codeChanged':
                    // Update main designer when code changes in external editor
                    if (this._view) {
                        this._view.webview.postMessage({
                            command: 'syncFromCode',
                            qmlContent: message.qmlContent
                        });
                    }
                    // Update VS Code document
                    if (this._syncManager) {
                        this._syncManager.updateCodeFromDesigner(message.qmlContent);
                    }
                    break;
                case 'saveCode':
                    await this.saveDesign(message.qmlContent);
                    break;
            }
        });
    }

    private getCodeEditorHtml(initialContent: string): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt Code Editor</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .editor-toolbar {
                    background-color: var(--vscode-panel-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 8px 16px;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .editor-btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .editor-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .editor-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .code-editor {
                    flex: 1;
                    margin: 16px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    background-color: var(--vscode-editor-background);
                }
                
                .code-textarea {
                    width: 100%;
                    height: 100%;
                    border: none;
                    padding: 16px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    resize: none;
                    outline: none;
                }
                
                .status-bar {
                    background-color: var(--vscode-statusBar-background);
                    color: var(--vscode-statusBar-foreground);
                    padding: 4px 16px;
                    font-size: 12px;
                    border-top: 1px solid var(--vscode-statusBar-border);
                }
            </style>
        </head>
        <body>
            <div class="editor-toolbar">
                <button class="editor-btn" onclick="saveCode()">💾 Save</button>
                <button class="editor-btn" onclick="formatCode()">🎨 Format</button>
                <button class="editor-btn" onclick="validateCode()">✓ Validate</button>
                <span style="margin-left: auto; font-size: 12px; color: var(--vscode-descriptionForeground);">
                    Qt Code Editor - Real-time sync enabled
                </span>
            </div>
            
            <div class="editor-container">
                <div class="code-editor">
                    <textarea class="code-textarea" id="codeEditor" placeholder="// QML code will appear here...">${initialContent}</textarea>
                </div>
            </div>
            
            <div class="status-bar">
                <span id="statusText">Ready - Changes sync automatically</span>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const codeEditor = document.getElementById('codeEditor');
                let lastContent = codeEditor.value;

                // Auto-save and sync on changes
                codeEditor.addEventListener('input', () => {
                    const currentContent = codeEditor.value;
                    if (currentContent !== lastContent) {
                        lastContent = currentContent;
                        
                        // Debounce the sync
                        clearTimeout(window.syncTimeout);
                        window.syncTimeout = setTimeout(() => {
                            vscode.postMessage({
                                command: 'codeChanged',
                                qmlContent: currentContent
                            });
                            updateStatus('Synced to designer');
                        }, 300);
                    }
                });

                // Listen for updates from designer
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateCode':
                            if (codeEditor.value !== message.qmlContent) {
                                codeEditor.value = message.qmlContent;
                                lastContent = message.qmlContent;
                                updateStatus('Updated from designer');
                            }
                            break;
                    }
                });

                function saveCode() {
                    vscode.postMessage({
                        command: 'saveCode',
                        qmlContent: codeEditor.value
                    });
                    updateStatus('Code saved');
                }

                function formatCode() {
                    // Simple QML formatting
                    let code = codeEditor.value;
                    // Add basic indentation
                    const lines = code.split('\\n');
                    let indentLevel = 0;
                    const formattedLines = lines.map(line => {
                        const trimmed = line.trim();
                        if (trimmed.endsWith('{')) {
                            const formatted = '    '.repeat(indentLevel) + trimmed;
                            indentLevel++;
                            return formatted;
                        } else if (trimmed.startsWith('}')) {
                            indentLevel = Math.max(0, indentLevel - 1);
                            return '    '.repeat(indentLevel) + trimmed;
                        } else if (trimmed) {
                            return '    '.repeat(indentLevel) + trimmed;
                        }
                        return '';
                    });
                    
                    codeEditor.value = formattedLines.join('\\n');
                    updateStatus('Code formatted');
                }

                function validateCode() {
                    const code = codeEditor.value;
                    // Basic QML validation
                    const openBraces = (code.match(/{/g) || []).length;
                    const closeBraces = (code.match(/}/g) || []).length;
                    
                    if (openBraces === closeBraces) {
                        updateStatus('✓ Code validation passed');
                    } else {
                        updateStatus('⚠ Mismatched braces detected');
                    }
                }

                function updateStatus(message) {
                    document.getElementById('statusText').textContent = message;
                    setTimeout(() => {
                        document.getElementById('statusText').textContent = 'Ready - Changes sync automatically';
                    }, 3000);
                }
            </script>
        </body>
        </html>`;
    }

    public async openDesigner(uri?: vscode.Uri) {
        if (!this._view) {
            await vscode.commands.executeCommand('qtCombinedDesigner.designer.focus');
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

    private async saveDesign(qmlContent: string) {
        if (!this._currentFile) {
            // Create new file
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('untitled.qml'),
                filters: { 'QML Files': ['qml'] }
            });
            
            if (uri) {
                this._currentFile = uri;
            } else {
                return;
            }
        }

        try {
            fs.writeFileSync(this._currentFile.fsPath, qmlContent);
            vscode.window.showInformationMessage(`Design saved to ${path.basename(this._currentFile.fsPath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save design: ${error}`);
        }
    }

    private async exportToUiFile(qmlContent: string) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('design.ui'),
            filters: { 'UI Files': ['ui'] }
        });

        if (uri) {
            try {
                // Convert QML to UI format (simplified conversion)
                const uiContent = this.convertQmlToUi(qmlContent);
                fs.writeFileSync(uri.fsPath, uiContent);
                vscode.window.showInformationMessage(`Design exported to ${path.basename(uri.fsPath)}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export UI file: ${error}`);
            }
        }
    }

    private convertQmlToUi(qmlContent: string): string {
        // Simplified QML to UI conversion
        return `<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>Form</class>
 <widget class="QWidget" name="Form">
  <property name="geometry">
   <rect>
    <x>0</x>
    <y>0</y>
    <width>800</width>
    <height>600</height>
   </rect>
  </property>
  <property name="windowTitle">
   <string>Qt Designer Form</string>
  </property>
  <!-- Converted from QML -->
  <!-- ${qmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->
 </widget>
 <resources/>
 <connections/>
</ui>`;
    }

    private async previewGeneratedCode(qmlContent: string) {
        const document = await vscode.workspace.openTextDocument({
            content: qmlContent,
            language: 'qml'
        });
        
        await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
    }

    private async loadTemplate(templateName: string) {
        const templates = new QtUITemplates();
        let templateData: WidgetData[] = [];
        
        // Get template data based on name using static methods
        switch (templateName) {
            case 'Form Layout':
                templateData = QtUITemplates.createFormLayout();
                break;
            case 'Navigation Drawer':
                templateData = QtUITemplates.createNavigationDrawer();
                break;
            case 'Tab View':
                templateData = QtUITemplates.createTabView();
                break;
            case 'Dashboard':
                templateData = QtUITemplates.createDashboard();
                break;
            case 'Master-Detail':
                templateData = QtUITemplates.createMasterDetail();
                break;
            case 'Login Form':
                templateData = QtUITemplates.createLoginForm();
                break;
            case 'Media Player':
                templateData = QtUITemplates.createMediaPlayer();
                break;
            default:
                templateData = [];
        }
        
        if (templateData && this._view) {
            this._view.webview.postMessage({
                command: 'loadTemplate',
                widgets: templateData,
                templateName: templateName
            });
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
            this.restoreState(previous);
        }
    }

    private redo() {
        if (this._redoStack.length > 0) {
            const next = this._redoStack.pop()!;
            this._undoStack.push(next);
            this.restoreState(next);
        }
    }

    private restoreState(content: string) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'restoreState',
                content: content
            });
        }
    }

    public startRealtimeSync(document?: vscode.TextDocument) {
        if (!this._view) {
            return;
        }

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

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt UI Designer + Live Preview</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    overflow: hidden;
                    height: 100vh;
                }
                
                .main-container {
                    display: flex;
                    height: 100vh;
                    flex-direction: row;
                }
                
                .designer-panel {
                    width: 280px;
                    background-color: var(--vscode-sideBar-background);
                    border-right: 1px solid var(--vscode-panel-border);
                    display: flex;
                    flex-direction: column;
                }
                
                .preview-area {
                    flex: 1;
                    background-color: var(--vscode-editor-background);
                    display: flex;
                    flex-direction: column;
                }
                
                .toolbar {
                    background-color: var(--vscode-panel-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding: 8px;
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                
                .toolbar-btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    white-space: nowrap;
                }
                
                .toolbar-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .widgets-panel {
                    padding: 12px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                .widget-category {
                    margin-bottom: 16px;
                }
                
                .category-title {
                    font-weight: bold;
                    font-size: 12px;
                    color: var(--vscode-charts-green);
                    margin-bottom: 8px;
                    padding: 4px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .widget-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                }
                
                .widget-item {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    border: 1px solid var(--vscode-list-activeSelectionForeground);
                    border-radius: 4px;
                    padding: 6px;
                    cursor: grab;
                    text-align: center;
                    font-size: 10px;
                    transition: all 0.2s;
                    color: var(--vscode-list-activeSelectionForeground);
                }
                
                .widget-item:hover {
                    background-color: var(--vscode-list-hoverBackground);
                    transform: scale(1.02);
                }
                
                .widget-item:active {
                    cursor: grabbing;
                }
                
                .widget-icon {
                    display: block;
                    font-size: 16px;
                    margin-bottom: 2px;
                }
                
                .properties-panel {
                    border-top: 1px solid var(--vscode-panel-border);
                    padding: 12px;
                    background-color: var(--vscode-sideBar-background);
                    max-height: 300px;
                    overflow-y: auto;
                }
                
                .preview-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    margin: 16px;
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: white;
                    position: relative;
                }
                
                .preview-header {
                    background-color: var(--vscode-panel-background);
                    color: var(--vscode-panel-foreground);
                    padding: 8px 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    font-size: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--vscode-charts-green);
                }
                
                .live-dot {
                    width: 8px;
                    height: 8px;
                    background-color: var(--vscode-charts-green);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .canvas {
                    flex: 1;
                    position: relative;
                    background-color: #f5f5f5;
                    overflow: auto;
                    min-height: 400px;
                }
                
                .widget-element {
                    position: absolute;
                    border: 1px dashed transparent;
                    cursor: move;
                    user-select: none;
                }
                
                .widget-element:hover {
                    border-color: var(--vscode-charts-blue);
                }
                
                .widget-element.selected {
                    border-color: var(--vscode-charts-red);
                    border-style: solid;
                }
                
                .resize-handle {
                    position: absolute;
                    bottom: -3px;
                    right: -3px;
                    width: 8px;
                    height: 8px;
                    background-color: var(--vscode-charts-red);
                    cursor: nw-resize;
                    border: 1px solid white;
                }
                
                .status-bar {
                    background-color: var(--vscode-statusBar-background);
                    color: var(--vscode-statusBar-foreground);
                    padding: 4px 16px;
                    font-size: 11px;
                    border-top: 1px solid var(--vscode-statusBar-border);
                }
                
                .property-group {
                    margin-bottom: 8px;
                }
                
                .property-label {
                    display: block;
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 2px;
                }
                
                .property-input {
                    width: 100%;
                    padding: 4px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 2px;
                    font-size: 11px;
                }
                
                .external-editor-btn {
                    background-color: var(--vscode-charts-blue);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    margin: 8px;
                }
                
                .external-editor-btn:hover {
                    background-color: var(--vscode-charts-purple);
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <!-- Left Panel: UI Designer -->
                <div class="designer-panel">
                    <div class="toolbar">
                        <button class="toolbar-btn" onclick="saveDesign()">💾 Save</button>
                        <button class="toolbar-btn" onclick="undo()">↶ Undo</button>
                        <button class="toolbar-btn" onclick="redo()">↷ Redo</button>
                        <button class="toolbar-btn" onclick="clearCanvas()">🗑️ Clear</button>
                        <button class="toolbar-btn" id="syncBtn" onclick="toggleRealtimeSync()" title="Toggle Real-time Sync">🔄 Sync</button>
                    </div>
                    
                    <div class="widgets-panel">
                        <div class="widget-category">
                            <div class="category-title">📦 Basic Widgets</div>
                            <div class="widget-grid">
                                <div class="widget-item" draggable="true" data-widget="Button">
                                    <span class="widget-icon">🔘</span> Button
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Label">
                                    <span class="widget-icon">📝</span> Label
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TextField">
                                    <span class="widget-icon">📄</span> TextField
                                </div>
                                <div class="widget-item" draggable="true" data-widget="TextArea">
                                    <span class="widget-icon">📋</span> TextArea
                                </div>
                            </div>
                        </div>
                        
                        <div class="widget-category">
                            <div class="category-title">🎛️ Input Controls</div>
                            <div class="widget-grid">
                                <div class="widget-item" draggable="true" data-widget="CheckBox">
                                    <span class="widget-icon">☑️</span> CheckBox
                                </div>
                                <div class="widget-item" draggable="true" data-widget="RadioButton">
                                    <span class="widget-icon">🔘</span> Radio
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Slider">
                                    <span class="widget-icon">🎚️</span> Slider
                                </div>
                                <div class="widget-item" draggable="true" data-widget="ProgressBar">
                                    <span class="widget-icon">📊</span> Progress
                                </div>
                            </div>
                        </div>
                        
                        <div class="widget-category">
                            <div class="category-title">📐 Layouts</div>
                            <div class="widget-grid">
                                <div class="widget-item" draggable="true" data-widget="Rectangle">
                                    <span class="widget-icon">⬜</span> Rectangle
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Row">
                                    <span class="widget-icon">↔️</span> Row
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Column">
                                    <span class="widget-icon">↕️</span> Column
                                </div>
                                <div class="widget-item" draggable="true" data-widget="Grid">
                                    <span class="widget-icon">⊞</span> Grid
                                </div>
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
                
                <!-- Right Panel: Live Preview -->
                <div class="preview-area">
                    <button class="external-editor-btn" onclick="openExternalEditor()">
                        🚀 Open Code Editor (Pop-up)
                    </button>
                    
                    <div class="preview-container">
                        <div class="preview-header">
                            <span>📱 Live Preview</span>
                            <div class="live-indicator">
                                <div class="live-dot"></div>
                                <span>LIVE</span>
                            </div>
                        </div>
                        
                        <div class="canvas" id="canvas" ondrop="drop(event)" ondragover="allowDrop(event)">
                            <!-- Widgets will be placed here and shown live -->
                        </div>
                    </div>
                    
                    <div class="status-bar">
                        <span id="statusText">Ready - Designer + Live Preview combined</span>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let selectedWidget = null;
                let widgets = [];
                let widgetCounter = 0;
                let dragOffsetX = 0;
                let dragOffsetY = 0;
                let isResizing = false;
                let isRealtimeSyncEnabled = true;
                let syncInProgress = false;

                // Drag and drop functionality
                function allowDrop(ev) {
                    ev.preventDefault();
                }

                function drop(ev) {
                    ev.preventDefault();
                    const widgetType = ev.dataTransfer.getData("text");
                    const canvas = document.getElementById('canvas');
                    const rect = canvas.getBoundingClientRect();
                    const x = ev.clientX - rect.left - dragOffsetX;
                    const y = ev.clientY - rect.top - dragOffsetY;
                    
                    addWidget(widgetType, x, y);
                }

                function addWidget(type, x, y) {
                    const widget = {
                        id: type.toLowerCase() + '_' + (++widgetCounter),
                        type: type,
                        x: Math.max(0, x),
                        y: Math.max(0, y),
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
                    element.id = widget.id;
                    element.className = 'widget-element';
                    element.style.left = widget.x + 'px';
                    element.style.top = widget.y + 'px';
                    element.style.width = widget.width + 'px';
                    element.style.height = widget.height + 'px';
                    
                    // Set widget content based on type
                    switch (widget.type) {
                        case 'Button':
                            element.style.backgroundColor = '#0078d4';
                            element.style.color = 'white';
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.justifyContent = 'center';
                            element.style.borderRadius = '4px';
                            element.textContent = widget.properties.text || 'Button';
                            break;
                        case 'Label':
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.paddingLeft = '8px';
                            element.style.backgroundColor = 'transparent';
                            element.style.color = '#333';
                            element.textContent = widget.properties.text || 'Label';
                            break;
                        case 'TextField':
                            element.style.backgroundColor = 'white';
                            element.style.border = '1px solid #ccc';
                            element.style.borderRadius = '2px';
                            element.style.paddingLeft = '8px';
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.textContent = widget.properties.placeholderText || 'TextField';
                            element.style.color = '#999';
                            break;
                        case 'CheckBox':
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.paddingLeft = '8px';
                            element.innerHTML = '☑️ ' + (widget.properties.text || 'CheckBox');
                            break;
                        case 'Rectangle':
                            element.style.backgroundColor = widget.properties.color || '#e0e0e0';
                            element.style.border = '1px solid #ccc';
                            element.style.borderRadius = '4px';
                            break;
                        default:
                            element.style.backgroundColor = '#f0f0f0';
                            element.style.border = '1px solid #ccc';
                            element.style.display = 'flex';
                            element.style.alignItems = 'center';
                            element.style.justifyContent = 'center';
                            element.textContent = widget.type;
                    }
                    
                    // Add resize handle
                    const resizeHandle = document.createElement('div');
                    resizeHandle.className = 'resize-handle';
                    element.appendChild(resizeHandle);
                    
                    // Add event listeners
                    element.addEventListener('mousedown', (e) => {
                        if (e.target === resizeHandle) {
                            startResizing(e);
                        } else {
                            startDragging(e);
                        }
                    });
                    
                    element.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectWidget(widget.id);
                    });
                    
                    canvas.appendChild(element);
                }

                function startDragging(e) {
                    if (isResizing) return;
                    
                    const element = e.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startY = e.clientY - rect.top;
                    
                    function handleMouseMove(e) {
                        const canvas = document.getElementById('canvas');
                        const canvasRect = canvas.getBoundingClientRect();
                        const newX = e.clientX - canvasRect.left - startX;
                        const newY = e.clientY - canvasRect.top - startY;
                        
                        element.style.left = Math.max(0, newX) + 'px';
                        element.style.top = Math.max(0, newY) + 'px';
                        
                        // Update widget data
                        const widget = widgets.find(w => w.id === element.id);
                        if (widget) {
                            widget.x = Math.max(0, newX);
                            widget.y = Math.max(0, newY);
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
                    
                    const element = e.target.parentElement;
                    const widget = widgets.find(w => w.id === element.id);
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = widget.width;
                    const startHeight = widget.height;
                    
                    function handleMouseMove(e) {
                        const newWidth = Math.max(20, startWidth + (e.clientX - startX));
                        const newHeight = Math.max(20, startHeight + (e.clientY - startY));
                        
                        element.style.width = newWidth + 'px';
                        element.style.height = newHeight + 'px';
                        
                        if (widget) {
                            widget.width = newWidth;
                            widget.height = newHeight;
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
                    document.querySelectorAll('.widget-element').forEach(el => {
                        el.classList.remove('selected');
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
                    if (!widget) {
                        container.innerHTML = '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                        return;
                    }
                    
                    container.innerHTML = '';
                    
                    // Basic properties
                    addPropertyInput(container, 'ID', widget.id, false);
                    addPropertyInput(container, 'X', widget.x, true);
                    addPropertyInput(container, 'Y', widget.y, true);
                    addPropertyInput(container, 'Width', widget.width, true);
                    addPropertyInput(container, 'Height', widget.height, true);
                    
                    // Widget-specific properties
                    Object.keys(widget.properties).forEach(property => {
                        addPropertyInput(container, property, widget.properties[property], true);
                    });
                }

                function addPropertyInput(container, property, value, editable) {
                    const group = document.createElement('div');
                    group.className = 'property-group';
                    
                    const label = document.createElement('label');
                    label.className = 'property-label';
                    label.textContent = property;
                    
                    const input = document.createElement('input');
                    input.className = 'property-input';
                    input.type = typeof value === 'boolean' ? 'checkbox' : 'text';
                    input.disabled = !editable;
                    
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                    
                    input.addEventListener('change', () => {
                        updateWidgetProperty(property, input.type === 'checkbox' ? input.checked : input.value);
                    });
                    
                    group.appendChild(label);
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

                function openExternalEditor() {
                    const qmlContent = generateQML();
                    vscode.postMessage({
                        command: 'openExternalEditor',
                        qmlContent: qmlContent
                    });
                    updateStatus('Opening external code editor...');
                }

                function generateQML() {
                    if (widgets.length === 0) {
                        return \`import QtQuick 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    id: window
    width: 800
    height: 600
    visible: true
    title: qsTr("Qt Application")
    
    // Add your widgets here
}\`;
                    }
                    
                    let qml = \`import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: window
    width: 800
    height: 600
    visible: true
    title: qsTr("Qt Application")

\`;
                    
                    widgets.forEach(widget => {
                        qml += generateWidgetQML(widget, 1);
                    });
                    
                    qml += '}\\n';
                    return qml;
                }

                function generateWidgetQML(widget, indentLevel) {
                    const indent = '    '.repeat(indentLevel);
                    let qml = \`\${indent}\${widget.type} {
\${indent}    id: \${widget.id}
\${indent}    x: \${widget.x}
\${indent}    y: \${widget.y}
\${indent}    width: \${widget.width}
\${indent}    height: \${widget.height}
\`;
                    
                    // Add properties
                    Object.keys(widget.properties).forEach(property => {
                        const value = widget.properties[property];
                        if (typeof value === 'string') {
                            qml += \`\${indent}    \${property}: qsTr("\${value}")\\n\`;
                        } else {
                            qml += \`\${indent}    \${property}: \${value}\\n\`;
                        }
                    });
                    
                    qml += \`\${indent}}\\n\\n\`;
                    return qml;
                }

                function getDefaultWidth(type) {
                    const widths = {
                        Button: 120, Label: 100, TextField: 200, TextArea: 250,
                        Rectangle: 150, CheckBox: 120, RadioButton: 120,
                        Slider: 200, ProgressBar: 200, Row: 200, Column: 150, Grid: 200
                    };
                    return widths[type] || 100;
                }

                function getDefaultHeight(type) {
                    const heights = {
                        Button: 35, Label: 30, TextField: 35, TextArea: 100,
                        Rectangle: 100, CheckBox: 30, RadioButton: 30,
                        Slider: 30, ProgressBar: 20, Row: 100, Column: 200, Grid: 200
                    };
                    return heights[type] || 30;
                }

                function getDefaultProperties(type) {
                    const properties = {
                        Button: { text: 'Button' },
                        Label: { text: 'Label' },
                        TextField: { placeholderText: 'Enter text' },
                        TextArea: { placeholderText: 'Enter text' },
                        CheckBox: { text: 'CheckBox', checked: false },
                        RadioButton: { text: 'RadioButton', checked: false },
                        Rectangle: { color: '#e0e0e0' },
                        Slider: { from: 0, to: 100, value: 50 },
                        ProgressBar: { from: 0, to: 100, value: 50 }
                    };
                    return properties[type] || {};
                }

                function saveDesign() {
                    const qmlContent = generateQML();
                    vscode.postMessage({
                        command: 'saveDesign',
                        qmlContent: qmlContent
                    });
                    updateStatus('Design saved');
                }

                function undo() {
                    vscode.postMessage({ command: 'undo' });
                }

                function redo() {
                    vscode.postMessage({ command: 'redo' });
                }

                function clearCanvas() {
                    document.getElementById('canvas').innerHTML = '';
                    widgets = [];
                    selectedWidget = null;
                    document.getElementById('properties-content').innerHTML = 
                        '<p style="color: var(--vscode-descriptionForeground); font-size: 12px;">Select a widget to edit its properties</p>';
                    updateStatus('Canvas cleared');
                    syncToCode();
                }

                function saveToUndoStack() {
                    const state = JSON.stringify(widgets);
                    vscode.postMessage({
                        command: 'addToUndoStack',
                        content: state
                    });
                }

                function updateStatus(message) {
                    document.getElementById('statusText').textContent = message;
                    setTimeout(() => {
                        document.getElementById('statusText').textContent = 'Ready - Designer + Live Preview combined';
                    }, 3000);
                }

                // Initialize drag and drop
                document.querySelectorAll('.widget-item').forEach(item => {
                    item.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text', e.target.dataset.widget);
                        const rect = e.target.getBoundingClientRect();
                        dragOffsetX = e.clientX - rect.left;
                        dragOffsetY = e.clientY - rect.top;
                    });
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
                                if (e.shiftKey) {
                                    e.preventDefault();
                                    redo();
                                } else {
                                    e.preventDefault();
                                    undo();
                                }
                                break;
                        }
                    } else {
                        switch (e.key) {
                            case 'Delete':
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

                // Listen for messages from VS Code
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

                function loadDesignFromQML(qmlContent) {
                    // Basic QML parsing and loading
                    // This would need more sophisticated parsing for production
                    updateStatus('QML design loaded');
                }

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
                    
                    syncToCode();
                }

                function restoreState(content) {
                    try {
                        const restoredWidgets = JSON.parse(content);
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
                updateStatus('Qt UI Designer + Live Preview ready - Drag widgets to start designing');
            </script>
        </body>
        </html>`;
    }
}
