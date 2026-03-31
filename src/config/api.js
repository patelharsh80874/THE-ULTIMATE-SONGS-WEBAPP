const isDevelopment = import.meta.env.MODE === 'development';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || (isDevelopment ? "http://localhost:5000" : "");

export default API_BASE_URL;

