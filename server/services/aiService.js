import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

/**
 * AI Music Curation Service
 * Uses Google Gemini API (via @google/genai SDK) + JioSaavn track verification
 * 
 * Model priority (latest free-tier eligible, Aug 2026):
 *   1. gemini-3.7-flash  (latest, released Aug 13 2026)
 *   2. gemini-3.6-flash  (released Jul 2026)
 *   3. gemini-2.5-flash  (stable fallback)
 */

// JioSaavn API base URL from .env (server/.env or root/.env)
const JIOSAAVN_API_URL = process.env.JIOSAAVN_API_URL || process.env.VITE_API_BASE_URL;

export const generateAISmartPlaylist = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key configuration error. GEMINI_API_KEY is missing.");

  const ai = new GoogleGenAI({ apiKey });

  // Models to try in order — latest first (all free-tier eligible)
  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
  ];

  const systemPrompt = `You are a world-class music curator in August 2026. For the given theme, generate 30 high-quality song recommendations.
VERY IMPORTANT: Prioritize the absolute latest trending hits from 2024, 2025, and 2026.
Also, create a short, catchy, creative name for the playlist (max 4-5 words) and a short 1-sentence description.
Return ONLY a valid JSON object with NO extra text, no markdown, no code fences:
{"title": "Playlist Name", "description": "Description here", "songs": [{"name": "Song Name", "artist": "Artist Name"}]}`;

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
          temperature: 0.9,
          topP: 0.95,
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
    throw new Error("All AI models failed to respond. Please check your GEMINI_API_KEY and try again.");
  }

  // Parse the AI response
  let suggestions = [];
  let generatedTitle = "";
  let generatedDescription = "";

  try {
    // Clean the response - remove markdown code fences if present
    let cleanedText = aiResponseText.trim();
    cleanedText = cleanedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
    suggestions = parsed.songs || [];
    generatedTitle = parsed.title || "";
    generatedDescription = parsed.description || "";
  } catch (parseError) {
    console.error('[AI SERVICE] JSON Parse Error:', parseError.message);
    console.error('[AI SERVICE] Raw response:', aiResponseText.substring(0, 500));
    throw new Error("AI returned an invalid format. Please try again.");
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error("AI did not return a list of songs.");
  }

  // Verify tracks against JioSaavn API
  console.log(`[AI SERVICE] Verifying ${suggestions.length} suggestions against JioSaavn...`);
  const limitedSuggestions = suggestions.slice(0, 30);

  const verifiedTracks = await Promise.all(
    limitedSuggestions.map(async (item) => {
      try {
        const searchQuery = encodeURIComponent(`${item.name} ${item.artist}`);
        const searchUrl = `${JIOSAAVN_API_URL}/search/songs?query=${searchQuery}&limit=1`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data?.data?.results?.[0] || null;
      } catch (e) {
        return null;
      }
    })
  );

  const finalPlaylist = verifiedTracks.filter(track => track !== null);
  
  console.log(`[AI SERVICE] Verified ${finalPlaylist.length}/${limitedSuggestions.length} tracks successfully.`);

  return {
    playlist: finalPlaylist,
    title: generatedTitle,
    description: generatedDescription
  };
};
