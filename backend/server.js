import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import appointmentRouter from './routes/appointmentRoute.js'
import paymentRouter from './routes/paymentRoute.js'
import reviewRouter from './routes/reviewRoute.js'
import aiRouter from './routes/aiRoute.js'
import fs from 'fs'
import path from 'path'
import { multipartErrorHandler, generalErrorHandler } from './middlewares/errorMiddleware.js'
import { handleMulterError } from './middlewares/multer.js'
import { fileURLToPath } from 'url'

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// app config
const app = express()
const port = process.env.PORT || 4000 
connectDB()
connectCloudinary()

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads'
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Create pdfs directory if it doesn't exist
const pdfsDir = './pdfs'
if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true })
}

// middlewares
app.use(express.json())

// Configure CORS to allow requests from deployed frontend and admin URLs
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:5173',
    'http://localhost:5174'
]

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
            return callback(new Error(msg), false)
        }
        return callback(null, true)
    },
    credentials: true
}))

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Serve static files from pdfs folder
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')))

// api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)
app.use('/api/appointment', appointmentRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/review', reviewRouter)
app.use('/api/ai', aiRouter)

app.get('/', (req, res)=>{
    res.send('API is working')
})

// Health check endpoint - no authentication required
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    })
})

// Authenticated health check endpoint
app.get('/api/health/auth', (req, res) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    // If we got here, at least the token format is valid
    // The actual token verification would be done by the authenticateToken middleware
    // but for a simple health check, we just verify the format
    res.status(200).json({
        success: true,
        message: 'Authenticated API is healthy',
        timestamp: new Date().toISOString()
    });
})

// Error handling middleware
app.use(handleMulterError)
app.use(multipartErrorHandler)
app.use(generalErrorHandler)

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    })
})

app.listen(port, () => {})