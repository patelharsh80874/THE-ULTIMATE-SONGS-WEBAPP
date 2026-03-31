import express from 'express';
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  checkUsername,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.get('/check-username/:username', checkUsername);

export default router;
