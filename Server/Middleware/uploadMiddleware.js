const multer = require('multer');

// Configure Multer to store files in memory (RAM)
// This allows us to process the file before uploading to Cloudinary
const storage = multer.memoryStorage();

// Create the Multer instance with file validation
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed image MIME types
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
        }
    }
});

// Export a single-file upload middleware for 'photo' field
module.exports = upload.single('photo');
