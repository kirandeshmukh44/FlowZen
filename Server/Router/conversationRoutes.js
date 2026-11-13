const express = require('express');
const {
    listConversations,
    createConversation,
    listMessages,
    createMessage,
    markConversationRead
} = require('../Controllers/conversationController');
const { protect } = require('../Middleware/authMiddleware');
const { objectId } = require('../utils/validate');

const router = express.Router();

const validId = (req, res, next) => {
    if (!objectId.safeParse(req.params.id).success) {
        return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    }
    next();
};

router.get('/', protect, listConversations);
router.post('/', protect, createConversation);
router.get('/:id/messages', protect, validId, listMessages);
router.post('/:id/messages', protect, validId, createMessage);
router.post('/:id/read', protect, validId, markConversationRead);

module.exports = router;
