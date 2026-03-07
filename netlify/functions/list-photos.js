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

const IMAGE_EXTENSIONS = new Set(['.jpg','.jpeg','.png','.gif','.webp']);

exports.handler = async () => {
  // __dirname = /var/task (which is netlify/functions/ at runtime)
  // So we walk UP from __dirname to find the repo root where images/ lives:
  //   __dirname         = .../netlify/functions
  //   one up            = .../netlify
  //   two up            = repo root  <-- images/ should be here
  const repoRoot = path.resolve(__dirname, '..', '..');

  // Build candidate list — repo root first, then any subfolders inside it
  const candidatePaths = [
    path.join(repoRoot, 'images'),
  ];

  // Also check one level deeper in case files are in a subfolder
  try {
    fs.readdirSync(repoRoot, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'netlify')
      .forEach(d => candidatePaths.push(path.join(repoRoot, d.name, 'images')));
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

  // Debug info
  let rootContents = [];
  try { rootContents = fs.readdirSync(repoRoot); } catch (_) {}

  console.log('__dirname  :', __dirname);
  console.log('repoRoot   :', repoRoot);
  console.log('rootContents:', rootContents);
  console.log('imagesRoot :', imagesRoot);

  if (!imagesRoot) {
    return respond(200, {
      categories: [],
      _debug: {
        dirname: __dirname,
        repoRoot,
        rootContents,
        tried: candidatePaths,
        message: 'images/ folder not found'
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
      const meta = CATEGORY_META[folderName] || {
        label: folderName.charAt(0).toUpperCase() + folderName.slice(1),
        icon:  '📷',
        color: '#1C2F5E',
      };

      const photos = fs.readdirSync(path.join(imagesRoot, folderName))
        .filter(f => !f.startsWith('.') && IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort()
        .map(filename => ({
          file:    filename,
          caption: filename
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
        }));

      if (photos.length > 0) {
        categories.push({ id: folderName, ...meta, photos });
      }
    }

    console.log(`Returning ${categories.length} categories`);
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
