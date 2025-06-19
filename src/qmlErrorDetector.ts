import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface QMLError {
    line: number;
    column: number;
    message: string;
    severity: vscode.DiagnosticSeverity;
    source: string;
    type: 'syntax' | 'semantic' | 'import' | 'property' | 'binding' | 'performance' | 'best-practice' | 'accessibility';
    quickFix?: string;
    codeActions?: vscode.CodeAction[];
}

export class QMLErrorDetector {
    private _diagnosticCollection: vscode.DiagnosticCollection;
    private _outputChannel: vscode.OutputChannel;
    private _qmlElements: Set<string> = new Set();
    private _qmlProperties: Map<string, string[]> = new Map();
    private _qmlSignals: Map<string, string[]> = new Map();
    private _qmlMethods: Map<string, string[]> = new Map();
    private _qtModules: Map<string, string[]> = new Map();

    constructor() {
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('qmlLivePreview');
        this._outputChannel = vscode.window.createOutputChannel('QML Error Detection');
        this.initializeQMLKnowledge();
    }

    private initializeQMLKnowledge() {
        // Extended QML elements with Qt6 components
        this._qmlElements = new Set([
            // Basic Items
            'Item', 'Rectangle', 'Text', 'Image', 'MouseArea', 'ListView', 'GridView',
            'Column', 'Row', 'Grid', 'Flow', 'StackView', 'SwipeView', 'TabBar',
            
            // Controls
            'Button', 'TextField', 'TextArea', 'ComboBox', 'CheckBox', 'RadioButton',
            'Slider', 'ProgressBar', 'SpinBox', 'ScrollView', 'Flickable', 'Switch',
            'RangeSlider', 'Tumbler', 'Calendar', 'DatePicker', 'Dial', 'DelayButton',
            
            // Windows & Dialogs
            'Window', 'ApplicationWindow', 'Dialog', 'Popup', 'Menu', 'MenuBar',
            'ToolBar', 'StatusBar', 'SplitView', 'Drawer', 'Frame', 'GroupBox',
            'Label', 'Pane', 'Page', 'PageIndicator', 'ScrollIndicator',
            
            // Animation
            'Timer', 'Animation', 'PropertyAnimation', 'NumberAnimation', 'ColorAnimation',
            'RotationAnimation', 'ScaleAnimation', 'PathAnimation', 'SequentialAnimation',
            'ParallelAnimation', 'PauseAnimation', 'PropertyChanges', 'State', 'Transition',
            'Behavior', 'SpringAnimation', 'SmoothedAnimation', 'Vector3dAnimation',
            
            // Models & Views
            'ListModel', 'XmlListModel', 'ObjectModel', 'DelegateModel', 'Repeater',
            'PathView', 'TableView', 'TreeView', 'ListView', 'GridView',
            
            // Layouts
            'ColumnLayout', 'RowLayout', 'GridLayout', 'StackLayout', 'Layout',
            
            // Graphics Effects
            'OpacityMask', 'ColorOverlay', 'Glow', 'DropShadow', 'FastBlur',
            'GaussianBlur', 'RadialGradient', 'LinearGradient', 'ConicalGradient',
            
            // Multimedia
            'MediaPlayer', 'VideoOutput', 'Audio', 'Camera', 'CameraCapture',
            
            // Input
            'Keys', 'FocusScope', 'KeyNavigation', 'Shortcut'
        ]);

        // Enhanced properties with type information
        this._qmlProperties = new Map([
            ['Item', ['x', 'y', 'z', 'width', 'height', 'opacity', 'visible', 'enabled', 'anchors', 'rotation', 'scale', 'transformOrigin', 'clip', 'focus', 'activeFocus', 'parent', 'children', 'data', 'resources', 'states', 'transitions']],
            ['Rectangle', ['color', 'border', 'radius', 'gradient', 'antialiasing', 'border.width', 'border.color']],
            ['Text', ['text', 'font', 'color', 'horizontalAlignment', 'verticalAlignment', 'wrapMode', 'elide', 'textFormat', 'lineHeight', 'font.family', 'font.pixelSize', 'font.pointSize', 'font.bold', 'font.italic', 'font.underline', 'font.strikeout', 'font.weight']],
            ['Image', ['source', 'fillMode', 'horizontalAlignment', 'verticalAlignment', 'smooth', 'cache', 'asynchronous', 'autoTransform', 'sourceSize', 'mirror', 'mipmap']],
            ['MouseArea', ['acceptedButtons', 'hoverEnabled', 'pressAndHoldInterval', 'preventStealing', 'propagateComposedEvents', 'cursorShape', 'drag', 'containsMouse', 'pressed', 'pressedButtons']],
            ['Button', ['text', 'checkable', 'checked', 'autoExclusive', 'autoRepeat', 'down', 'pressed', 'icon', 'display', 'flat', 'highlighted']],
            ['TextField', ['text', 'placeholderText', 'readOnly', 'validator', 'inputMask', 'echoMode', 'maximumLength', 'selectByMouse', 'selectedText', 'selectionStart', 'selectionEnd', 'cursorPosition', 'persistentSelection']],
            ['ListView', ['model', 'delegate', 'currentIndex', 'currentItem', 'orientation', 'spacing', 'cacheBuffer', 'snapMode', 'highlightItem', 'highlightFollowsCurrentItem', 'highlightMoveDuration']],
            ['GridView', ['model', 'delegate', 'cellWidth', 'cellHeight', 'flow', 'snapMode', 'cacheBuffer']],
            ['Window', ['title', 'modality', 'flags', 'minimumWidth', 'minimumHeight', 'maximumWidth', 'maximumHeight', 'screen', 'visibility']],
            ['ApplicationWindow', ['header', 'footer', 'menuBar', 'overlay', 'background']],
            ['Animation', ['duration', 'easing', 'loops', 'paused', 'running', 'alwaysRunToEnd']],
            ['PropertyAnimation', ['target', 'property', 'from', 'to', 'duration', 'easing.type']],
            ['Timer', ['interval', 'repeat', 'running', 'triggeredOnStart']]
        ]);

        // QML Signals
        this._qmlSignals = new Map([
            ['MouseArea', ['clicked', 'doubleClicked', 'pressed', 'released', 'entered', 'exited', 'positionChanged', 'pressAndHold']],
            ['Button', ['clicked', 'pressed', 'released', 'toggled']],
            ['TextField', ['textChanged', 'editingFinished', 'accepted']],
            ['Timer', ['triggered']],
            ['Animation', ['started', 'stopped', 'finished']],
            ['ListView', ['currentIndexChanged', 'currentItemChanged']],
            ['Item', ['childrenChanged', 'parentChanged', 'visibleChanged', 'enabledChanged']]
        ]);

        // QML Methods
        this._qmlMethods = new Map([
            ['Item', ['forceActiveFocus', 'mapFromItem', 'mapToItem', 'childAt']],
            ['ListView', ['positionViewAtIndex', 'incrementCurrentIndex', 'decrementCurrentIndex']],
            ['Animation', ['start', 'stop', 'pause', 'resume']],
            ['Timer', ['start', 'stop', 'restart']],
            ['TextField', ['selectAll', 'cut', 'copy', 'paste']]
        ]);

        // Qt Modules
        this._qtModules = new Map([
            ['QtQuick', ['Item', 'Rectangle', 'Text', 'Image', 'MouseArea', 'ListView', 'GridView']],
            ['QtQuick.Controls', ['Button', 'TextField', 'ComboBox', 'CheckBox', 'RadioButton']],
            ['QtQuick.Layouts', ['ColumnLayout', 'RowLayout', 'GridLayout']],
            ['QtQuick.Window', ['Window', 'ApplicationWindow']],
            ['QtMultimedia', ['MediaPlayer', 'VideoOutput', 'Audio']],
            ['QtQuick.Dialogs', ['FileDialog', 'ColorDialog', 'FontDialog']],
            ['QtCharts', ['ChartView', 'LineSeries', 'AreaSeries', 'BarSeries']]
        ]);
    }

    public async analyzeQMLFile(uri: vscode.Uri): Promise<QMLError[]> {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            const errors: QMLError[] = [];

            // Comprehensive error checking
            errors.push(...this.checkSyntaxErrors(content));
            errors.push(...this.checkImportErrors(content));
            errors.push(...this.checkPropertyErrors(content));
            errors.push(...this.checkBindingErrors(content));
            errors.push(...this.checkBraceMatching(content));
            errors.push(...this.checkStringLiterals(content));
            errors.push(...this.checkAnchors(content));
            errors.push(...this.checkSignalSlots(content));
            errors.push(...this.checkPerformanceIssues(content));
            errors.push(...this.checkBestPractices(content));
            errors.push(...this.checkAccessibility(content));
            errors.push(...this.checkModernQtUsage(content));
            errors.push(...this.checkTypeErrors(content));
            errors.push(...this.checkNamingConventions(content));

            // Update diagnostics with enhanced coloring
            this.updateDiagnosticsWithColors(uri, errors);
            
            return errors;
        } catch (error) {
            this._outputChannel.appendLine(`Error analyzing QML file ${uri.fsPath}: ${error}`);
            return [];
        }
    }

    private checkSyntaxErrors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;

            // Check for missing semicolons in JavaScript blocks
            if (line.includes('function') || line.includes('console.log') || line.includes('var ') || line.includes('let ') || line.includes('const ')) {
                if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && line !== '') {
                    errors.push({
                        line: i,
                        column: line.length,
                        message: 'Missing semicolon in JavaScript statement',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Syntax',
                        type: 'syntax'
                    });
                }
            }

            // Check for invalid characters
            const invalidChars = /[^\x00-\x7F\u00A0-\uFFFF]/g;
            const match = invalidChars.exec(line);
            if (match) {
                errors.push({
                    line: i,
                    column: match.index,
                    message: 'Invalid character in QML file',
                    severity: vscode.DiagnosticSeverity.Error,
                    source: 'QML Syntax',
                    type: 'syntax'
                });
            }

            // Check for malformed property declarations
            const propertyMatch = line.match(/^\s*property\s+(\w+)\s*(.*)$/);
            if (propertyMatch) {
                const propertyType = propertyMatch[1];
                const declaration = propertyMatch[2];
                
                const validTypes = ['bool', 'int', 'real', 'double', 'string', 'url', 'color', 'date', 'point', 'size', 'rect', 'var', 'variant'];
                if (!validTypes.includes(propertyType) && !this._qmlElements.has(propertyType)) {
                    errors.push({
                        line: i,
                        column: line.indexOf(propertyType),
                        message: `Unknown property type: ${propertyType}`,
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Property',
                        type: 'property'
                    });
                }

                if (!declaration.includes(':') && !declaration.includes(';')) {
                    errors.push({
                        line: i,
                        column: line.length,
                        message: 'Property declaration missing value or semicolon',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Property',
                        type: 'property'
                    });
                }
            }
        }

        return errors;
    }

    private checkImportErrors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check import statements
            const importMatch = line.match(/^import\s+(.+)$/);
            if (importMatch) {
                const importStatement = importMatch[1].trim();
                
                // Check for missing version
                if (!importStatement.includes(' ') && !importStatement.startsWith('"')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'Import statement should include version number (e.g., "import QtQuick 2.15")',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Import',
                        type: 'import'
                    });
                }

                // Check for common import errors
                if (importStatement.includes('QtQuick.Controls') && !importStatement.includes('2.')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'QtQuick.Controls should specify version 2.x',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Import',
                        type: 'import'
                    });
                }
            }
        }

        return errors;
    }

    private checkPropertyErrors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');
        let currentElement = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect current QML element
            const elementMatch = line.match(/^(\w+)\s*\{/);
            if (elementMatch) {
                currentElement = elementMatch[1];
                continue;
            }

            // Check property usage
            const propertyMatch = line.match(/^\s*(\w+)\s*:/);
            if (propertyMatch && currentElement) {
                const property = propertyMatch[1];
                
                // Check if property exists for current element
                if (this._qmlProperties.has(currentElement)) {
                    const validProperties = this._qmlProperties.get(currentElement)!;
                    const commonProperties = ['x', 'y', 'width', 'height', 'anchors', 'visible', 'enabled', 'opacity'];
                    
                    if (!validProperties.includes(property) && !commonProperties.includes(property) && !property.startsWith('on') && property !== 'id') {
                        errors.push({
                            line: i,
                            column: line.indexOf(property),
                            message: `Property '${property}' is not valid for ${currentElement}`,
                            severity: vscode.DiagnosticSeverity.Warning,
                            source: 'QML Property',
                            type: 'property'
                        });
                    }
                }

                // Check for common property value errors
                if (property === 'anchors' && !line.includes('.')) {
                    errors.push({
                        line: i,
                        column: line.indexOf(':') + 1,
                        message: 'Anchors property should specify target (e.g., anchors.fill: parent)',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Anchors',
                        type: 'property'
                    });
                }
            }
        }

        return errors;
    }

    private checkBindingErrors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for binding loops
            const bindingMatch = line.match(/^\s*(\w+)\s*:\s*(.+)$/);
            if (bindingMatch) {
                const property = bindingMatch[1];
                const value = bindingMatch[2].trim();
                
                // Simple check for potential binding loops
                if (value.includes(property) && !value.includes('parent.') && !value.includes('root.')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: `Potential binding loop: property '${property}' references itself`,
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Binding',
                        type: 'binding'
                    });
                }

                // Check for missing Qt binding syntax
                if ((value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/')) && 
                    !value.startsWith('"') && !value.match(/^\d+$/) && !value.includes('Qt.')) {
                    if (!value.includes('Math.') && !value.includes('Number(')) {
                        errors.push({
                            line: i,
                            column: line.indexOf(value),
                            message: 'Complex expressions should use Qt.binding() or be properly typed',
                            severity: vscode.DiagnosticSeverity.Information,
                            source: 'QML Binding',
                            type: 'binding'
                        });
                    }
                }
            }
        }

        return errors;
    }

    private checkBraceMatching(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');
        const stack: Array<{char: string, line: number, column: number}> = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '{' || char === '[' || char === '(') {
                    stack.push({char, line: i, column: j});
                } else if (char === '}' || char === ']' || char === ')') {
                    if (stack.length === 0) {
                        errors.push({
                            line: i,
                            column: j,
                            message: `Unmatched closing ${char}`,
                            severity: vscode.DiagnosticSeverity.Error,
                            source: 'QML Syntax',
                            type: 'syntax'
                        });
                    } else {
                        const last = stack.pop()!;
                        const expectedClosing = last.char === '{' ? '}' : last.char === '[' ? ']' : ')';
                        
                        if (char !== expectedClosing) {
                            errors.push({
                                line: i,
                                column: j,
                                message: `Expected ${expectedClosing} but found ${char}`,
                                severity: vscode.DiagnosticSeverity.Error,
                                source: 'QML Syntax',
                                type: 'syntax'
                            });
                        }
                    }
                }
            }
        }

        // Check for unclosed braces
        for (const unclosed of stack) {
            const expectedClosing = unclosed.char === '{' ? '}' : unclosed.char === '[' ? ']' : ')';
            errors.push({
                line: unclosed.line,
                column: unclosed.column,
                message: `Unclosed ${unclosed.char}, expected ${expectedClosing}`,
                severity: vscode.DiagnosticSeverity.Error,
                source: 'QML Syntax',
                type: 'syntax'
            });
        }

        return errors;
    }

    private checkStringLiterals(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let inString = false;
            let stringStart = 0;
            let escapeNext = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    if (!inString) {
                        inString = true;
                        stringStart = j;
                    } else {
                        inString = false;
                    }
                }
            }

            if (inString) {
                errors.push({
                    line: i,
                    column: stringStart,
                    message: 'Unclosed string literal',
                    severity: vscode.DiagnosticSeverity.Error,
                    source: 'QML Syntax',
                    type: 'syntax'
                });
            }
        }

        return errors;
    }

    private checkComments(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for nested /* */ comments
            let blockCommentDepth = 0;
            for (let j = 0; j < line.length - 1; j++) {
                if (line.substr(j, 2) === '/*') {
                    blockCommentDepth++;
                    if (blockCommentDepth > 1) {
                        errors.push({
                            line: i,
                            column: j,
                            message: 'Nested block comments are not allowed',
                            severity: vscode.DiagnosticSeverity.Warning,
                            source: 'QML Syntax',
                            type: 'syntax'
                        });
                    }
                } else if (line.substr(j, 2) === '*/') {
                    blockCommentDepth--;
                }
            }
        }

        return errors;
    }

    private checkAnchors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check anchor usage
            if (line.includes('anchors.')) {
                // Check for conflicting anchors
                if ((line.includes('anchors.left') || line.includes('anchors.right')) && line.includes('anchors.horizontalCenter')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'Cannot use left/right anchors with horizontalCenter',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Anchors',
                        type: 'property'
                    });
                }

                if ((line.includes('anchors.top') || line.includes('anchors.bottom')) && line.includes('anchors.verticalCenter')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'Cannot use top/bottom anchors with verticalCenter',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Anchors',
                        type: 'property'
                    });
                }

                // Check for anchors.fill with other anchors
                if (line.includes('anchors.fill') && (line.includes('anchors.left') || line.includes('anchors.top'))) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'anchors.fill conflicts with individual anchor properties',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Anchors',
                        type: 'property'
                    });
                }
            }
        }

        return errors;
    }

    private checkSignalSlots(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check signal handler naming
            const signalMatch = line.match(/^\s*(on\w+)\s*:/);
            if (signalMatch) {
                const handler = signalMatch[1];
                
                // Check proper camelCase
                if (!handler.match(/^on[A-Z]/)) {
                    errors.push({
                        line: i,
                        column: line.indexOf(handler),
                        message: 'Signal handlers should follow onSignalName pattern with camelCase',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Signal',
                        type: 'semantic'
                    });
                }
            }

            // Check function declarations
            const functionMatch = line.match(/^\s*function\s+(\w+)/);
            if (functionMatch) {
                const funcName = functionMatch[1];
                
                // Check function naming convention
                if (funcName[0] === funcName[0].toUpperCase()) {
                    errors.push({
                        line: i,
                        column: line.indexOf(funcName),
                        message: 'Function names should start with lowercase letter',
                        severity: vscode.DiagnosticSeverity.Information,
                        source: 'QML Function',
                        type: 'semantic'
                    });
                }
            }
        }

        return errors;
    }

    private checkPerformanceIssues(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for performance anti-patterns
            if (line.includes('Qt.createComponent') && !line.includes('asynchronous')) {
                errors.push({
                    line: i,
                    column: line.indexOf('Qt.createComponent'),
                    message: 'Consider using asynchronous component creation for better performance',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Performance',
                    type: 'performance',
                    quickFix: 'Add Component.Asynchronous'
                });
            }

            // Check for expensive bindings
            if (line.includes('Math.') && line.includes(':')) {
                errors.push({
                    line: i,
                    column: line.indexOf('Math.'),
                    message: 'Complex math operations in bindings can affect performance. Consider caching the result.',
                    severity: vscode.DiagnosticSeverity.Warning,
                    source: 'QML Performance',
                    type: 'performance'
                });
            }

            // Check for string concatenation in bindings
            if (line.includes('+') && line.includes('"') && line.includes(':')) {
                errors.push({
                    line: i,
                    column: line.indexOf('+'),
                    message: 'String concatenation in bindings can be expensive. Consider using template literals or pre-computing.',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Performance',
                    type: 'performance'
                });
            }

            // Check for unnecessary clips
            if (line.includes('clip: true')) {
                errors.push({
                    line: i,
                    column: line.indexOf('clip'),
                    message: 'Clipping can impact performance. Use only when necessary.',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Performance',
                    type: 'performance'
                });
            }
        }

        return errors;
    }

    private checkBestPractices(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for magic numbers
            const magicNumberMatch = line.match(/:\s*(\d{2,})/);
            if (magicNumberMatch && !line.includes('width') && !line.includes('height')) {
                const number = parseInt(magicNumberMatch[1]);
                if (number > 50 && number !== 100) {
                    errors.push({
                        line: i,
                        column: line.indexOf(magicNumberMatch[1]),
                        message: `Consider using a named constant instead of magic number ${number}`,
                        severity: vscode.DiagnosticSeverity.Information,
                        source: 'QML Best Practice',
                        type: 'best-practice'
                    });
                }
            }

            // Check for hardcoded colors
            if (line.includes('color:') && (line.includes('"#') || line.includes('"red') || line.includes('"blue'))) {
                errors.push({
                    line: i,
                    column: line.indexOf('color:'),
                    message: 'Consider using theme colors or constants instead of hardcoded colors',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Best Practice',
                    type: 'best-practice'
                });
            }

            // Check for missing id when needed
            if (line.includes('MouseArea') && !content.includes('id:')) {
                errors.push({
                    line: i,
                    column: 0,
                    message: 'Consider adding an id to MouseArea for better debugging and testing',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Best Practice',
                    type: 'best-practice'
                });
            }

            // Check for inline styles
            if (line.includes('font.pixelSize:') && line.includes('14')) {
                errors.push({
                    line: i,
                    column: line.indexOf('font.pixelSize'),
                    message: 'Consider using theme font sizes or constants',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Best Practice',
                    type: 'best-practice'
                });
            }
        }

        return errors;
    }

    private checkAccessibility(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for missing accessibility properties
            if (line.includes('Button') || line.includes('TextField')) {
                const hasAccessibleName = content.includes('Accessible.name');
                const hasAccessibleDescription = content.includes('Accessible.description');
                
                if (!hasAccessibleName) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'Interactive elements should have Accessible.name for screen readers',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Accessibility',
                        type: 'accessibility'
                    });
                }
            }

            // Check for images without alt text
            if (line.includes('Image') && line.includes('source:')) {
                if (!content.includes('Accessible.name') && !content.includes('Accessible.description')) {
                    errors.push({
                        line: i,
                        column: 0,
                        message: 'Images should have accessible descriptions for screen readers',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Accessibility',
                        type: 'accessibility'
                    });
                }
            }

            // Check for proper focus handling
            if (line.includes('Keys.onPressed') && !content.includes('focus:')) {
                errors.push({
                    line: i,
                    column: 0,
                    message: 'Elements handling key events should be focusable',
                    severity: vscode.DiagnosticSeverity.Warning,
                    source: 'QML Accessibility',
                    type: 'accessibility'
                });
            }
        }

        return errors;
    }

    private checkModernQtUsage(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for outdated Qt versions in imports
            if (line.includes('import QtQuick 2.1') || line.includes('import QtQuick 2.0')) {
                errors.push({
                    line: i,
                    column: 0,
                    message: 'Consider updating to QtQuick 2.15 or later for better features and performance',
                    severity: vscode.DiagnosticSeverity.Warning,
                    source: 'QML Modern Qt',
                    type: 'best-practice'
                });
            }

            // Check for deprecated properties
            if (line.includes('smooth:')) {
                errors.push({
                    line: i,
                    column: line.indexOf('smooth:'),
                    message: 'The "smooth" property is deprecated. Smoothing is enabled by default in Qt6.',
                    severity: vscode.DiagnosticSeverity.Warning,
                    source: 'QML Modern Qt',
                    type: 'best-practice'
                });
            }

            // Check for old-style connections
            if (line.includes('Connections') && line.includes('target:')) {
                errors.push({
                    line: i,
                    column: 0,
                    message: 'Consider using inline signal handlers instead of Connections for better performance',
                    severity: vscode.DiagnosticSeverity.Information,
                    source: 'QML Modern Qt',
                    type: 'best-practice'
                });
            }
        }

        return errors;
    }

    private checkTypeErrors(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for type mismatches
            if (line.includes('width:') || line.includes('height:')) {
                const valueMatch = line.match(/:\s*["']([^"']+)["']/);
                if (valueMatch && isNaN(Number(valueMatch[1]))) {
                    errors.push({
                        line: i,
                        column: line.indexOf(valueMatch[0]),
                        message: 'Width and height should be numeric values, not strings',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Type Error',
                        type: 'semantic'
                    });
                }
            }

            // Check for boolean type errors
            if (line.includes('visible:') || line.includes('enabled:')) {
                const stringBoolMatch = line.match(/:\s*["'](true|false)["']/);
                if (stringBoolMatch) {
                    errors.push({
                        line: i,
                        column: line.indexOf(stringBoolMatch[0]),
                        message: 'Boolean values should not be in quotes',
                        severity: vscode.DiagnosticSeverity.Error,
                        source: 'QML Type Error',
                        type: 'semantic'
                    });
                }
            }
        }

        return errors;
    }

    private checkNamingConventions(content: string): QMLError[] {
        const errors: QMLError[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check id naming conventions
            const idMatch = line.match(/id:\s*(\w+)/);
            if (idMatch) {
                const id = idMatch[1];
                if (id[0] === id[0].toUpperCase()) {
                    errors.push({
                        line: i,
                        column: line.indexOf(id),
                        message: 'QML id should start with lowercase letter (camelCase)',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Naming',
                        type: 'best-practice'
                    });
                }
            }

            // Check property naming
            const propertyMatch = line.match(/property\s+\w+\s+(\w+)/);
            if (propertyMatch) {
                const propName = propertyMatch[1];
                if (propName[0] === propName[0].toUpperCase()) {
                    errors.push({
                        line: i,
                        column: line.indexOf(propName),
                        message: 'Property names should start with lowercase letter (camelCase)',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source: 'QML Naming',
                        type: 'best-practice'
                    });
                }
            }
        }

        return errors;
    }

    private updateDiagnosticsWithColors(uri: vscode.Uri, errors: QMLError[]) {
        const diagnostics: vscode.Diagnostic[] = errors.map(error => {
            const range = new vscode.Range(
                new vscode.Position(error.line, error.column),
                new vscode.Position(error.line, error.column + 15)
            );

            const diagnostic = new vscode.Diagnostic(range, error.message, error.severity);
            diagnostic.source = error.source;
            diagnostic.code = error.type;

            // Add color-coded tags for different error types
            switch (error.type) {
                case 'syntax':
                    diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    break;
                case 'performance':
                    diagnostic.tags = [vscode.DiagnosticTag.Deprecated];
                    break;
                case 'accessibility':
                    // No specific tag, but will be colored differently
                    break;
                case 'best-practice':
                    diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    break;
            }

            return diagnostic;
        });

        this._diagnosticCollection.set(uri, diagnostics);
        
        // Enhanced colorful logging
        if (errors.length > 0) {
            this._outputChannel.appendLine(`\n🎨 === QML Analysis: ${path.basename(uri.fsPath)} ===`);
            this._outputChannel.appendLine(`📊 Found ${errors.length} issues:`);
            
            const errorsByType = errors.reduce((acc, error) => {
                acc[error.type] = (acc[error.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(errorsByType).forEach(([type, count]) => {
                const emoji = this.getEmojiForType(type);
                this._outputChannel.appendLine(`${emoji} ${type}: ${count} issues`);
            });

            this._outputChannel.appendLine('\n📝 Details:');
            errors.forEach(error => {
                const emoji = this.getEmojiForType(error.type);
                const severity = error.severity === vscode.DiagnosticSeverity.Error ? '🔴' :
                               error.severity === vscode.DiagnosticSeverity.Warning ? '🟡' : '🔵';
                this._outputChannel.appendLine(`${severity} Line ${error.line + 1}: ${emoji} [${error.type}] ${error.message}`);
            });
        } else {
            this._outputChannel.appendLine(`\n✅ QML file ${path.basename(uri.fsPath)} has no issues!`);
        }
    }

    private getEmojiForType(type: string): string {
        switch (type) {
            case 'syntax': return '🔧';
            case 'semantic': return '🧠';
            case 'import': return '📦';
            case 'property': return '🏷️';
            case 'binding': return '🔗';
            case 'performance': return '⚡';
            case 'best-practice': return '💡';
            case 'accessibility': return '♿';
            default: return '📋';
        }
    }

    public clearDiagnostics(uri?: vscode.Uri) {
        if (uri) {
            this._diagnosticCollection.delete(uri);
        } else {
            this._diagnosticCollection.clear();
        }
    }

    public dispose() {
        this._diagnosticCollection.dispose();
        this._outputChannel.dispose();
    }
}
