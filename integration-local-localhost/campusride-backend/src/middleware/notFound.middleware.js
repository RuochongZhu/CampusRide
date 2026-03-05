export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    },
    meta: {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl
    }
  });
}; 