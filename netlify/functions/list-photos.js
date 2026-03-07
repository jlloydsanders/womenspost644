// netlify/functions/list-photos.js
const fs   = require('fs');
const path = require('path');

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
  // Netlify sets cwd to /var/task (repo root)
  // Try every likely location for the images folder
  const candidatePaths = [
    path.join(process.cwd(), 'images'),                        // repo root  /var/task/images
    path.join(process.cwd(), 'post644-multipage', 'images'),   // subfolder  /var/task/post644-multipage/images
    '/var/task/images',                                         // absolute fallback
  ];

  // Also auto-scan for any subfolder that contains an images/ directory
  try {
    const topLevel = fs.readdirSync(process.cwd(), { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('netlify'))
      .map(d => path.join(process.cwd(), d.name, 'images'));
    candidatePaths.push(...topLevel);
  } catch (_) {}

  let imagesRoot = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        imagesRoot = p;
        break;
      }
    } catch (_) {}
  }

  // Log repo root contents to help diagnose structure
  let rootContents = [];
  try { rootContents = fs.readdirSync(process.cwd()); } catch (_) {}

  console.log('cwd:', process.cwd());
  console.log('repo root contents:', rootContents);
  console.log('imagesRoot resolved:', imagesRoot);

  if (!imagesRoot) {
    return respond(200, {
      categories: [],
      _debug: {
        cwd: process.cwd(),
        rootContents,
        tried: candidatePaths,
        message: 'images/ folder not found — check repo structure above'
      }
    });
  }

  try {
    const categories = [];

    const folders = fs.readdirSync(imagesRoot, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'))
      .map(d => d.name)
      .sort();

    for (const folderName of folders) {
      const folderPath = path.join(imagesRoot, folderName);
      const meta = CATEGORY_META[folderName] || {
        label: folderName.charAt(0).toUpperCase() + folderName.slice(1),
        icon:  '📷',
        color: '#1C2F5E',
      };

      const photos = fs.readdirSync(folderPath)
        .filter(f => !f.startsWith('.') && IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort()
        .map(filename => ({
          file: filename,
          caption: filename
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
        }));

      if (photos.length > 0) {
        categories.push({ id: folderName, ...meta, photos });
      }
    }

    console.log(`Found ${categories.length} categories`);
    return respond(200, { categories });

  } catch (err) {
    console.error('Scan error:', err.message);
    return respond(500, { error: err.message, categories: [] });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'no-cache',
    },
    body: JSON.stringify(body),
  };
}
