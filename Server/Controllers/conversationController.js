const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const User = require('../Models/User');
const Task = require('../Models/Task');
const TaskAssignment = require('../Models/TaskAssignment');
const { isTaskInScope } = require('../utils/taskScope');

const publicUser = (u) => u ? {
    id: u._id || u.id,
    name: u.name,
    email: u.email,
    role: u.role
} : null;

// 'general' conversations are open to every active member of the company.
const isGeneral = (conv) => conv.type === 'general';

// Participant + company check shared by message endpoints.
const getParticipantConversation = async (req, res) => {
    const conv = await Conversation.findOne({
        _id: req.params.id,
        companyId: req.user.companyId
    });
    if (!conv) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return null;
    }
    if (isGeneral(conv)) return conv;
    const isParticipant = conv.participantIds.some(
        (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
        res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
        return null;
    }
    return conv;
};

const myLastReadAt = (conv, userId) => {
    const marker = (conv.readMarkers || []).find(
        (m) => m.userId && m.userId.toString() === userId.toString()
    );
    return marker ? new Date(marker.lastReadAt) : null;
};

const serializeConversation = async (conv, userId) => {
    const obj = conv.toObject ? conv.toObject() : conv;
    obj.id = obj._id;
    obj.participants = (obj.participantIds || []).map(publicUser);
    delete obj.participantIds;
    delete obj.readMarkers;
    delete obj.companyId;

    const last = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .populate('senderId', 'name role')
        .lean();
    obj.lastMessage = last ? {
        id: last._id,
        message: last.message,
        sender: publicUser(last.senderId),
        createdAt: last.createdAt
    } : null;

    // Unread = messages after my last read marker, sent by someone else
    const lastRead = myLastReadAt(conv, userId);
    const unreadFilter = {
        companyId: conv.companyId,
        conversationId: conv._id,
        senderId: { $ne: userId }
    };
    if (lastRead) unreadFilter.createdAt = { $gt: lastRead };
    obj.unreadCount = await Message.countDocuments(unreadFilter);
    return obj;
};

// GET /api/conversations — conversations the current user participates in.
const listConversations = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const filter = {
            companyId,
            $or: [
                { participantIds: req.user._id },
                { type: 'general' }
            ]
        };
        const conversations = await Conversation.find(filter)
            .populate('participantIds', 'name email role')
            .populate('taskId', 'title status deadline')
            .sort({ lastMessageAt: -1 });

        const result = await Promise.all(
            conversations.map((c) => serializeConversation(c, req.user._id))
        );

        return res.status(200).json({
            success: true,
            count: result.length,
            conversations: result
        });
    } catch (error) {
        console.error('List conversations error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/conversations
//  { userId }            -> DM (type inferred)
//  { type:'dm', userId } -> same as above
//  { taskId }            -> task thread (type inferred); requires 2+ assignees
//  { type:'task', taskId } -> same as above
//  { type:'general' }    -> get-or-create the workspace channel
const createConversation = async (req, res) => {
    try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        let { type, userId, taskId } = body;
        const companyId = req.user.companyId;

        // Infer type when the client sends a bare { userId } or { taskId }
        if (!type) {
            if (userId) type = 'dm';
            else if (taskId) type = 'task';
        }

        if (type === 'general') {
            let conv = await Conversation.findOne({ companyId, type: 'general' });
            if (!conv) {
                conv = await Conversation.create({
                    companyId,
                    type: 'general',
                    participantIds: []
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Conversation ready',
                conversation: await serializeConversation(conv, req.user._id)
            });
        }

        if (type === 'dm') {
            if (!userId || userId === req.user._id.toString()) {
                return res.status(400).json({ success: false, message: 'A different userId is required for dm conversations' });
            }
            const other = await User.findOne({
                _id: userId,
                companyId,
                accountStatus: 'Active'
            });
            if (!other) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Role rules:
            //  Admin    -> anyone in the workspace
            //  Manager  -> Admins + Employees they created (their reports)
            //  Employee -> Admins + the Manager/Admin who created them
            const me = req.user._id.toString();
            const otherId = other._id.toString();
            const createdByMe = other.createdBy && other.createdBy.toString() === me;
            const createdMe = req.user.createdBy && req.user.createdBy.toString() === otherId;

            if (req.user.role === 'Employee') {
                const allowed = other.role === 'Admin' || createdMe;
                if (!allowed) {
                    return res.status(403).json({
                        success: false,
                        message: 'Employees can only message their Manager or an Admin'
                    });
                }
            } else if (req.user.role === 'Manager') {
                const allowed = other.role === 'Admin' || (other.role === 'Employee' && createdByMe);
                if (!allowed) {
                    return res.status(403).json({
                        success: false,
                        message: 'Managers can only message Admins and their own Employees'
                    });
                }
            }
            // Admin: no restriction beyond same-company (already enforced)

            const existing = await Conversation.findOne({
                companyId,
                type: 'dm',
                participantIds: { $all: [req.user._id, other._id], $size: 2 }
            });
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'Conversation already exists',
                    conversation: await serializeConversation(existing, req.user._id)
                });
            }

            const conv = await Conversation.create({
                companyId,
                type: 'dm',
                participantIds: [req.user._id, other._id]
            });
            await conv.populate('participantIds', 'name email role');
            return res.status(201).json({
                success: true,
                message: 'Conversation created',
                conversation: await serializeConversation(conv, req.user._id)
            });
        }

        if (type === 'task') {
            if (!taskId) {
                return res.status(400).json({ success: false, message: 'taskId is required for task conversations' });
            }
            const task = await Task.findOne({ _id: taskId, companyId });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found' });
            }

            const assignments = await TaskAssignment.find({ taskId: task._id, companyId })
                .populate('employeeId', 'name email role')
                .lean();
            const assigneeIds = assignments.map((a) => a.employeeId?._id || a.employeeId).filter(Boolean);

            // Task threads exist when the task has at least 1 assignee
            // (participants = assignees + creator, deduped below).
            if (assigneeIds.length < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Assign the task to at least one member before opening a thread'
                });
            }

            // Employees must be assignees; Manager limited to team scope;
            // Admin always allowed
            const isAssignee = assigneeIds.some((id) => id.toString() === req.user._id.toString());
            if (req.user.role === 'Employee' && !isAssignee) {
                return res.status(403).json({ success: false, message: 'You can only open threads for tasks assigned to you' });
            }
            if (req.user.role === 'Manager' && !(await isTaskInScope(req.user, task))) {
                return res.status(403).json({ success: false, message: 'This task is outside your team scope' });
            }

            const existing = await Conversation.findOne({ companyId, type: 'task', taskId: task._id });
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'Conversation already exists',
                    conversation: await serializeConversation(existing, req.user._id)
                });
            }

            // Participants: all assignees + task creator (deduped)
            const participantSet = new Map();
            for (const id of assigneeIds) participantSet.set(id.toString(), id);
            if (task.createdBy) participantSet.set(task.createdBy.toString(), task.createdBy);

            const conv = await Conversation.create({
                companyId,
                type: 'task',
                taskId: task._id,
                participantIds: [...participantSet.values()]
            });
            await conv.populate('participantIds', 'name email role');
            await conv.populate('taskId', 'title status deadline');
            return res.status(201).json({
                success: true,
                message: 'Conversation created',
                conversation: await serializeConversation(conv, req.user._id)
            });
        }

        return res.status(400).json({ success: false, message: "Provide { userId } for a DM, { taskId } for a task thread, or { type: 'general' }" });
    } catch (error) {
        console.error('Create conversation error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/conversations/:id/messages?after=<ISO date>
const listMessages = async (req, res) => {
    try {
        const conv = await getParticipantConversation(req, res);
        if (!conv) return;

        const filter = {
            companyId: req.user.companyId,
            conversationId: conv._id
        };
        if (req.query.after) {
            const after = new Date(req.query.after);
            if (!Number.isNaN(after.getTime())) {
                filter.createdAt = { $gt: after };
            }
        }

        const messages = await Message.find(filter)
            .populate('senderId', 'name role')
            .sort({ createdAt: 1 })
            .limit(200);

        return res.status(200).json({ success: true, count: messages.length, messages });
    } catch (error) {
        console.error('List messages error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/conversations/:id/messages { message }
const createMessage = async (req, res) => {
    try {
        const conv = await getParticipantConversation(req, res);
        if (!conv) return;

        const { message } = req.body || {};
        if (!message || !String(message).trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }
        if (String(message).trim().length > 2000) {
            return res.status(400).json({ success: false, message: 'Message exceeds 2000 characters' });
        }

        const doc = await Message.create({
            companyId: req.user.companyId,
            conversationId: conv._id,
            senderId: req.user._id,
            message: String(message).trim()
        });
        await doc.populate('senderId', 'name role');

        conv.lastMessageAt = new Date();
        // Sender has implicitly read their own message
        const markerIdx = conv.readMarkers.findIndex(
            (m) => m.userId && m.userId.toString() === req.user._id.toString()
        );
        if (markerIdx >= 0) {
            conv.readMarkers[markerIdx].lastReadAt = new Date();
        } else {
            conv.readMarkers.push({ userId: req.user._id, lastReadAt: new Date() });
        }
        await conv.save();

        // Notify every other participant that a new message arrived.
        const Notification = require('../Models/Notification');
        const preview = String(message).trim().slice(0, 80);
        const convLabel = conv.type === 'task' ? 'task thread' : 'chat';
        await Promise.all(
            (conv.participantIds || [])
                .filter((pid) => pid && pid.toString() !== req.user._id.toString())
                .map((pid) =>
                    Notification.create({
                        notificationId: `NOT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        userId: pid,
                        companyId: req.user.companyId,
                        message: `New ${convLabel} message: "${preview}"`,
                        notificationType: 'Message'
                    }).catch(() => null)
                )
        );

        return res.status(201).json({ success: true, message: doc });
    } catch (error) {
        console.error('Create message error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// POST /api/conversations/:id/read — mark the conversation read for me
const markConversationRead = async (req, res) => {
    try {
        const conv = await getParticipantConversation(req, res);
        if (!conv) return;

        const now = new Date();
        const markerIdx = conv.readMarkers.findIndex(
            (m) => m.userId && m.userId.toString() === req.user._id.toString()
        );
        if (markerIdx >= 0) {
            conv.readMarkers[markerIdx].lastReadAt = now;
        } else {
            conv.readMarkers.push({ userId: req.user._id, lastReadAt: now });
        }
        await conv.save();

        return res.status(200).json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
        console.error('Mark conversation read error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { listConversations, createConversation, listMessages, createMessage, markConversationRead };
