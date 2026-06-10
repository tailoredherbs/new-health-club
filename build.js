const fs = require('fs');
const path = require('path');

function parseMarkdown(content, filename) {
  const id = filename.replace('.md', '');
  const fm = {};
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    const lines = match[1].split('\n');
    let currentKey = null;
    let currentVal = [];
    lines.forEach(line => {
      const keyMatch = line.match(/^([a-zA-Z_]+):\s?"?(.*?)"?\s*$/);
      if (keyMatch) {
        if (currentKey) fm[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
        currentKey = keyMatch[1].trim();
        currentVal = [keyMatch[2].trim()];
      } else if (currentKey && line.trim()) {
        currentVal.push(line.trim());
      }
    });
    if (currentKey) fm[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
    fm.body = match[2].trim();
  }
  return { id, ...fm };
}

// Build signals
const signalsDir = path.join(__dirname, '_signals');
let signals = [];
if (fs.existsSync(signalsDir)) {
  signals = fs.readdirSync(signalsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => parseMarkdown(fs.readFileSync(path.join(signalsDir, f), 'utf8'), f))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Build reports — include body so report page can render full content
const reportsDir = path.join(__dirname, '_reports');
let reports = [];
if (fs.existsSync(reportsDir)) {
  reports = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fm = parseMarkdown(fs.readFileSync(path.join(reportsDir, f), 'utf8'), f);
      return {
        id: fm.id,
        title: fm.title || '',
        type: fm.type || '',
        theme: fm.theme || '',
        date: fm.date || '',
        readTime: fm.readTime || '',
        tag: fm.tag || '',
        location: fm.location || '',
        description: fm.description || '',
        body: fm.body || '',
        image: fm.image || ''
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Build spaces — venue index for the map (markdown -> spaces-data.json)
const spacesDir = path.join(__dirname, '_spaces');
let spaces = [];
if (fs.existsSync(spacesDir)) {
  const CATEGORY_ORDER = ['Longevity Sanctuaries', 'Execution Hubs', 'Practitioner-Led Boutiques', 'Retreats', 'Clubs'];
  spaces = fs.readdirSync(spacesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fm = parseMarkdown(fs.readFileSync(path.join(spacesDir, f), 'utf8'), f);
      return {
        id: fm.id,
        name: fm.title || '',
        area: fm.area || '',
        region: fm.region || '',
        category: fm.category || '',
        primaryType: fm.primaryType || '',
        status: fm.status || '',
        coordinates: { lat: parseFloat(fm.lat), lng: parseFloat(fm.lng) },
        bestFor: (fm.bestFor || '').split(',').map(s => s.trim()).filter(Boolean),
        tags: (fm.tags || '').split(',').map(s => s.trim()).filter(Boolean),
        note: fm.body || '',
        links: { website: fm.website || '', instagram: fm.instagram || '' }
      };
    })
    .filter(s => !isNaN(s.coordinates.lat) && !isNaN(s.coordinates.lng))
    .sort((a, b) => {
      const c = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      return c !== 0 ? c : a.name.localeCompare(b.name);
    });
}

fs.writeFileSync('signals-data.json', JSON.stringify(signals, null, 2));
fs.writeFileSync('reports-data.json', JSON.stringify(reports, null, 2));
fs.writeFileSync('spaces-data.json', JSON.stringify(spaces, null, 2));

console.log(`Built ${signals.length} signals, ${reports.length} reports, ${spaces.length} spaces`);
