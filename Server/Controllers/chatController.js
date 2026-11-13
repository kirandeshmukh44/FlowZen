const ChatMessage = require('../Models/ChatMessage');

const listMessages = async (req, res) => {
  try {
    const channel = String(req.query.channel || 'general').trim();
    const messages = await ChatMessage.find({ channel, companyId: req.user.companyId }).populate('senderId', 'name role').sort({ createdAt: 1 }).limit(100);
    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error('Get chat messages error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createMessage = async (req, res) => {
  try {
    const { message, channel = 'general' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
    const chatMessage = await ChatMessage.create({ senderId: req.user._id, channel: String(channel).trim(), companyId: req.user.companyId, message: message.trim() });
    await chatMessage.populate('senderId', 'name role');
    return res.status(201).json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('Create chat message error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { listMessages, createMessage };
