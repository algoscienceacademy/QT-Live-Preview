import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Qt6Module {
    name: string;
    displayName: string;
    description: string;
    dependencies: string[];
    headers?: string[];
    features?: string[];
}

export class Qt6ModuleManager {
    private static readonly QT6_MODULES: { [key: string]: Qt6Module } = {
        'Core': {
            name: 'Core',
            displayName: 'Qt Core',
            description: 'Core functionality for Qt applications',
            dependencies: [],
            headers: ['QCoreApplication', 'QString', 'QObject', 'QTimer']
        },
        'Widgets': {
            name: 'Widgets',
            displayName: 'Qt Widgets',
            description: 'Desktop GUI components',
            dependencies: ['Core', 'Gui'],
            headers: ['QApplication', 'QMainWindow', 'QPushButton', 'QLabel', 'QVBoxLayout'],
            features: ['Desktop GUI', 'Traditional Widgets', 'Layouts']
        },
        'Quick': {
            name: 'Quick',
            displayName: 'Qt Quick',
            description: 'QML engine and Quick components',
            dependencies: ['Core', 'Gui', 'Qml'],
            headers: ['QQuickView', 'QQmlApplicationEngine'],
            features: ['QML', 'Modern UI', 'Touch interfaces']
        },
        'QuickControls2': {
            name: 'QuickControls2',
            displayName: 'Qt Quick Controls 2',
            description: 'Modern QML controls',
            dependencies: ['Quick'],
            features: ['Material Design', 'Universal Style', 'Mobile UI']
        },
        'Network': {
            name: 'Network',
            displayName: 'Qt Network',
            description: 'Network programming classes',
            dependencies: ['Core'],
            headers: ['QNetworkAccessManager', 'QTcpSocket', 'QUdpSocket']
        },
        'Sql': {
            name: 'Sql',
            displayName: 'Qt SQL',
            description: 'Database integration classes',
            dependencies: ['Core'],
            headers: ['QSqlDatabase', 'QSqlQuery', 'QSqlTableModel']
        },
        'Multimedia': {
            name: 'Multimedia',
            displayName: 'Qt Multimedia',
            description: 'Audio, video, and camera functionality',
            dependencies: ['Core', 'Network'],
            headers: ['QMediaPlayer', 'QCamera', 'QAudioOutput']
        },
        'WebEngine': {
            name: 'WebEngine',
            displayName: 'Qt WebEngine',
            description: 'Chromium-based web engine',
            dependencies: ['Core', 'Quick'],
            headers: ['QWebEngineView']
        },
        'Charts': {
            name: 'Charts',
            displayName: 'Qt Charts',
            description: 'Chart and graph components',
            dependencies: ['Core', 'Widgets'],
            headers: ['QChart', 'QChartView', 'QLineSeries']
        },
        'DataVisualization': {
            name: 'DataVisualization',
            displayName: 'Qt Data Visualization',
            description: '3D data visualization',
            dependencies: ['Core', 'Gui'],
            features: ['3D Charts', 'Scatter plots', 'Surface plots']
        },
        'Bluetooth': {
            name: 'Bluetooth',
            displayName: 'Qt Bluetooth',
            description: 'Bluetooth connectivity',
            dependencies: ['Core'],
            headers: ['QBluetoothDeviceDiscoveryAgent', 'QBluetoothSocket']
        },
        'SerialPort': {
            name: 'SerialPort',
            displayName: 'Qt Serial Port',
            description: 'Serial port communication',
            dependencies: ['Core'],
            headers: ['QSerialPort', 'QSerialPortInfo']
        },
        'Positioning': {
            name: 'Positioning',
            displayName: 'Qt Positioning',
            description: 'Position information classes',
            dependencies: ['Core'],
            headers: ['QGeoPositionInfoSource', 'QGeoCoordinate']
        },
        'Sensors': {
            name: 'Sensors',
            displayName: 'Qt Sensors',
            description: 'Sensor API',
            dependencies: ['Core'],
            headers: ['QAccelerometer', 'QGyroscope', 'QCompass']
        },
        'WebSockets': {
            name: 'WebSockets',
            displayName: 'Qt WebSockets',
            description: 'WebSocket communication',
            dependencies: ['Core', 'Network'],
            headers: ['QWebSocket', 'QWebSocketServer']
        },
        'Concurrent': {
            name: 'Concurrent',
            displayName: 'Qt Concurrent',
            description: 'Concurrent programming support',
            dependencies: ['Core'],
            headers: ['QtConcurrent', 'QFuture', 'QThreadPool']
        },
        'PrintSupport': {
            name: 'PrintSupport',
            displayName: 'Qt Print Support',
            description: 'Printing functionality',
            dependencies: ['Core', 'Widgets'],
            headers: ['QPrinter', 'QPrintDialog', 'QPrintPreviewWidget']
        },
        'Svg': {
            name: 'Svg',
            displayName: 'Qt SVG',
            description: 'SVG rendering classes',
            dependencies: ['Core', 'Gui'],
            headers: ['QSvgRenderer', 'QSvgWidget']
        },
        'OpenGL': {
            name: 'OpenGL',
            displayName: 'Qt OpenGL',
            description: 'OpenGL integration classes',
            dependencies: ['Core', 'Gui'],
            headers: ['QOpenGLWidget', 'QOpenGLFunctions']
        },
        'Test': {
            name: 'Test',
            displayName: 'Qt Test',
            description: 'Unit testing framework',
            dependencies: ['Core'],
            headers: ['QTest', 'QSignalSpy']
        },
        '3DCore': {
            name: '3DCore',
            displayName: 'Qt 3D Core',
            description: '3D engine core functionality',
            dependencies: ['Core', 'Gui'],
            headers: ['Qt3DCore', 'QEntity', 'QTransform']
        },
        '3DRender': {
            name: '3DRender',
            displayName: 'Qt 3D Render',
            description: '3D rendering classes',
            dependencies: ['3DCore'],
            headers: ['Qt3DRender', 'QMesh', 'QMaterial']
        }
    };

    public static getAllModules(): Qt6Module[] {
        return Object.values(this.QT6_MODULES);
    }

    public static getModule(name: string): Qt6Module | undefined {
        return this.QT6_MODULES[name];
    }

    public static getModuleDependencies(moduleName: string): string[] {
        const module = this.getModule(moduleName);
        if (!module) return [];

        const deps = new Set<string>();
        const addDependencies = (modName: string) => {
            const mod = this.getModule(modName);
            if (mod) {
                mod.dependencies.forEach(dep => {
                    if (!deps.has(dep)) {
                        deps.add(dep);
                        addDependencies(dep);
                    }
                });
            }
        };

        addDependencies(moduleName);
        return Array.from(deps);
    }

    public static generateCMakeModules(modules: string[]): string {
        const allModules = new Set<string>();
        
        modules.forEach(mod => {
            allModules.add(mod);
            this.getModuleDependencies(mod).forEach(dep => allModules.add(dep));
        });

        return Array.from(allModules).map(mod => `Qt6::${mod}`).join(' ');
    }

    public static generateCMakeFindPackage(modules: string[]): string {
        const allModules = new Set<string>();
        
        modules.forEach(mod => {
            allModules.add(mod);
            this.getModuleDependencies(mod).forEach(dep => allModules.add(dep));
        });

        return `find_package(Qt6 REQUIRED COMPONENTS ${Array.from(allModules).join(' ')})`;
    }

    public static generateQMLImports(modules: string[]): string[] {
        const imports: string[] = [];
        
        modules.forEach(mod => {
            switch (mod) {
                case 'Quick':
                    imports.push('import QtQuick 2.15');
                    break;
                case 'QuickControls2':
                    imports.push('import QtQuick.Controls 2.15');
                    imports.push('import QtQuick.Layouts 1.15');
                    break;
                case 'Charts':
                    imports.push('import QtCharts 2.15');
                    break;
                case 'WebEngine':
                    imports.push('import QtWebEngine 1.15');
                    break;
                case 'Multimedia':
                    imports.push('import QtMultimedia 5.15');
                    break;
                case 'DataVisualization':
                    imports.push('import QtDataVisualization 1.15');
                    break;
                case '3DCore':
                case '3DRender':
                    imports.push('import Qt3D.Core 2.15');
                    imports.push('import Qt3D.Render 2.15');
                    break;
            }
        });

        return [...new Set(imports)]; // Remove duplicates
    }

    public async selectModulesInteractive(): Promise<string[]> {
        const allModules = Qt6ModuleManager.getAllModules();
        const quickPick = vscode.window.createQuickPick();
        
        quickPick.items = allModules.map(module => ({
            label: module.displayName,
            description: module.description,
            detail: `Dependencies: ${module.dependencies.join(', ') || 'None'}`,
            picked: ['Core', 'Widgets', 'Quick', 'QuickControls2'].includes(module.name)
        }));
        
        quickPick.canSelectMany = true;
        quickPick.placeholder = 'Select Qt6 modules for your project';
        quickPick.title = 'Qt6 Module Selection';
        
        return new Promise((resolve) => {
            quickPick.onDidAccept(() => {
                const selected = quickPick.selectedItems.map(item => {
                    const module = allModules.find(m => m.displayName === item.label);
                    return module?.name || '';
                }).filter(name => name !== '');
                
                quickPick.hide();
                resolve(selected);
            });
            
            quickPick.show();
        });
    }
}
