/**
 * PWA Icon Generator
 *
 * This script generates PWA icons from a source image.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js
 *
 * Requirements:
 *   - Place a 512x512 or larger source image at: public/icon-source.png
 *   - npm install sharp (already in your devDependencies via next)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
// Try these source images in order of preference
const POSSIBLE_SOURCES = [
  path.join(__dirname, '../public/icon-source.png'),
  path.join(__dirname, '../public/taxomind-logo.png'),
  path.join(__dirname, '../public/assets/images/logo.svg'),
];

const SOURCE_IMAGE = POSSIBLE_SOURCES.find(src => fs.existsSync(src)) || POSSIBLE_SOURCES[0];

// Icon sizes required by the manifest
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.log('\\n⚠️  Source image not found!');
    console.log('\\nTo generate PWA icons:');
    console.log('1. Create a 512x512 (or larger) PNG image of your app icon');
    console.log('2. Save it as: public/icon-source.png');
    console.log('3. Run this script again: node scripts/generate-pwa-icons.js');
    console.log('\\nAlternatively, you can use online tools:');
    console.log('- https://realfavicongenerator.net/');
    console.log('- https://www.pwabuilder.com/imageGenerator');
    console.log('\\nUpload your icon and download the generated icons to public/icons/');
    process.exit(1);
  }

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  console.log('Generating PWA icons from:', SOURCE_IMAGE);

  // Generate each icon size
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated: icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with padding for safe zone)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const outputPath = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`);
    const innerSize = Math.floor(size * 0.8); // 80% of size, 10% padding on each side

    await sharp(SOURCE_IMAGE)
      .resize(innerSize, innerSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: Math.floor((size - innerSize) / 2),
        bottom: Math.ceil((size - innerSize) / 2),
        left: Math.floor((size - innerSize) / 2),
        right: Math.ceil((size - innerSize) / 2),
        background: { r: 102, g: 126, b: 234, alpha: 1 } // #667eea theme color
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated: icon-maskable-${size}x${size}.png`);
  }

  // Generate shortcut icons
  const shortcutIcons = ['courses', 'learn'];
  for (const name of shortcutIcons) {
    const outputPath = path.join(ICONS_DIR, `${name}-96x96.png`);

    // For now, just use the main icon as shortcut icons
    // You can replace these with custom icons later
    await sharp(SOURCE_IMAGE)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated: ${name}-96x96.png`);
  }

  console.log('\\n✅ All PWA icons generated successfully!');
  console.log(`   Icons saved to: ${ICONS_DIR}`);
}

generateIcons().catch(console.error);
