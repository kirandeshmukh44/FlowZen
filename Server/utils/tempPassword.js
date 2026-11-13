const crypto = require('crypto');

// Human-typeable temporary password, e.g. "FZ-9f3kQ2mX".
// Returned ONCE to the creator; only the bcrypt hash is stored.
const generateTempPassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = crypto.randomBytes(10);
    let body = '';
    for (const b of bytes) body += alphabet[b % alphabet.length];
    return `FZ-${body}`;
};

module.exports = { generateTempPassword };
