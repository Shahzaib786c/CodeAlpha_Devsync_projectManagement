export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'MulterError') return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Avatar must be 2 MB or smaller' : 'Send exactly one avatar file and no extra fields' });
  if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) });
  if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already registered' });
  if (['ValidationError','CastError'].includes(error.name)) return res.status(400).json({ success: false, message: 'Invalid data' });
  const status = error.status >= 400 && error.status <= 599 ? error.status : 500;
  if (status === 500) console.error('Request failed:', error.name);
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : error.message });
}
