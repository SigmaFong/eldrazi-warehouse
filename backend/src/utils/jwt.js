import jwt from "jsonwebtoken";

export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,                                      // XSS protection (Module 5.2)
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",       // HTTPS only in prod
  };

  res.cookie("jwt", token, cookieOptions);

  // Remove sensitive fields from output
  user.password     = undefined;
  user.loginAttempts= undefined;
  user.lockUntil    = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};
