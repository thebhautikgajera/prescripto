import { verifyToken } from '../utils/jwtUtils.js';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  
  // Check if the token exists in the header (Bearer TOKEN format)
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  // Verify the token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Add user info to request
  req.user = decoded;
  next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

// Middleware to check if user is doctor
const isDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor privileges required.'
    });
  }
  
  next();
};

// Middleware to check if user is patient (regular user)
const isUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User privileges required.'
    });
  }
  
  next();
};

export { authenticateToken, isAdmin, isDoctor, isUser }; 