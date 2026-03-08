import { AppError } from "../utils/apiHelpers.js";

// ── Mongoose-specific error handlers ─────────────────────────────────────
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate value for field: "${field}". Please use another value.`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(`Validation failed: ${errors.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

// ── Response formatters ───────────────────────────────────────────────────
const sendErrorDev = (err, res) =>
  res.status(err.statusCode).json({
    status:     err.status,
    message:    err.message,
    stack:      err.stack,
    error:      err,
  });

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }
  console.error("💥 UNEXPECTED ERROR:", err);
  return res.status(500).json({ status: "error", message: "Something went wrong." });
};

// ── Main error middleware ─────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || "error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  }

  let error = { ...err, message: err.message };
  if (error.name === "CastError")               error = handleCastErrorDB(error);
  if (error.code  === 11000)                     error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError")          error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError")        error = handleJWTError();
  if (error.name === "TokenExpiredError")        error = handleJWTExpiredError();

  sendErrorProd(error, res);
};

export default globalErrorHandler;
