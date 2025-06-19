import * as vscode from 'vscode';
import { QTProjectManager } from './qtProjectManager';
import { LivePreviewProvider } from './livePreviewProvider';
import { HotReloadManager } from './hotReloadManager';
import { ErrorReporter } from './errorReporter';
import { BuildManager } from './buildManager';
import { QMLErrorDetector } from './qmlErrorDetector';

let projectManager: QTProjectManager;
let previewProvider: LivePreviewProvider;
let hotReloadManager: HotReloadManager;
let errorReporter: ErrorReporter;
let buildManager: BuildManager;
let qmlErrorDetector: QMLErrorDetector;

export function activate(context: vscode.ExtensionContext) {
    console.log('QT Live Preview extension is now active!');

    projectManager = new QTProjectManager();
    previewProvider = new LivePreviewProvider(context.extensionUri);
    hotReloadManager = new HotReloadManager(previewProvider);
    errorReporter = new ErrorReporter();
    buildManager = new BuildManager();
    qmlErrorDetector = new QMLErrorDetector();

    // Connect components
    previewProvider.setBuildManager(buildManager);
    hotReloadManager.setBuildManager(buildManager);

    // Register commands
    const createProjectCmd = vscode.commands.registerCommand('qtLivePreview.createProject', () => {
        projectManager.createNewProject();
    });

    const createModuleProjectCmd = vscode.commands.registerCommand('qtLivePreview.createModuleProject', () => {
        projectManager.createModuleProject();
    });

    const startPreviewCmd = vscode.commands.registerCommand('qtLivePreview.startPreview', (uri?: vscode.Uri) => {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (targetUri) {
            previewProvider.startPreview(targetUri);
            hotReloadManager.start(targetUri.fsPath);
        }
    });

    const stopPreviewCmd = vscode.commands.registerCommand('qtLivePreview.stopPreview', () => {
        previewProvider.stopPreview();
        hotReloadManager.stop();
    });

    const toggleHotReloadCmd = vscode.commands.registerCommand('qtLivePreview.toggleHotReload', () => {
        hotReloadManager.toggle();
    });

    const buildProjectCmd = vscode.commands.registerCommand('qtLivePreview.buildProject', () => {
        buildManager.buildProject();
    });

    const runProjectCmd = vscode.commands.registerCommand('qtLivePreview.runProject', () => {
        buildManager.runProject();
    });

    const debugProjectCmd = vscode.commands.registerCommand('qtLivePreview.debugProject', () => {
        buildManager.debugProject();
    });

    const configureQtCmd = vscode.commands.registerCommand('qtLivePreview.configureQt', () => {
        buildManager.configureQt();
    });

    const stopProjectCmd = vscode.commands.registerCommand('qtLivePreview.stopProject', () => {
        buildManager.stopApplication();
    });

    // Setup webview message handling after provider is registered
    const setupWebviewHandling = () => {
        if (previewProvider._view) {
            previewProvider._view.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'buildProject':
                            buildManager.buildProject();
                            break;
                        case 'runProject':
                            buildManager.runProject();
                            break;
                        case 'stopProject':
                            buildManager.stopApplication();
                            break;
                        case 'debugProject':
                            buildManager.debugProject();
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    };

    // Register webview provider and setup handling
    const webviewProvider = vscode.window.registerWebviewViewProvider('qtLivePreview.preview', previewProvider);
    
    // Setup webview handling after a delay to ensure provider is ready
    setTimeout(setupWebviewHandling, 1000);

    // Register all commands
    context.subscriptions.push(
        webviewProvider,
        createProjectCmd,
        createModuleProjectCmd,
        startPreviewCmd,
        stopPreviewCmd,
        toggleHotReloadCmd,
        buildProjectCmd,
        runProjectCmd,
        debugProjectCmd,
        configureQtCmd,
        stopProjectCmd
    );

    // Auto-start preview for QML files
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && (editor.document.languageId === 'qml' || editor.document.fileName.endsWith('.ui'))) {
            const config = vscode.workspace.getConfiguration('qtLivePreview');
            if (config.get('autoReload')) {
                previewProvider.startPreview(editor.document.uri);
                hotReloadManager.start(editor.document.uri.fsPath);
            }
        }
    });

    // Auto-analyze QML files when opened or changed
    const analyzeQMLFile = async (document: vscode.TextDocument) => {
        if (document.languageId === 'qml' || document.fileName.endsWith('.qml')) {
            await qmlErrorDetector.analyzeQMLFile(document.uri);
        }
    };

    // Register QML file watchers
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(analyzeQMLFile);
    const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(analyzeQMLFile);
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.languageId === 'qml' || event.document.fileName.endsWith('.qml')) {
            // Debounce analysis to avoid too frequent checks
            setTimeout(() => {
                qmlErrorDetector.analyzeQMLFile(event.document.uri);
            }, 1000);
        }
    });

    // Analyze currently open QML files
    vscode.workspace.textDocuments.forEach(analyzeQMLFile);

    // Set context for Qt project detection
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const hasQtProject = workspaceFolders.some(folder => 
            vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*.{pro,qml,ui}'), null, 1)
        );
        vscode.commands.executeCommand('setContext', 'workspaceHasQtProject', hasQtProject);
    }

    context.subscriptions.push(
        onDidOpenTextDocument,
        onDidSaveTextDocument,
        onDidChangeTextDocument,
        qmlErrorDetector
    );
}

export function deactivate() {
    if (previewProvider) {
        previewProvider.stopPreview();
    }
    if (hotReloadManager) {
        hotReloadManager.stop();
    }
    if (buildManager) {
        buildManager.dispose();
    }
    if (qmlErrorDetector) {
        qmlErrorDetector.dispose();
    }
}
