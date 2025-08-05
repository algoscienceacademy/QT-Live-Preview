import * as vscode from 'vscode';
import { WidgetData } from './qmlCodeGenerator';
import { QtUITemplates } from './qtUITemplates';

export interface ComponentDefinition {
    type: string;
    displayName: string;
    icon: string;
    category: string;
    defaultProperties: { [key: string]: any };
    defaultSize: { width: number; height: number };
    description: string;
    qmlImports?: string[];
}

export class QtComponentLibrary {
    
    /**
     * Get all available components organized by category
     */
    public static getComponentCategories(): { [category: string]: ComponentDefinition[] } {
        const allComponents = this.getAllComponents();
        const categories: { [category: string]: ComponentDefinition[] } = {};
        
        allComponents.forEach(component => {
            if (!categories[component.category]) {
                categories[component.category] = [];
            }
            categories[component.category].push(component);
        });
        
        return categories;
    }

    /**
     * Get all available components
     */
    public static getAllComponents(): ComponentDefinition[] {
        return [
            // Basic Widgets
            {
                type: 'Button',
                displayName: 'Button',
                icon: '🔘',
                category: 'Basic Widgets',
                defaultProperties: { text: 'Button', enabled: true },
                defaultSize: { width: 120, height: 35 },
                description: 'A clickable button control'
            },
            {
                type: 'Label',
                displayName: 'Label',
                icon: '🏷️',
                category: 'Basic Widgets',
                defaultProperties: { text: 'Label' },
                defaultSize: { width: 100, height: 25 },
                description: 'A text label for displaying information'
            },
            {
                type: 'TextField',
                displayName: 'Text Field',
                icon: '📝',
                category: 'Basic Widgets',
                defaultProperties: { placeholderText: 'Enter text' },
                defaultSize: { width: 200, height: 35 },
                description: 'Single-line text input field'
            },
            {
                type: 'TextArea',
                displayName: 'Text Area',
                icon: '📄',
                category: 'Basic Widgets',
                defaultProperties: { text: 'Multi-line text', wrapMode: 'Text.WordWrap' },
                defaultSize: { width: 250, height: 100 },
                description: 'Multi-line text input area'
            },
            {
                type: 'Image',
                displayName: 'Image',
                icon: '🖼️',
                category: 'Basic Widgets',
                defaultProperties: { source: '', fillMode: 'PreserveAspectFit' },
                defaultSize: { width: 150, height: 150 },
                description: 'Display images from files or resources'
            },

            // Layout Containers
            {
                type: 'Rectangle',
                displayName: 'Rectangle',
                icon: '⬛',
                category: 'Layout',
                defaultProperties: { color: '#f0f0f0', radius: 0 },
                defaultSize: { width: 150, height: 100 },
                description: 'Basic rectangular container'
            },
            {
                type: 'Row',
                displayName: 'Row Layout',
                icon: '↔️',
                category: 'Layout',
                defaultProperties: { spacing: 10 },
                defaultSize: { width: 300, height: 50 },
                description: 'Arranges children horizontally'
            },
            {
                type: 'Column',
                displayName: 'Column Layout',
                icon: '↕️',
                category: 'Layout',
                defaultProperties: { spacing: 10 },
                defaultSize: { width: 150, height: 200 },
                description: 'Arranges children vertically'
            },
            {
                type: 'Grid',
                displayName: 'Grid Layout',
                icon: '⊞',
                category: 'Layout',
                defaultProperties: { rows: 2, columns: 2, rowSpacing: 10, columnSpacing: 10 },
                defaultSize: { width: 200, height: 150 },
                description: 'Arranges children in a grid'
            },
            {
                type: 'RowLayout',
                displayName: 'Row Layout (Anchored)',
                icon: '↔️',
                category: 'Layout',
                defaultProperties: { spacing: 10 },
                defaultSize: { width: 300, height: 50 },
                description: 'Layout that arranges children horizontally with size policies',
                qmlImports: ['import QtQuick.Layouts 1.15']
            },
            {
                type: 'ColumnLayout',
                displayName: 'Column Layout (Anchored)',
                icon: '↕️',
                category: 'Layout',
                defaultProperties: { spacing: 10 },
                defaultSize: { width: 150, height: 200 },
                description: 'Layout that arranges children vertically with size policies',
                qmlImports: ['import QtQuick.Layouts 1.15']
            },
            {
                type: 'GridLayout',
                displayName: 'Grid Layout (Anchored)',
                icon: '⊞',
                category: 'Layout',
                defaultProperties: { rows: 2, columns: 2, rowSpacing: 10, columnSpacing: 10 },
                defaultSize: { width: 200, height: 150 },
                description: 'Layout that arranges children in a grid with size policies',
                qmlImports: ['import QtQuick.Layouts 1.15']
            },

            // Input Controls
            {
                type: 'CheckBox',
                displayName: 'Check Box',
                icon: '☑️',
                category: 'Controls',
                defaultProperties: { text: 'CheckBox', checked: false },
                defaultSize: { width: 120, height: 30 },
                description: 'Checkbox for boolean selection'
            },
            {
                type: 'RadioButton',
                displayName: 'Radio Button',
                icon: '🔘',
                category: 'Controls',
                defaultProperties: { text: 'RadioButton', checked: false },
                defaultSize: { width: 120, height: 30 },
                description: 'Radio button for exclusive selection'
            },
            {
                type: 'Slider',
                displayName: 'Slider',
                icon: '🎚️',
                category: 'Controls',
                defaultProperties: { from: 0, to: 100, value: 50 },
                defaultSize: { width: 200, height: 30 },
                description: 'Slider for numeric value selection'
            },
            {
                type: 'ProgressBar',
                displayName: 'Progress Bar',
                icon: '📊',
                category: 'Controls',
                defaultProperties: { from: 0, to: 100, value: 50 },
                defaultSize: { width: 200, height: 25 },
                description: 'Progress indicator bar'
            },
            {
                type: 'ComboBox',
                displayName: 'Combo Box',
                icon: '📋',
                category: 'Controls',
                defaultProperties: { model: ['Option 1', 'Option 2', 'Option 3'] },
                defaultSize: { width: 150, height: 35 },
                description: 'Dropdown selection box'
            },
            {
                type: 'SpinBox',
                displayName: 'Spin Box',
                icon: '🔢',
                category: 'Controls',
                defaultProperties: { from: 0, to: 100, value: 0 },
                defaultSize: { width: 120, height: 35 },
                description: 'Numeric input with spin buttons'
            },
            {
                type: 'Switch',
                displayName: 'Switch',
                icon: '🔀',
                category: 'Controls',
                defaultProperties: { checked: false },
                defaultSize: { width: 60, height: 30 },
                description: 'Toggle switch control'
            },

            // Advanced Widgets
            {
                type: 'ListView',
                displayName: 'List View',
                icon: '📋',
                category: 'Advanced',
                defaultProperties: { 
                    model: ['Item 1', 'Item 2', 'Item 3'],
                    delegate: 'Text { text: modelData; padding: 10 }'
                },
                defaultSize: { width: 200, height: 150 },
                description: 'Scrollable list of items'
            },
            {
                type: 'TreeView',
                displayName: 'Tree View',
                icon: '🌳',
                category: 'Advanced',
                defaultProperties: {},
                defaultSize: { width: 250, height: 200 },
                description: 'Hierarchical tree view'
            },
            {
                type: 'TabView',
                displayName: 'Tab View',
                icon: '📑',
                category: 'Advanced',
                defaultProperties: { currentIndex: 0 },
                defaultSize: { width: 400, height: 300 },
                description: 'Tabbed interface container'
            },
            {
                type: 'ScrollView',
                displayName: 'Scroll View',
                icon: '📜',
                category: 'Advanced',
                defaultProperties: { clip: true },
                defaultSize: { width: 250, height: 200 },
                description: 'Scrollable content container'
            },
            {
                type: 'SwipeView',
                displayName: 'Swipe View',
                icon: '👆',
                category: 'Advanced',
                defaultProperties: { currentIndex: 0 },
                defaultSize: { width: 300, height: 200 },
                description: 'Swipeable page container'
            },
            {
                type: 'StackView',
                displayName: 'Stack View',
                icon: '📚',
                category: 'Advanced',
                defaultProperties: {},
                defaultSize: { width: 300, height: 200 },
                description: 'Navigation stack container'
            },

            // Containers
            {
                type: 'GroupBox',
                displayName: 'Group Box',
                icon: '📦',
                category: 'Containers',
                defaultProperties: { title: 'Group' },
                defaultSize: { width: 200, height: 150 },
                description: 'Grouped container with title'
            },
            {
                type: 'Frame',
                displayName: 'Frame',
                icon: '🖼️',
                category: 'Containers',
                defaultProperties: {},
                defaultSize: { width: 200, height: 150 },
                description: 'Visual frame container'
            },
            {
                type: 'Page',
                displayName: 'Page',
                icon: '📄',
                category: 'Containers',
                defaultProperties: { title: 'Page' },
                defaultSize: { width: 400, height: 300 },
                description: 'Application page container'
            },
            {
                type: 'Pane',
                displayName: 'Pane',
                icon: '🗂️',
                category: 'Containers',
                defaultProperties: {},
                defaultSize: { width: 200, height: 150 },
                description: 'Background pane container'
            },

            // Navigation
            {
                type: 'Drawer',
                displayName: 'Drawer',
                icon: '📋',
                category: 'Navigation',
                defaultProperties: { edge: 'Qt.LeftEdge' },
                defaultSize: { width: 250, height: 400 },
                description: 'Slide-out navigation drawer'
            },
            {
                type: 'Dialog',
                displayName: 'Dialog',
                icon: '💬',
                category: 'Navigation',
                defaultProperties: { title: 'Dialog', modal: true },
                defaultSize: { width: 300, height: 200 },
                description: 'Modal dialog window'
            },
            {
                type: 'Popup',
                displayName: 'Popup',
                icon: '🎈',
                category: 'Navigation',
                defaultProperties: { modal: false },
                defaultSize: { width: 200, height: 150 },
                description: 'Popup overlay'
            },
            {
                type: 'ToolBar',
                displayName: 'Tool Bar',
                icon: '🔧',
                category: 'Navigation',
                defaultProperties: {},
                defaultSize: { width: 400, height: 50 },
                description: 'Toolbar for actions'
            },
            {
                type: 'MenuBar',
                displayName: 'Menu Bar',
                icon: '🍔',
                category: 'Navigation',
                defaultProperties: {},
                defaultSize: { width: 400, height: 30 },
                description: 'Application menu bar'
            },

            // Multimedia
            {
                type: 'VideoOutput',
                displayName: 'Video Output',
                icon: '📹',
                category: 'Multimedia',
                defaultProperties: { fillMode: 'PreserveAspectFit' },
                defaultSize: { width: 320, height: 240 },
                description: 'Video playback output',
                qmlImports: ['import QtMultimedia 5.15']
            },

            // Charts (if available)
            {
                type: 'ChartView',
                displayName: 'Chart View',
                icon: '📈',
                category: 'Charts',
                defaultProperties: { title: 'Chart', legend: 'visible' },
                defaultSize: { width: 400, height: 300 },
                description: 'Chart and graph display',
                qmlImports: ['import QtCharts 2.15']
            }
        ];
    }

    /**
     * Get component definition by type
     */
    public static getComponent(type: string): ComponentDefinition | undefined {
        return this.getAllComponents().find(comp => comp.type === type);
    }

    /**
     * Create a widget from component definition
     */
    public static createWidget(
        component: ComponentDefinition, 
        x: number, 
        y: number, 
        id?: string
    ): WidgetData {
        return {
            id: id || `${component.type.toLowerCase()}_${Date.now()}`,
            type: component.type,
            x: x,
            y: y,
            width: component.defaultSize.width,
            height: component.defaultSize.height,
            properties: { ...component.defaultProperties }
        };
    }

    /**
     * Get templates from the QtUITemplates class
     */
    public static getTemplates(): { [key: string]: () => WidgetData[] } {
        return QtUITemplates.getAllTemplates();
    }

    /**
     * Validate widget properties
     */
    public static validateProperties(widget: WidgetData): string[] {
        const errors: string[] = [];
        const component = this.getComponent(widget.type);
        
        if (!component) {
            errors.push(`Unknown widget type: ${widget.type}`);
            return errors;
        }

        // Basic validation
        if (widget.width <= 0) {
            errors.push('Width must be greater than 0');
        }
        if (widget.height <= 0) {
            errors.push('Height must be greater than 0');
        }

        // Type-specific validation
        switch (widget.type) {
            case 'Slider':
            case 'ProgressBar':
            case 'SpinBox':
                if (widget.properties.from >= widget.properties.to) {
                    errors.push('From value must be less than To value');
                }
                if (widget.properties.value < widget.properties.from || 
                    widget.properties.value > widget.properties.to) {
                    errors.push('Value must be between From and To values');
                }
                break;
            case 'Image':
                if (!widget.properties.source) {
                    errors.push('Image source is required');
                }
                break;
            case 'Grid':
            case 'GridLayout':
                if (widget.properties.rows <= 0 || widget.properties.columns <= 0) {
                    errors.push('Grid must have at least 1 row and 1 column');
                }
                break;
        }

        return errors;
    }

    /**
     * Get property schema for a widget type
     */
    public static getPropertySchema(widgetType: string): { [property: string]: any } {
        const schemas: { [type: string]: any } = {
            'Button': {
                text: { type: 'string', default: 'Button' },
                enabled: { type: 'boolean', default: true },
                checkable: { type: 'boolean', default: false },
                checked: { type: 'boolean', default: false },
                flat: { type: 'boolean', default: false },
                highlighted: { type: 'boolean', default: false }
            },
            'Label': {
                text: { type: 'string', default: 'Label' },
                color: { type: 'color', default: '#000000' },
                wrapMode: { type: 'enum', values: ['NoWrap', 'WordWrap', 'WrapAnywhere'], default: 'NoWrap' }
            },
            'TextField': {
                text: { type: 'string', default: '' },
                placeholderText: { type: 'string', default: 'Enter text' },
                readOnly: { type: 'boolean', default: false },
                maximumLength: { type: 'number', default: 32767 }
            },
            'Rectangle': {
                color: { type: 'color', default: '#f0f0f0' },
                radius: { type: 'number', default: 0, min: 0 },
                border: {
                    type: 'object',
                    properties: {
                        width: { type: 'number', default: 0, min: 0 },
                        color: { type: 'color', default: '#000000' }
                    }
                }
            },
            'Slider': {
                from: { type: 'number', default: 0 },
                to: { type: 'number', default: 100 },
                value: { type: 'number', default: 50 },
                stepSize: { type: 'number', default: 1, min: 0 },
                orientation: { type: 'enum', values: ['Qt.Horizontal', 'Qt.Vertical'], default: 'Qt.Horizontal' }
            }
        };

        return schemas[widgetType] || {};
    }

    /**
     * Get recommended parent types for a widget
     */
    public static getCompatibleParents(widgetType: string): string[] {
        const parentCompatibility: { [type: string]: string[] } = {
            'Button': ['Rectangle', 'Row', 'Column', 'Grid', 'RowLayout', 'ColumnLayout', 'GridLayout', 'Page', 'Frame', 'GroupBox'],
            'Label': ['Rectangle', 'Row', 'Column', 'Grid', 'RowLayout', 'ColumnLayout', 'GridLayout', 'Page', 'Frame', 'GroupBox'],
            'TextField': ['Rectangle', 'Row', 'Column', 'Grid', 'RowLayout', 'ColumnLayout', 'GridLayout', 'Page', 'Frame', 'GroupBox'],
            'Page': ['TabView', 'StackView', 'SwipeView'],
            'MenuItem': ['Menu'],
            'Action': ['ToolBar', 'MenuBar']
        };

        return parentCompatibility[widgetType] || ['Rectangle', 'Row', 'Column', 'Grid', 'Page'];
    }
}
