const { z } = require('zod');

// Shared zod schemas + a small middleware that returns 400 with
// { success:false, message, errors } on validation failure.

const email = z.string().trim().toLowerCase().email('Invalid email address').max(254);
const password = z.string().min(6, 'Password must be at least 6 characters').max(128);
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const schemas = {
    login: z.object({
        email,
        password,
        company: z.string().trim().max(120).optional(),
    }),
    registerCompany: z.object({
        companyName: z.string().trim().min(1).max(120),
        adminName: z.string().trim().min(1).max(120),
        email,
        password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    }),
    changePassword: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
    }),
    createUser: z.object({
        name: z.string().trim().min(1).max(120),
        email,
        role: z.enum(['Manager', 'Employee']),
        managerId: objectId.optional(),
    }),
    createTask: z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().max(5000).optional().default(''),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
        deadline: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid deadline'),
        // Optional Phase-3 fields accepted now so clients can send them early
        importance: z.number().int().min(1).max(10).optional(),
        urgency: z.number().int().min(1).max(10).optional(),
        effort: z.number().int().min(1).max(10).optional(),
        tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
        category: z.string().trim().max(60).optional(),
    }),
    updateTask: z.object({
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
        status: z.enum(['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Review']).optional(),
        deadline: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid deadline').optional(),
        importance: z.number().int().min(1).max(10).optional(),
        urgency: z.number().int().min(1).max(10).optional(),
        effort: z.number().int().min(1).max(10).optional(),
        tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
        category: z.string().trim().max(60).optional(),
    }).refine((o) => Object.keys(o).length > 0, { message: 'No valid fields to update' }),
    assignTask: z.object({ taskId: objectId, employeeId: objectId }),
    taskUpdate: z.object({
        taskId: objectId,
        newStatus: z.enum(['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Review']),
        progressNote: z.string().max(2000).optional(),
    }),
};

// validate(schema) -> express middleware; stores parsed body on req.body
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
    }
    req.body = result.data;
    next();
};

module.exports = { schemas, validate, objectId };
