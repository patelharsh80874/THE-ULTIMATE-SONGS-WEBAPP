import fetch from 'node-fetch';

/**
 * AI Music Curation Service
 * Handles Gemini API interaction and JioSaavn track verification
 */
export const generateAISmartPlaylist = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key configuration error.");

  // Prioritize Gemini 3 Flash for 2026 real-time data
  const modelsToTry = [
    "gemini-3-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-pro-latest"
  ];

  let aiResult = null;
  let workingModel = "";

  console.log(`[AI SERVICE] Generating for: "${prompt}"`);

  for (const modelName of modelsToTry) {
    try {
      // Try v1beta first
      const v1betaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const promptBody = {
        contents: [{
          parts: [{
            text: `You are a world-class music curator in April 2026. For the theme: "${prompt}", generate 30 high-quality song recommendations. 
            VERY IMPORTANT: Prioritize the absolute latest trending hits from 2024, 2025, and early 2026. 
            Also, create a short, catchy, creative name for the playlist (max 4-5 words) and a short 1-sentence description. 
            Return ONLY a JSON object: {"title": "Playlist Name", "description": "Description here", "songs": [{"name": "Song Name", "artist": "Artist Name"}]}. No intro text.`
          }]
        }]
      };

      const aiResponse = await fetch(v1betaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptBody)
      });

      if (aiResponse.ok) {
        aiResult = await aiResponse.json();
        workingModel = modelName;
        break;
      } else {
        // Fallback to v1
        const v1Url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
        const aiResponseV1 = await fetch(v1Url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptBody)
        });

        if (aiResponseV1.ok) {
          aiResult = await aiResponseV1.json();
          workingModel = modelName;
          break;
        }
      }
    } catch (e) {
      continue;
    }
  }

  if (!aiResult) {
    throw new Error("None of the standard models (Gemini 3, 2, 1.5) responded. Check API status.");
  }

  console.log(`[AI SERVICE] SUCCESS. Working model: ${workingModel}`);
  const responseText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  
  let suggestions = [];
  let generatedTitle = "";
  let generatedDescription = "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    suggestions = parsed.songs || [];
    generatedTitle = parsed.title || "";
    generatedDescription = parsed.description || "";
  } catch (parseError) {
    console.error('[AI SERVICE] JSON Parse Error:', parseError);
    throw new Error("AI returned an invalid format. Please try again.");
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    throw new Error("AI did not return a list of songs.");
  }

  // Verify tracks against JioSaavn API
  console.log(`[AI SERVICE] Verifying ${suggestions.length} suggestions...`);
  const limitedSuggestions = suggestions.slice(0, 30);

  const verifiedTracks = await Promise.all(
    limitedSuggestions.map(async (item) => {
      try {
        const searchQuery = encodeURIComponent(`${item.name} ${item.artist}`);
        const searchUrl = `${process.env.VITE_API_BASE_URL}/search/songs?query=${searchQuery}&limit=1;`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        return data?.data?.results?.[0] || null;
      } catch (e) {
        return null;
      }
    })
  );

  const finalPlaylist = verifiedTracks.filter(track => track !== null);
  
  return {
    playlist: finalPlaylist,
    title: generatedTitle,
    description: generatedDescription
  };
};
