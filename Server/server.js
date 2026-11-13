const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./Router/authRoutes');
const userRoutes = require('./Router/userRoutes');
const taskRoutes = require('./Router/taskRoutes');
const taskAssignmentRoutes = require('./Router/taskAssignmentRoutes');
const taskUpdateRoutes = require('./Router/taskUpdateRoutes');
const notificationRoutes = require('./Router/notificationRoutes');
const AISuggestionRoutes = require('./Router/aiSuggestionRoutes');
const commentRoutes = require('./Router/commentRoutes');
const chatRoutes = require('./Router/chatRoutes');
const conversationRoutes = require('./Router/conversationRoutes');
const rewardsRoutes = require('./Router/rewardsRoutes');
const profileRoutes = require('./Router/profileRoutes');


const app = express();

app.use(express.json());
app.use(cors({ origin: [process.env.CLIENT_ORIGIN || 'http://localhost:5173', 'http://localhost:5173', 'http://127.0.0.1:5173'] }));

// Dev request log — method, path, status, duration. Never logs bodies,
// so passwords and tokens cannot leak into the console.
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        const start = process.hrtime.bigint();
        res.on('finish', () => {
            const ms = Number(process.hrtime.bigint() - start) / 1e6;
            console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(0)}ms)`);
        });
        next();
    });
}

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-assignments', taskAssignmentRoutes);
app.use('/api/task-updates', taskUpdateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-suggestions', AISuggestionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/rewards', rewardsRoutes);


const User = require('./Models/User');
const Company = require('./Models/Company');
const Task = require('./Models/Task');
const TaskAssignment = require('./Models/TaskAssignment');
const TaskUpdate =  require('./Models/TaskUpdate');
const Notification = require('./Models/Notification');
const AISuggestion = require('./Models/AISuggestion');  
const Comment = require('./Models/Comment');
const Conversation = require('./Models/Conversation');
const Message = require('./Models/Message');

// Test Route
app.get('/', (req, res) => {
    res.send("FlowZen Server Is Running.......!");
});

//Health Check Route
app.get('/api/health', (req, res) =>{
    res.status(200).json({
        success: true,
        message: "FlowZen Server Is Healthy And Running Smoothly",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// Serve built React client (single-service deploys like Railway).
// Only active when Client/dist exists; harmless in local dev.
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '..', 'Client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const { host, name } = mongoose.connection;
        console.log(`MongoDB Atlas Connected Successfully`);
        console.log(`  host: ${host}`);
        console.log(`  database: ${name}`);
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

// Start Server
const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
