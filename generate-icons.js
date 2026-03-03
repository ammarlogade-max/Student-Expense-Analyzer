/**
 * ExpenseIQ — Icon Generator
 *
 * Generates all required PWA icon sizes from a single source SVG.
 * Run once after setup: node generate-icons.js
 *
 * Requirements:
 *   npm install sharp   (one-time, dev only)
 *
 * Output: frontend/public/icons/ with all PNG sizes
 */

const sharp  = require("sharp");
const fs     = require("fs");
const path   = require("path");

const OUT_DIR = path.join(__dirname, "frontend", "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Base SVG — the "IQ" logo badge ───────────────────────────────────────────
// Edit this SVG to match your final branding before generating.
const BASE_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <!-- Maskable safe zone = inner 80% circle -->
  </defs>

  <!-- Background rounded square -->
  <rect width="512" height="512" rx="114" fill="url(#grad)"/>

  <!-- Subtle grid pattern -->
  <rect width="512" height="512" rx="114" fill="url(#grad)" opacity="0.8"/>

  <!-- "IQ" text -->
  <text
    x="256" y="310"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="220"
    font-weight="900"
    fill="white"
    text-anchor="middle"
    letter-spacing="-8"
  >IQ</text>

  <!-- Bottom accent line -->
  <rect x="156" y="360" width="200" height="8" rx="4" fill="rgba(255,255,255,0.4)"/>
</svg>
`;

// Maskable version — same but with more padding (20% safe zone)
const MASKABLE_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <!-- Full bleed background — maskable icons fill the whole square -->
  <rect width="512" height="512" fill="url(#grad)"/>
  <!-- Content scaled down to 60% to sit within safe zone -->
  <text
    x="256" y="295"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="170"
    font-weight="900"
    fill="white"
    text-anchor="middle"
    letter-spacing="-6"
  >IQ</text>
  <rect x="176" y="330" width="160" height="6" rx="3" fill="rgba(255,255,255,0.4)"/>
</svg>
`;

// ── Generate standard icons ───────────────────────────────────────────────────
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  console.log("Generating ExpenseIQ PWA icons...\n");

  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(BASE_SVG))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`  ✅ icon-${size}.png`);
  }

  // Maskable variants (192 and 512 only — spec requirement)
  for (const size of [192, 512]) {
    const outPath = path.join(OUT_DIR, `icon-maskable-${size}.png`);
    await sharp(Buffer.from(MASKABLE_SVG))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`  ✅ icon-maskable-${size}.png`);
  }

  // Badge icon for notifications (72x72, monochrome-friendly)
  await sharp(Buffer.from(BASE_SVG))
    .resize(72, 72)
    .png()
    .toFile(path.join(OUT_DIR, "..", "badge-72.png"));
  console.log(`  ✅ badge-72.png`);

  // Shortcut icons (simplified, 96x96)
  const shortcutBase = `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <rect width="96" height="96" rx="20" fill="url(#g)"/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
  `;

  const shortcuts = {
    "shortcut-add.png":   shortcutBase + `<text x="48" y="62" font-size="44" text-anchor="middle" fill="white" font-weight="900">+</text></svg>`,
    "shortcut-home.png":  shortcutBase + `<text x="48" y="58" font-size="36" text-anchor="middle" fill="white">🏠</text></svg>`,
    "shortcut-score.png": shortcutBase + `<text x="48" y="58" font-size="36" text-anchor="middle" fill="white">🏆</text></svg>`,
  };

  for (const [name, svg] of Object.entries(shortcuts)) {
    await sharp(Buffer.from(svg)).resize(96, 96).png().toFile(path.join(OUT_DIR, name));
    console.log(`  ✅ ${name}`);
  }

  // Notification action icons (mic + pencil, 72x72)
  const micSvg = `<svg width="72" height="72" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
    <rect width="24" height="24" rx="6" fill="#6366f1"/>
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>`;
  const penSvg = `<svg width="72" height="72" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#ec4899"/>
    <path fill="white" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>`;

  await sharp(Buffer.from(micSvg)).resize(72, 72).png().toFile(path.join(OUT_DIR, "mic.png"));
  await sharp(Buffer.from(penSvg)).resize(72, 72).png().toFile(path.join(OUT_DIR, "pencil.png"));
  console.log("  ✅ mic.png, pencil.png");

  console.log("\n✅ All icons generated in frontend/public/icons/");
  console.log("   Create screenshots/ folder manually for app store listing.");
}

generate().catch(console.error);
