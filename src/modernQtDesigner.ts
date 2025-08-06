import * as vscode from 'vscode';

export class ModernQtDesigner {
    private _designerPanel?: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public async openDesigner(uri?: vscode.Uri) {
        // If a URI is provided, load the file content
        let initialContent = '';
        let fileName = 'untitled.qml';
        
        if (uri) {
            try {
                const document = await vscode.workspace.openTextDocument(uri);
                initialContent = document.getText();
                fileName = uri.fsPath.split(/[/\\]/).pop() || 'untitled.qml';
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load file: ${error}`);
            }
        }

        this._designerPanel = vscode.window.createWebviewPanel(
            'modernQtDesigner',
            `🎨 Modern Qt Designer Studio - ${fileName}`,
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        this._designerPanel.webview.html = this.getWebviewContent(initialContent, fileName);

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
                    case 'previewDesign':
                        this.previewDesign(message.data);
                        break;
                    case 'exportDesign':
                        this.exportDesign(message.data, message.format);
                        break;
                    case 'loadTemplate':
                        this.loadTemplate(message.template);
                        break;
                }
            },
            undefined
        );
    }

    private getWebviewContent(initialContent: string = '', fileName: string = 'untitled.qml'): string {
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
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            padding: 0 12px;
            border-right: 1px solid var(--border-light);
            position: relative;
        }

        .toolbar-section:last-child {
            border-right: none;
        }

        .section-label {
            font-size: 10px;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .toolbar-buttons {
            display: flex;
            gap: 4px;
        }

        .toolbar-btn {
            background: var(--tertiary-bg);
            border: 1px solid var(--border-light);
            color: var(--text-primary);
            padding: 6px 10px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: var(--transition-fast);
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: auto;
            white-space: nowrap;
        }

        .toolbar-btn:hover {
            background: var(--quaternary-bg);
            border-color: var(--border-medium);
            color: var(--text-primary);
            transform: translateY(-1px);
            box-shadow: var(--shadow-light);
        }

        .toolbar-btn.active {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
            color: white;
            box-shadow: var(--shadow-medium);
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

        .toolbar-btn.info {
            background: #17a2b8;
            border-color: #17a2b8;
            color: white;
        }

        .toolbar-btn.danger {
            background: var(--accent-red);
            border-color: var(--accent-red);
            color: white;
        }
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

        /* Center Panel Styles */
        .center-panel {
            flex: 1;
            background: var(--primary-bg);
            display: flex;
            flex-direction: column;
        }

        .center-tabs {
            background: var(--tertiary-bg);
            border-bottom: 1px solid var(--border-light);
            display: flex;
            padding: 0 16px;
        }

        .center-tab {
            padding: 12px 20px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: var(--transition-fast);
        }

        .center-tab.active {
            color: var(--accent-blue);
            border-bottom-color: var(--accent-blue);
            background: var(--secondary-bg);
        }

        .center-tab:hover:not(.active) {
            color: var(--text-primary);
            background: var(--quaternary-bg);
        }

        /* Design Area */
        .design-area {
            flex: 1;
            background: var(--primary-bg);
            display: flex;
            flex-direction: column;
        }

        .design-area.hidden {
            display: none;
        }

        /* Preview Area */
        .preview-area {
            flex: 1;
            background: var(--primary-bg);
            display: flex;
            flex-direction: column;
        }

        .preview-area.hidden {
            display: none;
        }

        .preview-header {
            background: var(--tertiary-bg);
            border-bottom: 1px solid var(--border-light);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .preview-controls {
            display: flex;
            gap: 8px;
        }

        .preview-btn {
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            color: var(--text-primary);
            padding: 6px 12px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 11px;
            transition: var(--transition-fast);
        }

        .preview-btn:hover {
            background: var(--accent-blue);
            color: white;
        }

        .preview-content {
            flex: 1;
            background: white;
            margin: 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            overflow: hidden;
        }

        /* Split View */
        .split-view {
            flex: 1;
            display: flex;
        }

        .split-view.hidden {
            display: none;
        }

        .split-pane {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .split-divider {
            width: 4px;
            background: var(--border-light);
            cursor: col-resize;
            transition: var(--transition-fast);
        }

        .split-divider:hover {
            background: var(--accent-blue);
        }

        .pane-header {
            background: var(--tertiary-bg);
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border-light);
        }

        .pane-content {
            flex: 1;
            background: var(--primary-bg);
            position: relative;
        }

        .canvas-container-small {
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle, var(--border-light) 1px, transparent 1px);
            background-size: 20px 20px;
            overflow: auto;
        }

        .design-canvas-small {
            position: relative;
            margin: 20px;
            min-width: 400px;
            min-height: 300px;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            overflow: hidden;
            transform: scale(0.7);
            transform-origin: top left;
        }

        .canvas-content-small {
            min-height: 300px;
            position: relative;
            background: white;
        }

        .preview-content-small {
            flex: 1;
            background: white;
            margin: 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            overflow: hidden;
        }

        /* Code View */
        .code-view {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .code-view.hidden {
            display: none;
        }

        .code-tabs {
            background: var(--tertiary-bg);
            border-bottom: 1px solid var(--border-light);
            display: flex;
            padding: 0 16px;
        }

        .code-tab {
            padding: 8px 16px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            border-bottom: 2px solid transparent;
            transition: var(--transition-fast);
        }

        .code-tab.active {
            color: var(--accent-blue);
            border-bottom-color: var(--accent-blue);
        }

        .code-tab:hover:not(.active) {
            color: var(--text-primary);
        }

        .code-editor-container {
            flex: 1;
            padding: 16px;
            background: var(--secondary-bg);
        }

        .code-editor {
            width: 100%;
            height: 100%;
            background: var(--primary-bg);
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            color: var(--text-primary);
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            padding: 16px;
            resize: none;
            outline: none;
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

        /* Enhanced Properties Panel */
        .properties-panel {
            width: 320px;
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
            margin-bottom: 4px;
        }

        .properties-subtitle {
            font-size: 11px;
            color: var(--text-muted);
            margin-bottom: 8px;
        }

        .properties-actions {
            display: flex;
            gap: 4px;
        }

        .prop-btn {
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            padding: 4px 8px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 10px;
            transition: var(--transition-fast);
        }

        .prop-btn:hover {
            background: var(--accent-blue);
            color: white;
        }

        .properties-content {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .property-group {
            margin-bottom: 16px;
            background: var(--tertiary-bg);
            border-radius: var(--border-radius);
            overflow: hidden;
        }

        .property-group-header {
            padding: 10px 12px;
            background: var(--quaternary-bg);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: var(--transition-fast);
        }

        .property-group-header:hover {
            background: var(--accent-blue);
            color: white;
        }

        .property-group-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .group-toggle {
            font-size: 10px;
            color: var(--text-muted);
            transition: transform var(--transition-fast);
        }

        .property-group-header.collapsed .group-toggle {
            transform: rotate(-90deg);
        }

        .property-group-content {
            padding: 12px;
            background: var(--tertiary-bg);
        }

        .property-group-content.collapsed {
            display: none;
        }

        .property-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .property-row {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .property-row .property-item {
            flex: 1;
            margin-bottom: 0;
        }

        .property-label {
            font-size: 11px;
            color: var(--text-secondary);
            min-width: 70px;
            font-weight: 500;
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
            transition: var(--transition-fast);
        }

        .property-input:focus {
            outline: none;
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }

        .property-checkbox {
            width: 16px;
            height: 16px;
            margin-left: 8px;
            accent-color: var(--accent-blue);
        }

        .property-textarea {
            flex: 1;
            padding: 8px;
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            border-radius: var(--border-radius);
            color: var(--text-primary);
            font-size: 11px;
            margin-left: 8px;
            min-height: 60px;
            resize: vertical;
            font-family: inherit;
        }

        .code-textarea {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            min-height: 80px;
        }

        .font-selector {
            display: flex;
            gap: 4px;
            flex: 1;
            margin-left: 8px;
        }

        .font-family {
            flex: 2;
            margin-left: 0;
        }

        .font-size {
            flex: 1;
            margin-left: 0;
        }

        .color-picker {
            display: flex;
            gap: 4px;
            flex: 1;
            margin-left: 8px;
        }

        .color-input {
            width: 30px;
            height: 24px;
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            margin-left: 0;
        }

        .color-text {
            flex: 1;
            margin-left: 0;
        }

        .signals-slots-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .add-connection-btn {
            background: var(--accent-green);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: var(--transition-fast);
        }

        .add-connection-btn:hover {
            background: var(--accent-blue);
        }

        .connections-list {
            background: var(--quaternary-bg);
            border-radius: var(--border-radius);
            padding: 8px;
            min-height: 60px;
            border: 1px solid var(--border-light);
        }

        .style-preset-buttons {
            display: flex;
            gap: 4px;
            margin-top: 8px;
        }

        .preset-btn {
            background: var(--quaternary-bg);
            border: 1px solid var(--border-light);
            color: var(--text-secondary);
            padding: 6px 12px;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            transition: var(--transition-fast);
            flex: 1;
        }

        .preset-btn:hover {
            background: var(--accent-blue);
            color: white;
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
                    Modern Qt Designer Studio
                </div>
                <div class="menu-items">
                    <button class="menu-item" onclick="showFileMenu()">File</button>
                    <button class="menu-item" onclick="showEditMenu()">Edit</button>
                    <button class="menu-item" onclick="showViewMenu()">View</button>
                    <button class="menu-item" onclick="showFormMenu()">Form</button>
                    <button class="menu-item" onclick="showToolsMenu()">Tools</button>
                    <button class="menu-item" onclick="showTemplatesMenu()">Templates</button>
                    <button class="menu-item" onclick="showHelpMenu()">Help</button>
                </div>
            </div>
            <div class="menu-right">
                <button class="menu-item" onclick="showSettings()">⚙️ Settings</button>
                <button class="menu-item" onclick="toggleTheme()">🌙 Theme</button>
            </div>
        </div>

        <!-- Enhanced Toolbar -->
        <div class="toolbar">
            <div class="toolbar-section">
                <span class="section-label">File</span>
                <button class="toolbar-btn primary" onclick="newDesign()" title="Create New Design">📄 New</button>
                <button class="toolbar-btn" onclick="openDesign()" title="Open Existing Design">📁 Open</button>
                <button class="toolbar-btn" onclick="saveDesign()" title="Save Current Design">💾 Save</button>
                <button class="toolbar-btn" onclick="saveAsDesign()" title="Save As...">💾 Save As</button>
                <button class="toolbar-btn" onclick="exportDesign()" title="Export Design">📤 Export</button>
            </div>
            
            <div class="toolbar-section">
                <span class="section-label">Edit</span>
                <button class="toolbar-btn" onclick="undoAction()" title="Undo (Ctrl+Z)">↶ Undo</button>
                <button class="toolbar-btn" onclick="redoAction()" title="Redo (Ctrl+Y)">↷ Redo</button>
                <button class="toolbar-btn" onclick="cutSelection()" title="Cut (Ctrl+X)">✂️ Cut</button>
                <button class="toolbar-btn" onclick="copySelection()" title="Copy (Ctrl+C)">📋 Copy</button>
                <button class="toolbar-btn" onclick="pasteSelection()" title="Paste (Ctrl+V)">📋 Paste</button>
                <button class="toolbar-btn danger" onclick="deleteSelection()" title="Delete (Del)">🗑️ Delete</button>
            </div>
            
            <div class="toolbar-section">
                <span class="section-label">Tools</span>
                <button class="toolbar-btn active" onclick="selectTool()" title="Selection Tool">🔍 Select</button>
                <button class="toolbar-btn" onclick="signalSlotTool()" title="Signal/Slot Connections">� Signals</button>
                <button class="toolbar-btn" onclick="layoutTool()" title="Layout Tools">� Layout</button>
                <button class="toolbar-btn" onclick="alignTool()" title="Alignment Tools">� Align</button>
            </div>
            
            <div class="toolbar-section">
                <span class="section-label">Templates</span>
                <button class="toolbar-btn" onclick="loadTemplate('window')" title="Load Window Template">🪟 Window</button>
                <button class="toolbar-btn" onclick="loadTemplate('dialog')" title="Load Dialog Template">� Dialog</button>
                <button class="toolbar-btn" onclick="loadTemplate('form')" title="Load Form Template">� Form</button>
            </div>
            
            <div class="toolbar-section">
                <span class="section-label">Preview & Code</span>
                <button class="toolbar-btn success" onclick="previewDesign()" title="Live Preview (F5)">▶️ Preview</button>
                <button class="toolbar-btn info" onclick="generateQMLCode()" title="Generate QML Code">� QML</button>
                <button class="toolbar-btn info" onclick="generateCppCode()" title="Generate C++ Code">🟨 C++</button>
                <button class="toolbar-btn" onclick="openExternalDesigner()" title="Open in External Qt Designer">🪟 External</button>
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

            <!-- Center Panel with Design + Live Preview -->
            <div class="center-panel">
                <div class="center-tabs">
                    <button class="center-tab active" onclick="showDesignView()">🎨 Design</button>
                    <button class="center-tab" onclick="showPreviewView()">▶️ Live Preview</button>
                    <button class="center-tab" onclick="showSplitView()">🔄 Split View</button>
                    <button class="center-tab" onclick="showCodeView()">💻 Code</button>
                </div>
                
                <!-- Design View -->
                <div class="design-area" id="designView">
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

                <!-- Live Preview View -->
                <div class="preview-area hidden" id="previewView">
                    <div class="preview-header">
                        <span>🔴 Live Preview</span>
                        <div class="preview-controls">
                            <button class="preview-btn" onclick="refreshPreview()">🔄 Refresh</button>
                            <button class="preview-btn" onclick="toggleAutoRefresh()">⚡ Auto</button>
                            <button class="preview-btn" onclick="openExternalPreview()">🪟 External</button>
                        </div>
                    </div>
                    <div class="preview-content" id="previewContent">
                        <iframe id="previewFrame" src="about:blank" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>

                <!-- Split View -->
                <div class="split-view hidden" id="splitView">
                    <div class="split-pane left-pane">
                        <div class="pane-header">🎨 Design</div>
                        <div class="pane-content">
                            <div class="canvas-container-small">
                                <div class="design-canvas-small" id="designCanvasSmall">
                                    <div class="canvas-content-small" id="canvasContentSmall">
                                        <!-- Design content will be mirrored here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="split-divider"></div>
                    <div class="split-pane right-pane">
                        <div class="pane-header">▶️ Live Preview</div>
                        <div class="pane-content">
                            <div class="preview-content-small" id="previewContentSmall">
                                <iframe id="previewFrameSmall" src="about:blank" style="width: 100%; height: 100%; border: none;"></iframe>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Code View -->
                <div class="code-view hidden" id="codeView">
                    <div class="code-tabs">
                        <button class="code-tab active" onclick="showQMLCode()">QML</button>
                        <button class="code-tab" onclick="showCppCode()">C++</button>
                        <button class="code-tab" onclick="showUICode()">UI File</button>
                    </div>
                    <div class="code-editor-container">
                        <textarea id="codeEditor" class="code-editor" readonly></textarea>
                    </div>
                </div>
            </div>

            <!-- Enhanced Properties Panel -->
            <div class="properties-panel">
                <div class="properties-header">
                    <div class="properties-title">Properties</div>
                    <div class="properties-subtitle" id="propertiesSubtitle">No widget selected</div>
                    <div class="properties-actions">
                        <button class="prop-btn" onclick="resetProperties()" title="Reset to defaults">🔄</button>
                        <button class="prop-btn" onclick="copyProperties()" title="Copy properties">📋</button>
                        <button class="prop-btn" onclick="pasteProperties()" title="Paste properties">📋+</button>
                    </div>
                </div>
                <div class="properties-content" id="propertiesContent">
                    <!-- Object Properties -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">🔧 Object</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="property-item">
                                <span class="property-label">objectName</span>
                                <input type="text" class="property-input" id="prop-objectName" placeholder="Enter object name">
                            </div>
                            <div class="property-item">
                                <span class="property-label">className</span>
                                <input type="text" class="property-input" id="prop-className" readonly>
                            </div>
                            <div class="property-item">
                                <span class="property-label">parent</span>
                                <select class="property-input" id="prop-parent">
                                    <option value="">None</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Geometry Properties -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">📐 Geometry</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="property-row">
                                <div class="property-item">
                                    <span class="property-label">x</span>
                                    <input type="number" class="property-input" id="prop-x" value="0">
                                </div>
                                <div class="property-item">
                                    <span class="property-label">y</span>
                                    <input type="number" class="property-input" id="prop-y" value="0">
                                </div>
                            </div>
                            <div class="property-row">
                                <div class="property-item">
                                    <span class="property-label">width</span>
                                    <input type="number" class="property-input" id="prop-width" value="100" min="1">
                                </div>
                                <div class="property-item">
                                    <span class="property-label">height</span>
                                    <input type="number" class="property-input" id="prop-height" value="30" min="1">
                                </div>
                            </div>
                            <div class="property-item">
                                <span class="property-label">sizePolicy</span>
                                <select class="property-input" id="prop-sizePolicy">
                                    <option value="Fixed">Fixed</option>
                                    <option value="Expanding">Expanding</option>
                                    <option value="Preferred">Preferred</option>
                                    <option value="Minimum">Minimum</option>
                                    <option value="Maximum">Maximum</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Appearance Properties -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">🎨 Appearance</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="property-item">
                                <span class="property-label">text</span>
                                <input type="text" class="property-input" id="prop-text" placeholder="Enter text">
                            </div>
                            <div class="property-item">
                                <span class="property-label">font</span>
                                <div class="font-selector">
                                    <select class="property-input font-family" id="prop-fontFamily">
                                        <option>Segoe UI</option>
                                        <option>Arial</option>
                                        <option>Times New Roman</option>
                                        <option>Courier New</option>
                                    </select>
                                    <input type="number" class="property-input font-size" id="prop-fontSize" value="9" min="6" max="72">
                                </div>
                            </div>
                            <div class="property-row">
                                <div class="property-item">
                                    <span class="property-label">bold</span>
                                    <input type="checkbox" class="property-checkbox" id="prop-bold">
                                </div>
                                <div class="property-item">
                                    <span class="property-label">italic</span>
                                    <input type="checkbox" class="property-checkbox" id="prop-italic">
                                </div>
                            </div>
                            <div class="property-item">
                                <span class="property-label">textAlign</span>
                                <select class="property-input" id="prop-textAlign">
                                    <option value="AlignLeft">Left</option>
                                    <option value="AlignCenter">Center</option>
                                    <option value="AlignRight">Right</option>
                                    <option value="AlignJustify">Justify</option>
                                </select>
                            </div>
                            <div class="property-item">
                                <span class="property-label">backgroundColor</span>
                                <div class="color-picker">
                                    <input type="color" class="color-input" id="prop-backgroundColor" value="#ffffff">
                                    <input type="text" class="property-input color-text" id="prop-backgroundColorText" value="#ffffff">
                                </div>
                            </div>
                            <div class="property-item">
                                <span class="property-label">textColor</span>
                                <div class="color-picker">
                                    <input type="color" class="color-input" id="prop-textColor" value="#000000">
                                    <input type="text" class="property-input color-text" id="prop-textColorText" value="#000000">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Behavior Properties -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">⚙️ Behavior</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="property-row">
                                <div class="property-item">
                                    <span class="property-label">enabled</span>
                                    <input type="checkbox" class="property-checkbox" id="prop-enabled" checked>
                                </div>
                                <div class="property-item">
                                    <span class="property-label">visible</span>
                                    <input type="checkbox" class="property-checkbox" id="prop-visible" checked>
                                </div>
                            </div>
                            <div class="property-item">
                                <span class="property-label">toolTip</span>
                                <input type="text" class="property-input" id="prop-toolTip" placeholder="Enter tooltip text">
                            </div>
                            <div class="property-item">
                                <span class="property-label">whatsThis</span>
                                <textarea class="property-textarea" id="prop-whatsThis" placeholder="Enter help text"></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Widget-Specific Properties -->
                    <div class="property-group" id="specificPropertiesGroup" style="display: none;">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title" id="specificPropertiesTitle">🔍 Specific</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content" id="specificPropertiesContent">
                            <!-- Widget-specific properties will be added here dynamically -->
                        </div>
                    </div>

                    <!-- Signals & Slots -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">📡 Signals & Slots</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="signals-slots-container">
                                <button class="add-connection-btn" onclick="addSignalSlotConnection()">+ Add Connection</button>
                                <div class="connections-list" id="connectionsList">
                                    <!-- Signal-slot connections will be listed here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Style Sheet -->
                    <div class="property-group">
                        <div class="property-group-header" onclick="togglePropertyGroup(this)">
                            <span class="property-group-title">🎭 Style Sheet</span>
                            <span class="group-toggle">▼</span>
                        </div>
                        <div class="property-group-content">
                            <div class="property-item">
                                <span class="property-label">styleSheet</span>
                                <textarea class="property-textarea code-textarea" id="prop-styleSheet" placeholder="Enter CSS-like styling"></textarea>
                            </div>
                            <div class="style-preset-buttons">
                                <button class="preset-btn" onclick="applyStylePreset('modern')">Modern</button>
                                <button class="preset-btn" onclick="applyStylePreset('classic')">Classic</button>
                                <button class="preset-btn" onclick="applyStylePreset('dark')">Dark</button>
                            </div>
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
        
        // =============================================================================
        // ONCLICK FUNCTION HANDLERS FOR TOOLBAR AND MENU ITEMS
        // =============================================================================
        
        // Menu Functions
        function showFileMenu() { 
            console.log('File menu clicked'); 
        }
        function showEditMenu() { 
            console.log('Edit menu clicked'); 
        }
        function showViewMenu() { 
            console.log('View menu clicked'); 
        }
        function showFormMenu() { 
            console.log('Form menu clicked'); 
        }
        function showToolsMenu() { 
            console.log('Tools menu clicked'); 
        }
        function showTemplatesMenu() { 
            console.log('Templates menu clicked'); 
        }
        function showHelpMenu() { 
            console.log('Help menu clicked'); 
        }
        function showSettings() { 
            alert('Settings panel coming soon!'); 
        }
        function toggleTheme() { 
            document.body.classList.toggle('light-theme');
            updateStatusBar('Theme toggled');
        }

        // File Operations
        function newDesign() {
            if (widgets.length > 0 && !confirm('Create new design? Current work will be lost.')) {
                return;
            }
            clearDesign();
            updateStatusBar('New design created');
        }

        function openDesign() {
            // Trigger file open dialog via VS Code
            vscode.postMessage({ command: 'openDesign' });
        }

        function saveDesign() {
            const qmlCode = generateQMLCode();
            const designData = {
                qml: qmlCode,
                widgets: widgets,
                metadata: {
                    created: new Date().toISOString(),
                    designer: 'Modern Qt Designer Studio'
                }
            };
            
            vscode.postMessage({
                command: 'saveDesign',
                data: designData
            });
            updateStatusBar('Design saved');
        }

        function exportDesign() {
            const qmlCode = generateQMLCode();
            const cppCode = generateCppCode();
            
            vscode.postMessage({
                command: 'exportDesign',
                data: { qml: qmlCode, cpp: cppCode },
                format: 'qml'
            });
            updateStatusBar('Design exported');
        }

        // Edit Operations
        function undoAction() {
            undo();
        }

        function redoAction() {
            redo();
        }

        function cutSelection() {
            if (selectedWidget) {
                copySelection();
                deleteSelection();
            }
        }

        function copySelection() {
            if (selectedWidget) {
                localStorage.setItem('qtDesignerClipboard', JSON.stringify({
                    type: selectedWidget.dataset.widget,
                    width: selectedWidget.style.width,
                    height: selectedWidget.style.height,
                    text: selectedWidget.textContent
                }));
                updateStatusBar('Widget copied to clipboard');
            }
        }

        function pasteSelection() {
            const clipboardData = localStorage.getItem('qtDesignerClipboard');
            if (clipboardData) {
                const widgetData = JSON.parse(clipboardData);
                // Create widget at mouse position or center
                createWidget(widgetData.type, 100, 100);
                updateStatusBar('Widget pasted from clipboard');
            }
        }

        function deleteSelection() {
            if (selectedWidget) {
                deleteWidget(selectedWidget);
            }
        }

        // Tool Functions
        function selectTool() {
            setActiveTool('select');
            updateStatusBar('Selection tool active');
        }

        function signalSlotTool() {
            toggleSignalSlotMode();
            updateStatusBar('Signal/Slot connection mode toggled');
        }

        function layoutTool() {
            setActiveTool('layout');
            showLayoutOptions();
        }

        function alignTool() {
            setActiveTool('align');
            showAlignmentOptions();
        }

        function setActiveTool(toolName) {
            // Remove active class from all toolbar buttons
            document.querySelectorAll('.toolbar-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button (if event is available)
            if (event && event.target) {
                event.target.classList.add('active');
            }
        }

        // Template Functions
        function loadTemplate(templateName) {
            vscode.postMessage({
                command: 'loadTemplate',
                template: templateName
            });
            updateStatusBar(\`Loading \${templateName} template...\`);
        }

        // Preview and Code Generation
        function previewDesign() {
            const qmlCode = generateQMLCode();
            vscode.postMessage({
                command: 'previewDesign',
                data: { qml: qmlCode }
            });
            updateStatusBar('Starting live preview...');
        }

        function generateQMLCode() {
            const widgetElements = document.querySelectorAll('.dropped-widget');
            if (widgetElements.length === 0) {
                return \`import QtQuick 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    width: 640
    height: 480
    visible: true
    title: "Untitled Design"
    
    // Add your content here
}\`;
            }

            let qml = \`import QtQuick 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    width: 640
    height: 480
    visible: true
    title: "Generated Design"

\`;

            widgetElements.forEach(widget => {
                const widgetType = widget.dataset.widget;
                const x = parseInt(widget.style.left) || 0;
                const y = parseInt(widget.style.top) || 0;
                const width = parseInt(widget.style.width) || 100;
                const height = parseInt(widget.style.height) || 30;
                const text = widget.textContent || '';

                // Convert Qt widget to QML equivalent
                let qmlWidget = '';
                switch(widgetType) {
                    case 'QPushButton':
                        qmlWidget = \`    Button {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        text: "\${text}"
    }\`;
                        break;
                    case 'QLabel':
                        qmlWidget = \`    Text {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        text: "\${text}"
        font.pixelSize: 12
    }\`;
                        break;
                    case 'QLineEdit':
                        qmlWidget = \`    TextField {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        placeholderText: "\${text}"
    }\`;
                        break;
                    case 'QCheckBox':
                        qmlWidget = \`    CheckBox {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        text: "\${text}"
    }\`;
                        break;
                    default:
                        qmlWidget = \`    Rectangle {
        x: \${x}
        y: \${y}
        width: \${width}
        height: \${height}
        color: "lightgray"
        border.color: "gray"
        
        Text {
            anchors.centerIn: parent
            text: "\${text}"
        }
    }\`;
                }
                qml += qmlWidget + '\\n\\n';
            });

            qml += '}';
            return qml;
        }

        function generateCppCode() {
            return \`#include <QApplication>
#include <QMainWindow>
#include <QVBoxLayout>
#include <QWidget>
#include <QPushButton>
#include <QLabel>
#include <QLineEdit>

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    QMainWindow window;
    window.setWindowTitle("Generated Design");
    window.resize(640, 480);

    QWidget *centralWidget = new QWidget(&window);
    window.setCentralWidget(centralWidget);

    // Add widgets here
    // TODO: Generate widget creation code

    window.show();
    return app.exec();
}\`;
        }

        function generateQMLCodeBtn() {
            vscode.postMessage({
                command: 'generateCode',
                type: 'qml',
                data: { qml: generateQMLCode() }
            });
        }

        function generateCppCodeBtn() {
            vscode.postMessage({
                command: 'generateCode',
                type: 'cpp',
                data: { cpp: generateCppCode() }
            });
        }

        // Layout Functions
        function showLayoutOptions() {
            alert('Layout options: Horizontal, Vertical, Grid, Form');
        }

        function showAlignmentOptions() {
            alert('Alignment options: Left, Center, Right, Top, Middle, Bottom');
        }

        function layoutHorizontally() {
            if (widgets.length < 2) return;
            // Implement horizontal layout
            updateStatusBar('Widgets laid out horizontally');
        }

        function layoutVertically() {
            if (widgets.length < 2) return;
            // Implement vertical layout
            updateStatusBar('Widgets laid out vertically');
        }

        // Toggle category function for widget palette
        function toggleCategory(header) {
            const category = header.parentElement;
            const content = category.querySelector('.widget-grid');
            const icon = header.querySelector('.category-icon');
            
            if (content.style.display === 'none') {
                content.style.display = 'grid';
                icon.textContent = '▼';
            } else {
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        }

        // Status bar update function
        function updateStatusBar(message = 'Ready') {
            const statusBar = document.querySelector('.status-bar');
            if (statusBar) {
                statusBar.textContent = message;
            }
        }

        // =============================================================================
        // VIEW MANAGEMENT FUNCTIONS
        // =============================================================================
        
        let currentView = 'design';
        let autoRefreshEnabled = false;
        let previewTimer = null;

        function showDesignView() {
            switchView('design');
        }

        function showPreviewView() {
            switchView('preview');
            updatePreview();
        }

        function showSplitView() {
            switchView('split');
            updatePreview();
            syncDesignToSmallCanvas();
        }

        function showCodeView() {
            switchView('code');
            updateCodeView();
        }

        function switchView(viewName) {
            // Hide all views
            document.getElementById('designView').classList.add('hidden');
            document.getElementById('previewView').classList.add('hidden');
            document.getElementById('splitView').classList.add('hidden');
            document.getElementById('codeView').classList.add('hidden');

            // Remove active class from all tabs
            document.querySelectorAll('.center-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected view and activate tab
            currentView = viewName;
            switch(viewName) {
                case 'design':
                    document.getElementById('designView').classList.remove('hidden');
                    document.querySelectorAll('.center-tab')[0].classList.add('active');
                    break;
                case 'preview':
                    document.getElementById('previewView').classList.remove('hidden');
                    document.querySelectorAll('.center-tab')[1].classList.add('active');
                    break;
                case 'split':
                    document.getElementById('splitView').classList.remove('hidden');
                    document.querySelectorAll('.center-tab')[2].classList.add('active');
                    break;
                case 'code':
                    document.getElementById('codeView').classList.remove('hidden');
                    document.querySelectorAll('.center-tab')[3].classList.add('active');
                    break;
            }
            updateStatusBar(\`Switched to \${viewName} view\`);
        }

        // =============================================================================
        // LIVE PREVIEW FUNCTIONS
        // =============================================================================

        function updatePreview() {
            const qmlCode = generateQMLCode();
            const previewFrame = document.getElementById('previewFrame');
            const previewFrameSmall = document.getElementById('previewFrameSmall');
            
            // Create a preview HTML page
            const previewHTML = \`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            font-family: 'Segoe UI', sans-serif;
                            background: #f0f0f0;
                        }
                        .qml-preview {
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            padding: 20px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        .widget-preview {
                            display: inline-block;
                            position: relative;
                            margin: 5px;
                            padding: 8px 12px;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            background: #f9f9f9;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .widget-preview:hover {
                            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            transform: translateY(-1px);
                        }
                        .button-preview {
                            background: #007acc;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        .text-preview {
                            background: transparent;
                            border: none;
                            color: #333;
                        }
                        .input-preview {
                            background: white;
                            border: 1px solid #ccc;
                            padding: 6px 8px;
                            border-radius: 3px;
                        }
                    </style>
                </head>
                <body>
                    <div class="qml-preview">
                        <h3>Live Preview</h3>
                        <div id="preview-content">
                            \${generatePreviewHTML()}
                        </div>
                    </div>
                </body>
                </html>
            \`;

            if (previewFrame) {
                previewFrame.srcdoc = previewHTML;
            }
            if (previewFrameSmall) {
                previewFrameSmall.srcdoc = previewHTML;
            }
        }

        function generatePreviewHTML() {
            const widgets = document.querySelectorAll('.dropped-widget');
            let html = '';
            
            widgets.forEach(widget => {
                const widgetType = widget.dataset.widget;
                const text = widget.textContent || 'Widget';
                const x = parseInt(widget.style.left) || 0;
                const y = parseInt(widget.style.top) || 0;
                
                let previewElement = '';
                switch(widgetType) {
                    case 'QPushButton':
                        previewElement = \`<button class="widget-preview button-preview" style="position: absolute; left: \${x}px; top: \${y}px;">\${text}</button>\`;
                        break;
                    case 'QLabel':
                        previewElement = \`<div class="widget-preview text-preview" style="position: absolute; left: \${x}px; top: \${y}px;">\${text}</div>\`;
                        break;
                    case 'QLineEdit':
                        previewElement = \`<input class="widget-preview input-preview" style="position: absolute; left: \${x}px; top: \${y}px;" placeholder="\${text}" />\`;
                        break;
                    case 'QCheckBox':
                        previewElement = \`<label class="widget-preview" style="position: absolute; left: \${x}px; top: \${y}px;"><input type="checkbox" /> \${text}</label>\`;
                        break;
                    default:
                        previewElement = \`<div class="widget-preview" style="position: absolute; left: \${x}px; top: \${y}px;">\${text}</div>\`;
                }
                html += previewElement;
            });
            
            return html || '<p>No widgets to preview. Drag widgets to the design canvas.</p>';
        }

        function refreshPreview() {
            updatePreview();
            updateStatusBar('Preview refreshed');
        }

        function toggleAutoRefresh() {
            autoRefreshEnabled = !autoRefreshEnabled;
            const btn = event.target;
            
            if (autoRefreshEnabled) {
                btn.textContent = '⚡ Auto (ON)';
                btn.style.background = 'var(--accent-green)';
                startAutoRefresh();
            } else {
                btn.textContent = '⚡ Auto (OFF)';
                btn.style.background = 'var(--quaternary-bg)';
                stopAutoRefresh();
            }
            updateStatusBar(\`Auto-refresh \${autoRefreshEnabled ? 'enabled' : 'disabled'}\`);
        }

        function startAutoRefresh() {
            if (previewTimer) clearInterval(previewTimer);
            previewTimer = setInterval(() => {
                if (currentView === 'preview' || currentView === 'split') {
                    updatePreview();
                }
            }, 1000); // Refresh every second
        }

        function stopAutoRefresh() {
            if (previewTimer) {
                clearInterval(previewTimer);
                previewTimer = null;
            }
        }

        function openExternalPreview() {
            const qmlCode = generateQMLCode();
            vscode.postMessage({
                command: 'openExternalPreview',
                data: { qml: qmlCode }
            });
            updateStatusBar('Opening external preview...');
        }

        function syncDesignToSmallCanvas() {
            const mainCanvas = document.getElementById('canvasContent');
            const smallCanvas = document.getElementById('canvasContentSmall');
            if (mainCanvas && smallCanvas) {
                smallCanvas.innerHTML = mainCanvas.innerHTML;
            }
        }

        // =============================================================================
        // CODE VIEW FUNCTIONS
        // =============================================================================

        function updateCodeView() {
            showQMLCode(); // Default to QML
        }

        function showQMLCode() {
            const qmlCode = generateQMLCode();
            const codeEditor = document.getElementById('codeEditor');
            codeEditor.value = qmlCode;
            
            // Update active tab
            document.querySelectorAll('.code-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.code-tab')[0].classList.add('active');
        }

        function showCppCode() {
            const cppCode = generateCppCode();
            const codeEditor = document.getElementById('codeEditor');
            codeEditor.value = cppCode;
            
            // Update active tab
            document.querySelectorAll('.code-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.code-tab')[1].classList.add('active');
        }

        function showUICode() {
            const uiCode = generateUICode();
            const codeEditor = document.getElementById('codeEditor');
            codeEditor.value = uiCode;
            
            // Update active tab
            document.querySelectorAll('.code-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.code-tab')[2].classList.add('active');
        }

        function generateUICode() {
            const widgets = document.querySelectorAll('.dropped-widget');
            let ui = \`<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>MainWindow</class>
 <widget class="QMainWindow" name="MainWindow">
  <property name="geometry">
   <rect>
    <x>0</x>
    <y>0</y>
    <width>800</width>
    <height>600</height>
   </rect>
  </property>
  <property name="windowTitle">
   <string>Generated Design</string>
  </property>
  <widget class="QWidget" name="centralwidget">
\`;

            widgets.forEach(widget => {
                const widgetType = widget.dataset.widget;
                const id = widget.dataset.id;
                const x = parseInt(widget.style.left) || 0;
                const y = parseInt(widget.style.top) || 0;
                const width = parseInt(widget.style.width) || 100;
                const height = parseInt(widget.style.height) || 30;
                const text = widget.textContent || '';

                ui += \`   <widget class="\${widgetType}" name="\${id}">
    <property name="geometry">
     <rect>
      <x>\${x}</x>
      <y>\${y}</y>
      <width>\${width}</width>
      <height>\${height}</height>
     </rect>
    </property>
    <property name="text">
     <string>\${text}</string>
    </property>
   </widget>
\`;
            });

            ui += \`  </widget>
 </widget>
 <resources/>
 <connections/>
</ui>\`;
            return ui;
        }

        // =============================================================================
        // ENHANCED PROPERTIES PANEL FUNCTIONS
        // =============================================================================

        function togglePropertyGroup(header) {
            const content = header.nextElementSibling;
            const toggle = header.querySelector('.group-toggle');
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                header.classList.remove('collapsed');
                toggle.textContent = '▼';
            } else {
                content.classList.add('collapsed');
                header.classList.add('collapsed');
                toggle.textContent = '▶';
            }
        }

        function updatePropertiesPanel(widget) {
            const subtitle = document.getElementById('propertiesSubtitle');
            const specificGroup = document.getElementById('specificPropertiesGroup');
            
            if (!widget) {
                subtitle.textContent = 'No widget selected';
                specificGroup.style.display = 'none';
                clearPropertyInputs();
                return;
            }

            const widgetType = widget.dataset.widget;
            subtitle.textContent = \`\${widgetType} selected\`;
            
            // Update basic properties
            document.getElementById('prop-objectName').value = widget.dataset.id || '';
            document.getElementById('prop-className').value = widgetType;
            document.getElementById('prop-x').value = parseInt(widget.style.left) || 0;
            document.getElementById('prop-y').value = parseInt(widget.style.top) || 0;
            document.getElementById('prop-width').value = parseInt(widget.style.width) || 100;
            document.getElementById('prop-height').value = parseInt(widget.style.height) || 30;
            document.getElementById('prop-text').value = widget.textContent || '';
            
            // Update widget-specific properties
            updateSpecificProperties(widget, widgetType);
            
            // Show specific properties group
            specificGroup.style.display = 'block';
        }

        function updateSpecificProperties(widget, widgetType) {
            const specificContent = document.getElementById('specificPropertiesContent');
            const specificTitle = document.getElementById('specificPropertiesTitle');
            
            specificTitle.textContent = \`🔍 \${widgetType} Properties\`;
            specificContent.innerHTML = '';
            
            // Add widget-specific properties based on type
            switch(widgetType) {
                case 'QPushButton':
                    addSpecificProperty('checkable', 'checkbox', false);
                    addSpecificProperty('checked', 'checkbox', false);
                    addSpecificProperty('autoDefault', 'checkbox', false);
                    addSpecificProperty('default', 'checkbox', false);
                    break;
                case 'QLineEdit':
                    addSpecificProperty('placeholderText', 'text', 'Enter text...');
                    addSpecificProperty('maxLength', 'number', 32767);
                    addSpecificProperty('readOnly', 'checkbox', false);
                    addSpecificProperty('echoMode', 'select', ['Normal', 'NoEcho', 'Password', 'PasswordEchoOnEdit']);
                    break;
                case 'QLabel':
                    addSpecificProperty('wordWrap', 'checkbox', false);
                    addSpecificProperty('scaledContents', 'checkbox', false);
                    addSpecificProperty('indent', 'number', -1);
                    addSpecificProperty('margin', 'number', 0);
                    break;
                case 'QProgressBar':
                    addSpecificProperty('minimum', 'number', 0);
                    addSpecificProperty('maximum', 'number', 100);
                    addSpecificProperty('value', 'number', 0);
                    addSpecificProperty('textVisible', 'checkbox', true);
                    addSpecificProperty('orientation', 'select', ['Horizontal', 'Vertical']);
                    break;
            }
        }

        function addSpecificProperty(name, type, defaultValue) {
            const specificContent = document.getElementById('specificPropertiesContent');
            const propertyDiv = document.createElement('div');
            propertyDiv.className = 'property-item';
            
            let inputElement = '';
            switch(type) {
                case 'checkbox':
                    inputElement = \`<input type="checkbox" class="property-checkbox" id="specific-\${name}" \${defaultValue ? 'checked' : ''}>\`;
                    break;
                case 'number':
                    inputElement = \`<input type="number" class="property-input" id="specific-\${name}" value="\${defaultValue}">\`;
                    break;
                case 'select':
                    const options = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
                    const optionElements = options.map(opt => \`<option value="\${opt}">\${opt}</option>\`).join('');
                    inputElement = \`<select class="property-input" id="specific-\${name}">\${optionElements}</select>\`;
                    break;
                default:
                    inputElement = \`<input type="text" class="property-input" id="specific-\${name}" value="\${defaultValue}">\`;
            }
            
            propertyDiv.innerHTML = \`
                <span class="property-label">\${name}</span>
                \${inputElement}
            \`;
            
            specificContent.appendChild(propertyDiv);
        }

        function clearPropertyInputs() {
            document.querySelectorAll('.property-input, .property-checkbox').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else if (input.type === 'number') {
                    input.value = 0;
                } else {
                    input.value = '';
                }
            });
        }

        function resetProperties() {
            if (!selectedWidget) return;
            
            const widgetType = selectedWidget.dataset.widget;
            const template = widgetTemplates[widgetType];
            
            if (template) {
                // Reset to template defaults
                selectedWidget.textContent = template.defaultText;
                selectedWidget.style.width = template.defaultSize.width + 'px';
                selectedWidget.style.height = template.defaultSize.height + 'px';
                
                updatePropertiesPanel(selectedWidget);
                updateStatusBar('Properties reset to defaults');
            }
        }

        function copyProperties() {
            if (!selectedWidget) return;
            
            const properties = extractWidgetProperties(selectedWidget);
            localStorage.setItem('qtDesignerProperties', JSON.stringify(properties));
            updateStatusBar('Properties copied');
        }

        function pasteProperties() {
            if (!selectedWidget) return;
            
            const propertiesData = localStorage.getItem('qtDesignerProperties');
            if (propertiesData) {
                const properties = JSON.parse(propertiesData);
                applyWidgetProperties(selectedWidget, properties);
                updatePropertiesPanel(selectedWidget);
                updateStatusBar('Properties pasted');
            }
        }

        function extractWidgetProperties(widget) {
            return {
                text: widget.textContent,
                width: widget.style.width,
                height: widget.style.height,
                backgroundColor: widget.style.backgroundColor,
                color: widget.style.color,
                fontFamily: widget.style.fontFamily,
                fontSize: widget.style.fontSize,
                fontWeight: widget.style.fontWeight,
                fontStyle: widget.style.fontStyle
            };
        }

        function applyWidgetProperties(widget, properties) {
            if (properties.text !== undefined) widget.textContent = properties.text;
            if (properties.width) widget.style.width = properties.width;
            if (properties.height) widget.style.height = properties.height;
            if (properties.backgroundColor) widget.style.backgroundColor = properties.backgroundColor;
            if (properties.color) widget.style.color = properties.color;
            if (properties.fontFamily) widget.style.fontFamily = properties.fontFamily;
            if (properties.fontSize) widget.style.fontSize = properties.fontSize;
            if (properties.fontWeight) widget.style.fontWeight = properties.fontWeight;
            if (properties.fontStyle) widget.style.fontStyle = properties.fontStyle;
        }

        function addSignalSlotConnection() {
            const connectionsList = document.getElementById('connectionsList');
            const connectionDiv = document.createElement('div');
            connectionDiv.className = 'connection-item';
            connectionDiv.innerHTML = \`
                <select class="signal-select">
                    <option>clicked()</option>
                    <option>textChanged()</option>
                    <option>valueChanged()</option>
                </select>
                <span>→</span>
                <select class="slot-select">
                    <option>close()</option>
                    <option>show()</option>
                    <option>hide()</option>
                </select>
                <button onclick="removeConnection(this)">×</button>
            \`;
            connectionsList.appendChild(connectionDiv);
        }

        function removeConnection(btn) {
            btn.parentElement.remove();
        }

        function applyStylePreset(preset) {
            if (!selectedWidget) return;
            
            switch(preset) {
                case 'modern':
                    selectedWidget.style.borderRadius = '8px';
                    selectedWidget.style.backgroundColor = '#007acc';
                    selectedWidget.style.color = 'white';
                    selectedWidget.style.border = 'none';
                    break;
                case 'classic':
                    selectedWidget.style.borderRadius = '0px';
                    selectedWidget.style.backgroundColor = '#f0f0f0';
                    selectedWidget.style.color = 'black';
                    selectedWidget.style.border = '1px solid #ccc';
                    break;
                case 'dark':
                    selectedWidget.style.borderRadius = '4px';
                    selectedWidget.style.backgroundColor = '#2d2d30';
                    selectedWidget.style.color = '#d4d4d4';
                    selectedWidget.style.border = '1px solid #464647';
                    break;
            }
            updateStatusBar(\`Applied \${preset} style preset\`);
        }
        
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
            // Basic property inputs
            const propertyInputs = [
                { id: 'prop-objectName', property: 'id' },
                { id: 'prop-x', property: 'left', unit: 'px' },
                { id: 'prop-y', property: 'top', unit: 'px' },
                { id: 'prop-width', property: 'width', unit: 'px' },
                { id: 'prop-height', property: 'height', unit: 'px' },
                { id: 'prop-text', property: 'textContent' }
            ];
            
            propertyInputs.forEach(({ id, property, unit }) => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('change', () => {
                        if (!selectedWidget) return;
                        
                        const value = input.value;
                        if (property === 'id') {
                            selectedWidget.dataset.id = value;
                        } else if (property === 'textContent') {
                            selectedWidget.textContent = value;
                        } else {
                            selectedWidget.style[property] = value + (unit || '');
                        }
                        saveState();
                        
                        // Update preview if auto-refresh is enabled
                        if (autoRefreshEnabled && (currentView === 'preview' || currentView === 'split')) {
                            updatePreview();
                        }
                    });
                }
            });

            // Appearance properties
            setupAppearanceProperties();
            
            // Behavior properties
            setupBehaviorProperties();
            
            // Color pickers
            setupColorPickers();
            
            // Font properties
            setupFontProperties();
        }

        function setupAppearanceProperties() {
            const backgroundColorInput = document.getElementById('prop-backgroundColor');
            const textColorInput = document.getElementById('prop-textColor');
            
            if (backgroundColorInput) {
                backgroundColorInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.backgroundColor = backgroundColorInput.value;
                        document.getElementById('prop-backgroundColorText').value = backgroundColorInput.value;
                        saveState();
                    }
                });
            }
            
            if (textColorInput) {
                textColorInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.color = textColorInput.value;
                        document.getElementById('prop-textColorText').value = textColorInput.value;
                        saveState();
                    }
                });
            }
        }

        function setupBehaviorProperties() {
            const enabledInput = document.getElementById('prop-enabled');
            const visibleInput = document.getElementById('prop-visible');
            
            if (enabledInput) {
                enabledInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.opacity = enabledInput.checked ? '1' : '0.5';
                        selectedWidget.style.pointerEvents = enabledInput.checked ? 'auto' : 'none';
                        saveState();
                    }
                });
            }
            
            if (visibleInput) {
                visibleInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.display = visibleInput.checked ? 'flex' : 'none';
                        saveState();
                    }
                });
            }
        }

        function setupColorPickers() {
            // Sync color picker with text input
            const colorInputs = [
                { color: 'prop-backgroundColor', text: 'prop-backgroundColorText' },
                { color: 'prop-textColor', text: 'prop-textColorText' }
            ];
            
            colorInputs.forEach(({ color, text }) => {
                const colorInput = document.getElementById(color);
                const textInput = document.getElementById(text);
                
                if (colorInput && textInput) {
                    textInput.addEventListener('change', () => {
                        if (isValidColor(textInput.value)) {
                            colorInput.value = textInput.value;
                            colorInput.dispatchEvent(new Event('change'));
                        }
                    });
                }
            });
        }

        function setupFontProperties() {
            const fontFamilyInput = document.getElementById('prop-fontFamily');
            const fontSizeInput = document.getElementById('prop-fontSize');
            const boldInput = document.getElementById('prop-bold');
            const italicInput = document.getElementById('prop-italic');
            
            if (fontFamilyInput) {
                fontFamilyInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.fontFamily = fontFamilyInput.value;
                        saveState();
                    }
                });
            }
            
            if (fontSizeInput) {
                fontSizeInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.fontSize = fontSizeInput.value + 'pt';
                        saveState();
                    }
                });
            }
            
            if (boldInput) {
                boldInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.fontWeight = boldInput.checked ? 'bold' : 'normal';
                        saveState();
                    }
                });
            }
            
            if (italicInput) {
                italicInput.addEventListener('change', () => {
                    if (selectedWidget) {
                        selectedWidget.style.fontStyle = italicInput.checked ? 'italic' : 'normal';
                        saveState();
                    }
                });
            }
        }

        function isValidColor(color) {
            const s = new Option().style;
            s.color = color;
            return s.color !== '';
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
            let qml = 'import QtQuick 2.15\\n' +
                     'import QtQuick.Controls 2.15\\n' +
                     'import QtQuick.Window 2.15\\n\\n' +
                     'ApplicationWindow {\\n' +
                     '    width: 800\\n' +
                     '    height: 600\\n' +
                     '    visible: true\\n' +
                     '    title: "Qt Application"\\n\\n';

            widgets.forEach(widget => {
                const type = widget.dataset.widget.replace('Q', '');
                const x = parseInt(widget.style.left);
                const y = parseInt(widget.style.top);
                const width = parseInt(widget.style.width);
                const height = parseInt(widget.style.height);
                const text = widget.textContent;

                qml += '    ' + type + ' {\\n' +
                      '        x: ' + x + '\\n' +
                      '        y: ' + y + '\\n' +
                      '        width: ' + width + '\\n' +
                      '        height: ' + height + '\\n' +
                      '        text: "' + text + '"\\n' +
                      '    }\\n\\n';
            });

            qml += '}';
            return qml;
        }

        // Generate C++ code
        function generateCppCode(widgets) {
            let cpp = '#include <QtWidgets>\\n\\n' +
                     'class MainWindow : public QMainWindow\\n' +
                     '{\\n' +
                     '    Q_OBJECT\\n\\n' +
                     'public:\\n' +
                     '    MainWindow(QWidget *parent = nullptr);\\n\\n' +
                     'private:\\n';

            // Declare members
            widgets.forEach(widget => {
                const type = widget.dataset.widget;
                const id = widget.dataset.id;
                cpp += '    ' + type + ' *' + id + ';\\n';
            });

            cpp += '};\\n\\n' +
                  'MainWindow::MainWindow(QWidget *parent)\\n' +
                  '    : QMainWindow(parent)\\n' +
                  '{\\n' +
                  '    auto centralWidget = new QWidget(this);\\n' +
                  '    setCentralWidget(centralWidget);\\n\\n';

            // Create widgets
            widgets.forEach(widget => {
                const type = widget.dataset.widget;
                const id = widget.dataset.id;
                const x = parseInt(widget.style.left);
                const y = parseInt(widget.style.top);
                const width = parseInt(widget.style.width);
                const height = parseInt(widget.style.height);
                const text = widget.textContent;

                cpp += '    ' + id + ' = new ' + type + '(centralWidget);\\n' +
                      '    ' + id + '->setGeometry(' + x + ', ' + y + ', ' + width + ', ' + height + ');\\n' +
                      '    ' + id + '->setText("' + text + '");\\n\\n';
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
        try {
            const options: vscode.SaveDialogOptions = {
                saveLabel: 'Save QML Design',
                filters: {
                    'QML Files': ['qml'],
                    'All Files': ['*']
                }
            };

            const uri = await vscode.window.showSaveDialog(options);
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(designData.qml, 'utf8'));
                vscode.window.showInformationMessage(`Design saved successfully to ${uri.fsPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save design: ${error}`);
        }
    }

    private async generateCode(type: string, data: any) {
        try {
            const content = type === 'qml' ? data.qml : data.cpp;
            const language = type === 'qml' ? 'qml' : 'cpp';
            
            const document = await vscode.workspace.openTextDocument({
                content: content,
                language: language
            });
            await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
            vscode.window.showInformationMessage(`${type.toUpperCase()} code generated successfully!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
        }
    }

    private async openExternalDesigner() {
        vscode.window.showInformationMessage('External Qt Designer functionality will be available in future updates');
    }

    private async previewDesign(designData: any) {
        try {
            // Create a temporary QML file and trigger live preview
            const tempContent = designData.qml || 'import QtQuick 2.15\nItem {\n    width: 640\n    height: 480\n}';
            const document = await vscode.workspace.openTextDocument({
                content: tempContent,
                language: 'qml'
            });
            
            // Trigger the live preview command
            vscode.commands.executeCommand('qtLivePreview.startPreview', document.uri);
            vscode.window.showInformationMessage('Design preview started!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to preview design: ${error}`);
        }
    }

    private async exportDesign(designData: any, format: string) {
        try {
            const options: vscode.SaveDialogOptions = {
                saveLabel: `Export as ${format.toUpperCase()}`,
                filters: {}
            };

            switch (format) {
                case 'qml':
                    options.filters = { 'QML Files': ['qml'] };
                    break;
                case 'cpp':
                    options.filters = { 'C++ Files': ['cpp', 'h'] };
                    break;
                case 'ui':
                    options.filters = { 'UI Files': ['ui'] };
                    break;
                default:
                    options.filters = { 'All Files': ['*'] };
            }

            const uri = await vscode.window.showSaveDialog(options);
            if (uri) {
                const content = designData[format] || designData.qml || '';
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
                vscode.window.showInformationMessage(`Design exported successfully as ${format.toUpperCase()}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to export design: ${error}`);
        }
    }

    private async loadTemplate(template: string) {
        try {
            // Define common Qt templates
            const templates: { [key: string]: string } = {
                'window': `import QtQuick 2.15
import QtQuick.Window 2.15

Window {
    width: 640
    height: 480
    visible: true
    title: qsTr("Hello World")

    Rectangle {
        anchors.fill: parent
        color: "#f0f0f0"
        
        Text {
            anchors.centerIn: parent
            text: qsTr("Hello World")
            font.pointSize: 24
        }
    }
}`,
                'dialog': `import QtQuick 2.15
import QtQuick.Controls 2.15

Dialog {
    width: 400
    height: 300
    modal: true
    title: qsTr("Dialog")

    Column {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 10

        Text {
            text: qsTr("This is a dialog")
        }

        Button {
            text: qsTr("OK")
            onClicked: accept()
        }
    }
}`,
                'form': `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    width: 500
    height: 400
    visible: true
    title: qsTr("Form Example")

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20

        GroupBox {
            title: qsTr("User Information")
            Layout.fillWidth: true

            GridLayout {
                columns: 2
                anchors.fill: parent

                Text { text: qsTr("Name:") }
                TextField { placeholderText: qsTr("Enter name") }

                Text { text: qsTr("Email:") }
                TextField { placeholderText: qsTr("Enter email") }
            }
        }

        RowLayout {
            Button { text: qsTr("Submit") }
            Button { text: qsTr("Cancel") }
        }
    }
}`
            };

            const templateContent = templates[template] || templates['window'];
            
            // Send the template back to the webview
            if (this._designerPanel) {
                this._designerPanel.webview.postMessage({
                    command: 'templateLoaded',
                    content: templateContent
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load template: ${error}`);
        }
    }
}
