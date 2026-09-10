function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user ? req.user.role : 'unknown'}' is not allowed to access this resource`,
      });
    }
    next();
  };
}

module.exports = authorize;