import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: window
    width: 800
    height: 600
    visible: true
    title: qsTr("Qt UI Designer Demo")

    // Demo form created with UI Designer
    Rectangle {
        id: formContainer
        x: 50
        y: 50
        width: 400
        height: 500
        color: "#f5f5f5"
        radius: 10
        border.width: 1
        border.color: "#e0e0e0"

        Column {
            id: formLayout
            x: 30
            y: 30
            width: 340
            height: 440
            spacing: 20

            Label {
                id: titleLabel
                text: qsTr("Contact Information")
                font.pixelSize: 24
                font.bold: true
                color: "#333333"
            }

            TextField {
                id: nameField
                width: 340
                height: 40
                placeholderText: qsTr("Full Name")
            }

            TextField {
                id: emailField
                width: 340
                height: 40
                placeholderText: qsTr("Email Address")
            }

            TextField {
                id: phoneField
                width: 340
                height: 40
                placeholderText: qsTr("Phone Number")
            }

            Row {
                id: checkboxRow
                spacing: 15

                CheckBox {
                    id: newsletterCheck
                    text: qsTr("Subscribe to newsletter")
                    checked: true
                }

                CheckBox {
                    id: termsCheck
                    text: qsTr("Accept terms")
                }
            }

            Slider {
                id: prioritySlider
                width: 340
                height: 40
                from: 1
                to: 10
                value: 5
            }

            Label {
                id: priorityLabel
                text: qsTr("Priority: ") + Math.round(prioritySlider.value)
                color: "#666666"
            }

            Row {
                id: buttonRow
                spacing: 15

                Button {
                    id: submitButton
                    text: qsTr("Submit")
                    highlighted: true
                    onClicked: {
                        console.log("Form submitted!")
                        console.log("Name:", nameField.text)
                        console.log("Email:", emailField.text)
                        console.log("Phone:", phoneField.text)
                        console.log("Newsletter:", newsletterCheck.checked)
                        console.log("Terms:", termsCheck.checked)
                        console.log("Priority:", prioritySlider.value)
                    }
                }

                Button {
                    id: clearButton
                    text: qsTr("Clear")
                    onClicked: {
                        nameField.text = ""
                        emailField.text = ""
                        phoneField.text = ""
                        newsletterCheck.checked = false
                        termsCheck.checked = false
                        prioritySlider.value = 5
                    }
                }
            }
        }
    }

    // Status bar at bottom
    Rectangle {
        id: statusBar
        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 30
        color: "#e0e0e0"

        Label {
            id: statusLabel
            anchors.centerIn: parent
            text: qsTr("Ready - Created with Qt UI Designer")
            color: "#666666"
            font.pixelSize: 12
        }
    }
}
