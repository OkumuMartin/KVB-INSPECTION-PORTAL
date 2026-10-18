function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

function errorHandler(err, req, res, next) {
  // In production, log only the message and status — never the full error object
  // (which includes stack traces and potentially sensitive request data).
  if (process.env.NODE_ENV === 'production') {
    console.error(`[${err.statusCode || 500}] ${err.message}`);
  } else {
    console.error(err);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `An item with that ${field} already exists.`,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.entries(err.errors).map(([field, detail]) => ({
      field,
      message: detail.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  if (err.name === 'StrictModeError') {
    return res.status(400).json({ success: false, message: 'Request contains fields that are not recognised.' });
  }

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Unable to process your request. Please try again later.';
  }

  return res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
