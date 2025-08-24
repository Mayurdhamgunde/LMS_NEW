# LMS Frontend

A React-based frontend for the Learning Management System with multi-tenant architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Backend server running on port 2000

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file in the root directory:

**Option 1: Use the setup script**
```bash
# Windows
setup-env.bat

# PowerShell
.\setup-env.ps1
```

**Option 2: Manual setup**
```bash
# Create .env file with:
VITE_API_URL=http://localhost:2000
VITE_APP_TITLE=LMS Frontend
VITE_APP_VERSION=1.0.0
```

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Configuration

### API Configuration
The frontend is configured to make direct API calls to the backend without using Vite's proxy:

- **Base URL**: `http://localhost:2000` (configurable via `VITE_API_URL`)
- **Authentication**: JWT-based with Bearer tokens
- **Tenant Support**: Multi-tenant architecture with tenant ID headers
- **CORS**: Configured for localhost development ports

### Key Files
- `src/config/api.ts` - Centralized API endpoint configuration
- `src/utils/axiosConfig.ts` - Axios configuration and interceptors
- `vite.config.ts` - Vite configuration (proxy removed)

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Courses
- `GET /courses` - List courses
- `POST /courses` - Create course
- `GET /courses/:id` - Get course details

### Video Quizzes
- `GET /vq` - List video quizzes
- `POST /vq` - Create video quiz
- `GET /vq/:id` - Get video quiz details

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment

## 🧪 Testing

Use the `ApiTest` component to verify API connectivity:

```tsx
import ApiTest from './components/ui/ApiTest';

// Add to your component
<ApiTest />
```

## 🔄 Migration from Proxy

If you were previously using Vite's proxy configuration:

1. ✅ Proxy configuration removed from `vite.config.ts`
2. ✅ Axios configured with direct base URL
3. ✅ CORS configured on backend for localhost ports
4. ✅ All existing API calls continue to work
5. ✅ New centralized endpoint configuration available

## 🚨 Troubleshooting

### CORS Issues
Ensure your backend CORS configuration includes your frontend port:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### Port Mismatch
Verify `VITE_API_URL` matches your backend port (default: 2000)

### Network Issues
- Check if backend is running
- Verify port configuration
- Check firewall settings
- Ensure no proxy interference

## 📁 Project Structure

```
src/
├── components/          # React components
├── config/             # Configuration files
│   └── api.ts         # API endpoint configuration
├── context/            # React context providers
├── utils/              # Utility functions
│   └── axiosConfig.ts # Axios configuration
└── ...
```

## 🤝 Contributing

1. Follow the existing code structure
2. Use the centralized API configuration
3. Test API connectivity before submitting changes
4. Update API documentation if adding new endpoints

## 📄 License

This project is part of the LMS system.
