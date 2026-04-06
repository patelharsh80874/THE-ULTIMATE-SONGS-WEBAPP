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
  
  // Base URLs from .env (VITE_API_BASE_URL is loaded from root .env)
  const frontendUrl = process.env.FRONTEND_URL || 'https://the-ultimate-songs-webapp-harsh-patel.vercel.app';
  const saavnApiUrl = process.env.VITE_API_BASE_URL;

  if (!saavnApiUrl) {
    console.error("[Meta] CRITICAL: VITE_API_BASE_URL is missing in .env");
    return serveStaticIndex(res);
  }

  try {
    // 1. Fetch Playlist Data from DB
    const playlist = await Playlist.findById(id).populate('owner', 'username');
    
    if (!playlist) {
        console.log(`[Meta] Playlist ${id} not found, serving static index.`);
        return serveStaticIndex(res);
    }

    // 2. Determine Preview Image (First song's album art)
    let imageUrl = `${frontendUrl}/logo3.jpg`;
    if (playlist.songs && playlist.songs.length > 0) {
      try {
        const songId = playlist.songs[0];
        // Using SAAVN_API_URL from .env
        const songResponse = await fetch(`${saavnApiUrl}/songs?ids=${songId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const songData = await songResponse.json();
        
        if (songData && songData.data && songData.data.length > 0) {
            const song = songData.data[0];
            // Get highest resolution image
            imageUrl = song.image?.[song.image.length - 1]?.url || song.image?.[2]?.url || imageUrl;
        }
      } catch (err) {
        console.error(`[Meta] Image Fetch failed for song ${playlist.songs[0]}:`, err.message);
      }
    }

    // 3. Prepare Metadata Strings (Dynamic Creator Info)
    const ownerName = playlist.owner?.username || 'User';
    const songCount = playlist.songs?.length || 0;
    const title = `"${playlist.name}" | curated by ${ownerName}`;
    const description = `Listen to "${playlist.name}" by ${ownerName} • ${songCount} Tracks. High-fidelity streaming curated by ${ownerName} on THE ULTIMATE SONGS.`;
    const shareUrl = `${frontendUrl}/${username}/${id}`;
    const profileUrl = `${frontendUrl}/profile/${username}`;

    // 4. Inject into index.html
    const indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    if (!fs.existsSync(indexPath)) {
        return res.status(404).send('index.html missing.');
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    /**
     * Replaces or Injects a meta tag into the HTML head
     */
    const updateMetaTag = (htmlContent, property, content, attr = 'property') => {
        const regex = new RegExp(`<meta\\s+(?:${attr}=["']${property}["']\\s+content=["'].*?["']|content=["'].*?["']\\s+${attr}=["']${property}["'])\\s*/?>`, 'i');
        const newTag = `<meta ${attr}="${property}" content="${content}" />`;
        return regex.test(htmlContent) 
            ? htmlContent.replace(regex, newTag) 
            : htmlContent.replace('</head>', `  ${newTag}\n  </head>`);
    };

    // Update Title & Core Headers
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    html = updateMetaTag(html, 'description', description, 'name');
    html = updateMetaTag(html, 'author', ownerName, 'name');
    html = updateMetaTag(html, 'creator', ownerName, 'name');
    html = updateMetaTag(html, 'developer', `${ownerName} (${profileUrl})`, 'name');
    html = updateMetaTag(html, 'designer', ownerName, 'name');
    
    // Update Author Link
    const authorLinkRegex = /<link\s+rel=["']author["']\s+href=["'].*?["']\s*\/?>/i;
    const newAuthorLink = `<link rel="author" href="${profileUrl}" />`;
    html = authorLinkRegex.test(html) ? html.replace(authorLinkRegex, newAuthorLink) : html.replace('</head>', `  ${newAuthorLink}\n  </head>`);

    // OG Tags (Social Discovery)
    html = updateMetaTag(html, 'og:title', title);
    html = updateMetaTag(html, 'og:description', description);
    html = updateMetaTag(html, 'og:image', imageUrl);
    html = updateMetaTag(html, 'og:url', shareUrl);
    html = updateMetaTag(html, 'og:type', 'music.playlist');
    html = updateMetaTag(html, 'og:site_name', 'THE ULTIMATE SONGS');
    
    // Music Specific Tags
    html = updateMetaTag(html, 'music:song_count', songCount.toString());
    html = updateMetaTag(html, 'music:creator', profileUrl);

    // Twitter Social Sync
    html = updateMetaTag(html, 'twitter:card', 'summary_large_image', 'name');
    html = updateMetaTag(html, 'twitter:title', title, 'name');
    html = updateMetaTag(html, 'twitter:description', description, 'name');
    html = updateMetaTag(html, 'twitter:image', imageUrl, 'name');

    // Final result
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error(`[Meta] Render Error for ${id}:`, error);
    serveStaticIndex(res);
  }
};

const serveStaticIndex = (res) => {
    const indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Not Found');
};
