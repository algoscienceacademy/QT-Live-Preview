import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    id: window
    width: 600
    height: 400
    visible: true
    title: qsTr("Real-time Sync Demo")

    // Try editing this file and watch the changes appear in the UI Designer!
    // Or use the UI Designer to drag widgets and see the code update automatically!

    Rectangle {
        id: demoContainer
        x: 50
        y: 50
        width: 500
        height: 300
        color: "#f0f0f0"
        radius: 8
        border.width: 2
        border.color: "#0078d4"

        Column {
            id: demoLayout
            x: 20
            y: 20
            width: 460
            height: 260
            spacing: 15

            Label {
                id: titleLabel
                text: qsTr("🔄 Real-time Sync Demo")
                font.pixelSize: 20
                font.bold: true
                color: "#333333"
            }

            Label {
                id: instructionLabel
                text: qsTr("✨ Changes in code editor sync instantly to UI Designer")
                font.pixelSize: 14
                color: "#666666"
            }

            TextField {
                id: testField
                width: 460
                height: 35
                placeholderText: qsTr("Type here and watch it sync!")
                text: qsTr("Hello Real-time Sync!")
            }

            Row {
                id: buttonRow
                spacing: 10

                Button {
                    id: testButton1
                    text: qsTr("Button 1")
                    highlighted: true
                }

                Button {
                    id: testButton2
                    text: qsTr("Button 2")
                }

                CheckBox {
                    id: testCheckBox
                    text: qsTr("Enable sync")
                    checked: true
                }
            }

            Slider {
                id: testSlider
                width: 460
                height: 30
                from: 0
                to: 100
                value: 50
            }

            Label {
                id: valueLabel
                text: qsTr("Slider value: ") + Math.round(testSlider.value)
                color: "#0078d4"
                font.pixelSize: 12
            }
        }
    }
}
