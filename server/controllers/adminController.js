import User from '../models/User.js';
import Playlist from '../models/Playlist.js';

// @desc    Get system-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPlaylists = await Playlist.countDocuments({});
    
    // Estimate total unique tracks from all collections (Likes + Playlists)
    const allUsers = await User.find({}).select('likedSongs');
    const allPlaylists = await Playlist.find({}).select('songs');
    
    const songSet = new Set();
    allUsers.forEach(u => u.likedSongs?.forEach(id => songSet.add(id)));
    allPlaylists.forEach(p => p.songs?.forEach(id => songSet.add(id)));

    res.status(200).json({
      totalUsers,
      totalPlaylists,
      totalTracks: songSet.size,
      activeUsers: totalUsers, // Basic placeholder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all playlists in the system
// @route   GET /api/admin/playlists
// @access  Private/Admin
export const getAllPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({})
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(playlists);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete any playlist as admin
// @route   DELETE /api/admin/playlists/:id
// @access  Private/Admin
export const deletePlaylistAdmin = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      res.status(404);
      throw new Error('Playlist not found');
    }

    await playlist.deleteOne();
    res.status(200).json({ message: 'Playlist removed by admin' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password as admin
// @route   PUT /api/admin/users/:id/password
// @access  Private/Admin
export const updateUserPasswordAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle ban/suspend a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (user.role === 'admin') { res.status(400); throw new Error('Cannot ban an admin'); }
    
    user.isBanned = !user.isBanned;
    await user.save();
    res.status(200).json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`, isBanned: user.isBanned });
  } catch (error) { next(error); }
};

// @desc    Toggle verify/unverify a user
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
export const toggleVerifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    
    user.isVerified = !user.isVerified;
    await user.save();
    res.status(200).json({ message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`, isVerified: user.isVerified });
  } catch (error) { next(error); }
};

// @desc    Bulk actions on multiple users
// @route   POST /api/admin/users/bulk
// @access  Private/Admin
export const bulkUserAction = async (req, res, next) => {
  try {
    const { userIds, action } = req.body; // action: 'delete' | 'ban' | 'unban' | 'makeAdmin' | 'makeUser'
    if (!userIds?.length || !action) { res.status(400); throw new Error('userIds and action are required'); }
    
    // Never allow actions on the requesting admin
    const safeIds = userIds.filter(id => id !== req.user._id.toString());
    
    let result;
    switch (action) {
      case 'delete':
        result = await User.deleteMany({ _id: { $in: safeIds } });
        break;
      case 'ban':
        result = await User.updateMany({ _id: { $in: safeIds }, role: { $ne: 'admin' } }, { isBanned: true });
        break;
      case 'unban':
        result = await User.updateMany({ _id: { $in: safeIds } }, { isBanned: false });
        break;
      case 'makeAdmin':
        result = await User.updateMany({ _id: { $in: safeIds } }, { role: 'admin' });
        break;
      case 'makeUser':
        result = await User.updateMany({ _id: { $in: safeIds } }, { role: 'user' });
        break;
      default:
        res.status(400); throw new Error('Invalid action');
    }
    
    res.status(200).json({ message: `Bulk ${action} completed`, modifiedCount: result.modifiedCount || result.deletedCount || 0 });
  } catch (error) { next(error); }
};

// ─── Reusable Admin Email Template (Matches OTP email style) ──────────
const buildAdminEmailHtml = ({ heading, username, bodyText, accentColor, footerText }) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>The Ultimate Songs</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<!-- PREHEADER -->
<span style="display:none;font-size:1px;color:#f1f5f9;max-height:0;max-width:0;opacity:0;overflow:hidden;">${heading} — Important update from The Ultimate Songs.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
  <tr><td align="center" valign="top" style="padding:32px 12px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

      <!-- HEADER -->
      <tr>
        <td align="center" bgcolor="${accentColor}" style="background-color:${accentColor};padding:28px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;font-style:italic;text-transform:uppercase;letter-spacing:-0.5px;font-family:Arial,Helvetica,sans-serif;">The Ultimate Songs</h1>
          <p style="margin:6px 0 0;font-size:10px;color:#ffffffb3;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Admin Communication</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td align="left" bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 32px 28px;">
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;text-align:center;">${heading}</h2>
          ${username ? `<p style="margin:0 0 16px;font-size:15px;color:#334155;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Hi ${username},</p>` : ''}
          <div style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${bodyText}</div>
        </td>
      </tr>

      <!-- DIVIDER -->
      <tr>
        <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 32px 32px;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${footerText}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
<!-- Anti-clipping / Thread-breaker for Gmail -->
<div style="display:none; white-space:nowrap; font:15px courier; line-height:0; color:#f1f5f9;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
<div style="display:none; font-size:1px; color:#f1f5f9; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">Ref: ${Date.now()}-${Math.random().toString(36).substring(2, 8)}</div>
</body>
</html>`;

// @desc    Send announcement email to all users
// @route   POST /api/admin/announce
// @access  Private/Admin
export const sendAnnouncement = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) { res.status(400); throw new Error('Subject and message are required'); }
    
    const users = await User.find({ isVerified: true }).select('email');
    const emails = users.map(u => u.email);
    
    // Use the existing nodemailer transport
    const { createTransport } = await import('nodemailer');
    const transporter = createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    
    const htmlContent = buildAdminEmailHtml({
      heading: subject,
      bodyText: message,
      accentColor: '#10b981', // green-500
      footerText: 'This is an official announcement from The Ultimate Songs.'
    });

    // Send in batches of 10
    for (let i = 0; i < emails.length; i += 10) {
      const batch = emails.slice(i, i + 10);
      await transporter.sendMail({
        from: `"The Ultimate Songs" <${process.env.EMAIL_USER}>`,
        bcc: batch.join(','),
        subject,
        html: htmlContent
      });
    }
    
    res.status(200).json({ message: `Announcement sent to ${emails.length} verified users` });
  } catch (error) { next(error); }
};

// @desc    Send email to a specific user
// @route   POST /api/admin/email-user
// @access  Private/Admin
export const sendEmailToUser = async (req, res, next) => {
  try {
    const { userId, subject, message } = req.body;
    if (!userId || !subject || !message) { res.status(400); throw new Error('userId, subject and message are required'); }
    
    const targetUser = await User.findById(userId).select('email username');
    if (!targetUser) { res.status(404); throw new Error('User not found'); }
    
    const { createTransport } = await import('nodemailer');
    const transporter = createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    
    const htmlContent = buildAdminEmailHtml({
      heading: subject,
      username: targetUser.username,
      bodyText: message,
      accentColor: '#3b82f6', // blue-500
      footerText: 'This message was sent specifically to you by an admin.<br>The Ultimate Songs.'
    });

    await transporter.sendMail({
      from: `"The Ultimate Songs Admin" <${process.env.EMAIL_USER}>`,
      to: targetUser.email,
      subject,
      html: htmlContent
    });
    
    res.status(200).json({ message: `Email sent to ${targetUser.username}` });
  } catch (error) { next(error); }
};
