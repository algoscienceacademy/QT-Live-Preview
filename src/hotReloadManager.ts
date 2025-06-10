import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import { LivePreviewProvider } from './livePreviewProvider';
import * as path from 'path';

export class HotReloadManager {
    private _watcher?: chokidar.FSWatcher;
    private _isEnabled: boolean = true;
    private _statusBarItem: vscode.StatusBarItem;
    private _currentFilePath?: string;
    private _debounceTimeout?: NodeJS.Timeout;
    private _buildManager?: any; // Will be injected
    private _isReloading: boolean = false; // Prevent multiple reloads

    constructor(private previewProvider: LivePreviewProvider) {
        this._statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this._statusBarItem.command = 'qtLivePreview.toggleHotReload';
        this.updateStatusBar();
        this._statusBarItem.show();
    }

    public setBuildManager(buildManager: any) {
        this._buildManager = buildManager;
    }

    public start(filePath: string) {
        this.stop();
        this._currentFilePath = filePath;

        if (!this._isEnabled) return;

        const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath))?.uri.fsPath;
        if (!workspaceRoot) return;

        // Watch QML, UI, C++, and resource files
        const watchPattern = [
            `${workspaceRoot}/**/*.qml`,
            `${workspaceRoot}/**/*.ui`,
            `${workspaceRoot}/**/*.cpp`,
            `${workspaceRoot}/**/*.h`,
            `${workspaceRoot}/**/*.qrc`,
            `${workspaceRoot}/**/*.js`,
            `${workspaceRoot}/**/CMakeLists.txt`
        ];

        this._watcher = chokidar.watch(watchPattern, {
            ignored: [
                /(^|[\/\\])\../, // ignore dotfiles
                /node_modules/,
                /build/,
                /\.git/
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            }
        });

        this._watcher
            .on('change', (path) => this.onFileChanged(path))
            .on('add', (path) => this.onFileChanged(path))
            .on('unlink', (path) => this.onFileDeleted(path))
            .on('error', (error) => {
                console.error('File watcher error:', error);
                vscode.window.showErrorMessage(`Hot reload error: ${error.message}`);
            });

        console.log(`Hot reload started for: ${filePath}`);
        this.updateStatusBar();
    }

    public stop() {
        if (this._watcher) {
            this._watcher.close();
            this._watcher = undefined;
        }
        
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
            this._debounceTimeout = undefined;
        }
        
        this._currentFilePath = undefined;
        this.updateStatusBar();
    }

    public toggle() {
        this._isEnabled = !this._isEnabled;
        this.updateStatusBar();
        
        if (this._isEnabled) {
            if (this._currentFilePath) {
                this.start(this._currentFilePath);
            }
            vscode.window.showInformationMessage('🔥 Hot reload enabled');
        } else {
            this.stop();
            vscode.window.showInformationMessage('⏸️ Hot reload disabled');
        }
    }

    private async onFileChanged(filePath: string) {
        console.log(`File changed: ${filePath}`);
        
        // Prevent multiple simultaneous reloads
        if (this._isReloading) {
            console.log('Reload already in progress, skipping...');
            return;
        }
        
        // Clear previous timeout
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
        }
        
        // Debounce rapid changes
        this._debounceTimeout = setTimeout(async () => {
            this._isReloading = true;
            
            try {
                const uri = vscode.Uri.file(filePath);
                const fileName = path.basename(filePath);
                const fileExt = path.extname(filePath);
                
                // Handle different file types
                if (['.qml'].includes(fileExt)) {
                    // For QML files, restart preview
                    await this.previewProvider.startPreview(uri);
                    this.previewProvider.updateWidgetsPreviewStatus(`🔄 QML reloaded: ${fileName}`);
                    vscode.window.setStatusBarMessage(`🔄 QML Reloaded: ${fileName}`, 3000);
                    
                } else if (['.cpp', '.h'].includes(fileExt)) {
                    // For C++ files, trigger hot reload if application is running
                    if (this._buildManager && this._buildManager.isApplicationRunning()) {
                        this.previewProvider.updateWidgetsPreviewStatus(`🔨 Rebuilding for: ${fileName}`);
                        await this._buildManager.hotReloadApplication();
                        this.previewProvider.updateWidgetsPreviewStatus(`✅ Hot reload completed: ${fileName}`);
                        vscode.window.setStatusBarMessage(`🔄 C++ Hot Reload: ${fileName}`, 3000);
                    } else {
                        this.previewProvider.updateWidgetsPreviewStatus(`📝 Modified: ${fileName} (run project to see changes)`);
                        vscode.window.setStatusBarMessage(`📝 Modified: ${fileName} (rebuild required)`, 3000);
                    }
                    
                } else if (['.ui'].includes(fileExt)) {
                    // For UI files, trigger rebuild if application is running
                    if (this._buildManager && this._buildManager.isApplicationRunning()) {
                        this.previewProvider.updateWidgetsPreviewStatus(`🎨 UI file changed: ${fileName}`);
                        await this._buildManager.hotReloadApplication();
                        this.previewProvider.updateWidgetsPreviewStatus(`✅ UI updated: ${fileName}`);
                        vscode.window.setStatusBarMessage(`🔄 UI Hot Reload: ${fileName}`, 3000);
                    } else {
                        this.previewProvider.updateWidgetsPreviewStatus(`🎨 UI modified: ${fileName} (run project to see changes)`);
                        vscode.window.setStatusBarMessage(`🎨 UI Modified: ${fileName}`, 3000);
                    }
                    
                } else if (fileExt === '.qrc') {
                    // Resource files changed
                    this.previewProvider.updateWidgetsPreviewStatus(`📦 Resource updated: ${fileName}`);
                    if (this._buildManager && this._buildManager.isApplicationRunning()) {
                        await this._buildManager.hotReloadApplication();
                    }
                    vscode.window.setStatusBarMessage(`📦 Resource updated: ${fileName}`, 3000);
                    
                } else if (fileName === 'CMakeLists.txt') {
                    // CMake files changed
                    this.previewProvider.updateWidgetsPreviewStatus(`⚙️ CMake updated: ${fileName} (manual rebuild recommended)`);
                    vscode.window.setStatusBarMessage(`⚙️ CMake updated: ${fileName}`, 3000);
                }
                
            } catch (error) {
                console.error('Hot reload error:', error);
                this.previewProvider.updateWidgetsPreviewStatus(`❌ Hot reload failed: ${error}`);
                vscode.window.showErrorMessage(`Hot reload failed: ${error}`);
            } finally {
                this._isReloading = false;
            }
        }, 1000); // Increased debounce to 1 second for better stability
    }

    private onFileDeleted(filePath: string) {
        console.log(`File deleted: ${filePath}`);
        const fileName = path.basename(filePath);
        vscode.window.setStatusBarMessage(`🗑️ Deleted: ${fileName}`, 3000);
    }

    private updateStatusBar() {
        if (this._isEnabled && this._watcher) {
            this._statusBarItem.text = '$(sync~spin) Hot Reload';
            this._statusBarItem.tooltip = 'Hot reload is active (click to disable)';
            this._statusBarItem.backgroundColor = undefined;
        } else if (this._isEnabled) {
            this._statusBarItem.text = '$(sync) Hot Reload';
            this._statusBarItem.tooltip = 'Hot reload is enabled but not watching (click to disable)';
            this._statusBarItem.backgroundColor = undefined;
        } else {
            this._statusBarItem.text = '$(sync-ignored) Hot Reload';
            this._statusBarItem.tooltip = 'Hot reload is disabled (click to enable)';
            this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    public dispose() {
        this.stop();
        this._statusBarItem.dispose();
    }
}
