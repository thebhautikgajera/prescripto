import jwt from 'jsonwebtoken';

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'prescripto-jwt-secret-key';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '24h' } // Token expires in 24 hours
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export { generateToken, verifyToken }; 