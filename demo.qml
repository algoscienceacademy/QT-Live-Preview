import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: "Qt Full Designer Demo"

    Rectangle {
        id: headerRect
        x: 20
        y: 20
        width: 760
        height: 60
        color: "#0078D4"
        radius: 8

        Text {
            id: titleLabel
            x: 20
            y: 15
            width: 400
            height: 30
            text: "Qt Full Designer Demo"
            color: "white"
            font.pixelSize: 18
            font.weight: Font.Bold
        }

        Button {
            id: refreshButton
            x: 650
            y: 15
            width: 90
            height: 30
            text: "Refresh"
            
            onClicked: {
                console.log("Refresh clicked")
            }
        }
    }

    Rectangle {
        id: contentArea
        x: 20
        y: 100
        width: 360
        height: 480
        color: "#F5F5F5"
        border.color: "#DDD"
        border.width: 1
        radius: 4

        Text {
            id: formLabel
            x: 20
            y: 20
            width: 200
            height: 25
            text: "User Information Form"
            font.pixelSize: 14
            font.weight: Font.Bold
        }

        TextField {
            id: nameField
            x: 20
            y: 60
            width: 320
            height: 35
            placeholderText: "Enter your name..."
        }

        TextField {
            id: emailField
            x: 20
            y: 110
            width: 320
            height: 35
            placeholderText: "Enter your email..."
        }

        CheckBox {
            id: agreeCheckbox
            x: 20
            y: 160
            width: 200
            height: 25
            text: "I agree to terms"
            checked: false
        }

        RadioButton {
            id: option1Radio
            x: 20
            y: 200
            width: 150
            height: 25
            text: "Option 1"
            checked: true
        }

        RadioButton {
            id: option2Radio
            x: 180
            y: 200
            width: 150
            height: 25
            text: "Option 2"
            checked: false
        }

        Slider {
            id: valueSlider
            x: 20
            y: 240
            width: 200
            height: 25
            from: 0
            to: 100
            value: 50
        }

        Text {
            id: sliderValue
            x: 240
            y: 240
            width: 100
            height: 25
            text: "Value: " + Math.round(valueSlider.value)
            font.pixelSize: 12
        }

        Button {
            id: submitButton
            x: 20
            y: 290
            width: 100
            height: 35
            text: "Submit"
            enabled: nameField.text.length > 0
            
            onClicked: {
                console.log("Form submitted")
            }
        }

        Button {
            id: cancelButton
            x: 140
            y: 290
            width: 100
            height: 35
            text: "Cancel"
            
            onClicked: {
                nameField.text = ""
                emailField.text = ""
                agreeCheckbox.checked = false
            }
        }
    }

    Rectangle {
        id: previewArea
        x: 400
        y: 100
        width: 380
        height: 480
        color: "white"
        border.color: "#DDD"
        border.width: 1
        radius: 4

        Text {
            id: previewLabel
            x: 20
            y: 20
            width: 200
            height: 25
            text: "Live Preview Area"
            font.pixelSize: 14
            font.weight: Font.Bold
        }

        Rectangle {
            id: imagePreview
            x: 20
            y: 60
            width: 340
            height: 200
            color: "#E3F2FD"
            border.color: "#2196F3"
            border.width: 2
            radius: 8

            Text {
                anchors.centerIn: parent
                text: "Image Preview\n📷"
                font.pixelSize: 24
                color: "#1976D2"
                horizontalAlignment: Text.AlignHCenter
            }
        }

        ListView {
            id: itemsList
            x: 20
            y: 280
            width: 340
            height: 180
            
            model: ListModel {
                ListElement { name: "Item 1"; description: "Description 1" }
                ListElement { name: "Item 2"; description: "Description 2" }
                ListElement { name: "Item 3"; description: "Description 3" }
            }
            
            delegate: Rectangle {
                width: itemsList.width
                height: 50
                color: index % 2 === 0 ? "#F9F9F9" : "white"
                border.color: "#EEE"
                border.width: 1
                
                Row {
                    anchors.left: parent.left
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.leftMargin: 10
                    spacing: 10
                    
                    Text {
                        text: name
                        font.weight: Font.Bold
                        font.pixelSize: 12
                    }
                    
                    Text {
                        text: description
                        font.pixelSize: 10
                        color: "#666"
                    }
                }
            }
        }
    }
}
