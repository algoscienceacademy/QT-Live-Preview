import { WidgetData } from './qmlCodeGenerator';

export class QtUITemplates {
    
    /**
     * Generate a basic form layout
     */
    public static createFormLayout(): WidgetData[] {
        return [
            {
                id: 'formContainer',
                type: 'Column',
                x: 20,
                y: 20,
                width: 400,
                height: 300,
                properties: {
                    spacing: 15
                },
                children: [
                    {
                        id: 'titleLabel',
                        type: 'Label',
                        x: 0,
                        y: 0,
                        width: 400,
                        height: 30,
                        properties: {
                            text: 'User Information',
                            font: { pixelSize: 18, bold: true }
                        }
                    },
                    {
                        id: 'nameField',
                        type: 'TextField',
                        x: 0,
                        y: 50,
                        width: 400,
                        height: 35,
                        properties: {
                            placeholderText: 'Enter your name'
                        }
                    },
                    {
                        id: 'emailField',
                        type: 'TextField',
                        x: 0,
                        y: 100,
                        width: 400,
                        height: 35,
                        properties: {
                            placeholderText: 'Enter your email'
                        }
                    },
                    {
                        id: 'submitButton',
                        type: 'Button',
                        x: 0,
                        y: 150,
                        width: 120,
                        height: 40,
                        properties: {
                            text: 'Submit',
                            signals: {
                                'onClicked': 'console.log("Form submitted")'
                            }
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Generate a navigation drawer layout
     */
    public static createNavigationDrawer(): WidgetData[] {
        return [
            {
                id: 'drawer',
                type: 'Drawer',
                x: 0,
                y: 0,
                width: 250,
                height: 600,
                properties: {
                    edge: 'Qt.LeftEdge'
                },
                children: [
                    {
                        id: 'drawerContent',
                        type: 'Column',
                        x: 0,
                        y: 0,
                        width: 250,
                        height: 600,
                        properties: {
                            spacing: 0
                        },
                        children: [
                            {
                                id: 'drawerHeader',
                                type: 'Rectangle',
                                x: 0,
                                y: 0,
                                width: 250,
                                height: 80,
                                properties: {
                                    color: '#3F51B5'
                                },
                                children: [
                                    {
                                        id: 'headerText',
                                        type: 'Label',
                                        x: 20,
                                        y: 20,
                                        width: 210,
                                        height: 40,
                                        properties: {
                                            text: 'Navigation',
                                            color: 'white',
                                            font: { pixelSize: 16, bold: true }
                                        }
                                    }
                                ]
                            },
                            {
                                id: 'homeButton',
                                type: 'Button',
                                x: 0,
                                y: 80,
                                width: 250,
                                height: 50,
                                properties: {
                                    text: '🏠 Home',
                                    flat: true
                                }
                            },
                            {
                                id: 'settingsButton',
                                type: 'Button',
                                x: 0,
                                y: 130,
                                width: 250,
                                height: 50,
                                properties: {
                                    text: '⚙️ Settings',
                                    flat: true
                                }
                            },
                            {
                                id: 'aboutButton',
                                type: 'Button',
                                x: 0,
                                y: 180,
                                width: 250,
                                height: 50,
                                properties: {
                                    text: 'ℹ️ About',
                                    flat: true
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Generate a tab view layout
     */
    public static createTabView(): WidgetData[] {
        return [
            {
                id: 'tabView',
                type: 'TabView',
                x: 20,
                y: 20,
                width: 600,
                height: 400,
                properties: {
                    currentIndex: 0
                },
                children: [
                    {
                        id: 'tab1',
                        type: 'Page',
                        x: 0,
                        y: 0,
                        width: 600,
                        height: 370,
                        properties: {
                            title: 'General'
                        },
                        children: [
                            {
                                id: 'tab1Content',
                                type: 'Column',
                                x: 20,
                                y: 20,
                                width: 560,
                                height: 330,
                                properties: {
                                    spacing: 15
                                },
                                children: [
                                    {
                                        id: 'generalLabel',
                                        type: 'Label',
                                        x: 0,
                                        y: 0,
                                        width: 560,
                                        height: 30,
                                        properties: {
                                            text: 'General Settings',
                                            font: { pixelSize: 16, bold: true }
                                        }
                                    },
                                    {
                                        id: 'enableFeature',
                                        type: 'CheckBox',
                                        x: 0,
                                        y: 45,
                                        width: 200,
                                        height: 30,
                                        properties: {
                                            text: 'Enable Feature',
                                            checked: true
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'tab2',
                        type: 'Page',
                        x: 0,
                        y: 0,
                        width: 600,
                        height: 370,
                        properties: {
                            title: 'Advanced'
                        },
                        children: [
                            {
                                id: 'tab2Content',
                                type: 'Column',
                                x: 20,
                                y: 20,
                                width: 560,
                                height: 330,
                                properties: {
                                    spacing: 15
                                },
                                children: [
                                    {
                                        id: 'advancedLabel',
                                        type: 'Label',
                                        x: 0,
                                        y: 0,
                                        width: 560,
                                        height: 30,
                                        properties: {
                                            text: 'Advanced Settings',
                                            font: { pixelSize: 16, bold: true }
                                        }
                                    },
                                    {
                                        id: 'qualitySlider',
                                        type: 'Slider',
                                        x: 0,
                                        y: 45,
                                        width: 300,
                                        height: 30,
                                        properties: {
                                            from: 0,
                                            to: 100,
                                            value: 75
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Generate a grid dashboard layout
     */
    public static createDashboard(): WidgetData[] {
        return [
            {
                id: 'dashboard',
                type: 'GridLayout',
                x: 20,
                y: 20,
                width: 800,
                height: 600,
                properties: {
                    rows: 2,
                    columns: 3,
                    rowSpacing: 15,
                    columnSpacing: 15
                },
                children: [
                    {
                        id: 'card1',
                        type: 'Rectangle',
                        x: 0,
                        y: 0,
                        width: 250,
                        height: 180,
                        properties: {
                            color: '#f5f5f5',
                            radius: 8,
                            border: { width: 1, color: '#e0e0e0' }
                        },
                        children: [
                            {
                                id: 'card1Title',
                                type: 'Label',
                                x: 15,
                                y: 15,
                                width: 220,
                                height: 30,
                                properties: {
                                    text: 'Sales',
                                    font: { pixelSize: 16, bold: true }
                                }
                            },
                            {
                                id: 'card1Value',
                                type: 'Label',
                                x: 15,
                                y: 50,
                                width: 220,
                                height: 50,
                                properties: {
                                    text: '$12,345',
                                    font: { pixelSize: 24, bold: true },
                                    color: '#2196F3'
                                }
                            }
                        ]
                    },
                    {
                        id: 'card2',
                        type: 'Rectangle',
                        x: 265,
                        y: 0,
                        width: 250,
                        height: 180,
                        properties: {
                            color: '#f5f5f5',
                            radius: 8,
                            border: { width: 1, color: '#e0e0e0' }
                        },
                        children: [
                            {
                                id: 'card2Title',
                                type: 'Label',
                                x: 15,
                                y: 15,
                                width: 220,
                                height: 30,
                                properties: {
                                    text: 'Users',
                                    font: { pixelSize: 16, bold: true }
                                }
                            },
                            {
                                id: 'card2Value',
                                type: 'Label',
                                x: 15,
                                y: 50,
                                width: 220,
                                height: 50,
                                properties: {
                                    text: '1,234',
                                    font: { pixelSize: 24, bold: true },
                                    color: '#4CAF50'
                                }
                            }
                        ]
                    },
                    {
                        id: 'card3',
                        type: 'Rectangle',
                        x: 530,
                        y: 0,
                        width: 250,
                        height: 180,
                        properties: {
                            color: '#f5f5f5',
                            radius: 8,
                            border: { width: 1, color: '#e0e0e0' }
                        },
                        children: [
                            {
                                id: 'card3Title',
                                type: 'Label',
                                x: 15,
                                y: 15,
                                width: 220,
                                height: 30,
                                properties: {
                                    text: 'Orders',
                                    font: { pixelSize: 16, bold: true }
                                }
                            },
                            {
                                id: 'card3Value',
                                type: 'Label',
                                x: 15,
                                y: 50,
                                width: 220,
                                height: 50,
                                properties: {
                                    text: '567',
                                    font: { pixelSize: 24, bold: true },
                                    color: '#FF9800'
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Generate a master-detail layout
     */
    public static createMasterDetail(): WidgetData[] {
        return [
            {
                id: 'masterDetailContainer',
                type: 'Row',
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                properties: {
                    spacing: 0
                },
                children: [
                    {
                        id: 'masterPanel',
                        type: 'Rectangle',
                        x: 0,
                        y: 0,
                        width: 300,
                        height: 600,
                        properties: {
                            color: '#fafafa',
                            border: { width: 1, color: '#e0e0e0' }
                        },
                        children: [
                            {
                                id: 'masterList',
                                type: 'ListView',
                                x: 0,
                                y: 0,
                                width: 300,
                                height: 600,
                                properties: {
                                    model: '["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]',
                                    delegate: 'Rectangle { width: 300; height: 60; color: "white"; border.color: "#e0e0e0"; Text { anchors.centerIn: parent; text: modelData } }'
                                }
                            }
                        ]
                    },
                    {
                        id: 'detailPanel',
                        type: 'Rectangle',
                        x: 300,
                        y: 0,
                        width: 500,
                        height: 600,
                        properties: {
                            color: 'white'
                        },
                        children: [
                            {
                                id: 'detailContent',
                                type: 'Column',
                                x: 30,
                                y: 30,
                                width: 440,
                                height: 540,
                                properties: {
                                    spacing: 20
                                },
                                children: [
                                    {
                                        id: 'detailTitle',
                                        type: 'Label',
                                        x: 0,
                                        y: 0,
                                        width: 440,
                                        height: 40,
                                        properties: {
                                            text: 'Detail View',
                                            font: { pixelSize: 20, bold: true }
                                        }
                                    },
                                    {
                                        id: 'detailDescription',
                                        type: 'Label',
                                        x: 0,
                                        y: 60,
                                        width: 440,
                                        height: 200,
                                        properties: {
                                            text: 'Select an item from the list to view details here.',
                                            wrapMode: 'Text.WordWrap'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Generate a login form
     */
    public static createLoginForm(): WidgetData[] {
        return [
            {
                id: 'loginContainer',
                type: 'Rectangle',
                x: 250,
                y: 150,
                width: 350,
                height: 400,
                properties: {
                    color: 'white',
                    radius: 10,
                    border: { width: 1, color: '#e0e0e0' }
                },
                children: [
                    {
                        id: 'loginForm',
                        type: 'Column',
                        x: 40,
                        y: 40,
                        width: 270,
                        height: 320,
                        properties: {
                            spacing: 20
                        },
                        children: [
                            {
                                id: 'loginTitle',
                                type: 'Label',
                                x: 0,
                                y: 0,
                                width: 270,
                                height: 40,
                                properties: {
                                    text: 'Login',
                                    font: { pixelSize: 24, bold: true },
                                    anchors: { horizontalCenter: 'parent.horizontalCenter' }
                                }
                            },
                            {
                                id: 'usernameField',
                                type: 'TextField',
                                x: 0,
                                y: 60,
                                width: 270,
                                height: 45,
                                properties: {
                                    placeholderText: 'Username'
                                }
                            },
                            {
                                id: 'passwordField',
                                type: 'TextField',
                                x: 0,
                                y: 125,
                                width: 270,
                                height: 45,
                                properties: {
                                    placeholderText: 'Password',
                                    echoMode: 'TextInput.Password'
                                }
                            },
                            {
                                id: 'rememberCheck',
                                type: 'CheckBox',
                                x: 0,
                                y: 190,
                                width: 150,
                                height: 30,
                                properties: {
                                    text: 'Remember me'
                                }
                            },
                            {
                                id: 'loginButton',
                                type: 'Button',
                                x: 0,
                                y: 240,
                                width: 270,
                                height: 45,
                                properties: {
                                    text: 'Login',
                                    highlighted: true
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Generate a media player layout
     */
    public static createMediaPlayer(): WidgetData[] {
        return [
            {
                id: 'mediaPlayerContainer',
                type: 'Column',
                x: 20,
                y: 20,
                width: 600,
                height: 400,
                properties: {
                    spacing: 10
                },
                children: [
                    {
                        id: 'videoOutput',
                        type: 'Rectangle',
                        x: 0,
                        y: 0,
                        width: 600,
                        height: 300,
                        properties: {
                            color: 'black'
                        },
                        children: [
                            {
                                id: 'playIcon',
                                type: 'Label',
                                x: 275,
                                y: 125,
                                width: 50,
                                height: 50,
                                properties: {
                                    text: '▶',
                                    color: 'white',
                                    font: { pixelSize: 40 }
                                }
                            }
                        ]
                    },
                    {
                        id: 'controls',
                        type: 'Row',
                        x: 0,
                        y: 320,
                        width: 600,
                        height: 60,
                        properties: {
                            spacing: 10
                        },
                        children: [
                            {
                                id: 'playButton',
                                type: 'Button',
                                x: 0,
                                y: 0,
                                width: 60,
                                height: 40,
                                properties: {
                                    text: '▶'
                                }
                            },
                            {
                                id: 'stopButton',
                                type: 'Button',
                                x: 70,
                                y: 0,
                                width: 60,
                                height: 40,
                                properties: {
                                    text: '⏹'
                                }
                            },
                            {
                                id: 'progressSlider',
                                type: 'Slider',
                                x: 140,
                                y: 0,
                                width: 350,
                                height: 40,
                                properties: {
                                    from: 0,
                                    to: 100,
                                    value: 0
                                }
                            },
                            {
                                id: 'volumeSlider',
                                type: 'Slider',
                                x: 500,
                                y: 0,
                                width: 80,
                                height: 40,
                                properties: {
                                    from: 0,
                                    to: 100,
                                    value: 50,
                                    orientation: 'Qt.Horizontal'
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    }

    /**
     * Get all available templates
     */
    public static getAllTemplates(): { [key: string]: () => WidgetData[] } {
        return {
            'Form Layout': this.createFormLayout,
            'Navigation Drawer': this.createNavigationDrawer,
            'Tab View': this.createTabView,
            'Dashboard': this.createDashboard,
            'Master-Detail': this.createMasterDetail,
            'Login Form': this.createLoginForm,
            'Media Player': this.createMediaPlayer
        };
    }

    /**
     * Create a template by name
     */
    public static createTemplate(templateName: string): WidgetData[] {
        const templates = this.getAllTemplates();
        const template = templates[templateName];
        
        if (template) {
            return template();
        }
        
        throw new Error(`Template "${templateName}" not found`);
    }
}
