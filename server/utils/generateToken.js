import jwt from 'jsonwebtoken';

const generateToken = (res, userId, rememberMe = true) => {
  const expiry = rememberMe ? '30d' : '1d';
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000  // 30 days
    : 1 * 24 * 60 * 60 * 1000;  // 1 day

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: expiry,
  });

  // Set JWT as HTTP-Only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge,
  });
};

export default generateToken;

