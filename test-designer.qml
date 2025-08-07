import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: window
    width: 640
    height: 480
    visible: true
    title: "Qt Visual Designer Test"

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 15

        Text {
            id: titleText
            text: "Welcome to Qt Visual Designer"
            font.pixelSize: 24
            font.bold: true
            color: "#2E3440"
            Layout.alignment: Qt.AlignHCenter
        }

        Rectangle {
            id: contentArea
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#F5F5F5"
            border.color: "#CCCCCC"
            border.width: 1
            radius: 8

            RowLayout {
                anchors.fill: parent
                anchors.margins: 20
                spacing: 20

                // Left Column - Form Controls
                ColumnLayout {
                    Layout.preferredWidth: parent.width * 0.5
                    spacing: 10

                    TextField {
                        id: nameField
                        placeholderText: "Enter your name"
                        Layout.fillWidth: true
                    }

                    TextField {
                        id: emailField
                        placeholderText: "Enter your email"
                        Layout.fillWidth: true
                    }

                    ComboBox {
                        id: countryCombo
                        model: ["Select Country", "USA", "Canada", "UK", "Germany", "France"]
                        Layout.fillWidth: true
                    }

                    CheckBox {
                        id: agreeCheck
                        text: "I agree to the terms and conditions"
                    }

                    Button {
                        id: submitButton
                        text: "Submit"
                        Layout.fillWidth: true
                        enabled: nameField.text.length > 0 && emailField.text.length > 0 && agreeCheck.checked
                        
                        onClicked: {
                            resultText.text = "Form submitted successfully!\nName: " + nameField.text + "\nEmail: " + emailField.text + "\nCountry: " + countryCombo.currentText;
                        }
                    }
                }

                // Right Column - Result Display
                Rectangle {
                    Layout.preferredWidth: parent.width * 0.5
                    Layout.fillHeight: true
                    color: "#FFFFFF"
                    border.color: "#DDDDDD"
                    border.width: 1
                    radius: 4

                    ScrollView {
                        anchors.fill: parent
                        anchors.margins: 10

                        Text {
                            id: resultText
                            text: "Fill out the form and click Submit to see results here."
                            wrapMode: Text.WordWrap
                            width: parent.width
                            font.pixelSize: 14
                            color: "#333333"
                        }
                    }
                }
            }
        }

        // Status Bar
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 30
            color: "#E8E8E8"
            border.color: "#CCCCCC"
            border.width: 1

            Text {
                anchors.centerIn: parent
                text: "Ready - Drag and drop widgets to design your interface"
                font.pixelSize: 12
                color: "#666666"
            }
        }
    }
}
