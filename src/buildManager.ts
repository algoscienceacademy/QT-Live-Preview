import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

export class BuildManager {
    private _currentProcess?: ChildProcess;
    private _outputChannel: vscode.OutputChannel;
    private _terminal?: vscode.Terminal;
    private _runningProcess?: ChildProcess; // Track running Qt application
    private _isApplicationRunning: boolean = false;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Qt Build');
    }

    private getPlatformInfo() {
        const platform = os.platform();
        const config = vscode.workspace.getConfiguration('qtLivePreview');
        const qt6Path = config.get<string>('qt6Path') || '';

        switch (platform) {
            case 'win32':
                // Default MSYS2 Qt6 path if not configured
                const defaultQt6Path = qt6Path || 'C:\\msys64\\mingw64';
                return {
                    platform: 'windows',
                    shell: 'C:\\msys64\\usr\\bin\\bash.exe', // MSYS2 bash
                    shellArgs: ['-l', '-c'],
                    cmake: 'cmake',
                    ninja: 'ninja',
                    qt6Path: defaultQt6Path,
                    env: {
                        ...process.env,
                        MSYSTEM: 'MINGW64',
                        PATH: `C:\\msys64\\mingw64\\bin;C:\\msys64\\usr\\bin;${defaultQt6Path}\\bin;${process.env.PATH}`,
                        CMAKE_PREFIX_PATH: defaultQt6Path,
                        Qt6_DIR: `${defaultQt6Path}\\lib\\cmake\\Qt6`
                    }
                };
            case 'darwin':
                return {
                    platform: 'macos',
                    shell: '/bin/zsh',
                    shellArgs: ['-c'],
                    cmake: 'cmake',
                    ninja: 'ninja',
                    qt6Path: qt6Path,
                    env: {
                        ...process.env,
                        PATH: `${qt6Path}/bin:${process.env.PATH}`,
                        CMAKE_PREFIX_PATH: qt6Path
                    }
                };
            default: // linux
                return {
                    platform: 'linux',
                    shell: '/bin/bash',
                    shellArgs: ['-c'],
                    cmake: 'cmake',
                    ninja: 'ninja',
                    qt6Path: qt6Path,
                    env: {
                        ...process.env,
                        PATH: `${qt6Path}/bin:${process.env.PATH}`,
                        CMAKE_PREFIX_PATH: qt6Path
                    }
                };
        }
    }

    private findProjectRoot(): string | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        }

        let currentDir = path.dirname(activeEditor.document.uri.fsPath);
        
        // Look for CMakeLists.txt or .pro file
        while (currentDir !== path.dirname(currentDir)) {
            const cmakeFile = path.join(currentDir, 'CMakeLists.txt');
            const proFile = path.join(currentDir, '*.pro');
            
            if (fs.existsSync(cmakeFile) || fs.readdirSync(currentDir).some(file => file.endsWith('.pro'))) {
                return currentDir;
            }
            
            currentDir = path.dirname(currentDir);
        }

        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    private async runCommand(command: string, args: string[], cwd: string): Promise<void> {
        const platformInfo = this.getPlatformInfo();
        
        return new Promise((resolve, reject) => {
            this._outputChannel.clear();
            this._outputChannel.show();
            this._outputChannel.appendLine(`Running: ${command} ${args.join(' ')}`);
            this._outputChannel.appendLine(`Platform: ${platformInfo.platform}`);
            this._outputChannel.appendLine(`Working directory: ${cwd}`);
            this._outputChannel.appendLine('='.repeat(50));

            let fullCommand: string;
            let fullArgs: string[];

            if (platformInfo.platform === 'windows') {
                fullCommand = platformInfo.shell;
                
                const msysCwd = this.convertToMsysPath(cwd);
                
                // Convert Windows paths in arguments to MSYS2 format
                const msysArgs = args.map(arg => {
                    if (arg.includes(':\\') || (arg.includes(':/') && arg.length > 3)) {
                        return this.convertToMsysPath(arg);
                    }
                    return arg;
                });
                
                const commandLine = `cd "${msysCwd}" && ${command} ${msysArgs.join(' ')}`;
                fullArgs = [...platformInfo.shellArgs, commandLine];
                
                this._outputChannel.appendLine(`MSYS2 command: ${commandLine}`);
            } else {
                fullCommand = command;
                fullArgs = args;
            }

            this._currentProcess = spawn(fullCommand, fullArgs, {
                cwd: cwd,
                env: platformInfo.env,
                stdio: 'pipe'
            });

            this._currentProcess.stdout?.on('data', (data) => {
                this._outputChannel.append(data.toString());
            });

            this._currentProcess.stderr?.on('data', (data) => {
                this._outputChannel.append(data.toString());
            });

            this._currentProcess.on('close', (code) => {
                this._outputChannel.appendLine('='.repeat(50));
                if (code === 0) {
                    this._outputChannel.appendLine(`✅ Command completed successfully`);
                    resolve();
                } else {
                    this._outputChannel.appendLine(`❌ Command failed with exit code ${code}`);
                    reject(new Error(`Process exited with code ${code}`));
                }
                this._currentProcess = undefined;
            });

            this._currentProcess.on('error', (error) => {
                this._outputChannel.appendLine(`❌ Error: ${error.message}`);
                reject(error);
                this._currentProcess = undefined;
            });
        });
    }

    private convertToMsysPath(windowsPath: string): string {
        // Convert Windows path to MSYS2 format
        // C:\Users\... -> /c/Users/...
        // Handle both forward and backward slashes
        let msysPath = windowsPath.replace(/\\/g, '/');
        
        // Convert drive letter
        if (msysPath.match(/^[A-Za-z]:/)) {
            const driveLetter = msysPath[0].toLowerCase();
            msysPath = `/${driveLetter}${msysPath.substring(2)}`;
        }
        
        return msysPath;
    }

    async buildProject(): Promise<void> {
        const projectRoot = this.findProjectRoot();
        if (!projectRoot) {
            vscode.window.showErrorMessage('No Qt project found in workspace');
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('qtLivePreview');
            const buildConfig = config.get<string>('buildConfiguration') || 'Debug';
            const buildDir = path.join(projectRoot, 'build');
            const platformInfo = this.getPlatformInfo();

            // Create build directory
            if (!fs.existsSync(buildDir)) {
                fs.mkdirSync(buildDir, { recursive: true });
            }

            // Use consistent path format for CMake
            const cmakeArgs = [
                '-S', projectRoot,
                '-B', buildDir,
                `-DCMAKE_BUILD_TYPE=${buildConfig}`,
                '-G', 'Ninja'
            ];

            // Add Qt6 specific paths
            if (platformInfo.qt6Path) {
                // For MSYS2, convert Qt6 path to MSYS format for CMake
                const qt6Path = platformInfo.platform === 'windows' 
                    ? this.convertToMsysPath(platformInfo.qt6Path)
                    : platformInfo.qt6Path;
                    
                cmakeArgs.push(`-DCMAKE_PREFIX_PATH=${qt6Path}`);
                cmakeArgs.push(`-DQt6_DIR=${qt6Path}/lib/cmake/Qt6`);
                cmakeArgs.push(`-DQt6Core_DIR=${qt6Path}/lib/cmake/Qt6Core`);
                cmakeArgs.push(`-DQt6Widgets_DIR=${qt6Path}/lib/cmake/Qt6Widgets`);
                cmakeArgs.push(`-DQt6Quick_DIR=${qt6Path}/lib/cmake/Qt6Quick`);
            }

            // Configure with CMake
            await this.runCommand('cmake', cmakeArgs, projectRoot);

            // Build with Ninja
            const buildPath = platformInfo.platform === 'windows' 
                ? this.convertToMsysPath(buildDir)
                : buildDir;
            await this.runCommand('ninja', ['-C', buildPath], projectRoot);

            vscode.window.showInformationMessage('✅ Qt project built successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Build failed: ${error}`);
        }
    }

    async runProject(): Promise<void> {
        const projectRoot = this.findProjectRoot();
        if (!projectRoot) {
            vscode.window.showErrorMessage('No Qt project found in workspace');
            return;
        }

        try {
            // If application is already running, just show notification
            if (this._isApplicationRunning && this._runningProcess) {
                vscode.window.showInformationMessage('🔄 Qt application is already running. Hot reload will update it automatically.');
                return;
            }

            // Build first
            await this.buildProject();

            // Find executable
            const buildDir = path.join(projectRoot, 'build');
            const projectName = path.basename(projectRoot);
            const platformInfo = this.getPlatformInfo();
            
            let executableName = projectName;
            if (platformInfo.platform === 'windows') {
                executableName += '.exe';
            }

            const executablePath = path.join(buildDir, executableName);
            
            if (!fs.existsSync(executablePath)) {
                vscode.window.showErrorMessage(`Executable not found: ${executablePath}`);
                return;
            }

            // Kill previous instance if exists
            if (this._runningProcess) {
                this._runningProcess.kill();
                this._runningProcess = undefined;
            }

            // Start the Qt application
            this._runningProcess = spawn(executablePath, [], {
                cwd: buildDir,
                env: platformInfo.env,
                stdio: 'pipe'
            });

            this._isApplicationRunning = true;

            // Handle application output
            this._runningProcess.stdout?.on('data', (data) => {
                this._outputChannel.appendLine(`App: ${data.toString()}`);
            });

            this._runningProcess.stderr?.on('data', (data) => {
                this._outputChannel.appendLine(`App Error: ${data.toString()}`);
            });

            this._runningProcess.on('close', (code) => {
                this._isApplicationRunning = false;
                this._runningProcess = undefined;
                this._outputChannel.appendLine(`Qt application exited with code ${code}`);
                vscode.window.showInformationMessage('📱 Qt application closed');
            });

            this._runningProcess.on('error', (error) => {
                this._isApplicationRunning = false;
                this._runningProcess = undefined;
                vscode.window.showErrorMessage(`Failed to run Qt application: ${error.message}`);
            });

            vscode.window.showInformationMessage('🚀 Qt application started! Hot reload is active.');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Failed to run project: ${error}`);
        }
    }

    public async hotReloadApplication(): Promise<void> {
        if (!this._isApplicationRunning || !this._runningProcess) {
            return;
        }

        const projectRoot = this.findProjectRoot();
        if (!projectRoot) return;

        try {
            // Rebuild the application
            await this.buildProject();

            // For Qt Widgets apps, we need to restart the application
            // because C++ changes require a restart
            if (this._runningProcess) {
                this._runningProcess.kill();
                
                // Wait a moment for the process to close
                setTimeout(async () => {
                    await this.runProject();
                }, 1000);
            }
        } catch (error) {
            console.error('Hot reload failed:', error);
        }
    }

    public stopApplication(): void {
        if (this._runningProcess) {
            this._runningProcess.kill();
            this._runningProcess = undefined;
            this._isApplicationRunning = false;
            vscode.window.showInformationMessage('⏹️ Qt application stopped');
        }
    }

    public isApplicationRunning(): boolean {
        return this._isApplicationRunning;
    }

    async debugProject(): Promise<void> {
        const projectRoot = this.findProjectRoot();
        if (!projectRoot) {
            vscode.window.showErrorMessage('No Qt project found in workspace');
            return;
        }

        try {
            // Build in Debug mode first
            const config = vscode.workspace.getConfiguration('qtLivePreview');
            await config.update('buildConfiguration', 'Debug', vscode.ConfigurationTarget.Workspace);
            
            await this.buildProject();

            // Launch debugger
            const projectName = path.basename(projectRoot);
            const buildDir = path.join(projectRoot, 'build');
            const platformInfo = this.getPlatformInfo();
            
            let program = path.join(buildDir, projectName);
            if (platformInfo.platform === 'windows') {
                program += '.exe';
            }

            const debugConfig = {
                type: platformInfo.platform === 'windows' ? 'cppdbg' : 'lldb',
                request: 'launch',
                name: 'Debug Qt Application',
                program: program,
                cwd: buildDir,
                environment: Object.entries(platformInfo.env).map(([name, value]) => ({ name, value: value?.toString() || '' }))
            };

            vscode.debug.startDebugging(vscode.workspace.workspaceFolders?.[0], debugConfig);
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Failed to debug project: ${error}`);
        }
    }

    async configureQt(): Promise<void> {
        const platform = os.platform();
        let defaultPath = '';
        let placeholder = '';

        if (platform === 'win32') {
            defaultPath = 'C:/msys64/mingw64';
            placeholder = 'e.g., C:/msys64/mingw64 or C:/Qt/6.5.0/mingw_64';
        } else if (platform === 'darwin') {
            placeholder = 'e.g., /usr/local/Qt/6.5.0/macos or /opt/homebrew/opt/qt6';
        } else {
            placeholder = 'e.g., /usr/local/Qt/6.5.0/gcc_64 or /usr/lib/qt6';
        }

        const qt6Path = await vscode.window.showInputBox({
            prompt: `Enter Qt6 installation path for ${platform === 'win32' ? 'MSYS2/MinGW64' : platform}`,
            placeHolder: placeholder,
            value: vscode.workspace.getConfiguration('qtLivePreview').get<string>('qt6Path') || defaultPath
        });

        if (qt6Path) {
            // Validate the path
            const qtCMakePath = path.join(qt6Path, 'lib', 'cmake', 'Qt6');
            if (!fs.existsSync(qtCMakePath)) {
                const result = await vscode.window.showWarningMessage(
                    `Qt6 CMake files not found at ${qtCMakePath}. Continue anyway?`,
                    'Yes', 'No'
                );
                if (result !== 'Yes') return;
            }

            const config = vscode.workspace.getConfiguration('qtLivePreview');
            await config.update('qt6Path', qt6Path, vscode.ConfigurationTarget.Global);
            
            const platformInfo = this.getPlatformInfo();
            vscode.window.showInformationMessage(
                `✅ Qt6 path configured for ${platformInfo.platform}: ${qt6Path}`
            );

            // Show additional setup instructions for MSYS2
            if (platform === 'win32' && qt6Path.includes('msys64')) {
                vscode.window.showInformationMessage(
                    '💡 MSYS2 detected. Make sure you have qt6-base and qt6-tools installed:\n' +
                    'pacman -S mingw-w64-x86_64-qt6-base mingw-w64-x86_64-qt6-tools',
                    'Open MSYS2 Docs'
                ).then(selection => {
                    if (selection === 'Open MSYS2 Docs') {
                        vscode.env.openExternal(vscode.Uri.parse('https://www.msys2.org/docs/package-management/'));
                    }
                });
            }
        }
    }

    dispose() {
        if (this._currentProcess) {
            this._currentProcess.kill();
        }
        if (this._runningProcess) {
            this._runningProcess.kill();
        }
        if (this._terminal) {
            this._terminal.dispose();
        }
        this._outputChannel.dispose();
    }
}
