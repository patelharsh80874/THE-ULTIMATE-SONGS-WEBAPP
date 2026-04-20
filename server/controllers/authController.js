import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// ─── Reusable OTP Email Template (Table-based for max compatibility) ──────────
const buildOtpEmailHtml = ({ otp, heading, bodyText, accentColor }) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>The Ultimate Songs</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<!-- PREHEADER: visible in mobile notifications & inbox preview -->
<span style="display:none;font-size:1px;color:#f1f5f9;max-height:0;max-width:0;opacity:0;overflow:hidden;">🔐 Your OTP: ${otp} — Valid for 10 minutes. Do not share this code.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
  <tr><td align="center" valign="top" style="padding:32px 12px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

      <!-- HEADER -->
      <tr>
        <td align="center" bgcolor="${accentColor}" style="background-color:${accentColor};padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;font-style:italic;text-transform:uppercase;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">The Ultimate Songs</h1>
          <p style="margin:6px 0 0;font-size:10px;color:#ffffffb3;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Your Premium Music Universe</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px;">
          <h2 style="margin:0 0 10px;font-size:18px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">${heading}</h2>
          <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">${bodyText}</p>

          <!-- OTP BOX -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;">
            <tr>
              <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;border:2px solid ${accentColor};border-radius:12px;padding:16px 32px;">
                <p style="margin:0 0 4px;font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Your OTP Code</p>
                <p style="margin:0;font-size:34px;font-weight:900;color:${accentColor};letter-spacing:0.3em;font-family:'Courier New',Courier,monospace;">${otp}</p>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:12px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">Expires in <strong style="color:#475569;">10 minutes</strong> &mdash; Do not share this code with anyone.</p>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td>
      </tr>

      <!-- DEVELOPER FOOTER -->
      <tr>
        <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 32px 28px;">
          <p style="margin:0 0 2px;font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Crafted with ❤️ by</p>
          <a href="https://patelharsh.in" style="text-decoration:none;">
            <p style="margin:4px 0 2px;font-size:15px;font-weight:900;color:#1e293b;font-style:italic;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Harsh Patel</p>
          </a>
          <p style="margin:0 0 16px;font-size:11px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">MERN / Full Stack Developer</p>

          <!-- SOCIAL BUTTONS -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding:0 3px;"><a href="https://patelharsh.in" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Portfolio</a></td>
              <td style="padding:0 3px;"><a href="https://github.com/patelharsh80874" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">GitHub</a></td>
              <td style="padding:0 3px;"><a href="https://instagram.com/patelharsh.in" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Instagram</a></td>
              <td style="padding:0 3px;"><a href="mailto:patelharsh80874@yahoo.com" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Contact</a></td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
// ─────────────────────────────────────────────────

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    
    // Support legacy email payloads gracefully if frontend hasn't updated yet
    const loginIdentifier = identifier || req.body.email; 

    // Important: Prevent empty identifier querying all users
    if (!loginIdentifier) {
      res.status(400);
      throw new Error('Please provide an email or username');
    }

    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { username: loginIdentifier.toLowerCase() }
      ]
    });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid Email/Username or Password');
    }

    // Security enforcement: check if explicitly verified
    if (user.isVerified !== true) {
      const otp = user.generateOTP();
      await user.save();

      const message = `Welcome to The Ultimate Songs!\n\nYour fresh OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

      try {
        await sendEmail({
          email: user.email,
          subject: '🎵 Verify Your Account - The Ultimate Songs',
          message,
          html: buildOtpEmailHtml({
            otp,
            heading: 'Verify Your Account',
            bodyText: `Welcome! Your account was created but needs one final step. Enter this OTP to verify your email and unlock full access.`,
            accentColor: '#7c3aed'
          })
        });

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          identifier: user.email,
          message: "Account not verified. We've sent a fresh OTP to your email."
        });
      } catch (err) {
        console.error(err);
        user.otpToken = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500);
        throw new Error('Verification email could not be sent.');
      }
    }

    // Record login activity
    user.lastLogin = Date.now();
    user.lastLoginDevice = req.headers['user-agent'] || 'Unknown Device';
    await user.save();

    generateToken(res, user._id, rememberMe !== false);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      lastLoginDevice: user.lastLoginDevice,
    });
  } catch (error) {
    next(error);
  }
};

const RESERVED_USERNAMES = new Set(['admin', 'root', 'system', 'support', 'official', 'ultimate', 'moderator', 'staff', 'owner', 'developer', 'harsh', 'theultimatesongs']);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // ─── Professional Username Validation (Industry Standard) ──────────
    const lowerUsername = username?.toLowerCase();

    if (RESERVED_USERNAMES.has(lowerUsername)) {
      res.status(400); throw new Error('This username is reserved for administrative use');
    }

    if (!username || username.length < 3) {
      res.status(400); throw new Error('Username must be at least 3 characters');
    }
    if (username.length > 20) {
      res.status(400); throw new Error('Username cannot exceed 20 characters');
    }
    if (username.includes(' ')) {
      res.status(400); throw new Error('Username cannot contain spaces');
    }
    if (username.includes('@')) {
      res.status(400); throw new Error('Username cannot be an email address');
    }
    // Only allow alphanumeric, underscores, and dots.
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      res.status(400); throw new Error('Username can only contain letters, numbers, dots, and underscores');
    }

    // ─── Pro Password Complexity Check ──────────
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400); throw new Error('Password must be at least 6 characters and contain at least one letter and one number');
    }
    // ─────────────────────────────────────────────────────────────────

    let user = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (user) {
      if (user.isVerified) {
        res.status(400);
        if (user.email === email.toLowerCase()) {
          throw new Error('Email already registered');
        } else {
          throw new Error('Username already taken');
        }
      } else {
        // User exists but isn't verified. Overwrite to allow corrections.
        user.username = username;
        user.email = email;
        user.password = password;
      }
    } else {
      user = new User({
        username,
        email,
        password,
        isVerified: false
      });
    }

    const otp = user.generateOTP();
    await user.save();

    const message = `Welcome to The Ultimate Songs!\n\nYour OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: '🎵 Verify Your Account - The Ultimate Songs',
        message,
        html: buildOtpEmailHtml({
          otp,
          heading: 'Verify Your Account',
          bodyText: 'Thank you for joining The Ultimate Songs! Enter this OTP to complete your registration and dive into your premium music universe.',
          accentColor: '#7c3aed'
        })
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
        requiresOtp: true,
        identifier: user.email // Sending back email to use as identifier for verification step
      });
    } catch (err) {
      console.error(err);
      user.otpToken = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      res.status(500);
      throw new Error('Verification email could not be sent. Please try again.');
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
        lastLogin: user.lastLogin,
        lastLoginDevice: user.lastLoginDevice,
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

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-register
// @access  Public
export const verifyRegisterOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;

    const otpToken = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
      otpToken,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otpToken = undefined;
    user.otpExpire = undefined;
    // Record login activity since this logs them in
    user.lastLogin = Date.now();
    user.lastLoginDevice = req.headers['user-agent'] || 'Unknown Device';
    await user.save();

    generateToken(res, user._id, true); // Register usually defaults to rememberMe

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      lastLoginDevice: user.lastLoginDevice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Login OTP
// @route   POST /api/auth/send-login-otp
// @access  Public
export const sendLoginOtp = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400);
      throw new Error('Please provide an email or username');
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }]
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // We allow unverified users to request an OTP. Verifying this OTP will double as their registration verification.
    const otp = user.generateOTP();
    await user.save();

    const isUnverified = !user.isVerified;
    const subjectTitle = isUnverified ? '🎵 Verify Your Account - The Ultimate Songs' : '🔐 Secure Login OTP - The Ultimate Songs';
    const headerColor = isUnverified ? '#7c3aed' : '#3b82f6';
    const headingText = isUnverified ? 'Verify Your Account' : 'Secure Login Request';
    const instructionsText = isUnverified ? 'Use the following OTP to verify your registration:' : 'Use the following OTP to log into your account:';
    
    const message = isUnverified 
      ? `Welcome to The Ultimate Songs!\n\nYour fresh OTP for account verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`
      : `Welcome Back to The Ultimate Songs!\n\nYour OTP for secure login is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: subjectTitle,
        message,
        html: buildOtpEmailHtml({
          otp,
          heading: headingText,
          bodyText: isUnverified
            ? 'Your account needs verification. Enter this OTP to verify your email and unlock full access to your music universe.'
            : 'Someone (hopefully you!) requested a secure login code. Enter this OTP to sign in instantly without a password.',
          accentColor: isUnverified ? '#7c3aed' : '#3b82f6'
        })
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
        identifier: user.email
      });
    } catch (err) {
      user.otpToken = undefined;
      user.otpExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      res.status(500);
      throw new Error('OTP email could not be sent. Please try again or use password.');
    }

  } catch (error) {
    next(error);
  }
};

// @desc    Verify Login OTP
// @route   POST /api/auth/verify-login
// @access  Public
export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { identifier, otp, rememberMe } = req.body;

    const otpToken = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
      otpToken,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    if (!user.isVerified) {
      user.isVerified = true;
    }

    user.otpToken = undefined;
    user.otpExpire = undefined;
    
    // Record login activity
    user.lastLogin = Date.now();
    user.lastLoginDevice = req.headers['user-agent'] || 'Unknown Device';
    await user.save();

    generateToken(res, user._id, rememberMe !== false);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      lastLoginDevice: user.lastLoginDevice,
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
        html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Password Reset - The Ultimate Songs</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<!-- PREHEADER: visible in mobile notifications & inbox preview -->
<span style="display:none;font-size:1px;color:#f1f5f9;max-height:0;max-width:0;opacity:0;overflow:hidden;">🔒 Password Reset Link Inside — Valid for 10 minutes. If you did not request this, ignore this email.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
  <tr><td align="center" valign="top" style="padding:32px 12px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

      <!-- HEADER -->
      <tr>
        <td align="center" bgcolor="#7c3aed" style="background-color:#7c3aed;padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;font-style:italic;text-transform:uppercase;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">The Ultimate Songs</h1>
          <p style="margin:6px 0 0;font-size:10px;color:#ffffffb3;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Security Protocol</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px;">
          <h2 style="margin:0 0 10px;font-size:18px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Password Reset</h2>
          <p style="margin:0 0 10px;font-size:14px;color:#64748b;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">Hi <strong style="color:#1e293b;">${user.username}</strong>,</p>
          <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">We received a request to reset your account password. No changes have been made yet. Click the button below to create a new password securely.</p>

          <!-- RESET BUTTON -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
            <tr>
              <td align="center" bgcolor="#7c3aed" style="background-color:#7c3aed;border-radius:12px;">
                <a href="${resetUrl}" style="display:inline-block;font-size:13px;font-weight:900;color:#ffffff;text-decoration:none;padding:14px 36px;text-transform:uppercase;letter-spacing:0.15em;font-family:Arial,Helvetica,sans-serif;">Reset My Password</a>
              </td>
            </tr>
          </table>

          <!-- SECURITY BOX -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 22px;width:100%;">
            <tr>
              <td bgcolor="#f8fafc" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#64748b;font-family:Arial,Helvetica,sans-serif;"><strong style="color:#1e293b;">Security Note:</strong> This link expires in <strong style="color:#7c3aed;">10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>

          <!-- FALLBACK LINK -->
          <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">If the button doesn&apos;t work, copy this link:</p>
          <p style="margin:0;font-size:11px;color:#7c3aed;word-break:break-all;font-family:'Courier New',Courier,monospace;">${resetUrl}</p>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td>
      </tr>

      <!-- DEVELOPER FOOTER -->
      <tr>
        <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;padding:24px 32px 28px;">
          <p style="margin:0 0 2px;font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Crafted with ❤️ by</p>
          <a href="https://patelharsh.in" style="text-decoration:none;">
            <p style="margin:4px 0 2px;font-size:15px;font-weight:900;color:#1e293b;font-style:italic;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Harsh Patel</p>
          </a>
          <p style="margin:0 0 16px;font-size:11px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">MERN / Full Stack Developer</p>

          <!-- SOCIAL BUTTONS -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding:0 3px;"><a href="https://patelharsh.in" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Portfolio</a></td>
              <td style="padding:0 3px;"><a href="https://github.com/patelharsh80874" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">GitHub</a></td>
              <td style="padding:0 3px;"><a href="https://instagram.com/patelharsh.in" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Instagram</a></td>
              <td style="padding:0 3px;"><a href="mailto:patelharsh80874@yahoo.com" style="display:inline-block;font-size:10px;font-weight:700;color:#475569;text-decoration:none;padding:6px 13px;background-color:#e2e8f0;border-radius:20px;font-family:Arial,Helvetica,sans-serif;">Contact</a></td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
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
