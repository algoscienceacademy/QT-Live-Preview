import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface WidgetData {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    properties: { [key: string]: any };
    children?: WidgetData[];
    parent?: string;
}

export class QMLCodeGenerator {
    
    /**
     * Generate QML code from widget data
     */
    public static generateQML(widgets: WidgetData[], options: any = {}): string {
        const imports = this.generateImports(widgets);
        const appWindow = this.generateApplicationWindow(widgets, options);
        
        return `${imports}\n\n${appWindow}`;
    }

    /**
     * Generate imports based on widget types used
     */
    private static generateImports(widgets: WidgetData[]): string {
        const imports = new Set([
            'import QtQuick 2.15',
            'import QtQuick.Controls 2.15'
        ]);

        // Check for specific widget types that require additional imports
        widgets.forEach(widget => {
            switch (widget.type) {
                case 'WebEngineView':
                    imports.add('import QtWebEngine 1.15');
                    break;
                case 'Chart':
                case 'ChartView':
                    imports.add('import QtCharts 2.15');
                    break;
                case 'MediaPlayer':
                case 'VideoOutput':
                    imports.add('import QtMultimedia 5.15');
                    break;
                case 'WebView':
                    imports.add('import QtWebView 1.15');
                    break;
                case 'Window':
                case 'Dialog':
                    imports.add('import QtQuick.Window 2.15');
                    break;
                case 'Layout':
                case 'GridLayout':
                case 'RowLayout':
                case 'ColumnLayout':
                    imports.add('import QtQuick.Layouts 1.15');
                    break;
            }
        });

        return Array.from(imports).join('\n');
    }

    /**
     * Generate the main ApplicationWindow
     */
    private static generateApplicationWindow(widgets: WidgetData[], options: any): string {
        const windowOptions = {
            width: options.width || 800,
            height: options.height || 600,
            title: options.title || "Qt Designer Application",
            visible: options.visible !== false
        };

        let qml = `ApplicationWindow {\n`;
        qml += `    id: window\n`;
        qml += `    width: ${windowOptions.width}\n`;
        qml += `    height: ${windowOptions.height}\n`;
        qml += `    visible: ${windowOptions.visible}\n`;
        qml += `    title: qsTr("${windowOptions.title}")\n\n`;

        // Add properties if any
        if (options.properties) {
            Object.entries(options.properties).forEach(([key, value]) => {
                qml += `    property ${typeof value} ${key}: ${this.formatValue(value)}\n`;
            });
            qml += '\n';
        }

        // Generate child widgets
        const rootWidgets = widgets.filter(w => !w.parent);
        rootWidgets.forEach(widget => {
            qml += this.generateWidget(widget, 1);
        });

        qml += `}`;
        return qml;
    }

    /**
     * Generate QML for a single widget
     */
    private static generateWidget(widget: WidgetData, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        const qmlType = this.getQMLType(widget.type);
        
        let qml = `${indent}${qmlType} {\n`;
        
        // Add id
        qml += `${indent}    id: ${this.sanitizeId(widget.id)}\n`;
        
        // Add positioning and sizing
        qml += `${indent}    x: ${widget.x}\n`;
        qml += `${indent}    y: ${widget.y}\n`;
        qml += `${indent}    width: ${widget.width}\n`;
        qml += `${indent}    height: ${widget.height}\n`;

        // Add widget-specific properties
        const properties = this.generateProperties(widget, indentLevel + 1);
        if (properties) {
            qml += properties;
        }

        // Add anchors if specified
        if (widget.properties.anchors) {
            qml += this.generateAnchors(widget.properties.anchors, indentLevel + 1);
        }

        // Add layout properties if it's a layout
        if (this.isLayoutType(widget.type)) {
            qml += this.generateLayoutProperties(widget, indentLevel + 1);
        }

        // Add signals and slots
        if (widget.properties.signals) {
            qml += this.generateSignals(widget.properties.signals, indentLevel + 1);
        }

        // Add child widgets
        if (widget.children && widget.children.length > 0) {
            qml += '\n';
            widget.children.forEach(child => {
                qml += this.generateWidget(child, indentLevel + 1);
            });
        }

        qml += `${indent}}\n\n`;
        return qml;
    }

    /**
     * Generate properties for a widget
     */
    private static generateProperties(widget: WidgetData, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let properties = '';

        Object.entries(widget.properties).forEach(([key, value]) => {
            if (['anchors', 'signals', 'children'].includes(key)) {
                return; // Skip special properties
            }

            switch (key) {
                case 'text':
                    if (value) {
                        properties += `${indent}text: qsTr("${value}")\n`;
                    }
                    break;
                case 'placeholderText':
                    if (value) {
                        properties += `${indent}placeholderText: qsTr("${value}")\n`;
                    }
                    break;
                case 'color':
                    properties += `${indent}color: "${value}"\n`;
                    break;
                case 'background':
                case 'backgroundColor':
                    properties += `${indent}background: Rectangle { color: "${value}" }\n`;
                    break;
                case 'enabled':
                    properties += `${indent}enabled: ${value}\n`;
                    break;
                case 'visible':
                    properties += `${indent}visible: ${value}\n`;
                    break;
                case 'opacity':
                    properties += `${indent}opacity: ${value}\n`;
                    break;
                case 'checked':
                    properties += `${indent}checked: ${value}\n`;
                    break;
                case 'value':
                    properties += `${indent}value: ${value}\n`;
                    break;
                case 'from':
                case 'minimum':
                    properties += `${indent}from: ${value}\n`;
                    break;
                case 'to':
                case 'maximum':
                    properties += `${indent}to: ${value}\n`;
                    break;
                case 'stepSize':
                    properties += `${indent}stepSize: ${value}\n`;
                    break;
                case 'font':
                    properties += this.generateFont(value, indentLevel);
                    break;
                case 'border':
                    properties += this.generateBorder(value, indentLevel);
                    break;
                case 'radius':
                    properties += `${indent}radius: ${value}\n`;
                    break;
                case 'source':
                    properties += `${indent}source: "${value}"\n`;
                    break;
                case 'fillMode':
                    properties += `${indent}fillMode: Image.${value}\n`;
                    break;
                default:
                    // Handle custom properties
                    if (typeof value === 'string') {
                        properties += `${indent}${key}: "${value}"\n`;
                    } else if (typeof value === 'boolean' || typeof value === 'number') {
                        properties += `${indent}${key}: ${value}\n`;
                    }
                    break;
            }
        });

        return properties;
    }

    /**
     * Generate anchors
     */
    private static generateAnchors(anchors: any, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let anchorCode = `${indent}anchors {\n`;

        Object.entries(anchors).forEach(([key, value]) => {
            switch (key) {
                case 'fill':
                    anchorCode += `${indent}    fill: ${value}\n`;
                    break;
                case 'centerIn':
                    anchorCode += `${indent}    centerIn: ${value}\n`;
                    break;
                case 'left':
                case 'right':
                case 'top':
                case 'bottom':
                case 'horizontalCenter':
                case 'verticalCenter':
                    anchorCode += `${indent}    ${key}: ${value}\n`;
                    break;
                case 'margins':
                    anchorCode += `${indent}    margins: ${value}\n`;
                    break;
                case 'leftMargin':
                case 'rightMargin':
                case 'topMargin':
                case 'bottomMargin':
                    anchorCode += `${indent}    ${key}: ${value}\n`;
                    break;
            }
        });

        anchorCode += `${indent}}\n`;
        return anchorCode;
    }

    /**
     * Generate layout properties
     */
    private static generateLayoutProperties(widget: WidgetData, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let layoutCode = '';

        if (widget.type === 'Row' || widget.type === 'RowLayout') {
            layoutCode += `${indent}spacing: ${widget.properties.spacing || 10}\n`;
            if (widget.properties.layoutDirection) {
                layoutCode += `${indent}layoutDirection: ${widget.properties.layoutDirection}\n`;
            }
        } else if (widget.type === 'Column' || widget.type === 'ColumnLayout') {
            layoutCode += `${indent}spacing: ${widget.properties.spacing || 10}\n`;
        } else if (widget.type === 'Grid' || widget.type === 'GridLayout') {
            layoutCode += `${indent}rows: ${widget.properties.rows || 2}\n`;
            layoutCode += `${indent}columns: ${widget.properties.columns || 2}\n`;
            layoutCode += `${indent}rowSpacing: ${widget.properties.rowSpacing || 10}\n`;
            layoutCode += `${indent}columnSpacing: ${widget.properties.columnSpacing || 10}\n`;
        }

        return layoutCode;
    }

    /**
     * Generate signals and slots
     */
    private static generateSignals(signals: any, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let signalCode = '';

        Object.entries(signals).forEach(([signal, handler]) => {
            if (typeof handler === 'string') {
                signalCode += `${indent}${signal}: ${handler}\n`;
            } else if (typeof handler === 'object' && handler !== null && 'code' in handler) {
                const handlerObj = handler as { code: string };
                signalCode += `${indent}${signal}: {\n`;
                signalCode += `${indent}    ${handlerObj.code}\n`;
                signalCode += `${indent}}\n`;
            }
        });

        return signalCode;
    }

    /**
     * Generate font properties
     */
    private static generateFont(font: any, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let fontCode = `${indent}font {\n`;

        if (font.family) fontCode += `${indent}    family: "${font.family}"\n`;
        if (font.pixelSize) fontCode += `${indent}    pixelSize: ${font.pixelSize}\n`;
        if (font.pointSize) fontCode += `${indent}    pointSize: ${font.pointSize}\n`;
        if (font.bold) fontCode += `${indent}    bold: ${font.bold}\n`;
        if (font.italic) fontCode += `${indent}    italic: ${font.italic}\n`;
        if (font.underline) fontCode += `${indent}    underline: ${font.underline}\n`;
        if (font.weight) fontCode += `${indent}    weight: Font.${font.weight}\n`;

        fontCode += `${indent}}\n`;
        return fontCode;
    }

    /**
     * Generate border properties
     */
    private static generateBorder(border: any, indentLevel: number): string {
        const indent = '    '.repeat(indentLevel);
        let borderCode = `${indent}border {\n`;

        if (border.width) borderCode += `${indent}    width: ${border.width}\n`;
        if (border.color) borderCode += `${indent}    color: "${border.color}"\n`;

        borderCode += `${indent}}\n`;
        return borderCode;
    }

    /**
     * Map widget types to QML types
     */
    private static getQMLType(widgetType: string): string {
        const mapping: { [key: string]: string } = {
            'Button': 'Button',
            'Label': 'Label',
            'TextField': 'TextField',
            'TextArea': 'ScrollView',
            'Rectangle': 'Rectangle',
            'CheckBox': 'CheckBox',
            'RadioButton': 'RadioButton',
            'Slider': 'Slider',
            'ProgressBar': 'ProgressBar',
            'ComboBox': 'ComboBox',
            'Row': 'Row',
            'Column': 'Column',
            'Grid': 'Grid',
            'RowLayout': 'RowLayout',
            'ColumnLayout': 'ColumnLayout',
            'GridLayout': 'GridLayout',
            'ListView': 'ListView',
            'TreeView': 'TreeView',
            'TabView': 'TabView',
            'ScrollView': 'ScrollView',
            'Image': 'Image',
            'WebEngineView': 'WebEngineView',
            'Canvas': 'Canvas',
            'Flickable': 'Flickable',
            'PathView': 'PathView',
            'SwipeView': 'SwipeView',
            'StackView': 'StackView',
            'SplitView': 'SplitView',
            'Drawer': 'Drawer',
            'Dialog': 'Dialog',
            'Popup': 'Popup',
            'Menu': 'Menu',
            'MenuBar': 'MenuBar',
            'ToolBar': 'ToolBar',
            'StatusBar': 'Rectangle', // Custom implementation
            'GroupBox': 'GroupBox',
            'Frame': 'Frame',
            'Page': 'Page',
            'Pane': 'Pane',
            'ScrollBar': 'ScrollBar',
            'SpinBox': 'SpinBox',
            'Tumbler': 'Tumbler',
            'Calendar': 'Calendar',
            'DatePicker': 'DatePicker',
            'TimePicker': 'TimePicker'
        };

        return mapping[widgetType] || 'Rectangle';
    }

    /**
     * Check if widget type is a layout
     */
    private static isLayoutType(widgetType: string): boolean {
        return ['Row', 'Column', 'Grid', 'RowLayout', 'ColumnLayout', 'GridLayout'].includes(widgetType);
    }

    /**
     * Sanitize ID for QML
     */
    private static sanitizeId(id: string): string {
        return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
    }

    /**
     * Format value for QML
     */
    private static formatValue(value: any): string {
        if (typeof value === 'string') {
            return `"${value}"`;
        } else if (typeof value === 'boolean') {
            return value.toString();
        } else if (typeof value === 'number') {
            return value.toString();
        } else if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
        } else if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value.toString();
    }

    /**
     * Generate a complete QML application with Material Design
     */
    public static generateMaterialApp(widgets: WidgetData[], options: any = {}): string {
        const imports = [
            'import QtQuick 2.15',
            'import QtQuick.Controls 2.15',
            'import QtQuick.Controls.Material 2.15',
            'import QtQuick.Layouts 1.15'
        ].join('\n');

        const materialProperties = `
    Material.theme: Material.Light
    Material.accent: Material.Blue
    Material.primary: Material.Indigo`;

        const appWindow = this.generateApplicationWindow(widgets, {
            ...options,
            additionalProperties: materialProperties
        });

        return `${imports}\n\n${appWindow}`;
    }

    /**
     * Generate a complete QML application with Universal Design
     */
    public static generateUniversalApp(widgets: WidgetData[], options: any = {}): string {
        const imports = [
            'import QtQuick 2.15',
            'import QtQuick.Controls 2.15',
            'import QtQuick.Controls.Universal 2.15',
            'import QtQuick.Layouts 1.15'
        ].join('\n');

        const universalProperties = `
    Universal.theme: Universal.Light
    Universal.accent: Universal.Cobalt
    Universal.foreground: Universal.Charcoal`;

        const appWindow = this.generateApplicationWindow(widgets, {
            ...options,
            additionalProperties: universalProperties
        });

        return `${imports}\n\n${appWindow}`;
    }

    /**
     * Parse QML back to widget data (basic implementation)
     */
    public static parseQML(qmlContent: string): WidgetData[] {
        // This is a simplified parser - in production you'd want a proper QML parser
        const widgets: WidgetData[] = [];
        
        // Basic regex patterns for common widgets
        const widgetPattern = /(\w+)\s*\{[^}]*\}/g;
        
        let match;
        let counter = 0;
        
        while ((match = widgetPattern.exec(qmlContent)) !== null) {
            const widgetType = match[1];
            const widgetContent = match[0];
            
            // Skip ApplicationWindow and other containers for now
            if (['ApplicationWindow', 'Window'].includes(widgetType)) {
                continue;
            }
            
            const widget: WidgetData = {
                id: `widget_${++counter}`,
                type: widgetType,
                x: this.extractProperty(widgetContent, 'x') || 0,
                y: this.extractProperty(widgetContent, 'y') || 0,
                width: this.extractProperty(widgetContent, 'width') || 100,
                height: this.extractProperty(widgetContent, 'height') || 30,
                properties: {}
            };
            
            // Extract text property
            const text = this.extractStringProperty(widgetContent, 'text');
            if (text) {
                widget.properties.text = text;
            }
            
            widgets.push(widget);
        }
        
        return widgets;
    }

    private static extractProperty(content: string, propertyName: string): number | null {
        const regex = new RegExp(`${propertyName}:\\s*(\\d+)`);
        const match = content.match(regex);
        return match ? parseInt(match[1]) : null;
    }

    private static extractStringProperty(content: string, propertyName: string): string | null {
        const regex = new RegExp(`${propertyName}:\\s*(?:qsTr\\()?["']([^"']+)["']\\)?`);
        const match = content.match(regex);
        return match ? match[1] : null;
    }
}
