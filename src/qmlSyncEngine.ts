import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class QMLSyncEngine {
    private _watchers: Map<string, vscode.FileSystemWatcher> = new Map();
    private _designerPanels: vscode.WebviewPanel[] = [];
    private _previewPanels: vscode.WebviewPanel[] = [];
    private _propertyPanels: vscode.WebviewPanel[] = [];
    private _activeDocument: vscode.TextDocument | undefined;
    private _syncEnabled: boolean = true;
    private _updateInProgress: boolean = false;

    constructor() {
        // Watch for active text editor changes
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.languageId === 'qml') {
                this.setActiveDocument(editor.document);
            }
        });

        // Watch for document changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (this._syncEnabled && !this._updateInProgress && 
                event.document.languageId === 'qml' && 
                event.document === this._activeDocument) {
                this.debounceSync(() => this.syncFromEditor(event.document));
            }
        });

        // Watch for document saves
        vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.languageId === 'qml') {
                this.syncFromEditor(document);
            }
        });
    }

    private _syncTimeout: NodeJS.Timeout | undefined;
    private debounceSync(callback: () => void, delay: number = 150) {
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
        }
        this._syncTimeout = setTimeout(callback, delay);
    }

    public registerDesignerPanel(panel: vscode.WebviewPanel) {
        this._designerPanels.push(panel);
        panel.onDidDispose(() => {
            const index = this._designerPanels.indexOf(panel);
            if (index > -1) {
                this._designerPanels.splice(index, 1);
            }
        });
    }

    public registerPreviewPanel(panel: vscode.WebviewPanel) {
        this._previewPanels.push(panel);
        panel.onDidDispose(() => {
            const index = this._previewPanels.indexOf(panel);
            if (index > -1) {
                this._previewPanels.splice(index, 1);
            }
        });
    }

    public registerPropertyPanel(panel: vscode.WebviewPanel) {
        this._propertyPanels.push(panel);
        panel.onDidDispose(() => {
            const index = this._propertyPanels.indexOf(panel);
            if (index > -1) {
                this._propertyPanels.splice(index, 1);
            }
        });
    }

    public setActiveDocument(document: vscode.TextDocument) {
        this._activeDocument = document;
        this.syncFromEditor(document);
    }

    public async syncFromEditor(document: vscode.TextDocument) {
        if (!this._syncEnabled || this._updateInProgress) return;

        try {
            const qmlContent = document.getText();
            const widgets = this.parseQMLToWidgets(qmlContent);
            
            // Update all designer panels
            this._designerPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updateFromCode',
                    qmlContent,
                    widgets
                });
            });

            // Update all preview panels
            this._previewPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updatePreview',
                    qmlContent,
                    widgets
                });
            });

            // Update property panels
            this._propertyPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updateFromCode',
                    widgets
                });
            });

        } catch (error) {
            console.error('Sync from editor failed:', error);
        }
    }

    public async syncFromDesigner(widgets: any[], qmlContent: string) {
        if (!this._syncEnabled || this._updateInProgress) return;

        this._updateInProgress = true;
        try {
            // Update VS Code editor
            if (this._activeDocument) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    this._activeDocument.positionAt(0),
                    this._activeDocument.positionAt(this._activeDocument.getText().length)
                );
                edit.replace(this._activeDocument.uri, fullRange, qmlContent);
                await vscode.workspace.applyEdit(edit);
            }

            // Update all preview panels
            this._previewPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updatePreview',
                    qmlContent,
                    widgets
                });
            });

            // Update property panels
            this._propertyPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updateFromDesigner',
                    widgets
                });
            });

        } catch (error) {
            console.error('Sync from designer failed:', error);
        } finally {
            this._updateInProgress = false;
        }
    }

    public async syncFromProperties(widgetId: string, property: string, value: any) {
        if (!this._syncEnabled || this._updateInProgress) return;

        this._updateInProgress = true;
        try {
            // Update designer panels
            this._designerPanels.forEach(panel => {
                panel.webview.postMessage({
                    command: 'updateWidgetProperty',
                    widgetId,
                    property,
                    value
                });
            });

            // Generate updated QML and sync to editor
            const updatedQML = await this.generateQMLFromProperty(widgetId, property, value);
            if (updatedQML && this._activeDocument) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    this._activeDocument.positionAt(0),
                    this._activeDocument.positionAt(this._activeDocument.getText().length)
                );
                edit.replace(this._activeDocument.uri, fullRange, updatedQML);
                await vscode.workspace.applyEdit(edit);
            }

        } catch (error) {
            console.error('Sync from properties failed:', error);
        } finally {
            this._updateInProgress = false;
        }
    }

    private parseQMLToWidgets(qmlContent: string): any[] {
        const widgets: any[] = [];
        
        try {
            // Enhanced QML parsing with better pattern matching
            const componentRegex = /(\w+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
            let match;
            let widgetId = 1;

            while ((match = componentRegex.exec(qmlContent)) !== null) {
                const componentType = match[1];
                const componentBody = match[2];

                // Skip root components like ApplicationWindow, Window, etc.
                if (['ApplicationWindow', 'Window', 'Item'].includes(componentType)) {
                    continue;
                }

                const widget = {
                    id: this.extractProperty(componentBody, 'id') || `${componentType.toLowerCase()}${widgetId++}`,
                    type: componentType,
                    properties: this.parseComponentProperties(componentBody),
                    position: {
                        x: parseInt(this.extractProperty(componentBody, 'x') || '0') || 0,
                        y: parseInt(this.extractProperty(componentBody, 'y') || '0') || 0,
                        width: parseInt(this.extractProperty(componentBody, 'width') || '100') || 100,
                        height: parseInt(this.extractProperty(componentBody, 'height') || '30') || 30
                    }
                };

                widgets.push(widget);
            }
        } catch (error) {
            console.error('QML parsing error:', error);
        }

        return widgets;
    }

    private extractProperty(content: string, property: string): string | null {
        const regex = new RegExp(`${property}:\\s*([^\\n;]+)`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim().replace(/["']/g, '') : null;
    }

    private parseComponentProperties(content: string): any {
        const properties: any = {};
        
        // Common QML properties
        const propertyPatterns = [
            'text', 'color', 'backgroundColor', 'fontSize', 'fontWeight',
            'placeholderText', 'checked', 'enabled', 'visible', 'opacity',
            'value', 'from', 'to', 'source', 'fillMode', 'wrapMode'
        ];

        propertyPatterns.forEach(prop => {
            const value = this.extractProperty(content, prop);
            if (value !== null) {
                // Type conversion
                if (prop === 'checked' || prop === 'enabled' || prop === 'visible') {
                    properties[prop] = value === 'true';
                } else if (prop === 'fontSize' || prop === 'opacity' || prop === 'value' || prop === 'from' || prop === 'to') {
                    properties[prop] = parseFloat(value) || 0;
                } else {
                    properties[prop] = value;
                }
            }
        });

        return properties;
    }

    private async generateQMLFromProperty(widgetId: string, property: string, value: any): Promise<string | null> {
        if (!this._activeDocument) return null;

        try {
            let qmlContent = this._activeDocument.getText();
            
            // Find the widget by ID and update the property
            const idRegex = new RegExp(`id:\\s*${widgetId}([^}]+)`, 'g');
            const match = idRegex.exec(qmlContent);
            
            if (match) {
                const widgetContent = match[1];
                const propertyRegex = new RegExp(`${property}:\\s*[^\\n;]+`, 'g');
                
                let newValue = value;
                if (typeof value === 'string' && !value.startsWith('"')) {
                    newValue = `"${value}"`;
                }

                const newPropertyLine = `${property}: ${newValue}`;
                
                if (propertyRegex.test(widgetContent)) {
                    // Update existing property
                    qmlContent = qmlContent.replace(propertyRegex, newPropertyLine);
                } else {
                    // Add new property
                    const insertIndex = qmlContent.indexOf(widgetContent) + widgetContent.indexOf('\n') + 1;
                    qmlContent = qmlContent.slice(0, insertIndex) + 
                                `    ${newPropertyLine}\n` + 
                                qmlContent.slice(insertIndex);
                }
            }

            return qmlContent;
        } catch (error) {
            console.error('QML generation error:', error);
            return null;
        }
    }

    public generateQMLFromWidgets(widgets: any[]): string {
        let qml = `import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt Live Preview"

`;

        widgets.forEach(widget => {
            qml += this.generateWidgetQML(widget, '    ');
        });

        qml += '}\n';
        return qml;
    }

    private generateWidgetQML(widget: any, indent: string): string {
        const pos = widget.position;
        const props = widget.properties;
        
        let qml = `${indent}${widget.type} {
${indent}    id: ${widget.id}
${indent}    x: ${pos.x}
${indent}    y: ${pos.y}
${indent}    width: ${pos.width}
${indent}    height: ${pos.height}
`;

        // Add widget properties
        Object.keys(props).forEach(key => {
            if (props[key] !== undefined && props[key] !== null) {
                let value = props[key];
                if (typeof value === 'string' && !value.startsWith('"') && 
                    !['true', 'false'].includes(value.toLowerCase())) {
                    value = `"${value}"`;
                }
                qml += `${indent}    ${key}: ${value}
`;
            }
        });

        qml += `${indent}}

`;
        return qml;
    }

    public setSyncEnabled(enabled: boolean) {
        this._syncEnabled = enabled;
    }

    public isSyncEnabled(): boolean {
        return this._syncEnabled;
    }

    public dispose() {
        this._watchers.forEach(watcher => watcher.dispose());
        this._watchers.clear();
        
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
        }
    }
}
