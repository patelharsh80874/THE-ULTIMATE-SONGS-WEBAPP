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
  
  // Base URLs (Always absolute for crawlers)
  const frontendUrl = process.env.FRONTEND_URL || 'https://the-ultimate-songs-webapp-harsh-patel.vercel.app';
  const saavnApiUrl = process.env.VITE_API_BASE_URL;

  try {
    // 1. Fetch Playlist Data
    const playlist = await Playlist.findById(id).populate('owner', 'username');
    
    if (!playlist) {
        console.log(`[Meta] 404: Playlist ${id} not found.`);
        return serveStaticIndex(res);
    }

    // 2. Determine Preview Image
    let imageUrl = `${frontendUrl}/logo3.jpg`; // Default
    if (playlist.songs && playlist.songs.length > 0) {
      try {
        const songId = playlist.songs[0];
        const apiUrl = `${saavnApiUrl}/songs?ids=${songId}`;
        
        const response = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const songData = await response.json();
        
        if (songData?.data?.length > 0) {
            const song = songData.data[0];
            const rawImage = song.image?.[song.image.length - 1]?.url || song.image?.[2]?.url || imageUrl;
            
            // Normalize Protocol
            if (rawImage.startsWith('//')) imageUrl = `https:${rawImage}`;
            else if (rawImage.startsWith('http:')) imageUrl = rawImage.replace('http:', 'https:');
            else imageUrl = rawImage;

            console.log(`[Meta] Extracted Image for ${id}: ${imageUrl}`);
        } else {
            console.warn(`[Meta] No song data for ${songId} at ${apiUrl}`);
        }
      } catch (err) {
        console.error(`[Meta] API Error for ${id}:`, err.message);
      }
    }

    // 3. Prepare Metadata
    const ownerName = playlist.owner?.username || 'User';
    const songCount = playlist.songs?.length || 0;
    const siteTitle = `"${playlist.name}" | THE ULTIMATE SONGS`;
    const shareDescription = `Listen to "${playlist.name}" by ${ownerName} • ${songCount} Tracks. High-fidelity streaming curated by ${ownerName} on THE ULTIMATE SONGS.`;
    const shareUrl = `${frontendUrl}/${username}/${id}`;
    const profileUrl = `${frontendUrl}/profile/${username}`;

    // 4. Inject into index.html
    let indexPath = path.resolve(__dirname, '..', '..', 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
        indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    }
    if (!fs.existsSync(indexPath)) return res.status(404).send('index.html missing.');

    let html = fs.readFileSync(indexPath, 'utf8');

    /**
     * Highly Resilient Tag Update
     */
    const injectMeta = (htmlContent, property, content, attr = 'property') => {
        // Regex to find existing tag
        const regex = new RegExp(`<meta\\s+(?:${attr}=["']${property}["']\\s+content=["'].*?["']|content=["'].*?["']\\s+${attr}=["']${property}["'])\\s*/?>`, 'i');
        const tag = `<meta ${attr}="${property}" content="${content}" />`;
        
        return regex.test(htmlContent) 
            ? htmlContent.replace(regex, tag) 
            : htmlContent.replace('</head>', `  ${tag}\n  </head>`);
    };

    // Global Overrides
    html = html.replace(/<title>.*?<\/title>/gi, `<title>${siteTitle}</title>`);
    html = injectMeta(html, 'description', shareDescription, 'name');
    html = injectMeta(html, 'author', ownerName, 'name');
    
    // Open Graph (Standard)
    html = injectMeta(html, 'og:title', siteTitle);
    html = injectMeta(html, 'og:description', shareDescription);
    html = injectMeta(html, 'og:url', shareUrl);
    html = injectMeta(html, 'og:type', 'website');
    html = injectMeta(html, 'og:site_name', 'THE ULTIMATE SONGS');
    
    // Image Meta (Secure + Sizing)
    html = injectMeta(html, 'og:image', imageUrl);
    html = injectMeta(html, 'og:image:secure_url', imageUrl);
    html = injectMeta(html, 'og:image:width', '500');
    html = injectMeta(html, 'og:image:height', '500');
    html = injectMeta(html, 'og:image:alt', `Cover art for ${playlist.name}`);
    
    // Music Extensions
    html = injectMeta(html, 'music:song_count', songCount.toString());
    html = injectMeta(html, 'music:creator', profileUrl);

    // Twitter Specifics
    html = injectMeta(html, 'twitter:card', 'summary_large_image', 'name');
    html = injectMeta(html, 'twitter:title', siteTitle, 'name');
    html = injectMeta(html, 'twitter:description', shareDescription, 'name');
    html = injectMeta(html, 'twitter:image', imageUrl, 'name');
    html = injectMeta(html, 'twitter:image:src', imageUrl, 'name');

    res.contentType('text/html').send(html);
  } catch (error) {
    console.error(`[Meta] Critical Failure for ${id}:`, error);
    serveStaticIndex(res);
  }
};

const serveStaticIndex = (res) => {
    let indexPath = path.resolve(__dirname, '..', '..', 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) {
        indexPath = path.resolve(__dirname, '..', '..', 'index.html');
    }
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Not Found');
};
