const fs = require('fs');
const path = require('path');

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

console.log('✅ Images directory ready');
console.log('📋 Please copy your Qt logo (icon.png) to the images/ directory');
console.log('💡 The icon should be:');
console.log('   - 128x128 pixels (recommended)');
console.log('   - PNG format');
console.log('   - Named exactly "icon.png"');
console.log('');
console.log('🎯 Your Qt logo will be used as the extension icon in VS Code marketplace');

// Check if icon already exists
const iconPath = path.join(imagesDir, 'icon.png');
if (fs.existsSync(iconPath)) {
    console.log('✅ Qt logo found at images/icon.png');
    console.log('🚀 Ready to package extension!');
} else {
    console.log('⚠️  Please add the Qt logo as images/icon.png');
    console.log('📁 Copy the icon to: ' + iconPath);
}
