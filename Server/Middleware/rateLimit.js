const rateLimit = require('express-rate-limit');

const envInt = (name, fallback) => {
    const v = parseInt(process.env[name], 10);
    return Number.isFinite(v) && v > 0 ? v : fallback;
};

// Strict limiter for credential endpoints (login/register/change-password).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: envInt('RATE_LIMIT_AUTH_MAX', 100),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
});

// Tighter limiter just for login to slow credential stuffing.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: envInt('RATE_LIMIT_LOGIN_MAX', 30),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

module.exports = { authLimiter, loginLimiter };
