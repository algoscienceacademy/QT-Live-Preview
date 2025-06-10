import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Qt6ModuleManager } from './qt6ModuleManager';
import { Qt6ProjectTemplates } from './qt6ProjectTemplates';

export class QTProjectManager {
    async createNewProject() {
        const projectTypes = [
            { label: 'Basic Qt6 Application', value: 'basic' },
            { label: 'Advanced Qt Widgets Application', value: 'widgets_advanced' },
            { label: 'Advanced QML Application', value: 'qml_advanced' },
            { label: 'Qt Multimedia Application', value: 'multimedia' },
            { label: 'Qt Charts Application', value: 'charts' },
            { label: 'Qt Network Application', value: 'network' },
            { label: 'Qt WebEngine Application', value: 'webengine' },
            { label: 'Qt 3D Application', value: '3d' }
        ];

        const selectedType = await vscode.window.showQuickPick(projectTypes, {
            placeHolder: 'Select project type'
        });

        if (!selectedType) return;

        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Project name is required';
                }
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Project name must start with letter and contain only letters, numbers, and underscores';
                }
                return null;
            }
        });

        if (!projectName) return;

        // Get default modules for project type
        const defaultModules = this.getDefaultModulesForType(selectedType.value);
        
        await this.createProjectWithModules(projectName, selectedType.value, defaultModules);
    }

    async createModuleProject() {
        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Project name is required';
                }
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                    return 'Project name must start with letter and contain only letters, numbers, and underscores';
                }
                return null;
            }
        });

        if (!projectName) return;

        const moduleManager = new Qt6ModuleManager();
        const selectedModules = await moduleManager.selectModulesInteractive();
        
        if (selectedModules.length === 0) {
            vscode.window.showWarningMessage('No modules selected. Using default modules.');
            await this.createProjectWithModules(projectName, 'basic', ['Core', 'Widgets']);
            return;
        }

        // Determine project type based on selected modules
        let projectType = 'basic';
        if (selectedModules.includes('Quick')) {
            projectType = 'qml_advanced';
        } else if (selectedModules.includes('Widgets')) {
            projectType = 'widgets_advanced';
        }

        await this.createProjectWithModules(projectName, projectType, selectedModules);
    }

    private async createProjectWithModules(projectName: string, projectType: string, modules: string[]) {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select project location'
        });

        if (!folderUri || folderUri.length === 0) return;

        const projectPath = path.join(folderUri[0].fsPath, projectName);
        
        try {
            await this.createProjectStructure(projectPath, projectName, projectType, modules);
            
            vscode.window.showInformationMessage(
                `✅ Qt6 project '${projectName}' created successfully with ${modules.length} modules!`,
                'Open Project'
            ).then(selection => {
                if (selection === 'Open Project') {
                    const uri = vscode.Uri.file(projectPath);
                    vscode.commands.executeCommand('vscode.openFolder', uri);
                }
            });
            
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Failed to create project: ${error}`);
        }
    }

    private async createProjectStructure(projectPath: string, projectName: string, projectType: string, modules: string[]) {
        // Create project directory
        fs.mkdirSync(projectPath, { recursive: true });

        // Get project template
        const template = Qt6ProjectTemplates.getTemplate(projectType, projectName, modules);
        
        // Create all files from template
        for (const [filename, content] of Object.entries(template.files)) {
            const filePath = path.join(projectPath, filename);
            
            // Create subdirectories if needed
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, content);
        }

        // Create additional directories
        fs.mkdirSync(path.join(projectPath, 'build'), { recursive: true });
        
        // Create .vscode directory with settings
        const vscodeDir = path.join(projectPath, '.vscode');
        fs.mkdirSync(vscodeDir, { recursive: true });
        
        // VS Code settings for Qt development
        const vscodeSettings = {
            "cmake.buildDirectory": "${workspaceFolder}/build",
            "cmake.generator": "Ninja",
            "qtLivePreview.autoReload": true,
            "files.associations": {
                "*.qml": "qml",
                "*.ui": "xml"
            },
            "qt.searchPaths": [
                "${workspaceFolder}"
            ]
        };
        
        fs.writeFileSync(
            path.join(vscodeDir, 'settings.json'),
            JSON.stringify(vscodeSettings, null, 2)
        );

        // Create .gitignore
        const gitignore = `# Build directories
build/
*.user

# Qt Creator files
*.pro.user*

# Visual Studio Code
.vscode/
!.vscode/settings.json

# Platform specific
.DS_Store
Thumbs.db

# Compiled Object files
*.o
*.obj

# Executables
*.exe
*.app

# CMake
CMakeCache.txt
CMakeFiles/
cmake_install.cmake
Makefile

# Ninja
.ninja_deps
.ninja_log
build.ninja
rules.ninja
`;
        
        fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

        console.log(`Project created at: ${projectPath}`);
        console.log(`Template: ${template.displayName}`);
        console.log(`Modules: ${modules.join(', ')}`);
    }

    private getDefaultModulesForType(projectType: string): string[] {
        switch (projectType) {
            case 'widgets_advanced':
                return ['Core', 'Widgets', 'Gui'];
            case 'qml_advanced':
                return ['Core', 'Quick', 'QuickControls2', 'Qml'];
            case 'multimedia':
                return ['Core', 'Quick', 'Multimedia'];
            case 'charts':
                return ['Core', 'Charts', 'Widgets'];
            case 'network':
                return ['Core', 'Network', 'Widgets'];
            case 'webengine':
                return ['Core', 'WebEngine', 'Quick'];
            case '3d':
                return ['Core', '3DCore', '3DRender', 'Quick'];
            default:
                return ['Core', 'Widgets'];
        }
    }
}
