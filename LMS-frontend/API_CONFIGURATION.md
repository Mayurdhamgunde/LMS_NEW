# API Configuration Guide

## Overview
This frontend application has been configured to make direct API calls to the backend without using Vite's proxy configuration.

## Configuration Files

### 1. `src/config/api.ts`
Centralized API configuration file containing:
- Base URL configuration
- All API endpoints organized by feature
- Request configuration settings
- Helper functions for building URLs

### 2. `src/utils/axiosConfig.ts`
Axios configuration with:
- Base URL setup
- Request/response interceptors
- Authentication token handling
- Tenant ID management
- Error handling and retry logic

### 3. `vite.config.ts`
Vite configuration with proxy removed for direct API calls.

## Environment Variables

Create a `.env` file in the frontend root directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:2000

# Development Configuration
VITE_APP_TITLE=LMS Frontend
VITE_APP_VERSION=1.0.0
```

## API Endpoints Structure

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update profile
- `PUT /api/auth/updatepassword` - Update password

### Courses (No /api prefix)
- `GET /courses` - List courses
- `POST /courses` - Create course
- `GET /courses/:id` - Get course details
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `GET /courses/public/ngo-courses` - Public courses
- `GET /courses/ngo-lms/ngo-public-courses` - NGO public courses

### Video Quizzes (No /api prefix)
- `GET /vq` - List video quizzes
- `POST /vq` - Create video quiz
- `GET /vq/:id` - Get video quiz details
- `PUT /vq/:id` - Update video quiz
- `DELETE /vq/:id` - Delete video quiz
- `GET /vq/search` - Search quizzes
- `GET /vq/statistics` - Get quiz statistics

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments/:id` - Get assignment details
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users` - Update user

### Progress
- `GET /api/progress/stats` - Get progress statistics
- `PUT /api/progress` - Update progress

### Uploads
- `/uploads/avatars` - Avatar images
- `/uploads/course-thumbnails` - Course thumbnails
- `/uploads/assignments` - Assignment files

## Usage Examples

### Using the API Configuration
```typescript
import { API_CONFIG } from '../config/api';

// Direct endpoint usage
const loginUrl = API_CONFIG.ENDPOINTS.AUTH.LOGIN;

// Dynamic endpoints with parameters
const courseUrl = API_CONFIG.ENDPOINTS.COURSES.GET('course123');

// Using helper functions
import { buildApiUrl, getEndpoint } from '../config/api';
const fullUrl = buildApiUrl('/api/auth/login');
```

### Making API Calls
```typescript
import axios from '../utils/axiosConfig';

// The base URL is automatically set
const response = await axios.get('/api/auth/login');
const courses = await axios.get('/courses');
const videoQuiz = await axios.get('/vq/quiz123');
```

## Key Benefits

1. **No Proxy Dependency**: Direct communication with backend
2. **Centralized Configuration**: All endpoints in one place
3. **Type Safety**: TypeScript support for endpoints
4. **Easy Maintenance**: Update endpoints in one location
5. **Environment Flexibility**: Easy to switch between dev/staging/prod

## Migration Notes

- Removed Vite proxy configuration
- Updated axios to use direct base URL
- All existing API calls will continue to work
- New centralized endpoint configuration available
- Backward compatibility maintained

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend has proper CORS configuration:

```javascript
// In backend server.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true
}));
```

### Port Mismatch
Ensure the `VITE_API_URL` in your `.env` file matches your backend port (default: 2000).

### Network Issues
- Check if backend is running
- Verify port configuration
- Check firewall settings
- Ensure no proxy interference
