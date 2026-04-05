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
  try {
    const { id } = req.params;
    
    // 1. Fetch Playlist Data
    const playlist = await Playlist.findById(id).populate('owner', 'username');
    
    // If playlist doesn't exist, we fallback to standard SPA behavior (or send index.html as is)
    if (!playlist) {
        return serveStaticIndex(res);
    }

    // 2. Determine Preview Image (First song's album art)
    let imageUrl = 'https://the-ultimate-songs-webapp-harsh-patel.vercel.app/logo3.jpg'; // Fallback
    if (playlist.songs && playlist.songs.length > 0) {
      try {
        const songId = playlist.songs[0];
        const response = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json&_marker=0&api_version=4&ctx=web6dot0`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const songData = await response.json();
        
        // Extract high-res image if available
        if (songData && songData[songId]) {
            const song = songData[songId];
            imageUrl = song.image?.replace('150x150', '500x500') || imageUrl;
        }
      } catch (err) {
        console.error('Error fetching song meta for OG:', err);
      }
    }

    // 3. Prepare Metadata Strings
    const title = `${playlist.name} | THE ULTIMATE SONGS`;
    const description = `Listen to "${playlist.name}" curated by ${playlist.owner?.username || 'a User'}. Featuring ${playlist.songs?.length || 0} tracks. ${playlist.description || 'Explore this premium music collection on THE ULTIMATE SONGS.'}`;
    const siteUrl = `https://the-ultimate-songs-webapp-harsh-patel.vercel.app/${req.params.username}/${id}`;

    // 4. Inject into index.html
    const indexPath = path.join(__dirname, '..', '..', 'index.html');
    if (!fs.existsSync(indexPath)) {
        return res.status(404).send('index.html not found.');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Robust injection: replace existing tags or add if missing
    // We target the tags we just updated in the previous turn
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="description" content=".*?" \/>|<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
    
    // OG Tags
    html = html.replace(/<meta property="og:title" content=".*?" \/>|<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>|<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta property="og:image" content=".*?" \/>|<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${imageUrl}">`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>|<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${siteUrl}">`);

    // Twitter Tags
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>|<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`);
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>|<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${description}">`);
    html = html.replace(/<meta name="twitter:image" content=".*?" \/>|<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${imageUrl}">`);

    // Add og:image if it was completely missing (just in case)
    if (!html.includes('og:image')) {
        html = html.replace('</head>', `<meta property="og:image" content="${imageUrl}">\n    <meta name="twitter:image" content="${imageUrl}">\n    </head>`);
    }

    res.send(html);
  } catch (error) {
    console.error('Meta rendering error:', error);
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
