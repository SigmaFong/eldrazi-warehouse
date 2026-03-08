// Circuit Breaker Middleware (Module 3.3)
// Tracks per-IP request counts in a sliding window.
// Once an IP exceeds the threshold it is temporarily blocked.

const ipStore = new Map(); // ip -> { count, windowStart, blocked, blockedUntil }

const WINDOW_MS   = 60 * 1000;  // 1 minute rolling window
const MAX_REQUESTS = 100;        // requests per window before trip
const BLOCK_MS    = 5 * 60 * 1000; // 5-minute cooldown

const circuitBreaker = (req, res, next) => {
  const ip  = req.ip || req.socket.remoteAddress;
  const now = Date.now();

  if (!ipStore.has(ip)) {
    ipStore.set(ip, { count: 0, windowStart: now, blocked: false, blockedUntil: null });
  }

  const state = ipStore.get(ip);

  // --- check if currently blocked ---
  if (state.blocked) {
    if (now < state.blockedUntil) {
      const retryAfterSec = Math.ceil((state.blockedUntil - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        status: "fail",
        message: `Circuit open. Too many requests from ${ip}. Retry after ${retryAfterSec}s.`,
        retryAfter: retryAfterSec,
      });
    }
    // cooldown expired — reset
    state.blocked      = false;
    state.count        = 0;
    state.windowStart  = now;
    state.blockedUntil = null;
  }

  // --- slide window ---
  if (now - state.windowStart > WINDOW_MS) {
    state.count       = 0;
    state.windowStart = now;
  }

  state.count += 1;

  // --- trip the breaker ---
  if (state.count > MAX_REQUESTS) {
    state.blocked      = true;
    state.blockedUntil = now + BLOCK_MS;
    console.warn(`⚡ Circuit tripped for IP: ${ip}`);
    return res.status(429).json({
      status: "fail",
      message: `Circuit open. IP ${ip} exceeded ${MAX_REQUESTS} requests/min.`,
      retryAfter: BLOCK_MS / 1000,
    });
  }

  // Expose headers for monitoring
  res.setHeader("X-RateLimit-Limit",     MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - state.count);
  res.setHeader("X-RateLimit-Reset",     Math.ceil((state.windowStart + WINDOW_MS) / 1000));

  next();
};

// Admin endpoint to inspect circuit state
export const getCircuitState = (req, res) => {
  const state = [];
  ipStore.forEach((v, k) => state.push({ ip: k, ...v }));
  res.json({ status: "success", data: state });
};

export default circuitBreaker;
