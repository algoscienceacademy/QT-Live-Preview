import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: mainWindow
    visible: true
    width: 800
    height: 600
    title: "Qt Visual Designer Demo"
    
    // Main content area
    Rectangle {
        id: backgroundRect
        anchors.fill: parent
        color: "#f5f5f5"
        
        // Header
        Rectangle {
            id: headerRect
            x: 0
            y: 0
            width: 800
            height: 60
            color: "#2d2d30"
            
            Text {
                id: titleText
                x: 20
                y: 20
                text: "Qt Visual Designer Demo"
                color: "white"
                font.pixelSize: 18
                font.bold: true
            }
        }
        
        // Form area
        Rectangle {
            id: formArea
            x: 50
            y: 100
            width: 700
            height: 450
            color: "white"
            border.color: "#ddd"
            border.width: 1
            radius: 8
            
            Text {
                id: formTitle
                x: 20
                y: 20
                text: "User Registration Form"
                font.pixelSize: 16
                font.bold: true
                color: "#333"
            }
            
            // Name field
            Text {
                id: nameLabel
                x: 20
                y: 60
                text: "Name:"
                font.pixelSize: 14
                color: "#666"
            }
            
            TextField {
                id: nameField
                x: 20
                y: 80
                width: 300
                height: 35
                placeholderText: "Enter your full name"
                font.pixelSize: 14
            }
            
            // Email field
            Text {
                id: emailLabel
                x: 20
                y: 130
                text: "Email:"
                font.pixelSize: 14
                color: "#666"
            }
            
            TextField {
                id: emailField
                x: 20
                y: 150
                width: 300
                height: 35
                placeholderText: "Enter your email address"
                font.pixelSize: 14
            }
            
            // Age slider
            Text {
                id: ageLabel
                x: 20
                y: 200
                text: "Age: 25"
                font.pixelSize: 14
                color: "#666"
            }
            
            Slider {
                id: ageSlider
                x: 20
                y: 220
                width: 300
                height: 30
                from: 18
                to: 100
                value: 25
            }
            
            // Checkboxes
            CheckBox {
                id: newsletterCheck
                x: 400
                y: 80
                text: "Subscribe to newsletter"
                checked: true
            }
            
            CheckBox {
                id: termsCheck
                x: 400
                y: 120
                text: "Accept terms and conditions"
                checked: false
            }
            
            // Country selection
            Text {
                id: countryLabel
                x: 400
                y: 160
                text: "Country:"
                font.pixelSize: 14
                color: "#666"
            }
            
            ComboBox {
                id: countryCombo
                x: 400
                y: 180
                width: 250
                height: 35
                model: ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France"]
                currentIndex: 0
            }
            
            // Action buttons
            Button {
                id: submitButton
                x: 20
                y: 350
                width: 120
                height: 40
                text: "Submit"
                highlighted: true
            }
            
            Button {
                id: cancelButton
                x: 160
                y: 350
                width: 120
                height: 40
                text: "Cancel"
            }
            
            Button {
                id: resetButton
                x: 300
                y: 350
                width: 120
                height: 40
                text: "Reset"
            }
            
            // Progress indicator
            ProgressBar {
                id: progressBar
                x: 400
                y: 260
                width: 250
                height: 20
                from: 0
                to: 100
                value: 65
            }
            
            Text {
                id: progressLabel
                x: 400
                y: 290
                text: "Profile completion: 65%"
                font.pixelSize: 12
                color: "#666"
            }
            
            // Image placeholder
            Rectangle {
                id: imageRect
                x: 500
                y: 320
                width: 80
                height: 80
                color: "#f0f0f0"
                border.color: "#ddd"
                border.width: 1
                radius: 4
                
                Text {
                    anchors.centerIn: parent
                    text: "Photo"
                    color: "#999"
                    font.pixelSize: 12
                }
            }
        }
        
        // Status bar
        Rectangle {
            id: statusBar
            x: 0
            y: 570
            width: 800
            height: 30
            color: "#f8f8f8"
            border.color: "#ddd"
            border.width: 1
            
            Text {
                id: statusText
                x: 10
                y: 8
                text: "Ready - Design your Qt application using the Visual Designer"
                font.pixelSize: 12
                color: "#666"
            }
        }
    }
}
