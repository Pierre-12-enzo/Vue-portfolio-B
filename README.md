# Portfolio2 Backend API

Simple and clean MEVN stack backend with CRUD operations for portfolio management.

## 🚀 Features

- **Authentication**: Session-based login/logout
- **Stacks CRUD**: Manage technology stacks
- **Works CRUD**: Manage portfolio projects  
- **User Management**: Admin user management
- **Contact Form**: Email integration
- **Public API**: Public endpoints for frontend

## 📋 API Endpoints

### Authentication
- `POST /api/signin` - User login
- `POST /api/signout` - User logout
- `GET /api/check-auth` - Check authentication status

### Public Routes
- `GET /api/stacks` - Get all active stacks
- `GET /api/works` - Get all active works
- `GET /api/works/:id` - Get single work
- `POST /api/contact` - Send contact message

### Dashboard Routes (Protected)

#### Stacks Management
- `GET /api/dashboard/stacks` - Get all stacks
- `POST /api/dashboard/stacks` - Create new stack
- `PUT /api/dashboard/stacks/:id` - Update stack
- `DELETE /api/dashboard/stacks/:id` - Delete stack

#### Works Management
- `GET /api/dashboard/works` - Get all works
- `POST /api/dashboard/works` - Create new work
- `PUT /api/dashboard/works/:id` - Update work
- `DELETE /api/dashboard/works/:id` - Delete work

#### User Management
- `GET /api/dashboard/users` - Get all users
- `POST /api/dashboard/users` - Create new user
- `PUT /api/dashboard/users/:id` - Update user
- `DELETE /api/dashboard/users/:id` - Delete user

#### Profile Management
- `GET /api/dashboard/profile` - Get current user profile
- `PUT /api/dashboard/profile` - Update current user profile

## 🗄️ Database Models

### User
```javascript
{
  firstName: String,
  lastName: String,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  avatar: String,
  bio: String,
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    website: String
  },
  isActive: Boolean
}
```

### Stack
```javascript
{
  name: String,
  description: String,
  category: String (Frontend/Backend/Database/DevOps/Mobile/Design/Other),
  proficiencyLevel: String (Beginner/Intermediate/Advanced/Expert),
  icon: String,
  color: String,
  link: String,
  yearsOfExperience: Number,
  featured: Boolean,
  isActive: Boolean,
  order: Number,
  createdBy: ObjectId (User)
}
```

### Work
```javascript
{
  title: String,
  description: String,
  shortDescription: String,
  category: String (Web Development/Mobile App/Desktop App/API/Design/Other),
  status: String (Planning/In Progress/Completed/On Hold),
  technologies: [ObjectId] (Stack references),
  images: [{
    url: String,
    caption: String,
    isMain: Boolean
  }],
  links: {
    live: String,
    github: String,
    documentation: String
  },
  features: [String],
  duration: {
    startDate: Date,
    endDate: Date
  },
  featured: Boolean,
  isActive: Boolean,
  order: Number,
  createdBy: ObjectId (User)
}
```

## 🔧 Setup

1. Copy `.env.example` to `.env` and configure your settings
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## 📝 Environment Variables

- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `SESSION_SECRET` - Session secret key
- `EMAIL_USER` - Gmail address for contact form
- `EMAIL_PASS` - Gmail app password
- `FRONTEND_URL` - Frontend URL for CORS

## 🛡️ Security Features

- Password hashing with bcryptjs
- Session-based authentication
- CORS protection
- Input validation
- Protected dashboard routes

## 📦 Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- bcryptjs - Password hashing
- express-session - Session management
- connect-mongo - MongoDB session store
- nodemailer - Email sending
- cors - CORS middleware
- dotenv - Environment variables
