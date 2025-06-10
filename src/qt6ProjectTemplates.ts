import * as fs from 'fs';
import * as path from 'path';
import { Qt6ModuleManager } from './qt6ModuleManager';

export interface ProjectTemplate {
    name: string;
    displayName: string;
    description: string;
    modules: string[];
    files: { [filename: string]: string };
}

export class Qt6ProjectTemplates {
    public static getTemplate(templateName: string, projectName: string, modules: string[]): ProjectTemplate {
        switch (templateName) {
            case 'widgets_advanced':
                return this.createAdvancedWidgetsTemplate(projectName, modules);
            case 'qml_advanced':
                return this.createAdvancedQMLTemplate(projectName, modules);
            case 'multimedia':
                return this.createMultimediaTemplate(projectName, modules);
            case 'network':
                return this.createNetworkTemplate(projectName, modules);
            case 'charts':
                return this.createChartsTemplate(projectName, modules);
            case 'webengine':
                return this.createWebEngineTemplate(projectName, modules);
            case '3d':
                return this.create3DTemplate(projectName, modules);
            default:
                return this.createBasicTemplate(projectName, modules);
        }
    }

    private static createAdvancedWidgetsTemplate(projectName: string, modules: string[]): ProjectTemplate {
        const findPackage = Qt6ModuleManager.generateCMakeFindPackage(modules);
        const linkLibraries = Qt6ModuleManager.generateCMakeModules(modules);

        return {
            name: 'widgets_advanced',
            displayName: 'Advanced Qt Widgets Application',
            description: 'Full-featured widgets application with menus, toolbars, and status bar',
            modules,
            files: {
                'CMakeLists.txt': `cmake_minimum_required(VERSION 3.16)
project(${projectName})

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

${findPackage}

set(SOURCES
    main.cpp
    mainwindow.cpp
    mainwindow.h
    mainwindow.ui
)

qt_add_executable(${projectName})
qt_add_resources(${projectName} "resources" PREFIX "/" FILES icons/app.png)

target_sources(${projectName} PRIVATE \${SOURCES})
target_link_libraries(${projectName} PRIVATE ${linkLibraries})

if(WIN32)
    set_target_properties(${projectName} PROPERTIES WIN32_EXECUTABLE TRUE)
endif()`,

                'main.cpp': `#include <QApplication>
#include <QStyleFactory>
#include <QDir>
#include "mainwindow.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    app.setApplicationName("${projectName}");
    app.setApplicationVersion("1.0");
    app.setOrganizationName("Your Company");
    
    // Set application icon
    app.setWindowIcon(QIcon(":/icons/app.png"));
    
    MainWindow window;
    window.show();

    return app.exec();
}`,

                'mainwindow.h': `#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QMenuBar>
#include <QToolBar>
#include <QStatusBar>
#include <QAction>
#include <QFileDialog>
#include <QMessageBox>
#include <QTextEdit>
#include <QVBoxLayout>
#include <QSplitter>

QT_BEGIN_NAMESPACE
class QAction;
class QMenu;
class QTextEdit;
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void newFile();
    void openFile();
    void saveFile();
    void about();
    void documentWasModified();

private:
    void createMenus();
    void createToolBars();
    void createStatusBar();
    void createCentralWidget();
    void readSettings();
    void writeSettings();

    QTextEdit *textEdit;
    QAction *newAct;
    QAction *openAct;
    QAction *saveAct;
    QAction *exitAct;
    QAction *aboutAct;
    
    QString currentFile;
};

#endif // MAINWINDOW_H`,

                'mainwindow.cpp': `#include "mainwindow.h"
#include <QApplication>
#include <QCloseEvent>
#include <QFileInfo>
#include <QSettings>
#include <QStandardPaths>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent), textEdit(nullptr)
{
    createCentralWidget();
    createMenus();
    createToolBars();
    createStatusBar();
    
    readSettings();
    
    connect(textEdit, &QTextEdit::textChanged,
            this, &MainWindow::documentWasModified);
    
    setWindowTitle(tr("${projectName}"));
    resize(800, 600);
}

MainWindow::~MainWindow() = default;

void MainWindow::createCentralWidget()
{
    textEdit = new QTextEdit;
    setCentralWidget(textEdit);
}

void MainWindow::createMenus()
{
    // File Menu
    newAct = new QAction(tr("&New"), this);
    newAct->setShortcuts(QKeySequence::New);
    newAct->setStatusTip(tr("Create a new file"));
    connect(newAct, &QAction::triggered, this, &MainWindow::newFile);

    openAct = new QAction(tr("&Open..."), this);
    openAct->setShortcuts(QKeySequence::Open);
    openAct->setStatusTip(tr("Open an existing file"));
    connect(openAct, &QAction::triggered, this, &MainWindow::openFile);

    saveAct = new QAction(tr("&Save"), this);
    saveAct->setShortcuts(QKeySequence::Save);
    saveAct->setStatusTip(tr("Save the document to disk"));
    connect(saveAct, &QAction::triggered, this, &MainWindow::saveFile);

    exitAct = new QAction(tr("E&xit"), this);
    exitAct->setShortcuts(QKeySequence::Quit);
    exitAct->setStatusTip(tr("Exit the application"));
    connect(exitAct, &QAction::triggered, this, &QWidget::close);

    QMenu *fileMenu = menuBar()->addMenu(tr("&File"));
    fileMenu->addAction(newAct);
    fileMenu->addAction(openAct);
    fileMenu->addAction(saveAct);
    fileMenu->addSeparator();
    fileMenu->addAction(exitAct);

    // Help Menu
    aboutAct = new QAction(tr("&About"), this);
    aboutAct->setStatusTip(tr("Show the application's About box"));
    connect(aboutAct, &QAction::triggered, this, &MainWindow::about);

    QMenu *helpMenu = menuBar()->addMenu(tr("&Help"));
    helpMenu->addAction(aboutAct);
}

void MainWindow::createToolBars()
{
    QToolBar *fileToolBar = addToolBar(tr("File"));
    fileToolBar->addAction(newAct);
    fileToolBar->addAction(openAct);
    fileToolBar->addAction(saveAct);
}

void MainWindow::createStatusBar()
{
    statusBar()->showMessage(tr("Ready"));
}

void MainWindow::newFile()
{
    textEdit->clear();
    currentFile.clear();
    setWindowTitle(tr("${projectName}"));
}

void MainWindow::openFile()
{
    QString fileName = QFileDialog::getOpenFileName(this);
    if (!fileName.isEmpty()) {
        QFile file(fileName);
        if (file.open(QIODevice::ReadOnly | QIODevice::Text)) {
            textEdit->setPlainText(file.readAll());
            currentFile = fileName;
            setWindowTitle(QFileInfo(fileName).fileName() + " - ${projectName}");
        }
    }
}

void MainWindow::saveFile()
{
    if (currentFile.isEmpty()) {
        currentFile = QFileDialog::getSaveFileName(this);
    }
    
    if (!currentFile.isEmpty()) {
        QFile file(currentFile);
        if (file.open(QIODevice::WriteOnly | QIODevice::Text)) {
            file.write(textEdit->toPlainText().toUtf8());
            setWindowTitle(QFileInfo(currentFile).fileName() + " - ${projectName}");
        }
    }
}

void MainWindow::about()
{
    QMessageBox::about(this, tr("About ${projectName}"),
                      tr("${projectName} v1.0\\n"
                         "Built with Qt6 and Qt Live Preview"));
}

void MainWindow::documentWasModified()
{
    setWindowModified(textEdit->document()->isModified());
}

void MainWindow::readSettings()
{
    QSettings settings;
    const QByteArray geometry = settings.value("geometry", QByteArray()).toByteArray();
    if (geometry.isEmpty()) {
        const QRect availableGeometry = screen()->availableGeometry();
        resize(availableGeometry.width() / 3, availableGeometry.height() / 2);
        move((availableGeometry.width() - width()) / 2,
             (availableGeometry.height() - height()) / 2);
    } else {
        restoreGeometry(geometry);
    }
}

void MainWindow::writeSettings()
{
    QSettings settings;
    settings.setValue("geometry", saveGeometry());
}`
            }
        };
    }

    private static createAdvancedQMLTemplate(projectName: string, modules: string[]): ProjectTemplate {
        const qmlImports = Qt6ModuleManager.generateQMLImports(modules);
        const findPackage = Qt6ModuleManager.generateCMakeFindPackage(modules);
        const linkLibraries = Qt6ModuleManager.generateCMakeModules(modules);

        return {
            name: 'qml_advanced',
            displayName: 'Advanced QML Application',
            description: 'Modern QML application with navigation, themes, and components',
            modules,
            files: {
                'CMakeLists.txt': `cmake_minimum_required(VERSION 3.16)
project(${projectName})

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

${findPackage}

qt_add_executable(${projectName})
target_sources(${projectName} PRIVATE main.cpp)

qt_add_qml_module(${projectName}
    URI ${projectName}
    VERSION 1.0
    QML_FILES
        main.qml
        components/NavigationDrawer.qml
        components/CustomButton.qml
        pages/HomePage.qml
        pages/SettingsPage.qml
)

target_link_libraries(${projectName} PRIVATE ${linkLibraries})`,

                'main.cpp': `#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QIcon>

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);
    app.setApplicationName("${projectName}");
    app.setApplicationVersion("1.0");
    app.setOrganizationName("Your Company");

    QQmlApplicationEngine engine;
    
    const QUrl url(QStringLiteral("qrc:/main.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl)
            QCoreApplication::exit(-1);
    }, Qt::QueuedConnection);
    
    engine.load(url);

    return app.exec();
}`,

                'main.qml': `${qmlImports.join('\n')}
import QtQuick.Window 2.15

ApplicationWindow {
    id: window
    width: 1200
    height: 800
    visible: true
    title: qsTr("${projectName}")

    property bool darkTheme: false

    Material.theme: darkTheme ? Material.Dark : Material.Light
    Material.accent: Material.Blue

    header: ToolBar {
        Material.foreground: "white"
        
        RowLayout {
            anchors.fill: parent
            
            ToolButton {
                icon.source: "qrc:/icons/menu.png"
                onClicked: drawer.open()
            }
            
            Label {
                text: window.title
                elide: Label.ElideRight
                Layout.fillWidth: true
            }
            
            ToolButton {
                icon.source: darkTheme ? "qrc:/icons/light.png" : "qrc:/icons/dark.png"
                onClicked: window.darkTheme = !window.darkTheme
            }
        }
    }

    Drawer {
        id: drawer
        width: 250
        height: window.height
        
        NavigationDrawer {
            anchors.fill: parent
            onPageSelected: function(page) {
                stackView.replace(page)
                drawer.close()
            }
        }
    }

    StackView {
        id: stackView
        anchors.fill: parent
        initialItem: HomePage {}
    }
}`,

                'components/NavigationDrawer.qml': `${qmlImports.join('\n')}

Column {
    signal pageSelected(string page)
    
    ItemDelegate {
        width: parent.width
        text: "Home"
        icon.source: "qrc:/icons/home.png"
        onClicked: pageSelected("qrc:/pages/HomePage.qml")
    }
    
    ItemDelegate {
        width: parent.width
        text: "Settings"
        icon.source: "qrc:/icons/settings.png"
        onClicked: pageSelected("qrc:/pages/SettingsPage.qml")
    }
}`,

                'components/CustomButton.qml': `${qmlImports.join('\n')}

Button {
    property color primaryColor: Material.accent
    property color hoverColor: Qt.darker(primaryColor, 1.1)
    
    Material.background: hovered ? hoverColor : primaryColor
    Material.foreground: "white"
    
    Behavior on Material.background {
        ColorAnimation { duration: 200 }
    }
}`,

                'pages/HomePage.qml': `${qmlImports.join('\n')}

Page {
    title: "Home"
    
    ScrollView {
        anchors.fill: parent
        
        Column {
            width: parent.width
            spacing: 20
            padding: 20
            
            Label {
                text: "Welcome to ${projectName}"
                font.pixelSize: 24
                font.bold: true
            }
            
            Label {
                text: "This is a modern QML application built with Qt6"
                font.pixelSize: 16
                color: Material.color(Material.Grey)
                wrapMode: Text.WordWrap
                width: parent.width - 40
            }
            
            CustomButton {
                text: "Get Started"
                onClicked: console.log("Button clicked!")
            }
        }
    }
}`,

                'pages/SettingsPage.qml': `${qmlImports.join('\n')}

Page {
    title: "Settings"
    
    ScrollView {
        anchors.fill: parent
        
        Column {
            width: parent.width
            spacing: 20
            padding: 20
            
            Label {
                text: "Application Settings"
                font.pixelSize: 24
                font.bold: true
            }
            
            SwitchDelegate {
                text: "Dark Theme"
                checked: window.darkTheme
                onToggled: window.darkTheme = checked
            }
            
            SwitchDelegate {
                text: "Notifications"
                checked: true
            }
        }
    }
}`
            }
        };
    }

    private static createMultimediaTemplate(projectName: string, modules: string[]): ProjectTemplate {
        return {
            name: 'multimedia',
            displayName: 'Qt Multimedia Application',
            description: 'Audio and video player application',
            modules: [...modules, 'Multimedia'],
            files: {
                'main.qml': `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtMultimedia 5.15

ApplicationWindow {
    width: 800
    height: 600
    visible: true
    title: "${projectName} - Media Player"

    MediaPlayer {
        id: player
        source: ""
    }

    VideoOutput {
        id: videoOutput
        anchors.fill: parent
        source: player
    }

    footer: ToolBar {
        RowLayout {
            anchors.fill: parent
            
            Button {
                text: "Play"
                onClicked: player.play()
            }
            
            Button {
                text: "Pause"
                onClicked: player.pause()
            }
            
            Button {
                text: "Stop"
                onClicked: player.stop()
            }
            
            Slider {
                Layout.fillWidth: true
                from: 0
                to: player.duration
                value: player.position
                onMoved: player.position = value
            }
        }
    }
}`
            }
        };
    }

    private static createChartsTemplate(projectName: string, modules: string[]): ProjectTemplate {
        return {
            name: 'charts',
            displayName: 'Qt Charts Application',
            description: 'Data visualization with charts',
            modules: [...modules, 'Charts'],
            files: {
                'main.qml': `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtCharts 2.15

ApplicationWindow {
    width: 800
    height: 600
    visible: true
    title: "${projectName} - Charts Demo"

    ChartView {
        anchors.fill: parent
        title: "Sample Line Chart"
        antialiasing: true

        LineSeries {
            name: "Data Series"
            XYPoint { x: 0; y: 0 }
            XYPoint { x: 1.1; y: 2.1 }
            XYPoint { x: 1.9; y: 3.3 }
            XYPoint { x: 2.1; y: 2.1 }
            XYPoint { x: 2.9; y: 4.9 }
            XYPoint { x: 3.4; y: 3.0 }
            XYPoint { x: 4.1; y: 3.3 }
        }
    }
}`
            }
        };
    }

    private static createNetworkTemplate(projectName: string, modules: string[]): ProjectTemplate {
        return {
            name: 'network',
            displayName: 'Qt Network Application',
            description: 'Network client application',
            modules: [...modules, 'Network'],
            files: {
                'main.cpp': `#include <QApplication>
#include <QMainWindow>
#include <QVBoxLayout>
#include <QTextEdit>
#include <QPushButton>
#include <QLineEdit>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QUrl>

class NetworkWindow : public QMainWindow
{
    Q_OBJECT

public:
    NetworkWindow(QWidget *parent = nullptr) : QMainWindow(parent)
    {
        setupUI();
        manager = new QNetworkAccessManager(this);
        connect(manager, &QNetworkAccessManager::finished,
                this, &NetworkWindow::replyFinished);
    }

private slots:
    void sendRequest()
    {
        QUrl url(urlEdit->text());
        QNetworkRequest request(url);
        manager->get(request);
        responseEdit->setText("Loading...");
    }

    void replyFinished(QNetworkReply *reply)
    {
        responseEdit->setText(reply->readAll());
        reply->deleteLater();
    }

private:
    void setupUI()
    {
        auto *centralWidget = new QWidget;
        setCentralWidget(centralWidget);
        
        auto *layout = new QVBoxLayout(centralWidget);
        
        urlEdit = new QLineEdit("https://api.github.com/users/octocat");
        auto *sendButton = new QPushButton("Send Request");
        responseEdit = new QTextEdit;
        
        layout->addWidget(urlEdit);
        layout->addWidget(sendButton);
        layout->addWidget(responseEdit);
        
        connect(sendButton, &QPushButton::clicked, this, &NetworkWindow::sendRequest);
        
        setWindowTitle("${projectName} - Network Client");
        resize(600, 400);
    }

    QLineEdit *urlEdit;
    QTextEdit *responseEdit;
    QNetworkAccessManager *manager;
};

#include "main.moc"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    NetworkWindow window;
    window.show();
    
    return app.exec();
}`
            }
        };
    }

    private static createWebEngineTemplate(projectName: string, modules: string[]): ProjectTemplate {
        return {
            name: 'webengine',
            displayName: 'Qt WebEngine Application',
            description: 'Web browser application',
            modules: [...modules, 'WebEngine'],
            files: {
                'main.qml': `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtWebEngine 1.15

ApplicationWindow {
    width: 1024
    height: 768
    visible: true
    title: "${projectName} - Web Browser"

    header: ToolBar {
        RowLayout {
            anchors.fill: parent
            
            Button {
                text: "Back"
                enabled: webView.canGoBack
                onClicked: webView.goBack()
            }
            
            Button {
                text: "Forward"
                enabled: webView.canGoForward
                onClicked: webView.goForward()
            }
            
            TextField {
                id: addressBar
                Layout.fillWidth: true
                text: webView.url
                onAccepted: webView.url = text
            }
            
            Button {
                text: "Reload"
                onClicked: webView.reload()
            }
        }
    }

    WebEngineView {
        id: webView
        anchors.fill: parent
        url: "https://www.qt.io"
    }
}`
            }
        };
    }

    private static create3DTemplate(projectName: string, modules: string[]): ProjectTemplate {
        return {
            name: '3d',
            displayName: 'Qt 3D Application',
            description: '3D graphics application',
            modules: [...modules, '3DCore', '3DRender'],
            files: {
                'main.qml': `import Qt3D.Core 2.15
import Qt3D.Render 2.15
import Qt3D.Input 2.15
import Qt3D.Extras 2.15
import QtQuick 2.15

Entity {
    id: sceneRoot

    Camera {
        id: camera
        projectionType: CameraLens.PerspectiveProjection
        fieldOfView: 45
        nearPlane : 0.1
        farPlane : 1000.0
        position: Qt.vector3d( 0.0, 0.0, 20.0 )
        upVector: Qt.vector3d( 0.0, 1.0, 0.0 )
        viewCenter: Qt.vector3d( 0.0, 0.0, 0.0 )
    }

    OrbitCameraController { camera: camera }

    components: [
        RenderSettings {
            activeFrameGraph: ForwardRenderer {
                camera: camera
                clearColor: Qt.rgba(0, 0.5, 1, 1)
            }
        },
        InputSettings { }
    ]

    PhongMaterial {
        id: material
        diffuse: Qt.rgba(0.7, 0.7, 0.9, 1.0)
    }

    TorusMesh {
        id: torusMesh
        radius: 5
        minorRadius: 1
        rings: 100
        slices: 20
    }

    Entity {
        id: torusEntity
        components: [ torusMesh, material ]
    }
}`
            }
        };
    }

    private static createBasicTemplate(projectName: string, modules: string[]): ProjectTemplate {
        const findPackage = Qt6ModuleManager.generateCMakeFindPackage(modules);
        const linkLibraries = Qt6ModuleManager.generateCMakeModules(modules);

        return {
            name: 'basic',
            displayName: 'Basic Qt6 Application',
            description: 'Simple Qt6 application template',
            modules,
            files: {
                'CMakeLists.txt': `cmake_minimum_required(VERSION 3.16)
project(${projectName})

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

${findPackage}

qt_add_executable(${projectName} main.cpp)
target_link_libraries(${projectName} PRIVATE ${linkLibraries})`,

                'main.cpp': `#include <QApplication>
#include <QLabel>

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    
    QLabel label("Hello Qt6!");
    label.show();
    
    return app.exec();
}`
            }
        };
    }
}
