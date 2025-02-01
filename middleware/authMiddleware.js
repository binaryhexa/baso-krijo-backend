const jwt = require('jsonwebtoken');

const authMiddleware = (roles) => {
  return (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Akses ditolak, Anda tidak memiliki izin' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).json({ message: 'Token tidak valid' });
    }
  };
};

module.exports = authMiddleware;