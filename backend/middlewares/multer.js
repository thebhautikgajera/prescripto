import multer from 'multer'
import path from 'path'

// Configure storage
const storage = multer.diskStorage({ 
    destination: function(req, file, callback) {
        callback(null, './uploads/')
    },
    filename: function(req, file, callback){ 
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        callback(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})

// File filter for image types
const fileFilter = (req, file, callback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        callback(null, true)
    } else {
        callback(new Error('Only image files are allowed!'), false)
    }
}

// Create multer instance with error handling
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})

// Custom error handler middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            })
        }
        return res.status(400).json({
            success: false,
            message: `Multer upload error: ${err.message}`
        })
    } else if (err) {
        // An unknown error occurred
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload failed'
        })
    }
    next()
}

export { upload, handleMulterError }