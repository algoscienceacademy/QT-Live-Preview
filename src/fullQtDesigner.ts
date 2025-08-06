import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { QMLSyncEngine } from './qmlSyncEngine';

export class FullQtDesigner {
    private _designerPanel?: vscode.WebviewPanel;
    private _previewPanel?: vscode.WebviewPanel;
    private _propertyPanel?: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;
    private _currentQmlContent: string = '';
    private _selectedWidget?: any;
    private _isExternalMode: boolean = false;
    private _syncEngine: QMLSyncEngine;
    private _widgets: any[] = [];

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        this._syncEngine = new QMLSyncEngine();
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

        // Register panels with sync engine
        this._syncEngine.registerDesignerPanel(this._designerPanel);
        this._syncEngine.registerPreviewPanel(this._previewPanel);
        this._syncEngine.registerPropertyPanel(this._propertyPanel);

        // Set up message handlers
        this.setupMessageHandlers();

        // Initialize with current active document or empty application
        this.initializeWithActiveDocument();
    }

    private getDesignerHtml(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Qt Professional Design Studio</title>
            <style>
                :root {
                    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    --warning-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    --dark-gradient: linear-gradient(135deg, #434343 0%, #000000 100%);
                    
                    --primary-color: #667eea;
                    --secondary-color: #764ba2;
                    --accent-color: #f093fb;
                    --success-color: #4facfe;
                    --warning-color: #43e97b;
                    --danger-color: #f5576c;
                    
                    --bg-dark: #1e1e1e;
                    --bg-medium: #2d2d30;
                    --bg-light: #3e3e42;
                    --bg-lighter: #4e4e52;
                    --text-primary: #ffffff;
                    --text-secondary: #cccccc;
                    --text-muted: #999999;
                    
                    --border-radius: 8px;
                    --shadow-light: 0 2px 8px rgba(0,0,0,0.1);
                    --shadow-medium: 0 4px 16px rgba(0,0,0,0.15);
                    --shadow-heavy: 0 8px 32px rgba(0,0,0,0.2);
                }

                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }

                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background: var(--bg-dark);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .toolbar {
                    background: var(--primary-gradient);
                    color: white;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: var(--shadow-medium);
                    position: relative;
                    z-index: 1000;
                }
                
                .toolbar::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--primary-gradient);
                    opacity: 0.9;
                    z-index: -1;
                }
                
                .toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .toolbar-title {
                    font-size: 16px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-right: 24px;
                    display: flex;
                    align-items: center;
                }
                
                .toolbar-title::before {
                    content: '🎨';
                    margin-right: 8px;
                    font-size: 18px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                
                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding: 0 8px;
                    border-left: 1px solid rgba(255,255,255,0.2);
                    border-right: 1px solid rgba(255,255,255,0.2);
                }
                
                .toolbar-group:first-child {
                    border-left: none;
                }
                
                .toolbar-group:last-child {
                    border-right: none;
                }
                
                .toolbar button {
                    background: rgba(255,255,255,0.15);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 8px 12px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .toolbar button:hover { 
                    background: rgba(255,255,255,0.25);
                    border-color: rgba(255,255,255,0.4);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .toolbar button.active { 
                    background: var(--success-gradient);
                    border-color: rgba(255,255,255,0.5);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .main-container {
                    display: flex;
                    flex: 1;
                    height: calc(100vh - 60px);
                    background: var(--bg-dark);
                }
                
                .widget-palette {
                    width: 280px;
                    background: var(--bg-medium);
                    border-right: 1px solid var(--bg-lighter);
                    overflow-y: auto;
                    padding: 16px;
                    box-shadow: var(--shadow-light);
                }
                
                .palette-header {
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid var(--primary-color);
                }
                
                .palette-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                }
                
                .palette-subtitle {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: 400;
                }
                
                .design-area {
                    flex: 1;
                    background: var(--bg-light);
                    position: relative;
                    overflow: auto;
                    margin: 16px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-medium);
                    border: 1px solid var(--bg-lighter);
                }
                
                .canvas {
                    width: 100%;
                    min-height: 600px;
                    position: relative;
                    background: 
                        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
                    background-size: 20px 20px;
                    background-color: var(--bg-light);
                }
                
                .widget-group {
                    margin-bottom: 24px;
                }
                
                .widget-group h3 {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    padding: 8px 12px;
                    background: var(--primary-gradient);
                    border-radius: var(--border-radius);
                    display: flex;
                    align-items: center;
                    box-shadow: var(--shadow-light);
                    position: relative;
                    overflow: hidden;
                }
                
                .widget-group h3::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
                    animation: shimmer 3s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .widget-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    margin: 4px 0;
                    background: var(--bg-light);
                    border: 1px solid var(--bg-lighter);
                    border-radius: var(--border-radius);
                    cursor: grab;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    position: relative;
                    overflow: hidden;
                }
                
                .widget-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: var(--success-gradient);
                    transition: left 0.3s ease;
                    opacity: 0.1;
                }
                
                .widget-item:hover {
                    background: var(--bg-lighter);
                    border-color: var(--primary-color);
                    transform: translateX(4px) translateY(-2px);
                    box-shadow: var(--shadow-medium);
                    color: var(--text-primary);
                }
                
                .widget-item:hover::before {
                    left: 0;
                }
                
                .widget-item:active { 
                    cursor: grabbing;
                    transform: translateX(2px) translateY(-1px);
                }
                
                .widget-icon {
                    width: 18px;
                    height: 18px;
                    margin-right: 10px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    filter: brightness(1.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }
                
                .dropped-widget {
                    position: absolute;
                    border: 2px solid var(--primary-color);
                    background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                    cursor: move;
                    min-width: 100px;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 500;
                    border-radius: var(--border-radius);
                    color: var(--text-primary);
                    box-shadow: var(--shadow-light);
                    backdrop-filter: blur(10px);
                }
                
                .dropped-widget.selected {
                    border-color: var(--accent-color);
                    background: linear-gradient(45deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
                    box-shadow: var(--shadow-medium);
                }
                
                .dropped-widget:hover {
                    border-color: var(--success-color);
                    transform: scale(1.02);
                }
                
                .resize-handle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--primary-gradient);
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: var(--shadow-light);
                    transition: all 0.2s ease;
                }
                
                .resize-handle:hover {
                    transform: scale(1.2);
                    box-shadow: var(--shadow-medium);
                }
                
                .resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
                .resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
                .resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
                .resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }
                .resize-handle.n { top: -5px; left: calc(50% - 5px); cursor: n-resize; }
                .resize-handle.s { bottom: -5px; left: calc(50% - 5px); cursor: s-resize; }
                .resize-handle.w { top: calc(50% - 5px); left: -5px; cursor: w-resize; }
                .resize-handle.e { top: calc(50% - 5px); right: -5px; cursor: e-resize; }
                
                .status-bar {
                    background: var(--bg-medium);
                    color: var(--text-secondary);
                    padding: 8px 16px;
                    border-top: 1px solid var(--bg-lighter);
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--success-color);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .form-container {
                    margin: 20px;
                    min-height: 400px;
                    background: var(--bg-light);
                    border: 2px dashed var(--bg-lighter);
                    border-radius: var(--border-radius);
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .form-container:hover {
                    border-color: var(--primary-color);
                    background: var(--bg-lighter);
                }
                
                .form-container.has-content {
                    border: 1px solid var(--bg-lighter);
                    border-style: solid;
                }
                
                .drop-zone-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--text-muted);
                    font-size: 14px;
                    pointer-events: none;
                    text-align: center;
                    font-weight: 500;
                }
                
                .sync-indicator {
                    position: fixed;
                    top: 70px;
                    right: 20px;
                    background: var(--success-gradient);
                    color: white;
                    padding: 8px 12px;
                    border-radius: var(--border-radius);
                    font-size: 11px;
                    font-weight: 500;
                    box-shadow: var(--shadow-medium);
                    z-index: 1000;
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: translateY(-10px);
                }
                
                .sync-indicator.show {
                    opacity: 1;
                    transform: translateY(0);
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="toolbar-title">Professional Design Studio</div>
                    
                    <div class="toolbar-group">
                        <button id="newBtn">📄 New</button>
                        <button id="openBtn">📁 Open</button>
                        <button id="saveBtn">💾 Save</button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button id="undoBtn">↶ Undo</button>
                        <button id="redoBtn">↷ Redo</button>
                    </div>
                    
                    <div class="toolbar-group">
                        <button id="previewBtn">▶️ Preview</button>
                        <button id="codeBtn">📝 Code</button>
                        <button id="syncBtn" class="active">🔄 Sync</button>
                    </div>
                </div>
                
                <div class="toolbar-group">
                    <button id="externalBtn">🪟 External</button>
                    <button id="settingsBtn">⚙️ Settings</button>
                </div>
            </div>
            
            <div class="main-container">
                <div class="widget-palette">
                    <div class="palette-header">
                        <div class="palette-title">🎨 Widget Palette</div>
                        <div class="palette-subtitle">Drag widgets to design area</div>
                    </div>
                    
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
                        <div class="widget-item" draggable="true" data-widget="Rectangle">
                            <div class="widget-icon">⬜</div>
                            Rectangle
                        </div>
                    </div>
                    
                    <div class="widget-group">
                        <h3>🖱️ Input Widgets</h3>
                        <div class="widget-item" draggable="true" data-widget="Button">
                            <div class="widget-icon">🔘</div>
                            Button
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TextField">
                            <div class="widget-icon">📄</div>
                            TextField
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TextArea">
                            <div class="widget-icon">📋</div>
                            TextArea
                        </div>
                        <div class="widget-item" draggable="true" data-widget="CheckBox">
                            <div class="widget-icon">☑️</div>
                            CheckBox
                        </div>
                        <div class="widget-item" draggable="true" data-widget="RadioButton">
                            <div class="widget-icon">🔘</div>
                            RadioButton
                        </div>
                        <div class="widget-item" draggable="true" data-widget="ComboBox">
                            <div class="widget-icon">📋</div>
                            ComboBox
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
                        <h3>📋 Container Widgets</h3>
                        <div class="widget-item" draggable="true" data-widget="Item">
                            <div class="widget-icon">📦</div>
                            Item
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Column">
                            <div class="widget-icon">📋</div>
                            Column
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Row">
                            <div class="widget-icon">➡️</div>
                            Row
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Grid">
                            <div class="widget-icon">⬛</div>
                            Grid
                        </div>
                        <div class="widget-item" draggable="true" data-widget="StackLayout">
                            <div class="widget-icon">📚</div>
                            StackLayout
                        </div>
                        <div class="widget-item" draggable="true" data-widget="ScrollView">
                            <div class="widget-icon">📜</div>
                            ScrollView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="GroupBox">
                            <div class="widget-icon">📦</div>
                            GroupBox
                        </div>
                        <div class="widget-item" draggable="true" data-widget="Frame">
                            <div class="widget-icon">🖼️</div>
                            Frame
                        </div>
                    </div>
                    
                    <div class="widget-group">
                        <h3>📊 Advanced Widgets</h3>
                        <div class="widget-item" draggable="true" data-widget="ListView">
                            <div class="widget-icon">📋</div>
                            ListView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TreeView">
                            <div class="widget-icon">🌳</div>
                            TreeView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TableView">
                            <div class="widget-icon">📊</div>
                            TableView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="TabView">
                            <div class="widget-icon">📑</div>
                            TabView
                        </div>
                        <div class="widget-item" draggable="true" data-widget="ProgressBar">
                            <div class="widget-icon">📊</div>
                            ProgressBar
                        </div>
                        <div class="widget-item" draggable="true" data-widget="WebView">
                            <div class="widget-icon">🌐</div>
                            WebView
                        </div>
                    </div>
                </div>
                
                <div class="design-area">
                    <div class="canvas" id="canvas">
                        <div class="form-container" id="formContainer">
                            <div class="drop-zone-text">
                                🎨 Drag widgets here to start designing<br>
                                <small style="opacity: 0.7;">Professional Qt Design Studio</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="status-bar">
                <div class="status-item">
                    <div class="status-indicator"></div>
                    <span>Real-time Sync Active</span>
                </div>
                <div class="status-item">
                    <span>Ready • Widgets: <span id="widgetCount">0</span> • Designer Connected</span>
                </div>
                <div class="status-item">
                    <span>Position: <span id="mousePos">0, 0</span></span>
                </div>
            </div>
            
            <div class="sync-indicator" id="syncIndicator">
                🔄 Synced with VS Code
            </div>
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
                let isRealTimeSync = true;
                let syncDebounceTimer = null;
                
                // Enhanced widget templates with professional styling
                const widgetTemplates = {
                    Label: { 
                        width: 120, height: 32, text: 'Label', 
                        color: '#ffffff', backgroundColor: 'transparent',
                        fontSize: 14, fontWeight: 'normal'
                    },
                    Text: { 
                        width: 200, height: 100, text: 'Professional Text Area...', 
                        wrapMode: 'WordWrap', color: '#ffffff', backgroundColor: '#3e3e42',
                        fontSize: 13, padding: 8
                    },
                    Image: { 
                        width: 150, height: 100, source: '', 
                        fillMode: 'PreserveAspectFit', backgroundColor: '#2d2d30',
                        border: '1px solid #4e4e52'
                    },
                    Rectangle: { 
                        width: 120, height: 80, color: '#667eea', 
                        border: '1px solid #764ba2', radius: 8,
                        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    },
                    Button: { 
                        width: 100, height: 36, text: 'Button', 
                        color: '#ffffff', backgroundColor: '#667eea',
                        hoverColor: '#764ba2', fontSize: 13, fontWeight: '500'
                    },
                    TextField: { 
                        width: 200, height: 32, placeholderText: 'Enter text...', 
                        color: '#ffffff', backgroundColor: '#3e3e42',
                        border: '1px solid #4e4e52', padding: 8
                    },
                    TextArea: { 
                        width: 200, height: 120, placeholderText: 'Enter multi-line text...', 
                        wrapMode: 'WordWrap', color: '#ffffff', backgroundColor: '#3e3e42',
                        border: '1px solid #4e4e52', padding: 8
                    },
                    CheckBox: { 
                        width: 120, height: 24, text: 'CheckBox', 
                        checked: false, color: '#ffffff', accentColor: '#667eea'
                    },
                    RadioButton: { 
                        width: 120, height: 24, text: 'RadioButton', 
                        checked: false, color: '#ffffff', accentColor: '#667eea'
                    },
                    ComboBox: { 
                        width: 150, height: 32, model: ['Option 1', 'Option 2', 'Option 3'], 
                        color: '#ffffff', backgroundColor: '#3e3e42',
                        border: '1px solid #4e4e52'
                    },
                    Slider: { 
                        width: 200, height: 24, from: 0, to: 100, value: 50, 
                        accentColor: '#667eea', backgroundColor: '#4e4e52'
                    },
                    SpinBox: { 
                        width: 80, height: 32, from: 0, to: 100, value: 0, 
                        color: '#ffffff', backgroundColor: '#3e3e42',
                        border: '1px solid #4e4e52'
                    },
                    Item: { 
                        width: 200, height: 150, backgroundColor: 'transparent',
                        border: '2px dashed #4e4e52'
                    },
                    Column: { 
                        width: 200, height: 200, spacing: 8, 
                        backgroundColor: 'transparent', border: '1px dashed #667eea'
                    },
                    Row: { 
                        width: 200, height: 100, spacing: 8, 
                        backgroundColor: 'transparent', border: '1px dashed #667eea'
                    },
                    Grid: { 
                        width: 200, height: 200, columns: 2, rows: 2, 
                        backgroundColor: 'transparent', border: '1px dashed #667eea'
                    },
                    StackLayout: { 
                        width: 200, height: 150, currentIndex: 0, 
                        backgroundColor: '#3e3e42', border: '1px solid #4e4e52'
                    },
                    ScrollView: { 
                        width: 200, height: 150, contentWidth: 300, contentHeight: 200, 
                        backgroundColor: '#2d2d30', border: '1px solid #4e4e52'
                    },
                    GroupBox: { 
                        width: 200, height: 150, title: 'Group Box', 
                        color: '#ffffff', backgroundColor: '#3e3e42',
                        border: '1px solid #4e4e52'
                    },
                    Frame: { 
                        width: 200, height: 150, backgroundColor: '#3e3e42',
                        border: '2px solid #667eea', radius: 8
                    },
                    ListView: { 
                        width: 200, height: 150, model: ['Item 1', 'Item 2', 'Item 3'], 
                        color: '#ffffff', backgroundColor: '#2d2d30',
                        border: '1px solid #4e4e52'
                    },
                    TreeView: { 
                        width: 200, height: 150, backgroundColor: '#2d2d30',
                        color: '#ffffff', border: '1px solid #4e4e52'
                    },
                    TableView: { 
                        width: 250, height: 150, columnCount: 3, rowCount: 5, 
                        backgroundColor: '#2d2d30', color: '#ffffff',
                        border: '1px solid #4e4e52'
                    },
                    TabView: { 
                        width: 250, height: 150, tabPosition: 'Top', 
                        backgroundColor: '#3e3e42', color: '#ffffff',
                        border: '1px solid #4e4e52'
                    },
                    ProgressBar: { 
                        width: 200, height: 24, from: 0, to: 100, value: 50, 
                        color: '#667eea', backgroundColor: '#4e4e52'
                    },
                    WebView: { 
                        width: 300, height: 200, url: 'about:blank', 
                        backgroundColor: '#2d2d30', border: '1px solid #4e4e52'
                    }
                };
                
                // Sync functionality
                function showSyncIndicator(message = 'Synced with VS Code') {
                    const indicator = document.getElementById('syncIndicator');
                    indicator.textContent = '🔄 ' + message;
                    indicator.classList.add('show');
                    setTimeout(() => {
                        indicator.classList.remove('show');
                    }, 2000);
                }
                
                function debouncedSync(callback, delay = 150) {
                    clearTimeout(syncDebounceTimer);
                    syncDebounceTimer = setTimeout(callback, delay);
                }
                
                function syncToEditor() {
                    if (!isRealTimeSync) return;
                    
                    debouncedSync(() => {
                        const widgets = Array.from(document.querySelectorAll('.dropped-widget')).map(el => ({
                            id: el.dataset.id,
                            type: el.dataset.widget,
                            x: parseInt(el.style.left) || 0,
                            y: parseInt(el.style.top) || 0,
                            width: parseInt(el.style.width) || 100,
                            height: parseInt(el.style.height) || 30,
                            properties: JSON.parse(el.dataset.properties || '{}')
                        }));
                        
                        vscode.postMessage({
                            command: 'syncToEditor',
                            widgets: widgets
                        });
                        
                        showSyncIndicator('Synced to VS Code Editor');
                        updateWidgetCount();
                    });
                }
                
                function updateWidgetCount() {
                    const count = document.querySelectorAll('.dropped-widget').length;
                    document.getElementById('widgetCount').textContent = count;
                }
                
                // Enhanced drag and drop functionality
                function initializeDragAndDrop() {
                    const canvas = document.getElementById('canvas');
                    const formContainer = document.getElementById('formContainer');
                    
                    // Track mouse position for status bar
                    canvas.addEventListener('mousemove', (e) => {
                        const rect = canvas.getBoundingClientRect();
                        const x = Math.round(e.clientX - rect.left);
                        const y = Math.round(e.clientY - rect.top);
                        document.getElementById('mousePos').textContent = x + ', ' + y;
                    });
                    
                    // Widget palette drag start
                    document.querySelectorAll('.widget-item').forEach(item => {
                        item.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', item.dataset.widget);
                            draggedWidget = item.dataset.widget;
                            item.style.opacity = '0.5';
                        });
                        
                        item.addEventListener('dragend', () => {
                            item.style.opacity = '1';
                        });
                    });
                    
                    // Canvas drop handling
                    canvas.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        formContainer.style.borderColor = 'var(--primary-color)';
                        formContainer.style.backgroundColor = 'var(--bg-lighter)';
                    });
                    
                    canvas.addEventListener('dragleave', () => {
                        formContainer.style.borderColor = 'var(--bg-lighter)';
                        formContainer.style.backgroundColor = 'var(--bg-light)';
                    });
                    
                    canvas.addEventListener('drop', (e) => {
                        e.preventDefault();
                        formContainer.style.borderColor = 'var(--bg-lighter)';
                        formContainer.style.backgroundColor = 'var(--bg-light)';
                        
                        const widgetType = e.dataTransfer.getData('text/plain');
                        if (widgetType && widgetTemplates[widgetType]) {
                            createWidget(widgetType, e.offsetX, e.offsetY);
                        }
                    });
                }
                
                // Enhanced widget creation with professional styling
                function createWidget(type, x, y) {
                    const template = widgetTemplates[type];
                    const widget = document.createElement('div');
                    const widgetId = 'widget_' + (++widgetCounter);
                    
                    widget.className = 'dropped-widget';
                    widget.dataset.widget = type;
                    widget.dataset.id = widgetId;
                    widget.dataset.properties = JSON.stringify(template);
                    widget.textContent = template.text || type;
                    
                    // Apply professional styling
                    widget.style.left = (x - template.width / 2) + 'px';
                    widget.style.top = (y - template.height / 2) + 'px';
                    widget.style.width = template.width + 'px';
                    widget.style.height = template.height + 'px';
                    
                    // Apply template-specific styles
                    if (template.backgroundColor) {
                        widget.style.backgroundColor = template.backgroundColor;
                    }
                    if (template.color) {
                        widget.style.color = template.color;
                    }
                    if (template.border) {
                        widget.style.border = template.border;
                    }
                    if (template.radius) {
                        widget.style.borderRadius = template.radius + 'px';
                    }
                    if (template.fontSize) {
                        widget.style.fontSize = template.fontSize + 'px';
                    }
                    if (template.fontWeight) {
                        widget.style.fontWeight = template.fontWeight;
                    }
                    if (template.gradient) {
                        widget.style.background = template.gradient;
                    }
                    
                    // Add resize handles
                    ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].forEach(direction => {
                        const handle = document.createElement('div');
                        handle.className = 'resize-handle ' + direction;
                        handle.addEventListener('mousedown', (e) => startResize(e, widget, direction));
                        widget.appendChild(handle);
                    });
                    
                    // Widget selection and dragging
                    widget.addEventListener('mousedown', (e) => {
                        if (e.target === widget) {
                            selectWidget(widget);
                            startDrag(e, widget);
                        }
                    });
                    
                    // Double-click to edit properties
                    widget.addEventListener('dblclick', () => {
                        editWidgetProperties(widget);
                    });
                    
                    document.getElementById('formContainer').appendChild(widget);
                    
                    // Hide drop zone text
                    const dropZoneText = document.querySelector('.drop-zone-text');
                    if (dropZoneText) {
                        dropZoneText.style.display = 'none';
                    }
                    document.getElementById('formContainer').classList.add('has-content');
                    
                    selectWidget(widget);
                    syncToEditor();
                }
                
                // Enhanced widget selection with visual feedback
                function selectWidget(widget) {
                    // Clear previous selection
                    document.querySelectorAll('.dropped-widget').forEach(w => {
                        w.classList.remove('selected');
                        w.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'none');
                    });
                    
                    // Select new widget
                    selectedWidget = widget;
                    widget.classList.add('selected');
                    widget.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'block');
                    
                    // Update property panel
                    vscode.postMessage({
                        command: 'selectWidget',
                        widget: {
                            id: widget.dataset.id,
                            type: widget.dataset.widget,
                            properties: JSON.parse(widget.dataset.properties || '{}'),
                            x: parseInt(widget.style.left) || 0,
                            y: parseInt(widget.style.top) || 0,
                            width: parseInt(widget.style.width) || 100,
                            height: parseInt(widget.style.height) || 30
                        }
                    });
                }
                
                // Enhanced drag functionality with smooth animations
                function startDrag(e, widget) {
                    if (isResizing) return;
                    
                    isDragging = true;
                    const rect = widget.getBoundingClientRect();
                    const canvasRect = document.getElementById('canvas').getBoundingClientRect();
                    
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    widget.style.zIndex = '1000';
                    widget.style.transform = 'scale(1.02)';
                    
                    const handleMouseMove = (e) => {
                        if (!isDragging) return;
                        
                        const x = e.clientX - canvasRect.left - dragOffset.x;
                        const y = e.clientY - canvasRect.top - dragOffset.y;
                        
                        widget.style.left = Math.max(0, x) + 'px';
                        widget.style.top = Math.max(0, y) + 'px';
                        
                        syncToEditor();
                    };
                    
                    const handleMouseUp = () => {
                        isDragging = false;
                        widget.style.zIndex = '';
                        widget.style.transform = '';
                        
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        
                        showSyncIndicator('Widget position updated');
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
                
                // Enhanced resize functionality
                function startResize(e, widget, direction) {
                    e.stopPropagation();
                    isResizing = true;
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = parseInt(widget.style.width) || 100;
                    const startHeight = parseInt(widget.style.height) || 30;
                    const startLeft = parseInt(widget.style.left) || 0;
                    const startTop = parseInt(widget.style.top) || 0;
                    
                    widget.style.transition = 'none';
                    
                    const handleMouseMove = (e) => {
                        if (!isResizing) return;
                        
                        const deltaX = e.clientX - startX;
                        const deltaY = e.clientY - startY;
                        
                        let newWidth = startWidth;
                        let newHeight = startHeight;
                        let newLeft = startLeft;
                        let newTop = startTop;
                        
                        // Handle different resize directions
                        if (direction.includes('e')) newWidth = Math.max(50, startWidth + deltaX);
                        if (direction.includes('w')) {
                            newWidth = Math.max(50, startWidth - deltaX);
                            newLeft = startLeft + deltaX;
                        }
                        if (direction.includes('s')) newHeight = Math.max(20, startHeight + deltaY);
                        if (direction.includes('n')) {
                            newHeight = Math.max(20, startHeight - deltaY);
                            newTop = startTop + deltaY;
                        }
                        
                        widget.style.width = newWidth + 'px';
                        widget.style.height = newHeight + 'px';
                        widget.style.left = newLeft + 'px';
                        widget.style.top = newTop + 'px';
                        
                        syncToEditor();
                    };
                    
                    const handleMouseUp = () => {
                        isResizing = false;
                        widget.style.transition = '';
                        
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        
                        showSyncIndicator('Widget resized');
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }
                
                // Enhanced property editing
                function editWidgetProperties(widget) {
                    const properties = JSON.parse(widget.dataset.properties || '{}');
                    const type = widget.dataset.widget;
                    
                    vscode.postMessage({
                        command: 'editProperties',
                        widget: {
                            id: widget.dataset.id,
                            type: type,
                            properties: properties
                        }
                    });
                }
                
                // Toolbar button handlers with enhanced functionality
                function setupToolbarHandlers() {
                    document.getElementById('newBtn').addEventListener('click', () => {
                        if (confirm('Create new design? This will clear the current design.')) {
                            clearDesign();
                            showSyncIndicator('New design created');
                        }
                    });
                    
                    document.getElementById('saveBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'saveDesign' });
                        showSyncIndicator('Design saved');
                    });
                    
                    document.getElementById('openBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'openDesign' });
                    });
                    
                    document.getElementById('previewBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'showPreview' });
                        showSyncIndicator('Preview updated');
                    });
                    
                    document.getElementById('codeBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'showCode' });
                    });
                    
                    document.getElementById('syncBtn').addEventListener('click', (e) => {
                        isRealTimeSync = !isRealTimeSync;
                        e.target.classList.toggle('active', isRealTimeSync);
                        e.target.textContent = isRealTimeSync ? '🔄 Sync' : '⏸️ Paused';
                        showSyncIndicator(isRealTimeSync ? 'Real-time sync enabled' : 'Real-time sync paused');
                    });
                    
                    document.getElementById('externalBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'openExternal' });
                    });
                    
                    document.getElementById('undoBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'undo' });
                    });
                    
                    document.getElementById('redoBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'redo' });
                    });
                }
                
                function clearDesign() {
                    document.querySelectorAll('.dropped-widget').forEach(widget => widget.remove());
                    document.querySelector('.drop-zone-text').style.display = 'block';
                    document.getElementById('formContainer').classList.remove('has-content');
                    selectedWidget = null;
                    widgetCounter = 0;
                    updateWidgetCount();
                }
                
                // Message handling from VS Code
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'syncFromEditor':
                            syncFromEditor(message.qmlContent);
                            break;
                        case 'updateProperty':
                            updateWidgetProperty(message.widgetId, message.property, message.value);
                            break;
                        case 'loadDesign':
                            loadDesign(message.widgets);
                            break;
                    }
                });
                
                function syncFromEditor(qmlContent) {
                    if (!isRealTimeSync) return;
                    
                    // Parse QML and update visual designer
                    showSyncIndicator('Synced from VS Code Editor');
                }
                
                function updateWidgetProperty(widgetId, property, value) {
                    const widget = document.querySelector('[data-id="' + widgetId + '"]');
                    if (widget) {
                        const properties = JSON.parse(widget.dataset.properties || '{}');
                        properties[property] = value;
                        widget.dataset.properties = JSON.stringify(properties);
                        
                        // Apply visual updates
                        if (property === 'text') widget.textContent = value;
                        if (property === 'color') widget.style.color = value;
                        if (property === 'backgroundColor') widget.style.backgroundColor = value;
                        
                        syncToEditor();
                        showSyncIndicator('Property updated');
                    }
                }
                
                function loadDesign(widgets) {
                    clearDesign();
                    widgets.forEach(widgetData => {
                        const widget = createWidgetFromData(widgetData);
                        document.getElementById('formContainer').appendChild(widget);
                    });
                    
                    if (widgets.length > 0) {
                        document.querySelector('.drop-zone-text').style.display = 'none';
                        document.getElementById('formContainer').classList.add('has-content');
                    }
                    
                    updateWidgetCount();
                    showSyncIndicator('Design loaded');
                }
                
                function createWidgetFromData(data) {
                    const widget = document.createElement('div');
                    widget.className = 'dropped-widget';
                    widget.dataset.widget = data.type;
                    widget.dataset.id = data.id;
                    widget.dataset.properties = JSON.stringify(data.properties);
                    widget.textContent = data.properties.text || data.type;
                    
                    widget.style.left = data.x + 'px';
                    widget.style.top = data.y + 'px';
                    widget.style.width = data.width + 'px';
                    widget.style.height = data.height + 'px';
                    
                    // Apply styling from properties
                    Object.entries(data.properties).forEach(([key, value]) => {
                        if (key === 'color') widget.style.color = value;
                        if (key === 'backgroundColor') widget.style.backgroundColor = value;
                        if (key === 'border') widget.style.border = value;
                    });
                    
                    // Add resize handles and event listeners
                    ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].forEach(direction => {
                        const handle = document.createElement('div');
                        handle.className = 'resize-handle ' + direction;
                        handle.addEventListener('mousedown', (e) => startResize(e, widget, direction));
                        widget.appendChild(handle);
                    });
                    
                    widget.addEventListener('mousedown', (e) => {
                        if (e.target === widget) {
                            selectWidget(widget);
                            startDrag(e, widget);
                        }
                    });
                    
                    widget.addEventListener('dblclick', () => editWidgetProperties(widget));
                    
                    return widget;
                }
                
                // Initialize everything
                document.addEventListener('DOMContentLoaded', () => {
                    initializeDragAndDrop();
                    setupToolbarHandlers();
                    updateWidgetCount();
                    
                    // Clear selection when clicking on canvas
                    document.getElementById('canvas').addEventListener('click', (e) => {
                        if (e.target.id === 'canvas' || e.target.id === 'formContainer') {
                            selectWidget(null);
                            document.querySelectorAll('.dropped-widget').forEach(w => {
                                w.classList.remove('selected');
                                w.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'none');
                            });
                        }
                    });
                    
                    // Keyboard shortcuts
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Delete' && selectedWidget) {
                            selectedWidget.remove();
                            selectedWidget = null;
                            syncToEditor();
                            updateWidgetCount();
                            showSyncIndicator('Widget deleted');
                        }
                    });
                });
            </script>
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
                            loadDesignFromWidgets(message.widgets);
                            break;
                        case 'updateFromCode':
                            loadDesignFromWidgets(message.widgets);
                            updateStatus('Updated from code');
                            break;
                        case 'updateProperty':
                            updateWidgetProperty(message.widgetId, message.property, message.value);
                            break;
                    }
                });

                // Load design from widgets array
                function loadDesignFromWidgets(widgets) {
                    const formContainer = document.getElementById('formContainer');
                    // Clear existing widgets except drop zone text
                    const existingWidgets = formContainer.querySelectorAll('.dropped-widget');
                    existingWidgets.forEach(w => w.remove());
                    
                    if (widgets && widgets.length > 0) {
                        formContainer.classList.add('has-content');
                        formContainer.querySelector('.drop-zone-text').style.display = 'none';
                        
                        widgets.forEach(widget => {
                            createWidgetFromData(widget);
                        });
                    } else {
                        formContainer.classList.remove('has-content');
                        formContainer.querySelector('.drop-zone-text').style.display = 'block';
                    }
                }

                // Create widget from data object
                function createWidgetFromData(widgetData) {
                    const widget = document.createElement('div');
                    widget.className = 'dropped-widget';
                    widget.id = widgetData.id;
                    widget.dataset.type = widgetData.type;
                    widget.dataset.properties = JSON.stringify(widgetData.properties);
                    
                    widget.style.left = widgetData.position.x + 'px';
                    widget.style.top = widgetData.position.y + 'px';
                    widget.style.width = widgetData.position.width + 'px';
                    widget.style.height = widgetData.position.height + 'px';
                    
                    // Set widget content
                    if (widgetData.properties.text) {
                        widget.textContent = widgetData.properties.text;
                    } else {
                        widget.textContent = widgetData.type;
                    }
                    
                    // Add resize handles
                    addResizeHandles(widget);
                    
                    // Add to canvas
                    document.getElementById('formContainer').appendChild(widget);
                    
                    // Setup widget interaction
                    setupWidgetInteraction(widget);
                }

                // Update widget property
                function updateWidgetProperty(widgetId, property, value) {
                    const widget = document.getElementById(widgetId);
                    if (widget) {
                        const properties = JSON.parse(widget.dataset.properties || '{}');
                        properties[property] = value;
                        widget.dataset.properties = JSON.stringify(properties);
                        
                        // Update visual representation
                        if (property === 'text') {
                            widget.textContent = value;
                        }
                        
                        // Trigger QML generation
                        generateQMLCode();
                    }
                }
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
                            updateLiveIndicator(true);
                            break;
                        case 'updateFromCode':
                            renderQMLPreview(message.widgets);
                            updateLiveIndicator(true);
                            break;
                    }
                });

                function updateLiveIndicator(isActive) {
                    const dot = document.querySelector('.live-dot');
                    if (dot) {
                        dot.style.backgroundColor = isActive ? '#4caf50' : '#ff9800';
                        dot.style.animation = isActive ? 'pulse 2s infinite' : 'none';
                    }
                }

                function renderQMLPreview(widgets) {
                    const content = document.getElementById('previewContent');
                    content.innerHTML = '';
                    
                    if (!widgets || widgets.length === 0) {
                        content.innerHTML = '<div style="text-align: center; color: #999; font-size: 16px; margin-top: 50px;">👁️ Live Preview<br><br><small>Your QML interface will appear here in real-time</small></div>';
                        updateLiveIndicator(false);
                        return;
                    }
                    
                    // Create a container for the widgets
                    const container = document.createElement('div');
                    container.style.position = 'relative';
                    container.style.width = '100%';
                    container.style.height = '100%';
                    
                    widgets.forEach(widget => {
                        const element = createPreviewElement(widget);
                        container.appendChild(element);
                    });
                    
                    content.appendChild(container);
                    updateLiveIndicator(true);
                }
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
            <title>Professional Properties Panel</title>
            <style>
                :root {
                    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    --warning-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    
                    --primary-color: #667eea;
                    --secondary-color: #764ba2;
                    --accent-color: #f093fb;
                    --success-color: #4facfe;
                    --warning-color: #43e97b;
                    --danger-color: #f5576c;
                    
                    --bg-dark: #1e1e1e;
                    --bg-medium: #2d2d30;
                    --bg-light: #3e3e42;
                    --bg-lighter: #4e4e52;
                    --text-primary: #ffffff;
                    --text-secondary: #cccccc;
                    --text-muted: #999999;
                    
                    --border-radius: 8px;
                    --shadow-light: 0 2px 8px rgba(0,0,0,0.1);
                    --shadow-medium: 0 4px 16px rgba(0,0,0,0.15);
                }

                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }

                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background: var(--bg-dark);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .property-header {
                    background: var(--primary-gradient);
                    color: white;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--bg-lighter);
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: var(--shadow-light);
                }
                
                .property-header::before {
                    content: '⚙️';
                    margin-right: 8px;
                    font-size: 16px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                
                .property-sync-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--success-color);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .property-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: var(--bg-dark);
                }
                
                .no-selection {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: var(--text-muted);
                }
                
                .no-selection-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                
                .property-group {
                    background: var(--bg-medium);
                    border: 1px solid var(--bg-lighter);
                    border-radius: var(--border-radius);
                    margin-bottom: 16px;
                    overflow: hidden;
                    box-shadow: var(--shadow-light);
                }
                
                .property-group-header {
                    background: var(--bg-light);
                    padding: 10px 16px;
                    border-bottom: 1px solid var(--bg-lighter);
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                
                .property-group-header:hover {
                    background: var(--bg-lighter);
                }
                
                .property-group-header.collapsed {
                    border-bottom: none;
                }
                
                .property-group-icon {
                    margin-right: 8px;
                    font-size: 14px;
                }
                
                .property-group-toggle {
                    font-size: 10px;
                    color: var(--text-muted);
                    transition: transform 0.2s ease;
                }
                
                .property-group-header.collapsed .property-group-toggle {
                    transform: rotate(-90deg);
                }
                
                .property-group-content {
                    padding: 12px 0;
                    transition: max-height 0.3s ease;
                    overflow: hidden;
                }
                
                .property-group-content.collapsed {
                    max-height: 0;
                    padding: 0;
                }
                
                .property-item {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    font-size: 12px;
                    transition: background-color 0.2s ease;
                }
                
                .property-item:hover {
                    background-color: rgba(255,255,255,0.02);
                }
                
                .property-item:last-child {
                    border-bottom: none;
                }
                
                .property-label {
                    flex: 1;
                    color: var(--text-secondary);
                    font-weight: 500;
                    min-width: 80px;
                }
                
                .property-input {
                    flex: 1.5;
                    margin-left: 12px;
                }
                
                .property-input input,
                .property-input select,
                .property-input textarea {
                    width: 100%;
                    padding: 6px 10px;
                    background: var(--bg-light);
                    border: 1px solid var(--bg-lighter);
                    border-radius: var(--border-radius);
                    color: var(--text-primary);
                    font-size: 11px;
                    font-family: inherit;
                    transition: all 0.2s ease;
                }
                
                .property-input input:focus,
                .property-input select:focus,
                .property-input textarea:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
                }
                
                .property-input input[type="checkbox"] {
                    width: auto;
                    margin-right: 8px;
                    accent-color: var(--primary-color);
                }
                
                .property-input input[type="color"] {
                    width: 50px;
                    height: 32px;
                    padding: 2px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                }
                
                .property-input input[type="range"] {
                    accent-color: var(--primary-color);
                }
                
                .property-input .input-group {
                    display: flex;
                    gap: 4px;
                }
                
                .property-input .input-group input {
                    flex: 1;
                }
                
                .property-input .unit-label {
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                    background: var(--bg-lighter);
                    border: 1px solid var(--bg-lighter);
                    border-left: none;
                    border-radius: 0 var(--border-radius) var(--border-radius) 0;
                    color: var(--text-muted);
                    font-size: 10px;
                    white-space: nowrap;
                }
                
                .property-button {
                    background: var(--primary-gradient);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: var(--border-radius);
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 4px;
                }
                
                .property-button:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-light);
                }
                
                .property-button.secondary {
                    background: var(--bg-lighter);
                    color: var(--text-secondary);
                }
                
                .property-button.danger {
                    background: var(--secondary-gradient);
                }
                
                .widget-info {
                    background: var(--bg-medium);
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    border-radius: var(--border-radius);
                    border: 1px solid var(--bg-lighter);
                }
                
                .widget-type {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--primary-color);
                    margin-bottom: 4px;
                }
                
                .widget-id {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-family: 'Courier New', monospace;
                }
                
                .property-tabs {
                    display: flex;
                    background: var(--bg-medium);
                    border-radius: var(--border-radius) var(--border-radius) 0 0;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                
                .property-tab {
                    flex: 1;
                    padding: 10px 12px;
                    background: var(--bg-light);
                    color: var(--text-muted);
                    border: none;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    border-right: 1px solid var(--bg-lighter);
                }
                
                .property-tab:last-child {
                    border-right: none;
                }
                
                .property-tab.active {
                    background: var(--primary-gradient);
                    color: white;
                }
                
                .property-tab:hover:not(.active) {
                    background: var(--bg-lighter);
                    color: var(--text-secondary);
                }
                
                .color-picker-group {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .color-preset {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid var(--bg-lighter);
                    transition: all 0.2s ease;
                }
                
                .color-preset:hover {
                    transform: scale(1.1);
                    border-color: var(--text-secondary);
                }
                
                .range-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .range-value {
                    min-width: 40px;
                    text-align: center;
                    background: var(--bg-lighter);
                    border: 1px solid var(--bg-lighter);
                    border-radius: var(--border-radius);
                    padding: 4px 6px;
                    font-size: 10px;
                    color: var(--text-primary);
                }
            </style>
        </head>
        <body>
            <div class="property-header">
                Professional Properties
                <div class="property-sync-indicator" title="Real-time sync active"></div>
            </div>
            
            <div class="property-content" id="propertyContent">
                <div class="no-selection" id="noSelection">
                    <div class="no-selection-icon">🎯</div>
                    <div>
                        <h3>No Widget Selected</h3>
                        <p>Select a widget in the designer<br>to edit its properties</p>
                    </div>
                </div>
                
                <div id="widgetProperties" style="display: none;">
                    <div class="widget-info">
                        <div class="widget-type" id="widgetType">Button</div>
                        <div class="widget-id" id="widgetId">widget_1</div>
                    </div>
                    
                    <div class="property-tabs">
                        <button class="property-tab active" data-tab="general">General</button>
                        <button class="property-tab" data-tab="layout">Layout</button>
                        <button class="property-tab" data-tab="style">Style</button>
                    </div>
                    
                    <div class="tab-content" id="generalTab">
                        <div class="property-group">
                            <div class="property-group-header">
                                <span><span class="property-group-icon">📝</span>Content</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">Text</div>
                                    <div class="property-input">
                                        <input type="text" id="prop-text" placeholder="Enter text...">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Placeholder</div>
                                    <div class="property-input">
                                        <input type="text" id="prop-placeholder" placeholder="Placeholder text...">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Enabled</div>
                                    <div class="property-input">
                                        <input type="checkbox" id="prop-enabled" checked>
                                        <label for="prop-enabled">Widget is enabled</label>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Visible</div>
                                    <div class="property-input">
                                        <input type="checkbox" id="prop-visible" checked>
                                        <label for="prop-visible">Widget is visible</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="layoutTab" style="display: none;">
                        <div class="property-group">
                            <div class="property-group-header">
                                <span><span class="property-group-icon">📐</span>Position & Size</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">X Position</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-x" min="0" value="0">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Y Position</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-y" min="0" value="0">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Width</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-width" min="1" value="100">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Height</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-height" min="1" value="30">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="styleTab" style="display: none;">
                        <div class="property-group">
                            <div class="property-group-header">
                                <span><span class="property-group-icon">🎨</span>Colors</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">Text Color</div>
                                    <div class="property-input">
                                        <div class="color-picker-group">
                                            <input type="color" id="prop-color" value="#ffffff">
                                            <div class="color-preset" style="background: #ffffff;" data-color="#ffffff"></div>
                                            <div class="color-preset" style="background: #000000;" data-color="#000000"></div>
                                            <div class="color-preset" style="background: #667eea;" data-color="#667eea"></div>
                                            <div class="color-preset" style="background: #f093fb;" data-color="#f093fb"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Background</div>
                                    <div class="property-input">
                                        <div class="color-picker-group">
                                            <input type="color" id="prop-backgroundColor" value="#3e3e42">
                                            <div class="color-preset" style="background: transparent; border: 2px dashed #666;" data-color="transparent"></div>
                                            <div class="color-preset" style="background: #3e3e42;" data-color="#3e3e42"></div>
                                            <div class="color-preset" style="background: #667eea;" data-color="#667eea"></div>
                                            <div class="color-preset" style="background: #f093fb;" data-color="#f093fb"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Opacity</div>
                                    <div class="property-input">
                                        <div class="range-group">
                                            <input type="range" id="prop-opacity" min="0" max="1" step="0.1" value="1">
                                            <input type="number" class="range-value" id="prop-opacity-value" min="0" max="1" step="0.1" value="1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <div class="property-group-header">
                                <span><span class="property-group-icon">🖼️</span>Appearance</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">Border Radius</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-borderRadius" min="0" value="8">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Font Size</div>
                                    <div class="property-input">
                                        <div class="input-group">
                                            <input type="number" id="prop-fontSize" min="8" max="72" value="13">
                                            <div class="unit-label">px</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Font Weight</div>
                                    <div class="property-input">
                                        <select id="prop-fontWeight">
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="lighter">Lighter</option>
                                            <option value="500">Medium</option>
                                            <option value="600">Semi Bold</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--bg-lighter);">
                        <button class="property-button" onclick="applyChanges()">Apply Changes</button>
                        <button class="property-button secondary" onclick="resetProperties()">Reset</button>
                        <button class="property-button danger" onclick="deleteWidget()">Delete Widget</button>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentWidget = null;
                
                // Tab switching
                document.querySelectorAll('.property-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Remove active class from all tabs
                        document.querySelectorAll('.property-tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        
                        // Add active class to clicked tab
                        tab.classList.add('active');
                        const tabId = tab.dataset.tab + 'Tab';
                        document.getElementById(tabId).style.display = 'block';
                    });
                });
                
                // Property group collapsing
                document.querySelectorAll('.property-group-header').forEach(header => {
                    header.addEventListener('click', () => {
                        header.classList.toggle('collapsed');
                        const content = header.nextElementSibling;
                        content.classList.toggle('collapsed');
                    });
                });
                
                // Color preset selection
                document.querySelectorAll('.color-preset').forEach(preset => {
                    preset.addEventListener('click', () => {
                        const color = preset.dataset.color;
                        const colorInput = preset.parentElement.querySelector('input[type="color"]');
                        if (colorInput) {
                            colorInput.value = color === 'transparent' ? '#000000' : color;
                            colorInput.dispatchEvent(new Event('change'));
                        }
                    });
                });
                
                // Range slider sync
                document.getElementById('prop-opacity').addEventListener('input', (e) => {
                    document.getElementById('prop-opacity-value').value = e.target.value;
                });
                
                document.getElementById('prop-opacity-value').addEventListener('input', (e) => {
                    document.getElementById('prop-opacity').value = e.target.value;
                });
                
                // Property change handlers
                function setupPropertyChangeHandlers() {
                    const inputs = document.querySelectorAll('#widgetProperties input, #widgetProperties select, #widgetProperties textarea');
                    inputs.forEach(input => {
                        input.addEventListener('change', () => {
                            if (currentWidget) {
                                updateProperty(input.id.replace('prop-', ''), input.value, input.type);
                            }
                        });
                    });
                }
                
                function updateProperty(property, value, type) {
                    if (type === 'checkbox') {
                        value = document.getElementById('prop-' + property).checked;
                    }
                    
                    vscode.postMessage({
                        command: 'updateProperty',
                        widgetId: currentWidget.id,
                        property: property,
                        value: value
                    });
                }
                
                function applyChanges() {
                    vscode.postMessage({
                        command: 'applyProperties',
                        widgetId: currentWidget.id
                    });
                }
                
                function resetProperties() {
                    if (currentWidget) {
                        loadWidgetProperties(currentWidget);
                    }
                }
                
                function deleteWidget() {
                    if (currentWidget && confirm('Delete this widget?')) {
                        vscode.postMessage({
                            command: 'deleteWidget',
                            widgetId: currentWidget.id
                        });
                    }
                }
                
                function showNoSelection() {
                    document.getElementById('noSelection').style.display = 'flex';
                    document.getElementById('widgetProperties').style.display = 'none';
                    currentWidget = null;
                }
                
                function showWidgetProperties(widget) {
                    document.getElementById('noSelection').style.display = 'none';
                    document.getElementById('widgetProperties').style.display = 'block';
                    currentWidget = widget;
                    loadWidgetProperties(widget);
                }
                
                function loadWidgetProperties(widget) {
                    document.getElementById('widgetType').textContent = widget.type;
                    document.getElementById('widgetId').textContent = widget.id;
                    
                    // Load property values
                    const props = widget.properties;
                    Object.entries(props).forEach(([key, value]) => {
                        const input = document.getElementById('prop-' + key);
                        if (input) {
                            if (input.type === 'checkbox') {
                                input.checked = value;
                            } else {
                                input.value = value;
                            }
                        }
                    });
                    
                    // Load position and size
                    document.getElementById('prop-x').value = widget.x || 0;
                    document.getElementById('prop-y').value = widget.y || 0;
                    document.getElementById('prop-width').value = widget.width || 100;
                    document.getElementById('prop-height').value = widget.height || 30;
                }
                
                // Message handling from designer
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'selectWidget':
                            showWidgetProperties(message.widget);
                            break;
                        case 'clearSelection':
                            showNoSelection();
                            break;
                        case 'updateWidget':
                            if (currentWidget && currentWidget.id === message.widget.id) {
                                loadWidgetProperties(message.widget);
                            }
                            break;
                    }
                });
                
                // Initialize
                document.addEventListener('DOMContentLoaded', () => {
                    setupPropertyChangeHandlers();
                    showNoSelection();
                });
            </script>
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
                        case 'updateFromCode':
                            updateObjectTreeFromWidgets(message.widgets);
                            break;
                        case 'updateFromDesigner':
                            updateObjectTreeFromWidgets(message.widgets);
                            break;
                    }
                });

                function updateObjectTreeFromWidgets(widgets) {
                    const tree = document.getElementById('objectTree');
                    tree.innerHTML = '';
                    
                    if (!widgets || widgets.length === 0) {
                        tree.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 12px;">No objects in form</div>';
                        return;
                    }
                    
                    widgets.forEach(widget => {
                        const item = document.createElement('div');
                        item.className = 'object-item';
                        item.textContent = '🎯 ' + widget.type + ' (' + widget.id + ')';
                        item.addEventListener('click', () => {
                            // Select this widget
                            document.querySelectorAll('.object-item').forEach(i => i.classList.remove('selected'));
                            item.classList.add('selected');
                            
                            // Update property editor
                            updateProperties(widget);
                            
                            // Notify designer to select this widget
                            vscode.postMessage({
                                command: 'selectWidget',
                                widgetId: widget.id
                            });
                        });
                        tree.appendChild(item);
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private setupMessageHandlers() {
        // Designer panel messages
        this._designerPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'generateQML':
                    this._widgets = message.widgets;
                    const qmlCode = this._syncEngine.generateQMLFromWidgets(message.widgets);
                    this._currentQmlContent = qmlCode;
                    
                    // Sync to VS Code editor and preview
                    await this._syncEngine.syncFromDesigner(message.widgets, qmlCode);
                    break;
                    
                case 'updateProperties':
                    this._propertyPanel?.webview.postMessage({
                        command: 'updateProperties',
                        widget: message.widget
                    });
                    break;
                    
                case 'widgetSelected':
                    this._selectedWidget = message.widget;
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
        this._propertyPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'updateWidgetProperty':
                    // Update the widget in the designer
                    this._designerPanel?.webview.postMessage({
                        command: 'updateProperty',
                        widgetId: message.widgetId,
                        property: message.property,
                        value: message.value
                    });
                    
                    // Sync the property change across all panels and editor
                    await this._syncEngine.syncFromProperties(
                        message.widgetId, 
                        message.property, 
                        message.value
                    );
                    break;
            }
        });

        // Preview panel messages  
        this._previewPanel?.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'refreshPreview':
                    // Refresh preview from current widgets
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: this._widgets
                    });
                    break;
            }
        });
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

    public dispose() {
        this._designerPanel?.dispose();
        this._previewPanel?.dispose(); 
        this._propertyPanel?.dispose();
        this._syncEngine.dispose();
    }

    private initializeWithActiveDocument() {
        // Check if there's an active QML document
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.languageId === 'qml') {
            // Parse existing QML and load into designer
            this._syncEngine.setActiveDocument(activeEditor.document);
        } else {
            // Initialize with a simple default layout
            this.initializeDefaultApplication();
        }
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
        
        this._widgets = defaultWidgets;
        const qmlCode = this._syncEngine.generateQMLFromWidgets(defaultWidgets);
        this._currentQmlContent = qmlCode;
        
        this._previewPanel?.webview.postMessage({
            command: 'updatePreview',
            widgets: defaultWidgets
        });
        
        this._designerPanel?.webview.postMessage({
            command: 'loadDesign',
            widgets: defaultWidgets
        });
    }
}
