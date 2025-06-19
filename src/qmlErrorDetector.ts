import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface QMLError {
    line: number;
    column: number;
    message: string;
    severity: vscode.DiagnosticSeverity;
    source: string;
    type: 'syntax' | 'semantic' | 'import' | 'property' | 'binding';
}

export class QMLErrorDetector {
    private _diagnosticCollection: vscode.DiagnosticCollection;
    private _outputChannel: vscode.OutputChannel;
    private _qmlElements: Set<string> = new Set();
    private _qmlProperties: Map<string, string[]> = new Map();

    constructor() {
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('qmlLivePreview');
        this._outputChannel = vscode.window.createOutputChannel('QML Error Detection');
        this.initializeQMLKnowledge();
    }

    private initializeQMLKnowledge() {
        // Common QML elements
        this._qmlElements = new Set([
            'Item', 'Rectangle', 'Text', 'Image', 'MouseArea', 'ListView', 'GridView',
            'Column', 'Row', 'Grid', 'Flow', 'StackView', 'SwipeView', 'TabBar',
            'Button', 'TextField', 'TextArea', 'ComboBox', 'CheckBox', 'RadioButton',
            'Slider', 'ProgressBar', 'SpinBox', 'ScrollView', 'Flickable',
            'Window', 'ApplicationWindow', 'Dialog', 'Popup', 'Menu', 'MenuBar',
            'ToolBar', 'StatusBar', 'SplitView', 'Drawer', 'Frame', 'GroupBox',
            'Label', 'Switch', 'RangeSlider', 'Tumbler', 'Calendar', 'DatePicker',
            'Timer', 'Animation', 'PropertyAnimation', 'NumberAnimation', 'ColorAnimation',
            'RotationAnimation', 'ScaleAnimation', 'PathAnimation', 'SequentialAnimation',
            'ParallelAnimation', 'PauseAnimation', 'PropertyChanges', 'State', 'Transition'
        ]);

        // Common properties for QML elements
        this._qmlProperties = new Map([
            ['Item', ['x', 'y', 'z', 'width', 'height', 'opacity', 'visible', 'enabled', 'anchors', 'rotation', 'scale', 'transformOrigin', 'clip', 'focus', 'activeFocus']],
            ['Rectangle', ['color', 'border', 'radius', 'gradient', 'antialiasing']],
            ['Text', ['text', 'font', 'color', 'horizontalAlignment', 'verticalAlignment', 'wrapMode', 'elide', 'textFormat', 'lineHeight']],
            ['Image', ['source', 'fillMode', 'horizontalAlignment', 'verticalAlignment', 'smooth', 'cache', 'asynchronous', 'autoTransform']],
            ['MouseArea', ['acceptedButtons', 'hoverEnabled', 'pressAndHoldInterval', 'preventStealing', 'propagateComposedEvents', 'cursorShape']],
            ['Button', ['text', 'checkable', 'checked', 'autoExclusive', 'autoRepeat', 'down', 'pressed', 'icon', 'display']],
            ['TextField', ['text', 'placeholderText', 'readOnly', 'validator', 'inputMask', 'echoMode', 'maximumLength', 'selectByMouse']],
            ['ListView', ['model', 'delegate', 'currentIndex', 'currentItem', 'orientation', 'spacing', 'cacheBuffer', 'snapMode']],
            ['GridView', ['model', 'delegate', 'cellWidth', 'cellHeight', 'flow', 'snapMode', 'cacheBuffer']],
            ['Window', ['title', 'modality', 'flags', 'minimumWidth', 'minimumHeight', 'maximumWidth', 'maximumHeight']]
        ]);
    }

    public async analyzeQMLFile(uri: vscode.Uri): Promise<QMLError[]> {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf8');
            const errors: QMLError[] = [];

            // Perform various error checks
            errors.push(...this.checkSyntaxErrors(content));
            errors.push(...this.checkImportErrors(content));
            errors.push(...this.checkPropertyErrors(content));
            errors.push(...this.checkBindingErrors(content));
            errors.push(...this.checkBraceMatching(content));
            errors.push(...this.checkStringLiterals(content));
            errors.push(...this.checkComments(content));
            errors.push(...this.checkAnchors(content));
            errors.push(...this.checkSignalSlots(content));

            // Update diagnostics
            this.updateDiagnostics(uri, errors);
            
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

    private updateDiagnostics(uri: vscode.Uri, errors: QMLError[]) {
        const diagnostics: vscode.Diagnostic[] = errors.map(error => {
            const range = new vscode.Range(
                new vscode.Position(error.line, error.column),
                new vscode.Position(error.line, error.column + 10)
            );

            const diagnostic = new vscode.Diagnostic(range, error.message, error.severity);
            diagnostic.source = error.source;
            diagnostic.code = error.type;

            return diagnostic;
        });

        this._diagnosticCollection.set(uri, diagnostics);
        
        // Log to output channel
        if (errors.length > 0) {
            this._outputChannel.appendLine(`\n=== QML Analysis: ${path.basename(uri.fsPath)} ===`);
            errors.forEach(error => {
                this._outputChannel.appendLine(`Line ${error.line + 1}: [${error.type}] ${error.message}`);
            });
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
