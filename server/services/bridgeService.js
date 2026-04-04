import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
import stringSimilarity from 'string-similarity';
import YouTubeSR from 'youtube-sr';
const YouTube = YouTubeSR.YouTube || YouTubeSR;

import yts from 'yt-search';

const { getTracks, getData } = spotifyUrlInfo(fetch);

/**
 * Utility to clean song titles for better matching
 */
const cleanTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/\(feat\..*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/- .*?(remastered|edit|version|mix|original|deluxe|expanded|soundtrack|official video|lyric video|music video)/gi, '')
    .replace(/\b(Lyrical|Audio|Video|Official|Full Song|Film Version|HD|4K|720p)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Checks if a string looks like a music label channel instead of an artist
 */
const isMusicLabel = (name) => {
    const labels = ['music', 'records', 't-series', 'tseries', 'saregama', 'sony', 'zee', 'tips', 'venus', 'official', 'production', 'channel', 'vevo'];
    const lower = name.toLowerCase();
    return labels.some(label => lower.includes(label));
};

/**
 * Intelligently parse YouTube titles for Mixes to find potential Song Name and Artists
 */
const parseYouTubeMetadata = (title, channelName) => {
    let songTitle = title;
    let potentialArtists = [];

    // Clean title from common suffixes first
    let cleanedMainTitle = title.replace(/\b(Lyrical|Audio|Video|Official|Full Song|Film Version|HD|4K|720p)\b/gi, '').trim();

    // Split by common separators: | , - , : , – (en dash), — (em dash)
    const parts = cleanedMainTitle.split(/[|:\-–—]/).map(p => p.trim());
    
    if (parts.length > 1) {
        songTitle = parts[0];
        // The other parts usually contain artists or album names
        potentialArtists = parts.slice(1).flatMap(p => 
            p.replace(/\(.*?\)/g, '') // remove (Prod. by ...)
             .split(/[,&/]|(feat\.)|(ft\.)/i)
             .map(a => a ? a.trim() : '')
             .filter(a => a && a.length > 1)
        );
    }

    if (!isMusicLabel(channelName)) potentialArtists.push(channelName);

    // Filter out common noise
    potentialArtists = potentialArtists.filter(a => 
        a.length > 2 && 
        !isMusicLabel(a) && 
        !/^(prod|music|directed|starring|singer|composed|lyrics)/i.test(a) &&
        !/^[0-9]+$/.test(a) && 
        !/^[^\w\s]+$/.test(a)
    );

    return {
        title: cleanTitle(songTitle),
        artists: potentialArtists,
        rawTitle: cleanedMainTitle,
        allParts: parts
    };
};

/**
 * Specialized Matcher for YouTube Mixes
 */
const findJioSaavnMatchForMix = async (title, artistsArray = [], rawTitle = "", allParts = []) => {
    const cleanedTitle = cleanTitle(title);
    const primaryArtist = artistsArray[0] || '';
    
    // Create more aggressive search tiers
    let searchTiers = [
        `${cleanedTitle} ${primaryArtist}`, // "Song Artist"
        allParts.length > 1 ? `${allParts[0]} ${allParts[1]}` : '', // "Part1 Part2" (Common for Song | Movie)
        cleanedTitle, // "Song"
        rawTitle.substring(0, 100).replace(/[|:\-–—]/g, ' '), // "Full Title"
    ].filter(q => q && q.trim().length > 2);

    // Deduplicate tiers
    searchTiers = [...new Set(searchTiers)];

    let results = [];
    for (const query of searchTiers) {
        try {
            const res = await fetch(`https://jiosaavn-roan.vercel.app/api/search/songs?query=${encodeURIComponent(query)}&limit=10`);
            const data = await res.json();
            const batch = data?.data?.results || [];
            results = [...results, ...batch];
            if (results.length >= 10) break;
        } catch (err) {}
    }

    if (results.length === 0) return null;

    // Deduplicate results by ID
    const uniqueResults = Array.from(new Map(results.map(r => [r.id, r])).values());

    const scoredResults = uniqueResults.map(res => {
        const resTitle = cleanTitle(res.name || '');
        const resArtistsAll = (res.artists?.all || []).map(a => a.name.toLowerCase());
        const resAlbum = cleanTitle(res.album?.name || '');
        
        // 1. Title Similarity
        const titleSim = stringSimilarity.compareTwoStrings(cleanedTitle.toLowerCase(), resTitle.toLowerCase());
        
        // 2. Cross-Intersection Check
        // Try to find if JioSaavn result name exists anywhere in the raw YouTube title
        const rawTitleLower = rawTitle.toLowerCase();
        const isInRawTitle = rawTitleLower.includes(resTitle.toLowerCase());
        
        // 3. Artist match
        const artistInTitleIntersect = resArtistsAll.some(ra => 
            rawTitleLower.includes(ra) || cleanedTitle.toLowerCase().includes(ra)
        );

        let confidence = (titleSim * 0.5);
        if (artistInTitleIntersect) confidence += 0.4;
        if (isInRawTitle && titleSim < 0.5) confidence += 0.3; // Boost if name matches but similarity is low due to extra text

        // Check if album matches any parts
        if (allParts.some(p => cleanTitle(p).includes(resAlbum) || resAlbum.includes(cleanTitle(p)))) {
            confidence += 0.1;
        }

        return { data: res, confidence };
    });

    scoredResults.sort((a, b) => b.confidence - a.confidence);
    const best = scoredResults[0];
    
    // For Mixes, we can be slightly more lenient if it's the only result
    if (best.confidence < 0.35) return null;

    return {
        id: best.data.id,
        name: best.data.name,
        artist: best.data.artists?.primary?.[0]?.name || best.data.artists?.all?.[0]?.name,
        album: best.data.album?.name,
        image: best.data.image?.[1]?.url || best.data.image?.[2]?.url,
        confidence: Math.min(100, Math.round(best.confidence * 100))
    };
};

/**
 * Original Common Matcher Logic (For Spotify/Standard YT)
 */
const findJioSaavnMatch = async (title, artistRaw) => {
    const spotifyArtistsArray = artistRaw.split(/[&,]/).map(a => a.trim());
    const primarySpotifyArtist = spotifyArtistsArray[0];
    const cleanedSpotifyTitle = cleanTitle(title);
    
    // --- Tiered Search Strategy ---
    let results = [];
    
    // Tier 1: Title + Full Artist String
    const tier1Query = encodeURIComponent(`${cleanedSpotifyTitle} ${artistRaw}`);
    const res1 = await fetch(`https://jiosaavn-roan.vercel.app/api/search/songs?query=${tier1Query}&limit=10`);
    const data1 = await res1.json();
    results = data1?.data?.results || [];

    // Tier 2: Title + Primary Artist
    if (results.length === 0) {
      const tier2Query = encodeURIComponent(`${cleanedSpotifyTitle} ${primarySpotifyArtist}`);
      const res2 = await fetch(`https://jiosaavn-roan.vercel.app/api/search/songs?query=${tier2Query}&limit=10`);
      const data2 = await res2.json();
      results = data2?.data?.results || [];
    }

    // Tier 3: Title Only
    if (results.length === 0) {
      const tier3Query = encodeURIComponent(cleanedSpotifyTitle);
      const res3 = await fetch(`https://jiosaavn-roan.vercel.app/api/search/songs?query=${tier3Query}&limit=10`);
      const data3 = await res3.json();
      results = data3?.data?.results || [];
    }

    if (results.length === 0) return null;

    // Calculate confidence scores
    const scoredResults = results.map(res => {
      const resTitle = res.name || '';
      const resArtistsAll = res.artists?.all || [];
      const primaryResArtist = res.artists?.primary?.[0]?.name || '';
      const cleanedResTitle = cleanTitle(resTitle);
      
      const titleSim = stringSimilarity.compareTwoStrings(cleanedSpotifyTitle, cleanedResTitle);
      let artistSim = stringSimilarity.compareTwoStrings(artistRaw.toLowerCase(), primaryResArtist.toLowerCase());
      
      const hasOverlappingArtist = resArtistsAll.some(ra => 
          artistRaw.toLowerCase().includes(ra.name.toLowerCase()) ||
          ra.name.toLowerCase().includes(artistRaw.toLowerCase()) ||
          primarySpotifyArtist.toLowerCase().includes(ra.name.toLowerCase()) ||
          ra.name.toLowerCase().includes(primarySpotifyArtist.toLowerCase())
      );
      
      if (hasOverlappingArtist) artistSim = Math.max(artistSim, 1.0);
      const isARRahman = artistRaw.toLowerCase().includes('rahman') || primaryResArtist.toLowerCase().includes('rahman');
      if (isARRahman && hasOverlappingArtist) artistSim = 1.0;

      const totalConfidence = (titleSim * 0.6) + (artistSim * 0.4);
      return { data: res, confidence: totalConfidence };
    });

    scoredResults.sort((a, b) => b.confidence - a.confidence);
    const best = scoredResults[0];
    
    return {
        id: best.data.id,
        name: best.data.name,
        artist: best.data.artists?.primary?.[0]?.name || best.data.artists?.all?.[0]?.name,
        album: best.data.album?.name,
        image: best.data.image?.[1]?.url || best.data.image?.[2]?.url,
        confidence: Math.round(best.confidence * 100)
    };
};

/**
 * Utility to split array into chunks for batch processing
 */
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Playlist Bridge Service (Universal)
 */
export const analyzePlaylist = async (url) => {
  try {
    const isSpotify = url.includes('spotify.com');
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    if (!isSpotify && !isYouTube) {
        throw new Error('Invalid URL. Please provide a Spotify or YouTube playlist link.');
    }

    let tracksToProcess = [];
    let playlistName = 'Music Import';
    let extractionMethod = 'unknown';

    if (isSpotify) {
        console.log(`[BRIDGE SERVICE] Analyzing Spotify: ${url}`);
        const spotifyTracks = await getTracks(url);
        const spotifyData = await getData(url).catch(() => ({}));
        playlistName = spotifyData.name || 'Spotify Import';
        tracksToProcess = spotifyTracks.map(t => ({
            name: t.name,
            artist: t.artist || 'Unknown Artist',
            image: null
        }));
        extractionMethod = 'spotify';
    } else {
        console.log(`[BRIDGE SERVICE] Analyzing YouTube: ${url}`);
        const urlObj = new URL(url.replace('music.youtube.com', 'www.youtube.com'));
        const listId = urlObj.searchParams.get('list');
        if (!listId) throw new Error('Could not find a valid playlist ID in the URL.');

        if (listId.startsWith('PL')) {
            extractionMethod = 'youtube-sr';
            const ytPlaylist = await YouTube.getPlaylist(url, { fetchAll: true });
            if (!ytPlaylist) throw new Error('YouTube Playlist not found or private.');
            playlistName = ytPlaylist.title || 'YouTube Import';
            tracksToProcess = ytPlaylist.videos.map(v => ({
                name: v.title,
                artist: v.channel?.name || 'Unknown Artist',
                image: v.thumbnail?.url
            }));
        } else {
            extractionMethod = 'yt-search';
            const ytData = await yts({ listId });
            if (!ytData || !ytData.videos) throw new Error('Could not extract Mix/Radio data.');
            playlistName = ytData.title || 'YouTube Music Mix';
            tracksToProcess = ytData.videos.map(v => {
                const meta = parseYouTubeMetadata(v.title, v.author?.name || '');
                return {
                    name: meta.title,
                    artist: meta.artists,
                    rawTitle: meta.rawTitle,
                    allParts: meta.allParts,
                    image: v.thumbnail || v.image
                };
            });
        }
    }

    console.log(`[BRIDGE SERVICE] Processing ${tracksToProcess.length} tracks in batches...`);
    const results = [];
    const chunks = chunkArray(tracksToProcess, 15); // Process 15 at a time

    for (const chunk of chunks) {
        const batchResults = await Promise.all(chunk.map(async (track) => {
            try {
                let match = null;
                if (extractionMethod === 'yt-search') {
                    match = await findJioSaavnMatchForMix(track.name, track.artist, track.rawTitle, track.allParts);
                } else {
                    match = await findJioSaavnMatch(track.name, track.artist);
                }
                return {
                    originalTrack: track,
                    match: match,
                    status: match ? 'found' : 'missing',
                    confidence: match?.confidence || 0
                };
            } catch (error) {
                console.error(`[BRIDGE SERVICE] Error matching track "${track.name}":`, error);
                return {
                    originalTrack: track,
                    match: null,
                    status: 'error',
                    confidence: 0
                };
            }
        }));
        results.push(...batchResults);
    }

    return {
      playlistName,
      tracks: results,
      totalFound: results.filter(t => t.status === 'found').length,
      totalProcessed: results.length
    };
  } catch (error) {
    console.error(`[BRIDGE SERVICE] Critical Error:`, error);
    
    // User-friendly error mapping
    let userMessage = error.message || 'Failed to analyze playlist.';
    if (userMessage.includes('404') || userMessage.toLowerCase().includes('not found')) {
        userMessage = 'This playlist doesn\'t exist or is set to private. Double-check your link!';
    } else if (userMessage.includes('403')) {
        userMessage = 'Access denied. The playlist might be private or restricted.';
    }

    throw new Error(userMessage);
  }
};
