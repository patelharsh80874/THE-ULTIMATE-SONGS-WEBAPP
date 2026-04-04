import express from 'express';
import { generateAISmartPlaylist } from '../services/aiService.js';

const router = express.Router();

/**
 * @route   POST /api/ai/generate-playlist
 * @desc    Generate a smart AI playlist using Gemini 3 Flash
 * @access  Public (or semi-private if auth is added)
 */
router.post('/generate-playlist', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  try {
    const result = await generateAISmartPlaylist(prompt);
    
    res.json({
      success: true,
      playlist: result.playlist,
      title: result.title,
      description: result.description,
      verifiedCount: result.playlist.length
    });
  } catch (error) {
    console.error('[AI ROUTE ERROR]:', error);
    res.status(500).json({ 
      message: error.message || 'AI failed to generate playlist.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
