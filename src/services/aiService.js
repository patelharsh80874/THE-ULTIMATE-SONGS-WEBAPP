import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generates an AI-powered smart playlist based on a user prompt.
 * @param {string} prompt - The mood, theme, or activity for the playlist.
 * @returns {Promise<Object>} - The generated playlist and metadata.
 */
export const generateAIPlaylist = async (prompt) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/ai/generate-playlist`, 
      { prompt }, 
      { 
        withCredentials: true,
        timeout: 60000, // 60 second timeout since AI generation can take time
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in generateAIPlaylist:', error);
    
    // More specific error messages
    if (error.code === 'ECONNABORTED') {
      throw { message: 'Request timed out. The AI is taking too long, please try again.' };
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      throw { message: 'Cannot connect to the server. Make sure the backend server is running on port 5000.' };
    }
    
    throw error.response?.data || { message: 'Failed to generate playlist. Please try again.' };
  }
};
