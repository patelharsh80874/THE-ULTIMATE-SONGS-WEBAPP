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
    // 1. Fetch Playlist Data from DB
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
        // Using the more reliable endpoint as seen in the frontend hydration (roan API is better)
        const songResponse = await fetch(`https://jiosaavn-roan.vercel.app/api/songs?ids=${songId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const songData = await songResponse.json();
        
        if (songData && songData.data && songData.data.length > 0) {
            const song = songData.data[0];
            // Get highest resolution image (usually the last index in the image array)
            imageUrl = song.image?.[song.image.length - 1]?.url || song.image?.[2]?.url || imageUrl;
        } else {
            console.warn(`[Meta] Fallback: No song data found for ID ${songId}. Use static logo.`);
        }
      } catch (err) {
        console.error(`[Meta] Image Fetch failed for song in ${id}:`, err.message);
      }
    }

    // 3. Prepare Metadata Strings
    const ownerName = playlist.owner?.username || 'User';
    const songCount = playlist.songs?.length || 0;
    const title = `${playlist.name} | THE ULTIMATE SONGS`;
    const description = `Check out "${playlist.name}" by ${ownerName} • ${songCount} Tracks. High-fidelity streaming only on THE ULTIMATE SONGS.`;
    const siteUrl = `https://the-ultimate-songs-webapp-harsh-patel.vercel.app/${username}/${id}`;

    // 4. Inject into index.html
    const indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    if (!fs.existsSync(indexPath)) {
        console.error(`[Meta] index.html not found at ${indexPath}`);
        return res.status(404).send('index.html not found.');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    /**
     * Replaces or Injects a meta tag into the HTML head
     */
    const updateMetaTag = (htmlContent, property, content, attr = 'property') => {
        const regex = new RegExp(`<meta\\s+(?:${attr}=["']${property}["']\\s+content=["'].*?["']|content=["'].*?["']\\s+${attr}=["']${property}["'])\\s*/?>`, 'i');
        const newTag = `<meta ${attr}="${property}" content="${content}" />`;
        
        if (regex.test(htmlContent)) {
            return htmlContent.replace(regex, newTag);
        } else {
            // Inject if missing (before </head>)
            return htmlContent.replace('</head>', `  ${newTag}\n  </head>`);
        }
    };

    // Update Title
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    
    // Update Meta Description
    html = updateMetaTag(html, 'description', description, 'name');
    
    // OG Tags
    html = updateMetaTag(html, 'og:title', title);
    html = updateMetaTag(html, 'og:description', description);
    html = updateMetaTag(html, 'og:image', imageUrl);
    html = updateMetaTag(html, 'og:url', siteUrl);
    html = updateMetaTag(html, 'og:type', 'music.playlist');

    // Twitter Tags
    html = updateMetaTag(html, 'twitter:card', 'summary_large_image', 'name');
    html = updateMetaTag(html, 'twitter:title', title, 'name');
    html = updateMetaTag(html, 'twitter:description', description, 'name');
    html = updateMetaTag(html, 'twitter:image', imageUrl, 'name');

    // Final result
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error(`[Meta] Global Render Error for ${id}:`, error);
    serveStaticIndex(res);
  }
};

const serveStaticIndex = (res) => {
    const indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('index.html missing.');
    }
};
