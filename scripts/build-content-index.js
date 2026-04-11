// build-content-index.js
// Runs at Netlify build time. Reads all CMS markdown files and
// outputs /public/content-index.json so the site can load content.

var fs = require('fs');
var path = require('path');

function parseFrontmatter(fileContent) {
  var result = {};
  var lines = fileContent.split('\n');
  var inFrontmatter = false;
  var bodyLines = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (i === 0 && line.trim() === '---') { inFrontmatter = true; continue; }
    if (inFrontmatter && line.trim() === '---') { inFrontmatter = false; continue; }
    if (inFrontmatter) {
      var colonIdx = line.indexOf(':');
      if (colonIdx > -1) {
        var key = line.substring(0, colonIdx).trim();
        var val = line.substring(colonIdx + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    } else {
      bodyLines.push(line);
    }
  }
  result._body = bodyLines.join('\n').trim();
  return result;
}

function loadCollection(collectionName) {
  var dir = path.join(__dirname, '..', 'content', collectionName);
  var items = [];
  if (!fs.existsSync(dir)) return items;
  var files = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.md'); });
  files.forEach(function(file) {
    try {
      var content = fs.readFileSync(path.join(dir, file), 'utf8');
      var data = parseFrontmatter(content);
      items.push(data);
    } catch(e) {
      console.warn('Could not parse:', file, e.message);
    }
  });
  return items;
}

function loadSettings() {
  var file = path.join(__dirname, '..', 'content', 'settings', 'post-info.json');
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch(e) { return {}; }
}

var index = {
  photos:      loadCollection('photos'),
  minutes:     loadCollection('minutes'),
  newsletters: loadCollection('newsletters'),
  events:      loadCollection('events'),
  news:        loadCollection('news'),
  settings:    loadSettings(),
  generated:   new Date().toISOString()
};

var outPath = path.join(__dirname, '..', 'public', 'content-index.json');
fs.writeFileSync(outPath, JSON.stringify(index, null, 2));
console.log('content-index.json generated:',
  index.photos.length, 'photos,',
  index.minutes.length, 'minutes,',
  index.newsletters.length, 'newsletters,',
  index.events.length, 'events,',
  index.news.length, 'news items'
);
