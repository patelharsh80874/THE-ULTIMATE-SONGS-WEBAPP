import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generates an AI-powered smart playlist based on a user prompt.
 * @param {string} prompt - The mood, theme, or activity for the playlist.
 * @returns {Promise<Object>} - The generated playlist and metadata.
 */
export const generateAIPlaylist = async (prompt) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/generate-playlist`, { prompt }, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error in generateAIPlaylist:', error);
    throw error.response?.data || { message: 'Network error occurred while generating playlist' };
  }
};
