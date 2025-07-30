# Prescripto 🏥

<div align="center">
  <img src="frontend/src/assets/logo.svg" alt="Prescripto Logo" width="200">
  <p><em>Your Complete Healthcare Management Solution</em></p>
</div>

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.16.1-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=flat-square&logo=socket.io)](https://socket.io/)

## 📋 Overview

Prescripto is a comprehensive healthcare platform that connects patients with doctors, streamlines appointment scheduling, and facilitates medical consultations. The platform integrates AI-powered symptom analysis to help patients identify potential conditions and find appropriate specialists. The platform consists of three main components:

- **Patient Portal** - For users to find doctors, book appointments, manage their healthcare, and use AI symptom checker
- **Doctor Dashboard** - For healthcare providers to manage patients and appointments
- **Admin Panel** - For platform administrators to oversee operations and manage users

## ✨ Features

### Multilingual Support
- 🌐 User interface in English
- 🗣️ AI symptom analysis in multiple languages (English, Hindi, Gujarati)
- 🔍 Specialized medical terminology recognition across languages

### For Patients
- 👨‍⚕️ Browse and search for doctors by specialty
- 📅 Book and manage appointments
- 💬 Verify email and OTP for secure registration
- 💰 Online payment processing with Razorpay
- 👤 Personal profile management
- 📊 View appointment history
- 🤖 AI-powered symptom checker with multilingual support (English, Hindi, Gujarati)
- 🩺 Get AI-suggested specialists based on symptoms
- 📝 Access symptom analysis history

### For Doctors
- 👨‍⚕️ Manage professional profile
- 📅 View and manage appointment schedule
- 👥 Access patient information
- ⚙️ Configure availability and settings

### For Administrators
- 👥 Manage doctors and patients
- 📊 Dashboard with key metrics
- 📅 Monitor appointments
- 💰 Track payment history
- ⚙️ System configuration

## 🏗️ Architecture

The project follows a modern three-tier architecture:

```
Prescripto/
├── frontend/    # Patient-facing web application
├── admin/       # Admin dashboard
└── backend/     # API server and database operations
```

## 🛠️ Tech Stack

### Frontend & Admin
- **React** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - API requests
- **Socket.IO Client** - Real-time communication
- **React Toastify** - Notifications
- **Vite** - Build tool

### Backend
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Image storage
- **Nodemailer** - Email notifications
- **MJML** - Email templates
- **Socket.IO** - Real-time communication
- **Razorpay** - Payment processing
- **OpenRouter AI** - AI-powered symptom analysis and specialist recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Cloudinary account
- Razorpay account (for payments)
- SMTP server (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thebhautikgajera/prescripto.git
   cd prescripto
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file with MongoDB URI, JWT secret, etc.
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Configure your .env file with API URL
   npm run dev
   ```

4. **Set up the admin panel**
   ```bash
   cd ../admin
   npm install
   cp .env.example .env
   # Configure your .env file with API URL
   npm run dev
   ```

### Environment Variables

Create `.env` files in each directory with the following variables:

**Backend**
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/prescripto
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_SERVICE=smtp
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Frontend & Admin**
```
VITE_API_URL=http://localhost:4000
VITE_BACKEND_URI=http://localhost:4000
```

## 💳 Payment Integration

Prescripto uses Razorpay for payment processing. For testing, use the following credentials:

- **Card Number**: 5267 3181 8797 5449
- **Expiry**: Any future date
- **CVV**: Any 3-digit number
- **Name**: Any name
- **OTP**: Any 6 digits (e.g., 123456)

## 📱 Screenshots

<div align="center">
  <img src="frontend/src/assets/about_image.png" alt="Prescripto Screenshot" width="400">
</div>

## 🧪 Testing

```bash
# Backend API tests
cd backend
npm test
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Email verification
- Secure payment processing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

For any inquiries, please reach out to [workwithbhautik@gmail.com](mailto:workwithbhautik@gmail.com).

---

<div align="center">
  <p>Made with ❤️ by thebhautikgajera</p>
</div>