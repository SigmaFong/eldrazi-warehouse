export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status     = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Wrap async route handlers — eliminates try/catch boilerplate
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Build a standardised API response
export const sendSuccess = (res, statusCode, data, meta = {}) => {
  res.status(statusCode).json({
    status: "success",
    ...meta,
    data,
  });
};
