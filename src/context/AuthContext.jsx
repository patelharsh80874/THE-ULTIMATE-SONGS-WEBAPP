import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpAttempts, setOtpAttempts] = useState({ remaining: null, limit: null });

  // Helper to extract rate limit headers
  const updateOtpAttempts = (headers) => {
    const remaining = headers['x-ratelimit-remaining'] || headers['ratelimit-remaining'];
    const limit = headers['x-ratelimit-limit'] || headers['ratelimit-limit'];
    if (remaining !== undefined) {
      setOtpAttempts({ 
        remaining: parseInt(remaining), 
        limit: parseInt(limit) || 5 
      });
    }
  };

  // Automatically check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/me`, {

          withCredentials: true
        });
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (identifier, password, rememberMe = true) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        identifier,
        password,
        rememberMe,
      }, { withCredentials: true });
      
      updateOtpAttempts(response.headers);
      const { data } = response;

      if (data.requiresOtp) {
        toast.success(data.message || `Verification OTP sent to ${data.identifier}`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        return { success: true, requiresOtp: true, identifier: data.identifier };
      }

      setUser(data);
      toast.success(`Welcome back, ${data.username}!`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: true };
    } catch (error) {
      if (error.response?.headers) updateOtpAttempts(error.response.headers);
      toast.error(error.response?.data?.message || 'Login failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: false, error: error.response?.data?.message };
    }
  };


  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
      }, { withCredentials: true });
      
      updateOtpAttempts(response.headers);
      const { data } = response;

      if (data.requiresOtp) {
        toast.success(`Verification OTP sent to ${email}`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
        return { success: true, requiresOtp: true, identifier: data.identifier };
      }
      
      setUser(data);
      return { success: true };
    } catch (error) {
      if (error.response?.headers) updateOtpAttempts(error.response.headers);
      toast.error(error.response?.data?.message || 'Registration failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: false, error: error.response?.data?.message };
    }
  };

  const verifyRegisterOtp = async (identifier, otp) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-register`, {
        identifier,
        otp,
      }, { withCredentials: true });
      
      updateOtpAttempts(response.headers);
      const { data } = response;
      
      setUser(data);
      toast.success(`Account verified! Welcome, ${data.username}!`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: true };
    } catch (error) {
      if (error.response?.headers) updateOtpAttempts(error.response.headers);
      toast.error(error.response?.data?.message || 'Verification failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: false, error: error.response?.data?.message };
    }
  };

  const sendLoginOtp = async (identifier) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/send-login-otp`, {
        identifier
      }, { withCredentials: true });
      
      updateOtpAttempts(response.headers);
      
      toast.success(`Secure OTP sent to your email`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: true };
    } catch (error) {
      if (error.response?.headers) updateOtpAttempts(error.response.headers);
      toast.error(error.response?.data?.message || 'Failed to send OTP', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: false, error: error.response?.data?.message };
    }
  };

  const verifyLoginOtp = async (identifier, otp, rememberMe = true) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-login`, {
        identifier,
        otp,
        rememberMe,
      }, { withCredentials: true });
      
      updateOtpAttempts(response.headers);
      const { data } = response;
      
      setUser(data);
      toast.success(`Welcome back, ${data.username}!`, {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: true };
    } catch (error) {
      if (error.response?.headers) updateOtpAttempts(error.response.headers);
      toast.error(error.response?.data?.message || 'OTP Verification failed', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return { success: false, error: error.response?.data?.message };
    }
  };


  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });

      setUser(null);
      toast.success('Logged out successfully', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    } catch (error) {
      toast.error('Error logging out', {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      otpAttempts,
      login, 
      register, 
      logout,
      verifyRegisterOtp,
      sendLoginOtp,
      verifyLoginOtp
    }}>
      {children}
    </AuthContext.Provider>

  );
};
