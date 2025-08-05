import * as vscode from 'vscode';
import { QMLCodeGenerator, WidgetData } from './qmlCodeGenerator';
import { QtComponentLibrary } from './qtComponentLibrary';

export class QMLSyncManager {
    private _onDidChangeDocument: vscode.Disposable | undefined;
    private _isUpdatingFromDesigner = false;
    private _isUpdatingFromCode = false;
    private _lastKnownContent = '';

    constructor(
        private designerView: vscode.WebviewView | undefined,
        private document: vscode.TextDocument | undefined
    ) {}

    public startSync(document: vscode.TextDocument, designerView: vscode.WebviewView) {
        this.document = document;
        this.designerView = designerView;
        this._lastKnownContent = document.getText();

        // Listen for document changes
        this._onDidChangeDocument = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document === this.document && !this._isUpdatingFromDesigner) {
                this.onCodeChanged(event.document.getText());
            }
        });

        // Initial sync from code to designer
        this.syncCodeToDesigner(document.getText());
    }

    public stopSync() {
        if (this._onDidChangeDocument) {
            this._onDidChangeDocument.dispose();
            this._onDidChangeDocument = undefined;
        }
    }

    public updateCodeFromDesigner(qmlContent: string) {
        if (!this.document || this._isUpdatingFromCode) {
            return;
        }

        this._isUpdatingFromDesigner = true;
        
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            this.document.positionAt(0),
            this.document.positionAt(this.document.getText().length)
        );
        
        edit.replace(this.document.uri, fullRange, qmlContent);
        
        vscode.workspace.applyEdit(edit).then(() => {
            this._lastKnownContent = qmlContent;
            this._isUpdatingFromDesigner = false;
        });
    }

    private onCodeChanged(newContent: string) {
        if (newContent === this._lastKnownContent) {
            return;
        }

        this._lastKnownContent = newContent;
        this.syncCodeToDesigner(newContent);
    }

    private syncCodeToDesigner(qmlContent: string) {
        if (!this.designerView || this._isUpdatingFromDesigner) {
            return;
        }

        this._isUpdatingFromCode = true;

        try {
            // Parse QML content to extract widgets
            const widgets = this.parseQMLToWidgets(qmlContent);
            
            // Send to designer
            this.designerView.webview.postMessage({
                command: 'syncFromCode',
                widgets: widgets,
                qmlContent: qmlContent
            });

        } catch (error) {
            console.error('Failed to sync code to designer:', error);
        }

        this._isUpdatingFromCode = false;
    }

    private parseQMLToWidgets(qmlContent: string): WidgetData[] {
        const widgets: WidgetData[] = [];
        
        try {
            // Enhanced QML parser - more sophisticated than the basic one
            const lines = qmlContent.split('\n');
            let currentWidget: Partial<WidgetData> | null = null;
            let indentLevel = 0;
            let widgetStack: Partial<WidgetData>[] = [];
            let inApplicationWindow = false;
            let currentId = '';

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const originalLine = lines[i];
                const currentIndent = originalLine.length - originalLine.trimLeft().length;

                // Skip imports and comments
                if (line.startsWith('import ') || line.startsWith('//') || line === '') {
                    continue;
                }

                // Check for ApplicationWindow
                if (line.includes('ApplicationWindow')) {
                    inApplicationWindow = true;
                    continue;
                }

                if (!inApplicationWindow) continue;

                // Widget declaration (e.g., "Button {", "Rectangle {")
                const widgetMatch = line.match(/^(\w+)\s*\{/);
                if (widgetMatch) {
                    const widgetType = widgetMatch[1];
                    
                    // Skip ApplicationWindow itself
                    if (widgetType === 'ApplicationWindow') {
                        continue;
                    }

                    // Create new widget
                    const newWidget: Partial<WidgetData> = {
                        type: widgetType,
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 30,
                        properties: {},
                        children: []
                    };

                    // Handle nesting
                    if (currentIndent > indentLevel && currentWidget) {
                        // This is a child widget
                        widgetStack.push(currentWidget);
                        if (!currentWidget.children) {
                            currentWidget.children = [];
                        }
                    } else if (currentIndent < indentLevel && widgetStack.length > 0) {
                        // Going back up the hierarchy
                        while (widgetStack.length > 0 && currentIndent <= indentLevel) {
                            const parentWidget = widgetStack.pop();
                            if (parentWidget && this.isValidWidget(parentWidget)) {
                                if (widgetStack.length === 0) {
                                    widgets.push(parentWidget as WidgetData);
                                } else {
                                    const grandParent = widgetStack[widgetStack.length - 1];
                                    if (grandParent && grandParent.children) {
                                        grandParent.children.push(parentWidget as WidgetData);
                                    }
                                }
                            }
                        }
                    }

                    currentWidget = newWidget;
                    indentLevel = currentIndent;
                    continue;
                }

                // Property parsing
                if (currentWidget && line.includes(':')) {
                    const propertyMatch = line.match(/^(\w+):\s*(.+)$/);
                    if (propertyMatch) {
                        const [, property, value] = propertyMatch;
                        this.parseProperty(currentWidget, property, value);
                    }
                }

                // End of widget block
                if (line === '}') {
                    if (currentWidget && this.isValidWidget(currentWidget)) {
                        if (widgetStack.length === 0) {
                            widgets.push(currentWidget as WidgetData);
                        } else {
                            const parentWidget = widgetStack[widgetStack.length - 1];
                            if (parentWidget && parentWidget.children) {
                                parentWidget.children.push(currentWidget as WidgetData);
                            }
                        }
                    }
                    
                    if (widgetStack.length > 0) {
                        currentWidget = widgetStack[widgetStack.length - 1];
                        indentLevel = Math.max(0, indentLevel - 4);
                    } else {
                        currentWidget = null;
                    }
                }
            }

            // Handle any remaining widgets in the stack
            while (widgetStack.length > 0) {
                const widget = widgetStack.pop();
                if (widget && this.isValidWidget(widget)) {
                    widgets.push(widget as WidgetData);
                }
            }

        } catch (error) {
            console.error('Error parsing QML:', error);
            // Return empty array if parsing fails
            return [];
        }

        return widgets;
    }

    private parseProperty(widget: Partial<WidgetData>, property: string, value: string) {
        const cleanValue = value.replace(/[;"]/g, '').trim();

        switch (property) {
            case 'id':
                widget.id = cleanValue;
                break;
            case 'x':
                widget.x = this.parseNumber(cleanValue);
                break;
            case 'y':
                widget.y = this.parseNumber(cleanValue);
                break;
            case 'width':
                widget.width = this.parseNumber(cleanValue);
                break;
            case 'height':
                widget.height = this.parseNumber(cleanValue);
                break;
            case 'text':
                if (!widget.properties) widget.properties = {};
                widget.properties.text = this.parseString(cleanValue);
                break;
            case 'placeholderText':
                if (!widget.properties) widget.properties = {};
                widget.properties.placeholderText = this.parseString(cleanValue);
                break;
            case 'color':
                if (!widget.properties) widget.properties = {};
                widget.properties.color = this.parseString(cleanValue);
                break;
            case 'enabled':
                if (!widget.properties) widget.properties = {};
                widget.properties.enabled = this.parseBoolean(cleanValue);
                break;
            case 'checked':
                if (!widget.properties) widget.properties = {};
                widget.properties.checked = this.parseBoolean(cleanValue);
                break;
            case 'value':
                if (!widget.properties) widget.properties = {};
                widget.properties.value = this.parseNumber(cleanValue);
                break;
            case 'from':
                if (!widget.properties) widget.properties = {};
                widget.properties.from = this.parseNumber(cleanValue);
                break;
            case 'to':
                if (!widget.properties) widget.properties = {};
                widget.properties.to = this.parseNumber(cleanValue);
                break;
            case 'spacing':
                if (!widget.properties) widget.properties = {};
                widget.properties.spacing = this.parseNumber(cleanValue);
                break;
            case 'radius':
                if (!widget.properties) widget.properties = {};
                widget.properties.radius = this.parseNumber(cleanValue);
                break;
            default:
                // Store other properties as-is
                if (!widget.properties) widget.properties = {};
                widget.properties[property] = cleanValue;
                break;
        }
    }

    private parseNumber(value: string): number {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    private parseString(value: string): string {
        // Remove quotes and qsTr() wrapper
        return value
            .replace(/^qsTr\(["'](.*)["']\)$/, '$1')
            .replace(/^["'](.*)["']$/, '$1');
    }

    private parseBoolean(value: string): boolean {
        return value.toLowerCase() === 'true';
    }

    private isValidWidget(widget: Partial<WidgetData>): widget is WidgetData {
        return !!(widget.type && 
                 typeof widget.x === 'number' && 
                 typeof widget.y === 'number' && 
                 typeof widget.width === 'number' && 
                 typeof widget.height === 'number');
    }
}
