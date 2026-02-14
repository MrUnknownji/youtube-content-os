// Middleware to check if MongoDB is configured
const checkDbConnection = (req, res, next) => {
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({
      success: false,
      data: null,
      fallbackUsed: true,
      message: 'MongoDB not configured'
    });
  }
  next();
};

module.exports = checkDbConnection;
