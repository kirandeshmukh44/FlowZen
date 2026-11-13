
const bcrypt = require('bcryptjs');
const User = require('../Models/User');
const Company = require('../Models/Company');

//JWT Token Generation Function
const jwt = require('jsonwebtoken');

// NOTE: public self-registration was removed in Phase 2.
// Companies are created via registerCompany; users are created by
// Admin/Manager via POST /api/users. This function is kept for
// reference but is no longer routed.
const registerUser = async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Public registration is disabled. Use POST /api/auth/register-company.'
    });
};

// POST /api/auth/register-company { companyName, adminName, email, password }
// Creates the Company and its first Admin user, returns a JWT immediately.
const registerCompany = async (req, res) => {
    try {
        const { companyName, adminName, email, password } = req.body || {};

        if (!companyName || !adminName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Company name, admin name, email and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCompany = companyName.trim();

        // Email must be unique per company; since no company exists yet,
        // reject if the email is already taken anywhere to avoid ambiguity.
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        const company = await Company.create({ name: normalizedCompany });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: adminName.trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'Admin',
            companyId: company._id
        });

        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Company registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                mustChangePassword: false,
                createdBy: user.createdBy || null
            },
            company: { id: company._id, name: company.name }
        });
    } catch (error) {
        console.error('Register company error:', error.message);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered'
            });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password, company } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Email is unique per company, not globally — collect all matches.
        let candidates = await User.find({ email: normalizedEmail });

        // Optional company disambiguation by company name or id.
        if (company && candidates.length > 1) {
            const companyDoc = await Company.findOne({
                $or: [
                    { _id: /^[0-9a-fA-F]{24}$/.test(company) ? company : null },
                    { name: new RegExp(`^${String(company).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                ].filter(Boolean)
            });
            if (companyDoc) {
                candidates = candidates.filter((u) => u.companyId.toString() === companyDoc._id.toString());
            }
        }

        if (candidates.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        if (candidates.length > 1) {
            return res.status(409).json({
                success: false,
                message: 'This email exists in multiple companies. Please specify the company.'
            });
        }

        const user = candidates[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.accountStatus !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                mustChangePassword: !!user.mustChangePassword,
                createdBy: user.createdBy || null
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


// POST /api/auth/change-password — any authenticated user.
// Verifies the current password, stores the new hash, clears
// mustChangePassword. Body validated by zod in the route layer.
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.mustChangePassword = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { registerUser, loginUser, changePassword, registerCompany };
