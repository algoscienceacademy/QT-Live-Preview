import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

export class LivePreviewProvider implements vscode.WebviewViewProvider {
    public _view?: vscode.WebviewView; // Changed from private to public
    private _currentProcess?: ChildProcess;
    private _currentFile?: vscode.Uri;
    private _buildManager?: any; // Will be injected

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public setBuildManager(buildManager: any) {
        this._buildManager = buildManager;
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
    }

    private getPlatformQmlEngine(): { command: string; env: any } {
        const config = vscode.workspace.getConfiguration('qtLivePreview');
        const qt6Path = config.get<string>('qt6Path') || '';
        const qmlEngine = config.get<string>('qmlEngine') || 'qml';
        const platform = os.platform();

        switch (platform) {
            case 'win32':
                // For MSYS2, use the default path if not configured
                const defaultQt6Path = qt6Path || 'C:\\msys64\\mingw64';
                const qmlCommand = path.join(defaultQt6Path, 'bin', `${qmlEngine}.exe`);
                
                return {
                    command: qmlCommand,
                    env: {
                        ...process.env,
                        MSYSTEM: 'MINGW64',
                        PATH: `${defaultQt6Path}\\bin;C:\\msys64\\mingw64\\bin;C:\\msys64\\usr\\bin;${process.env.PATH}`,
                        QT_QPA_PLATFORM_PLUGIN_PATH: path.join(defaultQt6Path, 'plugins', 'platforms'),
                        QML2_IMPORT_PATH: path.join(defaultQt6Path, 'qml'),
                        CMAKE_PREFIX_PATH: defaultQt6Path,
                        // Fix potential path issues
                        TEMP: process.env.TEMP,
                        TMP: process.env.TMP
                    }
                };
            case 'darwin':
                return {
                    command: path.join(qt6Path, 'bin', qmlEngine),
                    env: {
                        ...process.env,
                        PATH: `${qt6Path}/bin:${process.env.PATH}`,
                        QT_QPA_PLATFORM_PLUGIN_PATH: path.join(qt6Path, 'plugins', 'platforms'),
                        QML2_IMPORT_PATH: path.join(qt6Path, 'qml'),
                        CMAKE_PREFIX_PATH: qt6Path
                    }
                };
            default: // linux
                return {
                    command: qmlEngine,
                    env: {
                        ...process.env,
                        PATH: `${qt6Path}/bin:${process.env.PATH}`,
                        QT_QPA_PLATFORM_PLUGIN_PATH: path.join(qt6Path, 'plugins', 'platforms'),
                        QML2_IMPORT_PATH: path.join(qt6Path, 'qml'),
                        CMAKE_PREFIX_PATH: qt6Path
                    }
                };
        }
    }

    public async startPreview(uri: vscode.Uri) {
        if (!this._view) {
            await vscode.commands.executeCommand('qtLivePreview.preview.focus');
        }

        this._currentFile = uri;
        const filePath = uri.fsPath;
        
        if (filePath.endsWith('.qml')) {
            await this.previewQML(filePath);
        } else if (filePath.endsWith('.ui')) {
            await this.previewUI(filePath);
        } else if (filePath.endsWith('.cpp') || filePath.endsWith('.h')) {
            await this.previewWidgetsApp(filePath);
        }
    }

    private async previewWidgetsApp(filePath: string) {
        try {
            const content = this.generateWidgetsPreviewContent(filePath);
            
            if (this._view) {
                this._view.webview.postMessage({ 
                    command: 'updateContent', 
                    content: content 
                });
            }

            // Auto-start the application if build manager is available
            if (this._buildManager && !this._buildManager.isApplicationRunning()) {
                setTimeout(() => {
                    this._buildManager.runProject();
                }, 1000);
            }
        } catch (error) {
            this.showError(`Failed to preview Qt Widgets application: ${error}`);
        }
    }

    private async previewQML(filePath: string) {
        try {
            // Kill existing process
            if (this._currentProcess) {
                this._currentProcess.kill();
            }

            const { command, env } = this.getPlatformQmlEngine();
            
            // Check if QML engine exists
            if (!fs.existsSync(command)) {
                this.showError(`QML engine not found: ${command}. Please install Qt6 in MSYS2 or configure the correct path.`);
                return;
            }

            // For Windows, run QML directly without shell conversion since we're using native Windows paths
            this._currentProcess = spawn(command, [filePath], {
                cwd: path.dirname(filePath),
                env: env,
                stdio: 'pipe'
            });

            this._currentProcess.stdout?.on('data', (data) => {
                console.log(`QML Output: ${data}`);
            });

            this._currentProcess.stderr?.on('data', (data) => {
                const error = data.toString();
                console.error(`QML Error: ${error}`);
                this.showError(error);
            });

            this._currentProcess.on('close', (code) => {
                console.log(`QML process exited with code ${code}`);
                if (code !== 0 && code !== null) {
                    this.showError(`QML process exited with code ${code}`);
                }
            });

            this._currentProcess.on('error', (error) => {
                this.showError(`Failed to start QML engine: ${error.message}`);
            });

            // Update webview
            if (this._view) {
                const content = this.generateQMLPreviewContent(filePath);
                this._view.webview.postMessage({ 
                    command: 'updateContent', 
                    content: content 
                });
            }

        } catch (error) {
            this.showError(`Failed to start QML preview: ${error}`);
        }
    }

    private async previewUI(filePath: string) {
        try {
            const uiContent = fs.readFileSync(filePath, 'utf8');
            const content = this.generateUIPreviewContent(uiContent, filePath);
            
            if (this._view) {
                this._view.webview.postMessage({ 
                    command: 'updateContent', 
                    content: content 
                });
            }
        } catch (error) {
            this.showError(`Failed to preview UI file: ${error}`);
        }
    }

    public async hotReload() {
        if (this._currentFile) {
            const filePath = this._currentFile.fsPath;
            
            if (filePath.endsWith('.qml')) {
                // For QML, restart the QML engine
                await this.previewQML(filePath);
            } else if (filePath.endsWith('.cpp') || filePath.endsWith('.h') || filePath.endsWith('.ui')) {
                // For C++/UI files, trigger hot reload through build manager
                if (this._buildManager) {
                    await this._buildManager.hotReloadApplication();
                    this.updateWidgetsPreviewStatus('🔄 Hot reloaded Qt Widgets application');
                }
            }
        }
    }

    private generateQMLPreviewContent(filePath: string): string {
        const fileName = path.basename(filePath);
        const platform = os.platform();
        const platformName = platform === 'win32' ? 'Windows (MSYS2/MinGW64)' : 
                            platform === 'darwin' ? 'macOS' : 'Linux';
        
        return `
            <div class="preview-container">
                <h3>🎬 QML Live Preview: ${fileName}</h3>
                <div class="status">
                    <span class="status-indicator active"></span>
                    Live preview running on ${platformName}
                </div>
                <div class="info-panel">
                    <div class="info-item">
                        <strong>📁 File:</strong> ${filePath}
                    </div>
                    <div class="info-item">
                        <strong>🖥️ Platform:</strong> ${platformName}
                    </div>
                    <div class="info-item">
                        <strong>⚡ Hot Reload:</strong> Enabled
                    </div>
                </div>
                <div class="preview-note">
                    <p>QML application is running in external window.</p>
                    <p>Changes will be automatically reloaded when you save the file.</p>
                </div>
            </div>
        `;
    }

    private generateUIPreviewContent(uiContent: string, filePath: string): string {
        const fileName = path.basename(filePath);
        return `
            <div class="preview-container">
                <h3>🎨 Qt UI File Preview: ${fileName}</h3>
                <div class="status">
                    <span class="status-indicator active"></span>
                    UI file loaded
                </div>
                <div class="ui-preview">
                    <div class="ui-header">Qt Designer Form</div>
                    <pre><code>${this.escapeHtml(uiContent.substring(0, 1000))}${uiContent.length > 1000 ? '...' : ''}</code></pre>
                </div>
                <div class="preview-note">
                    <p>To see the visual preview, build and run the project.</p>
                </div>
            </div>
        `;
    }

    private generateCppPreviewContent(filePath: string): string {
        const fileName = path.basename(filePath);
        return `
            <div class="preview-container">
                <h3>⚙️ C++ File: ${fileName}</h3>
                <div class="status">
                    <span class="status-indicator active"></span>
                    Ready for build
                </div>
                <div class="cpp-actions">
                    <button onclick="buildProject()" class="action-btn">🔨 Build Project</button>
                    <button onclick="runProject()" class="action-btn">🚀 Run Project</button>
                    <button onclick="debugProject()" class="action-btn">🐛 Debug Project</button>
                </div>
                <div class="preview-note">
                    <p>C++ files need to be compiled. Use the build actions above.</p>
                </div>
            </div>
        `;
    }

    private generateWidgetsPreviewContent(filePath: string): string {
        const fileName = path.basename(filePath);
        const platform = os.platform();
        const platformName = platform === 'win32' ? 'Windows (MSYS2/MinGW64)' : 
                            platform === 'darwin' ? 'macOS' : 'Linux';
        
        return `
            <div class="preview-container">
                <h3>🖥️ Qt Widgets Application: ${fileName}</h3>
                <div class="status" id="widgets-status">
                    <span class="status-indicator active"></span>
                    Qt Widgets app on ${platformName}
                </div>
                <div class="info-panel">
                    <div class="info-item">
                        <strong>📁 File:</strong> ${filePath}
                    </div>
                    <div class="info-item">
                        <strong>🖥️ Platform:</strong> ${platformName}
                    </div>
                    <div class="info-item">
                        <strong>⚡ Hot Reload:</strong> Enabled (rebuilds on save)
                    </div>
                    <div class="info-item">
                        <strong>🔧 Type:</strong> Qt Widgets (C++)
                    </div>
                </div>
                <div class="widgets-controls">
                    <button onclick="buildProject()" class="action-btn">🔨 Build</button>
                    <button onclick="runProject()" class="action-btn">🚀 Run</button>
                    <button onclick="stopProject()" class="action-btn">⏹️ Stop</button>
                    <button onclick="debugProject()" class="action-btn">🐛 Debug</button>
                </div>
                <div class="preview-note">
                    <p><strong>🎯 Live Preview:</strong></p>
                    <ul>
                        <li>Application runs in separate window</li>
                        <li>Hot reload rebuilds and restarts on file changes</li>
                        <li>Real-time updates for UI modifications</li>
                        <li>One instance runs until you stop it</li>
                    </ul>
                </div>
                <div class="live-updates" id="live-updates">
                    <h4>📊 Live Updates</h4>
                    <div class="update-log" id="update-log">
                        <div class="update-item">Ready for hot reload...</div>
                    </div>
                </div>
            </div>
        `;
    }

    public updateWidgetsPreviewStatus(message: string) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateStatus',
                message: message,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    }

    private generateStoppedContent(): string {
        return `
            <div class="preview-container">
                <h3>⏹️ Preview Stopped</h3>
                <div class="status">
                    <span class="status-indicator inactive"></span>
                    No active preview
                </div>
                <div class="preview-note">
                    <p>Open a QML or UI file to start live preview.</p>
                </div>
            </div>
        `;
    }

    private showError(error: string) {
        if (this._view) {
            this._view.webview.postMessage({ 
                command: 'showError', 
                error: error 
            });
        }
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QT Live Preview</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                }
                .preview-container {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    background-color: var(--vscode-panel-background);
                }
                .status {
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                }
                .status-indicator {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: var(--vscode-charts-red);
                    animation: pulse 2s infinite;
                }
                .status-indicator.active {
                    background-color: var(--vscode-charts-green);
                }
                .status-indicator.inactive {
                    background-color: var(--vscode-charts-gray);
                    animation: none;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .info-panel {
                    background-color: var(--vscode-textCodeBlock-background);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 15px 0;
                }
                .info-item {
                    margin: 8px 0;
                }
                .error {
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    color: var(--vscode-inputValidation-errorForeground);
                    padding: 15px;
                    border-radius: 4px;
                    margin: 15px 0;
                }
                .ui-preview {
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-textBlockQuote-border);
                    border-radius: 4px;
                    margin: 15px 0;
                    overflow: hidden;
                }
                .ui-header {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 10px 15px;
                    font-weight: bold;
                }
                .cpp-actions {
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                }
                .action-btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }
                .action-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .widgets-controls {
                    display: flex;
                    gap: 10px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                }
                .live-updates {
                    background-color: var(--vscode-textCodeBlock-background);
                    border-radius: 4px;
                    padding: 15px;
                    margin: 15px 0;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .update-log {
                    font-family: monospace;
                    font-size: 12px;
                }
                .update-item {
                    padding: 5px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .update-item:last-child {
                    border-bottom: none;
                }
                .update-item.new {
                    background-color: var(--vscode-editor-selectionBackground);
                    animation: highlight 2s ease-out;
                }
                @keyframes highlight {
                    from { background-color: var(--vscode-charts-yellow); }
                    to { background-color: transparent; }
                }
                h3 {
                    margin-top: 0;
                    color: var(--vscode-charts-blue);
                }
            </style>
        </head>
        <body>
            <div id="content">
                <div class="preview-container">
                    <h3>🎬 QT Live Preview</h3>
                    <div class="status">
                        <span class="status-indicator inactive"></span>
                        Ready to preview
                    </div>
                    <div class="preview-note">
                        <p>Open a QML, UI, or C++ file to start live preview</p>
                        <p>Supports Windows (MSYS2/MinGW64), Linux (bash), and macOS (zsh)</p>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    const contentEl = document.getElementById('content');
                    
                    switch (message.command) {
                        case 'updateContent':
                            contentEl.innerHTML = message.content;
                            break;
                        case 'showError':
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error';
                            errorDiv.innerHTML = '<strong>❌ Error:</strong><br>' + message.error;
                            contentEl.appendChild(errorDiv);
                            break;
                        case 'updateStatus':
                            updateLiveLog(message.message, message.timestamp);
                            break;
                    }
                });

                function updateLiveLog(message, timestamp) {
                    const updateLog = document.getElementById('update-log');
                    if (updateLog) {
                        const item = document.createElement('div');
                        item.className = 'update-item new';
                        item.textContent = \`[\${timestamp}] \${message}\`;
                        updateLog.insertBefore(item, updateLog.firstChild);
                        
                        // Keep only last 10 items
                        while (updateLog.children.length > 10) {
                            updateLog.removeChild(updateLog.lastChild);
                        }
                    }
                }

                function buildProject() {
                    vscode.postMessage({ command: 'buildProject' });
                }

                function runProject() {
                    vscode.postMessage({ command: 'runProject' });
                }

                function stopProject() {
                    vscode.postMessage({ command: 'stopProject' });
                }

                function debugProject() {
                    vscode.postMessage({ command: 'debugProject' });
                }
            </script>
        </body>
        </html>`;
    }

    public stopPreview() {
        if (this._currentProcess) {
            this._currentProcess.kill();
            this._currentProcess = undefined;
        }
        
        if (this._view) {
            this._view.webview.postMessage({ 
                command: 'updateContent', 
                content: this.generateStoppedContent()
            });
        }
    }
}
