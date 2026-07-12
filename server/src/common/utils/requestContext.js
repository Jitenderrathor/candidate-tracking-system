const requestContext = (req) => ({
  ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
  userAgent: req.get('user-agent') || 'unknown',
});

module.exports = requestContext;
