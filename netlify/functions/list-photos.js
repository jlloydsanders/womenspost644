// netlify/functions/list-photos.js
// ─────────────────────────────────────────────────────────────────────────────
// Serverless function that scans the /images folder and returns a structured
// JSON manifest of all categories and photos found.
//
// The gallery page calls: /.netlify/functions/list-photos
// Response matches the same shape as photos.json so the gallery works
// identically — but with ZERO manual updates needed.
//
// To add a photo: just upload it to images/[category]/ on GitHub. Done.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

// Category display config — label, icon, color per folder name
const CATEGORY_META = {
  events:      { label: 'Events',      icon: '🎖️', color: '#1C2F5E' },
  community:   { label: 'Community',   icon: '🤝', color: '#1a5c35' },
  ceremonies:  { label: 'Ceremonies',  icon: '🇺🇸', color: '#8B0000' },
  members:     { label: 'Members',     icon: '👥', color: '#4a2070' },
  fundraisers: { label: 'Fundraisers', icon: '🎗️', color: '#0f5050' },
  awards:      { label: 'Awards',      icon: '⭐', color: '#7a5000' },
  remembrance: { label: 'Remembrance', icon: '🌺', color: '#333333' },
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

exports.handler = async () => {
  try {
    // Netlify deploys your repo to /var/task — images folder sits at root
    const imagesRoot = path.join(__dirname, '..', '..', 'images');

    if (!fs.existsSync(imagesRoot)) {
      return respond(200, { categories: [] });
    }

    const categories = [];

    // Read each subfolder as a category
    const folders = fs.readdirSync(imagesRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    for (const folderName of folders) {
      const folderPath = path.join(imagesRoot, folderName);
      const meta = CATEGORY_META[folderName] || {
        label: capitalize(folderName),
        icon:  '📷',
        color: '#1C2F5E',
      };

      // Collect image files, sorted alphabetically
      const photos = fs.readdirSync(folderPath)
        .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort()
        .map(filename => ({
          file:    filename,
          caption: toCaption(filename),
        }));

      if (photos.length > 0) {
        categories.push({ id: folderName, ...meta, photos });
      }
    }

    return respond(200, { categories });

  } catch (err) {
    console.error('list-photos error:', err);
    return respond(500, { error: 'Could not read image directory', detail: err.message });
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'public, max-age=60', // cache 60s
    },
    body: JSON.stringify(body),
  };
}

// "my-photo_name.jpg" → "My Photo Name"
function toCaption(filename) {
  return filename
    .replace(/\.[^.]+$/, '')          // remove extension
    .replace(/[-_]/g, ' ')            // dashes/underscores → spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
