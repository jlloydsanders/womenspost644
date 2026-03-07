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
  // Netlify deploys site files to /var/task
  // Try multiple candidate paths to find the images folder
  const candidatePaths = [
    '/var/task/images',
    path.join(__dirname, '..', '..', 'images'),
    path.join(process.cwd(), 'images'),
  ];

  let imagesRoot = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        imagesRoot = p;
        break;
      }
    } catch (_) {}
  }

  // Always log for debugging in Netlify function logs
  console.log('__dirname:', __dirname);
  console.log('cwd:', process.cwd());
  console.log('imagesRoot resolved:', imagesRoot);
  console.log('candidates tried:', candidatePaths);

  if (!imagesRoot) {
    return respond(200, {
      categories: [],
      _debug: { tried: candidatePaths, dirname: __dirname, cwd: process.cwd() }
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

    console.log(`Returning ${categories.length} categories with photos`);
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
