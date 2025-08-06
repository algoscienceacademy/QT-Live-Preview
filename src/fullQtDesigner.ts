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
                    /* Black and White Professional Theme */
                    --primary-color: #ffffff;
                    --secondary-color: #e0e0e0;
                    --accent-color: #333333;
                    --success-color: #666666;
                    --warning-color: #888888;
                    --danger-color: #000000;
                    
                    --bg-primary: #000000;
                    --bg-secondary: #1a1a1a;
                    --bg-tertiary: #2a2a2a;
                    --bg-quaternary: #3a3a3a;
                    --bg-surface: #ffffff;
                    
                    --text-primary: #ffffff;
                    --text-secondary: #e0e0e0;
                    --text-tertiary: #cccccc;
                    --text-muted: #999999;
                    --text-inverse: #000000;
                    
                    --border-primary: #333333;
                    --border-secondary: #555555;
                    --border-light: #777777;
                    
                    --shadow-light: 0 2px 8px rgba(0,0,0,0.3);
                    --shadow-medium: 0 4px 16px rgba(0,0,0,0.4);
                    --shadow-heavy: 0 8px 32px rgba(0,0,0,0.5);
                    
                    --border-radius: 6px;
                    --transition-fast: 0.15s ease;
                    --transition-normal: 0.25s ease;
                    --transition-slow: 0.4s ease;
                }

                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }

                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .toolbar {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid var(--border-primary);
                    box-shadow: var(--shadow-light);
                }
                
                .toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .toolbar-title {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    margin-right: 24px;
                    display: flex;
                    align-items: center;
                    color: var(--text-primary);
                }
                
                .toolbar-title::before {
                    content: '⚫';
                    margin-right: 8px;
                    font-size: 18px;
                    color: var(--text-primary);
                }
                
                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding: 0 12px;
                    border-left: 1px solid var(--border-primary);
                    border-right: 1px solid var(--border-primary);
                }
                
                .toolbar-group:first-child {
                    border-left: none;
                }
                
                .toolbar-group:last-child {
                    border-right: none;
                }
                
                .toolbar button {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 8px 12px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all var(--transition-fast);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .toolbar button:hover { 
                    background: var(--bg-quaternary);
                    border-color: var(--border-secondary);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-light);
                }
                
                .toolbar button.active { 
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                    border-color: var(--border-light);
                    box-shadow: var(--shadow-medium);
                }
                
                .main-container {
                    display: flex;
                    flex: 1;
                    height: calc(100vh - 60px);
                    background: var(--bg-primary);
                }
                
                .widget-palette {
                    width: 280px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border-primary);
                    overflow-y: auto;
                    padding: 16px;
                    box-shadow: var(--shadow-light);
                }
                
                .palette-header {
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid var(--border-primary);
                }
                
                .palette-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                }
                
                .palette-title::before {
                    content: '⚫';
                    margin-right: 8px;
                    font-size: 16px;
                }
                
                .palette-subtitle {
                    font-size: 11px;
                    color: var(--text-muted);
                    font-weight: 400;
                }
                
                .design-area {
                    flex: 1;
                    background: var(--bg-tertiary);
                    position: relative;
                    overflow: auto;
                    margin: 16px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-medium);
                    border: 1px solid var(--border-primary);
                }
                
                .canvas {
                    width: 100%;
                    min-height: 600px;
                    position: relative;
                    background: 
                        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
                    background-size: 20px 20px;
                    background-color: var(--bg-tertiary);
                }
                
                .widget-group {
                    margin-bottom: 20px;
                }
                
                .widget-group h3 {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                    padding: 8px 12px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    display: flex;
                    align-items: center;
                    box-shadow: var(--shadow-light);
                }
                
                .widget-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    margin: 4px 0;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    cursor: grab;
                    transition: all var(--transition-fast);
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }
                
                .widget-item:hover {
                    background: var(--bg-quaternary);
                    border-color: var(--border-secondary);
                    transform: translateX(4px) translateY(-2px);
                    box-shadow: var(--shadow-light);
                    color: var(--text-primary);
                }
                
                .widget-item:active { 
                    cursor: grabbing;
                    transform: translateX(2px) translateY(-1px);
                }
                
                .widget-icon {
                    width: 18px;
                    height: 18px;
                    margin-right: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: var(--text-primary);
                }
                
                .dropped-widget {
                    position: absolute;
                    border: 2px solid var(--border-light);
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                    cursor: move;
                    min-width: 100px;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 500;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-light);
                    transition: all var(--transition-fast);
                }
                
                .dropped-widget.selected {
                    border-color: var(--text-primary);
                    box-shadow: var(--shadow-medium);
                    background: var(--bg-quaternary);
                    color: var(--text-primary);
                }
                
                .dropped-widget:hover {
                    border-color: var(--border-light);
                    transform: scale(1.02);
                    box-shadow: var(--shadow-medium);
                }
                
                .resize-handle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--text-primary);
                    border: 2px solid var(--bg-primary);
                    border-radius: 50%;
                    box-shadow: var(--shadow-light);
                    transition: all var(--transition-fast);
                }
                
                .resize-handle:hover {
                    transform: scale(1.2);
                    box-shadow: var(--shadow-medium);
                    background: var(--border-light);
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
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    padding: 8px 16px;
                    border-top: 1px solid var(--border-primary);
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
                    background: var(--text-primary);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .form-container {
                    margin: 20px;
                    min-height: 400px;
                    background: var(--bg-tertiary);
                    border: 2px dashed var(--border-primary);
                    border-radius: var(--border-radius);
                    position: relative;
                    transition: all var(--transition-normal);
                }
                
                .form-container:hover {
                    border-color: var(--border-secondary);
                    background: var(--bg-quaternary);
                }
                
                .form-container.has-content {
                    border: 1px solid var(--border-primary);
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
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                    padding: 8px 12px;
                    border-radius: var(--border-radius);
                    font-size: 11px;
                    font-weight: 500;
                    box-shadow: var(--shadow-medium);
                    border: 1px solid var(--border-primary);
                    z-index: 1000;
                    transition: all var(--transition-normal);
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
                        
                        // Send to VS Code for QML generation and editor update
                        vscode.postMessage({
                            command: 'generateQML',
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
                    
                    if (!widget) {
                        selectedWidget = null;
                        return;
                    }
                    
                    // Select new widget
                    selectedWidget = widget;
                    widget.classList.add('selected');
                    widget.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'block');
                    
                    // Send widget selection to property panel and VS Code
                    const widgetData = {
                        id: widget.dataset.id,
                        type: widget.dataset.widget,
                        properties: JSON.parse(widget.dataset.properties || '{}'),
                        x: parseInt(widget.style.left) || 0,
                        y: parseInt(widget.style.top) || 0,
                        width: parseInt(widget.style.width) || 100,
                        height: parseInt(widget.style.height) || 30
                    };
                    
                    vscode.postMessage({
                        command: 'widgetSelected',
                        widget: widgetData
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
                :root {
                    /* Black and White Theme */
                    --bg-primary: #000000;
                    --bg-secondary: #1a1a1a;
                    --bg-tertiary: #2a2a2a;
                    --bg-surface: #ffffff;
                    --text-primary: #ffffff;
                    --text-secondary: #e0e0e0;
                    --text-inverse: #000000;
                    --border-primary: #333333;
                    --border-secondary: #555555;
                    --shadow-light: 0 2px 8px rgba(0,0,0,0.3);
                    --border-radius: 6px;
                    --transition-fast: 0.15s ease;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-size: 13px;
                }
                
                .preview-toolbar {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid var(--border-primary);
                    box-shadow: var(--shadow-light);
                }
                
                .preview-title {
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                }
                
                .preview-title::before {
                    content: '▶';
                    margin-right: 8px;
                    font-size: 16px;
                }
                
                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: var(--text-secondary);
                }
                
                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--text-primary);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .preview-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .preview-btn {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 6px 12px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 11px;
                    transition: all var(--transition-fast);
                }
                
                .preview-btn:hover {
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                }
                
                .preview-container {
                    flex: 1;
                    padding: 20px;
                    overflow: auto;
                    background: var(--bg-tertiary);
                    margin: 16px;
                    border-radius: var(--border-radius);
                    border: 1px solid var(--border-primary);
                    box-shadow: var(--shadow-light);
                }
                
                .preview-frame {
                    width: 100%;
                    min-height: 500px;
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    background: var(--bg-surface);
                    position: relative;
                    overflow: hidden;
                }
                
                .preview-content {
                    padding: 20px;
                    height: 100%;
                    position: relative;
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                }
                
                .no-preview {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-inverse);
                    opacity: 0.6;
                }
                
                .no-preview-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                /* QML Widget Styles for Preview */
                .qml-widget {
                    position: absolute;
                    border: 1px solid var(--border-primary);
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: inherit;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                
                .qml-label { 
                    background: transparent;
                    border: none;
                    font-weight: 500;
                }
                
                .qml-button { 
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    font-weight: 500;
                }
                
                .qml-button:hover {
                    background: var(--bg-tertiary);
                }
                
                .qml-textfield {
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                    border: 1px solid var(--border-primary);
                    padding: 4px 8px;
                    font-size: 12px;
                }
                
                .qml-checkbox, .qml-radiobutton {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                
                .qml-rectangle {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                }
                
                .qml-container {
                    background: transparent;
                    border: 1px dashed var(--border-primary);
                }
            </style>
        </head>
        <body>
            <div class="preview-toolbar">
                <div class="preview-title">Live Preview</div>
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    <span>Live Sync Active</span>
                </div>
                <div class="preview-controls">
                    <button class="preview-btn" onclick="refreshPreview()">🔄 Refresh</button>
                    <button class="preview-btn" onclick="fullscreen()">⛶ Fullscreen</button>
                </div>
            </div>
            
            <div class="preview-container">
                <div class="preview-frame" id="previewFrame">
                    <div class="preview-content" id="previewContent">
                        <div class="no-preview">
                            <div class="no-preview-icon">▶</div>
                            <div>Start designing to see live preview</div>
                            <small style="opacity: 0.7; margin-top: 8px;">Widgets will appear here in real-time</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentWidgets = [];
                
                // Listen for widget updates from designer
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updatePreview':
                            updatePreview(message.widgets);
                            break;
                        case 'clearPreview':
                            clearPreview();
                            break;
                    }
                });
                
                function updatePreview(widgets) {
                    if (!widgets || widgets.length === 0) {
                        showNoPreview();
                        return;
                    }
                    
                    currentWidgets = widgets;
                    const previewContent = document.getElementById('previewContent');
                    previewContent.innerHTML = '';
                    
                    widgets.forEach(widget => {
                        const element = createPreviewWidget(widget);
                        previewContent.appendChild(element);
                    });
                }
                
                function createPreviewWidget(widget) {
                    const element = document.createElement('div');
                    element.className = 'qml-widget qml-' + widget.type.toLowerCase();
                    element.style.left = widget.x + 'px';
                    element.style.top = widget.y + 'px';
                    element.style.width = widget.width + 'px';
                    element.style.height = widget.height + 'px';
                    
                    // Apply properties
                    const props = widget.properties || {};
                    
                    if (props.text) {
                        element.textContent = props.text;
                    } else if (props.placeholderText) {
                        element.textContent = props.placeholderText;
                        element.style.opacity = '0.6';
                    } else {
                        element.textContent = widget.type;
                    }
                    
                    if (props.color) {
                        element.style.color = props.color;
                    }
                    
                    if (props.backgroundColor) {
                        element.style.backgroundColor = props.backgroundColor;
                    }
                    
                    if (props.border) {
                        element.style.border = props.border;
                    }
                    
                    if (props.fontSize) {
                        element.style.fontSize = props.fontSize + 'px';
                    }
                    
                    if (props.fontWeight) {
                        element.style.fontWeight = props.fontWeight;
                    }
                    
                    return element;
                }
                
                function showNoPreview() {
                    const previewContent = document.getElementById('previewContent');
                    previewContent.innerHTML = \`
                        <div class="no-preview">
                            <div class="no-preview-icon">▶</div>
                            <div>Start designing to see live preview</div>
                            <small style="opacity: 0.7; margin-top: 8px;">Widgets will appear here in real-time</small>
                        </div>
                    \`;
                }
                
                function clearPreview() {
                    currentWidgets = [];
                    showNoPreview();
                }
                
                function refreshPreview() {
                    vscode.postMessage({
                        command: 'refreshPreview'
                    });
                }
                
                function fullscreen() {
                    const frame = document.getElementById('previewFrame');
                    if (frame.requestFullscreen) {
                        frame.requestFullscreen();
                    }
                }
                
                // Initialize
                showNoPreview();
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
            <title>Property Panel</title>
            <style>
                :root {
                    /* Black and White Theme */
                    --bg-primary: #000000;
                    --bg-secondary: #1a1a1a;
                    --bg-tertiary: #2a2a2a;
                    --bg-surface: #ffffff;
                    --text-primary: #ffffff;
                    --text-secondary: #e0e0e0;
                    --text-inverse: #000000;
                    --border-primary: #333333;
                    --border-secondary: #555555;
                    --shadow-light: 0 2px 8px rgba(0,0,0,0.3);
                    --border-radius: 6px;
                    --transition-fast: 0.15s ease;
                }

                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }

                body { 
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .property-header {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    padding: 12px 16px;
                    border-bottom: 2px solid var(--border-primary);
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: var(--shadow-light);
                }
                
                .property-title {
                    display: flex;
                    align-items: center;
                }
                
                .property-title::before {
                    content: '⚙';
                    margin-right: 8px;
                    font-size: 16px;
                }
                
                .property-sync-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    color: var(--text-secondary);
                }
                
                .sync-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--text-primary);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .property-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: var(--bg-primary);
                }
                
                .no-selection {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: var(--text-secondary);
                    opacity: 0.6;
                }
                
                .no-selection-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .widget-info {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: var(--shadow-light);
                }
                
                .widget-type {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                }
                
                .widget-type::before {
                    content: '▣';
                    margin-right: 8px;
                    font-size: 18px;
                }
                
                .widget-id {
                    font-size: 11px;
                    color: var(--text-secondary);
                    font-family: 'Monaco', 'Consolas', monospace;
                    background: var(--bg-tertiary);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid var(--border-primary);
                }
                
                .property-group {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    margin-bottom: 16px;
                    overflow: hidden;
                    box-shadow: var(--shadow-light);
                }
                
                .property-group-header {
                    background: var(--bg-tertiary);
                    padding: 10px 16px;
                    border-bottom: 1px solid var(--border-primary);
                    font-weight: 600;
                    font-size: 12px;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: background-color var(--transition-fast);
                }
                
                .property-group-header:hover {
                    background: var(--bg-surface);
                    color: var(--text-inverse);
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
                    color: var(--text-secondary);
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
                    border-bottom: 1px solid var(--border-primary);
                    font-size: 12px;
                    transition: background-color var(--transition-fast);
                }
                
                .property-item:hover {
                    background-color: var(--bg-tertiary);
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
                    background: var(--bg-surface);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--border-radius);
                    color: var(--text-inverse);
                    font-size: 11px;
                    font-family: inherit;
                    transition: all var(--transition-fast);
                }
                
                .property-input input:focus,
                .property-input select:focus,
                .property-input textarea:focus {
                    outline: none;
                    border-color: var(--text-primary);
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
                }
                
                .property-input input[type="checkbox"] {
                    width: auto;
                    margin-right: 8px;
                }
                
                .property-input input[type="color"] {
                    width: 40px;
                    height: 30px;
                    padding: 0;
                    border: 1px solid var(--border-primary);
                    cursor: pointer;
                }
                
                .property-input textarea {
                    resize: vertical;
                    min-height: 60px;
                }
                
                .property-actions {
                    padding: 16px;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-primary);
                    display: flex;
                    gap: 8px;
                }
                
                .property-btn {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 8px 16px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all var(--transition-fast);
                    flex: 1;
                }
                
                .property-btn:hover {
                    background: var(--bg-surface);
                    color: var(--text-inverse);
                }
                
                .property-btn.primary {
                    background: var(--text-primary);
                    color: var(--text-inverse);
                }
                
                .property-btn.primary:hover {
                    background: var(--text-secondary);
                }
                
                /* Custom scrollbar */
                .property-content::-webkit-scrollbar {
                    width: 8px;
                }
                
                .property-content::-webkit-scrollbar-track {
                    background: var(--bg-primary);
                }
                
                .property-content::-webkit-scrollbar-thumb {
                    background: var(--border-primary);
                    border-radius: 4px;
                }
                
                .property-content::-webkit-scrollbar-thumb:hover {
                    background: var(--border-secondary);
                }
            </style>
        </head>
        <body>
            <div class="property-header">
                <div class="property-title">Properties</div>
                <div class="property-sync-indicator">
                    <div class="sync-dot"></div>
                    <span>Sync Active</span>
                </div>
            </div>
            
            <div class="property-content" id="propertyContent">
                <div class="no-selection">
                    <div class="no-selection-icon">⚙</div>
                    <div>No widget selected</div>
                    <small style="margin-top: 8px; opacity: 0.7;">Select a widget to edit properties</small>
                </div>
            </div>
            
            <div class="property-actions" id="propertyActions" style="display: none;">
                <button class="property-btn" onclick="resetProperties()">Reset</button>
                <button class="property-btn primary" onclick="applyProperties()">Apply</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentWidget = null;
                
                // Listen for widget selection
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'selectWidget':
                            showWidgetProperties(message.widget);
                            break;
                        case 'clearSelection':
                            clearProperties();
                            break;
                    }
                });
                
                function showWidgetProperties(widget) {
                    currentWidget = widget;
                    const content = document.getElementById('propertyContent');
                    const actions = document.getElementById('propertyActions');
                    
                    content.innerHTML = \`
                        <div class="widget-info">
                            <div class="widget-type">\${widget.type}</div>
                            <div class="widget-id">ID: \${widget.id}</div>
                        </div>
                        
                        <div class="property-group">
                            <div class="property-group-header" onclick="toggleGroup(this)">
                                <span><span class="property-group-icon">📐</span>Layout</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">X</div>
                                    <div class="property-input">
                                        <input type="number" value="\${widget.x}" onchange="updateProperty('x', this.value)">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Y</div>
                                    <div class="property-input">
                                        <input type="number" value="\${widget.y}" onchange="updateProperty('y', this.value)">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Width</div>
                                    <div class="property-input">
                                        <input type="number" value="\${widget.width}" onchange="updateProperty('width', this.value)">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Height</div>
                                    <div class="property-input">
                                        <input type="number" value="\${widget.height}" onchange="updateProperty('height', this.value)">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        \${generatePropertyGroups(widget)}
                    \`;
                    
                    actions.style.display = 'flex';
                }
                
                function generatePropertyGroups(widget) {
                    const props = widget.properties || {};
                    let html = '';
                    
                    // Common properties
                    if (props.text !== undefined || widget.type === 'Label' || widget.type === 'Button') {
                        html += \`
                            <div class="property-group">
                                <div class="property-group-header" onclick="toggleGroup(this)">
                                    <span><span class="property-group-icon">📝</span>Text</span>
                                    <span class="property-group-toggle">▼</span>
                                </div>
                                <div class="property-group-content">
                                    <div class="property-item">
                                        <div class="property-label">Text</div>
                                        <div class="property-input">
                                            <input type="text" value="\${props.text || ''}" onchange="updateProperty('text', this.value)">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }
                    
                    // Appearance properties
                    html += \`
                        <div class="property-group">
                            <div class="property-group-header" onclick="toggleGroup(this)">
                                <span><span class="property-group-icon">🎨</span>Appearance</span>
                                <span class="property-group-toggle">▼</span>
                            </div>
                            <div class="property-group-content">
                                <div class="property-item">
                                    <div class="property-label">Color</div>
                                    <div class="property-input">
                                        <input type="color" value="\${props.color || '#000000'}" onchange="updateProperty('color', this.value)">
                                    </div>
                                </div>
                                <div class="property-item">
                                    <div class="property-label">Background</div>
                                    <div class="property-input">
                                        <input type="color" value="\${props.backgroundColor || '#ffffff'}" onchange="updateProperty('backgroundColor', this.value)">
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    return html;
                }
                
                function toggleGroup(header) {
                    const content = header.nextElementSibling;
                    const isCollapsed = header.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        header.classList.remove('collapsed');
                        content.classList.remove('collapsed');
                    } else {
                        header.classList.add('collapsed');
                        content.classList.add('collapsed');
                    }
                }
                
                function updateProperty(property, value) {
                    if (!currentWidget) return;
                    
                    // Update current widget
                    if (['x', 'y', 'width', 'height'].includes(property)) {
                        currentWidget[property] = parseInt(value);
                    } else {
                        if (!currentWidget.properties) {
                            currentWidget.properties = {};
                        }
                        currentWidget.properties[property] = value;
                    }
                    
                    // Send update to designer
                    vscode.postMessage({
                        command: 'updateWidget',
                        widget: currentWidget
                    });
                }
                
                function clearProperties() {
                    currentWidget = null;
                    const content = document.getElementById('propertyContent');
                    const actions = document.getElementById('propertyActions');
                    
                    content.innerHTML = \`
                        <div class="no-selection">
                            <div class="no-selection-icon">⚙</div>
                            <div>No widget selected</div>
                            <small style="margin-top: 8px; opacity: 0.7;">Select a widget to edit properties</small>
                        </div>
                    \`;
                    
                    actions.style.display = 'none';
                }
                
                function resetProperties() {
                    if (!currentWidget) return;
                    
                    vscode.postMessage({
                        command: 'resetWidget',
                        widgetId: currentWidget.id
                    });
                }
                
                function applyProperties() {
                    if (!currentWidget) return;
                    
                    vscode.postMessage({
                        command: 'applyProperties',
                        widget: currentWidget
                    });
                }
                
                // Initialize
                clearProperties();
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
                    
                    // Update code editor
                    await this.updateCodeEditor(qmlCode);
                    
                    // Update preview panel
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: message.widgets
                    });
                    break;
                    
                case 'widgetSelected':
                    this._selectedWidget = message.widget;
                    // Send to property panel
                    this._propertyPanel?.webview.postMessage({
                        command: 'selectWidget',
                        widget: message.widget
                    });
                    break;
                    
                case 'refreshPreview':
                    // Refresh preview with current widgets
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: this._widgets
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
                case 'updateWidget':
                    const updatedWidget = message.widget;
                    // Find and update widget in widgets array
                    const widgetIndex = this._widgets.findIndex(w => w.id === updatedWidget.id);
                    if (widgetIndex !== -1) {
                        this._widgets[widgetIndex] = updatedWidget;
                        
                        // Update designer panel
                        this._designerPanel?.webview.postMessage({
                            command: 'updateWidget',
                            widget: updatedWidget
                        });
                        
                        // Update preview panel
                        this._previewPanel?.webview.postMessage({
                            command: 'updatePreview',
                            widgets: this._widgets
                        });
                        
                        // Generate and sync QML code
                        const qmlCode = this._syncEngine.generateQMLFromWidgets(this._widgets);
                        await this.updateCodeEditor(qmlCode);
                    }
                    break;
                    
                case 'resetWidget':
                    // Reset widget to default properties
                    const widget = this._widgets.find(w => w.id === message.widgetId);
                    if (widget) {
                        // Reset to default properties based on widget type
                        widget.properties = this.getDefaultProperties(widget.type);
                        
                        // Update all panels
                        this._designerPanel?.webview.postMessage({
                            command: 'updateWidget',
                            widget: widget
                        });
                        
                        this._propertyPanel?.webview.postMessage({
                            command: 'selectWidget',
                            widget: widget
                        });
                        
                        this._previewPanel?.webview.postMessage({
                            command: 'updatePreview',
                            widgets: this._widgets
                        });
                    }
                    break;
                    
                case 'applyProperties':
                    // Apply all property changes and sync to editor
                    const qmlCode = this._syncEngine.generateQMLFromWidgets(this._widgets);
                    await this.updateCodeEditor(qmlCode);
                    
                    vscode.window.showInformationMessage('Properties applied and synced to editor');
                    break;
            }
        });

        // Preview panel messages
        this._previewPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refreshPreview':
                    // Refresh preview with current widgets
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: this._widgets
                    });
                    break;
            }
        });

        // Property panel messages
        this._propertyPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'updateWidget':
                    const updatedWidget = message.widget;
                    // Find and update widget in widgets array
                    const widgetIndex = this._widgets.findIndex(w => w.id === updatedWidget.id);
                    if (widgetIndex !== -1) {
                        this._widgets[widgetIndex] = updatedWidget;
                        
                        // Update designer panel
                        this._designerPanel?.webview.postMessage({
                            command: 'updateWidget',
                            widget: updatedWidget
                        });
                        
                        // Update preview panel
                        this._previewPanel?.webview.postMessage({
                            command: 'updatePreview',
                            widgets: this._widgets
                        });
                        
                        // Generate and sync QML code
                        const qmlCode = this._syncEngine.generateQMLFromWidgets(this._widgets);
                        await this.updateCodeEditor(qmlCode);
                    }
                    break;
                    
                case 'resetWidget':
                    // Reset widget to default properties
                    const widget = this._widgets.find(w => w.id === message.widgetId);
                    if (widget) {
                        // Reset to default properties based on widget type
                        widget.properties = this.getDefaultProperties(widget.type);
                        
                        // Update all panels
                        this._designerPanel?.webview.postMessage({
                            command: 'updateWidget',
                            widget: widget
                        });
                        
                        this._propertyPanel?.webview.postMessage({
                            command: 'selectWidget',
                            widget: widget
                        });
                        
                        this._previewPanel?.webview.postMessage({
                            command: 'updatePreview',
                            widgets: this._widgets
                        });
                    }
                    break;
                    
                case 'applyProperties':
                    // Apply all property changes and sync to editor
                    const qmlCode = this._syncEngine.generateQMLFromWidgets(this._widgets);
                    await this.updateCodeEditor(qmlCode);
                    
                    vscode.window.showInformationMessage('Properties applied and synced to editor');
                    break;
            }
        });

        // Preview panel messages
        this._previewPanel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refreshPreview':
                    // Refresh preview with current widgets
                    this._previewPanel?.webview.postMessage({
                        command: 'updatePreview',
                        widgets: this._widgets
                    });
                    break;
            }
        });
    }

    private getDefaultProperties(type: string): any {
        const defaults: { [key: string]: any } = {
            'Button': { text: 'Button', color: '#000000', backgroundColor: '#ffffff' },
            'Label': { text: 'Label', color: '#000000', backgroundColor: 'transparent' },
            'TextField': { text: '', placeholderText: 'Enter text...', color: '#000000', backgroundColor: '#ffffff' },
            'CheckBox': { text: 'CheckBox', checked: false, color: '#000000' },
            'RadioButton': { text: 'RadioButton', checked: false, color: '#000000' },
            'Rectangle': { color: '#000000', backgroundColor: '#ffffff' },
            'Image': { source: '', fillMode: 'PreserveAspectFit' }
        };
        return defaults[type] || {};
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
