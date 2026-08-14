import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

/**
 * AI Music Curation Service
 * Uses Google Gemini API (via @google/genai SDK) + Multi-endpoint JioSaavn track verification
 */

// Available JioSaavn API endpoints for high reliability
const JIOSAAVN_ENDPOINTS = [
  process.env.JIOSAAVN_API_URL,
  process.env.VITE_API_BASE_URL,
  'https://jiosaavn-roan.vercel.app/api',
  'https://jio-saavan-api.vercel.app/api',
  'https://saavn.dev/api'
].filter(Boolean);

/**
 * Search a track across available JioSaavn endpoints with timeout
 */
const searchTrack = async (query) => {
  const encodedQuery = encodeURIComponent(query);
  
  for (const endpoint of JIOSAAVN_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const searchUrl = `${endpoint}/search/songs?query=${encodedQuery}&limit=1`;
      const response = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const track = data?.data?.results?.[0] || (Array.isArray(data?.data) ? data?.data[0] : null);
      if (track && track.id) {
        return track;
      }
    } catch (e) {
      // Continue to next endpoint if this one fails/times out
      continue;
    }
  }
  return null;
};

export const generateAISmartPlaylist = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your deployment settings.");

  const ai = new GoogleGenAI({ apiKey });

  // Priority order: fastest & most available first to avoid 503 load spikes
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
  ];

  const systemPrompt = `You are a world-class music curator in August 2026. For the given theme, generate 20 top-tier song recommendations.
Prioritize popular, trending, and highly recognized songs from 2023 to 2026.
Also create a short, catchy playlist title (max 4-5 words) and a 1-sentence description.
Return ONLY a valid JSON object without markdown fences or additional text:
{"title": "Playlist Name", "description": "Description here", "songs": [{"name": "Song Name", "artist": "Primary Artist"}]}`;

  let aiResponseText = null;
  let workingModel = "";

  console.log(`[AI SERVICE] Generating for: "${prompt}"`);

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI SERVICE] Trying model: ${modelName}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Theme: "${prompt}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      });

      aiResponseText = response.text;
      
      if (aiResponseText && aiResponseText.trim().length > 0) {
        workingModel = modelName;
        console.log(`[AI SERVICE] SUCCESS with model: ${workingModel}`);
        break;
      }
    } catch (e) {
      console.warn(`[AI SERVICE] Model ${modelName} failed:`, e.message || e);
      continue;
    }
  }

  if (!aiResponseText) {
    throw new Error("AI service is currently busy. Please try again in a moment.");
  }

  // Parse the AI response with multi-layer resilience
  let suggestions = [];
  let generatedTitle = `Playlist: ${prompt.substring(0, 20)}`;
  let generatedDescription = `AI curated collection for "${prompt}"`;

  try {
    let cleanedText = aiResponseText.trim();
    cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove trailing commas if any before parsing
    const sanitized = cleanedText.replace(/,\s*([\]}])/g, '$1');
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : sanitized);
    
    suggestions = parsed.songs || [];
    if (parsed.title) generatedTitle = parsed.title;
    if (parsed.description) generatedDescription = parsed.description;
  } catch (parseError) {
    console.warn('[AI SERVICE] JSON parse failed, attempting regex extraction:', parseError.message);
    
    // Regex extraction fallback: find all {"name": "...", "artist": "..."} objects
    const songRegex = /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"artist"\s*:\s*"([^"]+)"\s*\}/g;
    let match;
    while ((match = songRegex.exec(aiResponseText)) !== null) {
      suggestions.push({ name: match[1], artist: match[2] });
    }
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    console.warn("[AI SERVICE] No songs extracted from AI response, falling back to direct search.");
  }

  // Verify tracks in parallel with fallback queries
  console.log(`[AI SERVICE] Verifying ${suggestions.length} suggestions...`);
  const limitedSuggestions = suggestions.slice(0, 20);

  const verifiedTracks = await Promise.all(
    limitedSuggestions.map(async (item) => {
      try {
        // 1. First attempt: Song name + Primary artist
        const primaryArtist = item.artist ? item.artist.split(/[,&/]/)[0].trim() : '';
        let track = await searchTrack(`${item.name} ${primaryArtist}`.trim());
        
        // 2. Fallback attempt: Just song name
        if (!track && item.name) {
          track = await searchTrack(item.name.trim());
        }
        
        return track;
      } catch (e) {
        return null;
      }
    })
  );

  // Filter out nulls and remove duplicate songs by ID
  const seenIds = new Set();
  let finalPlaylist = [];
  for (const track of verifiedTracks) {
    if (track && track.id && !seenIds.has(track.id)) {
      seenIds.add(track.id);
      finalPlaylist.push(track);
    }
  }

  // Fallback: If verification yielded 0 tracks, perform a direct keyword search on JioSaavn for the prompt
  if (finalPlaylist.length === 0) {
    console.log(`[AI SERVICE] Direct search fallback for prompt: "${prompt}"`);
    for (const endpoint of JIOSAAVN_ENDPOINTS) {
      try {
        const fallbackRes = await fetch(`${endpoint}/search/songs?query=${encodeURIComponent(prompt)}&limit=15`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const results = fallbackData?.data?.results || (Array.isArray(fallbackData?.data) ? fallbackData?.data : []);
          if (results.length > 0) {
            finalPlaylist = results;
            break;
          }
        }
      } catch (e) {}
    }
  }

  console.log(`[AI SERVICE] Final playlist: ${finalPlaylist.length} tracks.`);

  return {
    playlist: finalPlaylist,
    title: generatedTitle,
    description: generatedDescription
  };
};
