// API Configuration
export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:2000',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      ME: '/api/auth/me',
      UPDATE_PROFILE: '/api/auth/updateprofile',
      UPDATE_PASSWORD: '/api/auth/updatepassword',
    },
    
    // User endpoints
    USERS: {
      PROFILE: '/api/users/profile',
      UPDATE: '/api/users',
    },
    
    // Course endpoints (note: no /api prefix in backend)
    COURSES: {
      LIST: '/courses',
      CREATE: '/courses',
      GET: (id: string) => `/courses/${id}`,
      UPDATE: (id: string) => `/courses/${id}`,
      DELETE: (id: string) => `/courses/${id}`,
      PROGRESS: (id: string) => `/courses/${id}/progress`,
      RATING: (id: string) => `/courses/${id}/rating`,
      ENROLL: (id: string) => `/courses/${id}/enroll`,
      CREATOR: (creatorId: string) => `/courses/creator/${creatorId}`,
      STATS: (id: string) => `/courses/${id}/stats`,
      PUBLIC: '/courses/public/ngo-courses',
      PUBLIC_DETAIL: (courseId: string) => `/courses/public/ngo-courses/${courseId}`,
      NGO_PUBLIC: '/courses/ngo-lms/ngo-public-courses',
      NGO_PUBLIC_DETAIL: (courseId: string) => `/courses/ngo-lms/ngo-public-course/${courseId}`,
    },
    
    // Module endpoints
    MODULES: {
      CREATE: (courseId: string) => `/courses/${courseId}/modules`,
      UPDATE: (id: string) => `/api/modules/${id}`,
      DELETE: (id: string) => `/api/modules/${id}`,
    },
    
    // Video Quiz endpoints (note: no /api prefix in backend)
    VIDEO_QUIZZES: {
      LIST: '/vq',
      CREATE: '/vq',
      GET: (id: string) => `/vq/${id}`,
      UPDATE: (id: string) => `/vq/${id}`,
      DELETE: (id: string) => `/vq/${id}`,
      SEARCH: '/vq/search',
      STATISTICS: '/vq/statistics',
      BULK_CREATE: '/vq/bulk',
      BY_TITLE: (title: string) => `/vq/title/${title}`,
      BY_MODULE: (moduleName: string) => `/vq/module/${moduleName}`,
      BY_COURSE: (courseName: string) => `/vq/course/${courseName}`,
      BY_CONTEXT: (board: string, grade: string, medium: string) => `/vq/context/${board}/${grade}/${medium}`,
      QUESTIONS: (id: string) => `/vq/${id}/questions`,
      QUESTION_UPDATE: (id: string, questionIndex: number) => `/vq/${id}/questions/${questionIndex}`,
      QUESTION_DELETE: (id: string, questionIndex: number) => `/vq/${id}/questions/${questionIndex}`,
    },
    
    // Assignment endpoints
    ASSIGNMENTS: {
      LIST: '/api/assignments',
      CREATE: '/api/assignments',
      GET: (id: string) => `/api/assignments/${id}`,
      UPDATE: (id: string) => `/api/assignments/${id}`,
      DELETE: (id: string) => `/api/assignments/${id}`,
      UPCOMING: '/api/assignments/upcoming',
      SUBMIT: (id: string) => `/api/assignments/${id}/submit`,
    },
    
    // Certification endpoints
    CERTIFICATIONS: {
      LIST: '/api/certifications',
      CREATE: '/api/certifications',
      GET: (id: string) => `/api/certifications/${id}`,
      UPDATE: (id: string) => `/api/certifications/${id}`,
      DELETE: (id: string) => `/api/certifications/${id}`,
    },
    
    // Institution endpoints
    INSTITUTIONS: {
      LIST: '/api/institutions',
      CREATE: '/api/institutions',
      GET: (id: string) => `/api/institutions/${id}`,
      UPDATE: (id: string) => `/api/institutions/${id}`,
      DELETE: (id: string) => `/api/institutions/${id}`,
    },
    
    // Progress endpoints
    PROGRESS: {
      STATS: '/api/progress/stats',
      UPDATE: '/api/progress',
    },
    
    // Tenant endpoints
    TENANTS: {
      LIST: '/api/tenants',
      CREATE: '/api/tenants',
      GET: (id: string) => `/api/tenants/${id}`,
      UPDATE: (id: string) => `/api/tenants/${id}`,
      DELETE: (id: string) => `/api/tenants/${id}`,
    },
    
    // Upload endpoints
    UPLOADS: {
      AVATARS: '/uploads/avatars',
      COURSE_THUMBNAILS: '/uploads/course-thumbnails',
      ASSIGNMENTS: '/uploads/assignments',
    },
    
    // Status endpoints
    STATUS: {
      CONNECTIONS: '/api/status/connections',
    },
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 1,
    RETRY_DELAY: 1000, // 1 second
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get endpoint with parameters
export const getEndpoint = (baseEndpoint: string, ...params: string[]): string => {
  return params.reduce((endpoint, param) => endpoint.replace(/:[^/]+/, param), baseEndpoint);
};
