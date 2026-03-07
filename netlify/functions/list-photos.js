// netlify/functions/list-photos.js
// Uses the GitHub API to list images — works regardless of Netlify's
// filesystem bundling. No token needed for public repos.

const GITHUB_USER = 'jlloydsanders';
const GITHUB_REPO = 'womenspost644';
const IMAGES_PATH = 'images';  // folder in repo root

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

const BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

async function ghFetch(urlPath) {
  const res = await fetch(`${BASE}/${urlPath}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'post644-gallery' }
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${urlPath}`);
  return res.json();
}

function toCaption(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

exports.handler = async () => {
  try {
    // 1. List all category folders inside images/
    const topLevel = await ghFetch(IMAGES_PATH);
    const folders  = topLevel.filter(item => item.type === 'dir');

    const categories = [];

    // 2. For each folder, list its image files
    await Promise.all(folders.map(async folder => {
      const folderName = folder.name;
      const meta = CATEGORY_META[folderName] || {
        label: folderName.charAt(0).toUpperCase() + folderName.slice(1),
        icon:  '📷',
        color: '#1C2F5E',
      };

      const contents = await ghFetch(`${IMAGES_PATH}/${folderName}`);
      const photos = contents
        .filter(f => f.type === 'file' && IMAGE_EXTENSIONS.has(
          f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
        ))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(f => ({
          file:    f.name,
          caption: toCaption(f.name),
        }));

      if (photos.length > 0) {
        categories.push({ id: folderName, ...meta, photos });
      }
    }));

    // Sort categories by defined order
    const order = Object.keys(CATEGORY_META);
    categories.sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return respond(200, { categories });

  } catch (err) {
    console.error('list-photos error:', err.message);
    return respond(500, { error: err.message, categories: [] });
  }
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control':               'public, max-age=300', // cache 5 mins
    },
    body: JSON.stringify(body),
  };
}
