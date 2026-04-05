import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import Playlist from '../models/Playlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller to render the SPA index.html with dynamic Open Graph metadata
 */
export const renderDynamicMeta = async (req, res) => {
  const { id, username } = req.params;
  
  try {
    // 1. Fetch Playlist Data
    const playlist = await Playlist.findById(id).populate('owner', 'username');
    
    if (!playlist) {
        console.log(`[Meta] Playlist ${id} not found, serving static index.`);
        return serveStaticIndex(res);
    }

    // 2. Determine Preview Image (First song's album art)
    let imageUrl = 'https://the-ultimate-songs-webapp-harsh-patel.vercel.app/logo3.jpg';
    if (playlist.songs && playlist.songs.length > 0) {
      try {
        const songId = playlist.songs[0];
        // Using the same reliable endpoint as seen in the frontend hydration
        const songResponse = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0&api_version=4&ctx=web6dot0`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const songData = await songResponse.json();
        
        if (songData && songData[songId]) {
            const song = songData[songId];
            // Extract high-res image (500x500)
            imageUrl = song.image?.replace('150x150', '500x500') || imageUrl;
        }
      } catch (err) {
        console.error(`[Meta] Image Fetch failed for song in ${id}:`, err.message);
      }
    }

    // 3. Prepare Metadata Strings
    const ownerName = playlist.owner?.username || 'User';
    const songCount = playlist.songs?.length || 0;
    const title = `${playlist.name} | THE ULTIMATE SONGS`;
    const description = `Check out "${playlist.name}" curated by ${ownerName} • ${songCount} Tracks. High-fidelity streaming only on THE ULTIMATE SONGS.`;
    const siteUrl = `https://the-ultimate-songs-webapp-harsh-patel.vercel.app/${username}/${id}`;

    // 4. Inject into index.html
    const indexPath = path.join(__dirname, '..', '..', 'index.html');
    if (!fs.existsSync(indexPath)) {
        return res.status(404).send('index.html not found.');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // REGEX: Flexible matching for both self-closing (/>) and standard (>) tags
    const replaceTag = (htmlContent, propertyName, newValue, type = 'property') => {
        const attr = type === 'property' ? 'property' : 'name';
        const regex = new RegExp(`<meta\\s+${attr}=["']${propertyName}["']\\s+content=["'].*?["']\\s*\/?>`, 'gi');
        return htmlContent.replace(regex, `<meta ${attr}="${propertyName}" content="${newValue}" />`);
    };

    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    html = replaceTag(html, 'description', description, 'name');
    
    // OG Tags
    html = replaceTag(html, 'og:title', title);
    html = replaceTag(html, 'og:description', description);
    html = replaceTag(html, 'og:image', imageUrl);
    html = replaceTag(html, 'og:url', siteUrl);

    // Twitter Tags
    html = replaceTag(html, 'twitter:title', title, 'name');
    html = replaceTag(html, 'twitter:description', description, 'name');
    html = replaceTag(html, 'twitter:image', imageUrl, 'name');

    // Final sanity check for Vercel: If the regex missed for some reason, we force inject og:image
    if (!html.toLowerCase().includes('og:image')) {
        html = html.replace('</head>', `<meta property="og:image" content="${imageUrl}" />\n</head>`);
    }

    res.contentType('text/html').send(html);
  } catch (error) {
    console.error(`[Meta] Global Render Error for ${id}:`, error);
    serveStaticIndex(res);
  }
};

const serveStaticIndex = (res) => {
    const indexPath = path.join(__dirname, '..', '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built yet.');
    }
};
