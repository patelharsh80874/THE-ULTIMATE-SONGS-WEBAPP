import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  checkUsername,
  forgotPassword,
  resetPassword,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many OTP requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many password reset attempts. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// ─────────────────────────────────────────────────────────────────────────────

router.post('/register', otpLimiter, registerUser);
router.post('/verify-register', otpLimiter, verifyRegisterOtp);
router.post('/login', loginLimiter, loginUser);
router.post('/send-login-otp', otpLimiter, sendLoginOtp);
router.post('/verify-login', otpLimiter, verifyLoginOtp);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.get('/check-username/:username', checkUsername);
router.post('/forgotpassword', resetLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', resetLimiter, resetPassword);

export default router;

