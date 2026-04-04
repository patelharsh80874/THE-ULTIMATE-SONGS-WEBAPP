import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);

      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      res.status(400);
      if (userExists.email === email.toLowerCase()) {
        throw new Error('Email already registered');
      } else {
        throw new Error('Username already taken');
      }
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      generateToken(res, user._id);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      const field = Object.keys(error.keyPattern)[0];
      return next(new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`));
    }
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile (validate session)
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if username is available
// @route   GET /api/auth/check-username/:username
// @access  Public
export const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });
    
    res.status(200).json({
      available: !user,
      message: user ? 'Username already taken' : 'Username is available'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found with that email or username');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    // Note: In production, this should point to your frontend domain
    const resetUrl = `${req.protocol}://${req.get('host').includes('localhost') ? 'localhost:5173' : req.get('host')}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the button below to reset your password:`;

    try {
      await sendEmail({
        email: user.email,
        subject: '🔒 Password Reset Request - The Ultimate Songs',
        message,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 50px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.05em; color: #ffffff; text-transform: uppercase; font-style: italic;">The Ultimate Songs</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 11px; font-weight: bold; letter-spacing: 0.3em; text-transform: uppercase;">Security Protocol</p>
              </div>
              
              <div style="padding: 40px 35px; line-height: 1.6; color: #334155;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800;">Hi ${user.username},</h2>
                <p style="font-size: 16px; color: #475569; margin-bottom: 20px;">We received a request to reset the password for your account. No changes have been made yet.</p>
                <p style="font-size: 16px; color: #475569; margin-bottom: 35px;">To securely update your credentials, please click the button below:</p>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; box-shadow: 0 10px 20px rgba(124, 58, 237, 0.2);">Reset Password</a>
                </div>
                
                <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 40px; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
                  <strong>Security Alert:</strong> This link will expire in 10 minutes. If you did not request this, you can safely ignore this email.
                </p>
              </div>

              <div style="padding: 40px 35px; text-align: center; background-color: #f8fafc; border-top: 1px solid #eef2f6;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #7c3aed; font-size: 11px; margin: 10px 0; word-break: break-all;">${resetUrl}</p>
                <p style="color: #94a3b8; font-size: 11px; margin-top: 25px;">&copy; ${new Date().getFullYear()} The Ultimate Songs. All rights reserved.</p>
                
                <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #eef2f6;">
                  <span style="font-size: 10px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.25em; display: block; margin-bottom: 8px;">Crafted with Love by</span>
                  <a href="https://patelharsh.in" style="font-size: 18px; font-weight: 900; color: #1e293b; text-decoration: none; font-style: italic;">Harsh Patel</a>
                  
                  <div style="margin-top: 22px;">
                    <a href="https://instagram.com/patelharsh.in" style="display: inline-block; background-color: #ffffff; color: #1e293b; padding: 10px 20px; border-radius: 100px; text-decoration: none; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 5px; border: 1px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">Instagram</a>
                    <a href="https://github.com/patelharsh80874" style="display: inline-block; background-color: #ffffff; color: #1e293b; padding: 10px 20px; border-radius: 100px; text-decoration: none; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 5px; border: 1px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">GitHub</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
