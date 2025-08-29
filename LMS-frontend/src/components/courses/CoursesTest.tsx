import { useState, useEffect, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'

/**
 * Video Quiz API Integration Notes:
 * 
 * This component now uses enhanced video quiz APIs that include course context
 * to prevent issues when module names are the same across different subjects.
 * 
 * Key API endpoints:
 * - GET /vq/module/:moduleName/course/:courseName - New route for unique module+course queries
 * - GET /vq/module/:moduleName?courseName=X - Enhanced existing route with course filtering
 * - GET /vq/title/:videoTitle?courseName=X - Enhanced title search with course context
 * 
 * The component includes fallback mechanisms and utility functions for:
 * - Fetching video quizzes with proper course context
 * - Checking for existing quizzes to prevent duplicates
 * - Creating/updating quizzes with validation
 * - Error handling for course context issues
 */

// Helper function to create video object without _id (backend will generate it)
const createVideoObject = (videoUrl: string) => {
  return {
    videoUrl: videoUrl
  };
}
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline'

interface Course {
  _id: string
  title: string
  description: string
  slug: string
  price: number
  status: string
  isPublic: boolean
  iconName?: string
  progress?: number
  tenantId: string
  createdAt: string
  updatedAt: string
  // Optional educational context fields (may not be present in list response)
  board?: string
  grade?: number | string
  medium?: string | string[]
  // Optional module count for display
  moduleCount?: number
  // Creator information (optional in list response)
  createdBy?: {
    _id?: string
    name?: string
    email?: string
  }
}

type CorrectAnswerKey = 'a' | 'b' | 'c' | 'd'

interface QuizQuestionForm {
  que: string
  opt: {
    a: string
    b: string
    c: string
    d: string
  }
  correctAnswer: CorrectAnswerKey
  explanation: string
}

interface VideoQuizForm {
  videoTitle: string
  videoUrl: string
  ytId?: string
  moduleName: string
  topicName?: string
  subtopicName?: string
  courseName: string
  board: string
  grade: string
  medium: string | string[]
  quiz: QuizQuestionForm[]
}

interface Module {
  _id: string
  title: string
  description: string
  duration: string
  courseId: {
    _id: string
    title: string
    description: string
    calculatedProgress: number
    id: string
  }
  isCompleted: boolean
  videoUrl: string
  difficulty: string
  rating: number
  enrolledUsers: number
  tenantId: string
  createdAt: string
  updatedAt: string
  id: string
  videos?: {
    _id: string
    videoUrl: string
  }[]
  topics?: {
    topicName?: string
    topicname?: string // Backend might send lowercase
    subtopics?: { 
      subtopicName?: string
      subtopicname?: string // Backend might send lowercase
      videos?: {
        _id: string
        videoUrl: string
      }[]
    }[]
    videos?: {
      _id: string
      videoUrl: string
    }[]
  }[]
}

interface CoursesResponse {
  success: boolean
  data: Course[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
  }
}

interface ModulesResponse {
  success: boolean
  count: number
  data: Module[]
}

const Courses = ({ darkMode }: { darkMode: boolean }) => {
  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-sm',
    cardHover: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-lg',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    textAccent: darkMode ? 'text-blue-400' : 'text-blue-600',
    hoverBg: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    buttonText: darkMode ? 'text-white' : 'text-gray-900',
    skeletonBg: darkMode ? 'bg-white/10' : 'bg-gray-200',
    inputBg: darkMode ? 'bg-gray-700' : 'bg-white',
    input: darkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: darkMode
      ? 'border-white/10 text-white hover:bg-white/5'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
    dialogBg: darkMode ? 'bg-gray-800' : 'bg-white',
    dialogBorder: darkMode ? 'border-gray-700' : 'border-gray-200',
    overlay: darkMode ? 'bg-black/50' : 'bg-gray-900/50',
    gradientBg: darkMode 
      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
      : 'bg-gradient-to-r from-blue-100 to-purple-100',
    notification: {
      success: darkMode 
        ? 'bg-green-500/10 border-green-500/20 text-green-400'
        : 'bg-green-50 border-green-200 text-green-700',
      error: darkMode 
        ? 'bg-red-500/10 border-red-500/20 text-red-400'
        : 'bg-red-50 border-red-200 text-red-700',
      info: darkMode 
        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }
  };

  const { user } = useContext(AuthContext)
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingModuleCounts, setLoadingModuleCounts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [sortByLevel, setSortByLevel] = useState(false)
  
  // Add ref to prevent double API calls in StrictMode
  const hasInitialized = useRef(false)
  
  // Module related states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [openModulesDialog, setOpenModulesDialog] = useState(false)
  const [openAddModuleDialog, setOpenAddModuleDialog] = useState(false)
  const [openEditModuleDialog, setOpenEditModuleDialog] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [editingModule, setEditingModule] = useState(false)
  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null)
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = useState(false)
  const [openCreateQuizDialog, setOpenCreateQuizDialog] = useState(false)
  const [moduleForQuiz, setModuleForQuiz] = useState<Module | null>(null)
  const [creatingQuiz, setCreatingQuiz] = useState(false)
  const [quizStep, setQuizStep] = useState<1 | 2>(1)
  const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false)
  const [currentVideoQuizId, setCurrentVideoQuizId] = useState<string | null>(null)
  const emptyQuestion: QuizQuestionForm = {
    que: '',
    opt: { a: '', b: '', c: '', d: '' },
    correctAnswer: 'a',
    explanation: ''
  }
  const [quizForm, setQuizForm] = useState<VideoQuizForm>({
    videoTitle: '',
    videoUrl: '',
    ytId: '',
    moduleName: '',
    topicName: '',
    subtopicName: '',
    courseName: '',
    board: '',
    grade: '',
    medium: '',
    quiz: [
      {
        que: '',
        opt: { a: '', b: '', c: '', d: '' },
        correctAnswer: 'a',
        explanation: ''
      }
    ]
  })

  const isQuizStep1Valid = () => {
    const required = [
      quizForm.videoTitle,
      quizForm.videoUrl,
      quizForm.moduleName,
      quizForm.courseName,
      quizForm.board,
      quizForm.grade
    ]
    const mediumValid = quizForm.board.toUpperCase() === 'CBSE' || 
      (quizForm.medium && (Array.isArray(quizForm.medium) ? quizForm.medium.length > 0 : quizForm.medium.trim().length > 0))
    return required.every((v) => (v || '').toString().trim()) && mediumValid
  }
  
  // Delete and Update states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null)
  const [editing, setEditing] = useState(false)
  
  // Success/error notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  // Auto-dismiss notifications after a short delay
  useEffect(() => {
    if (!notification.open) return
    const timeoutId = setTimeout(() => {
      setNotification(prev => ({ ...prev, open: false }))
    }, 4000)
    return () => clearTimeout(timeoutId)
  }, [notification.open])
  
  const navigate = useNavigate()
  
  // Separate states for Add and Edit module forms
  const [newModule, setNewModule] = useState({
    title: '',
    topicName: '',
    subtopicName: '',
    videoUrl: '',
    subjectname: '',
    board: '',
    grade: '',
    medium: '' as string | string[]
  })

  const [editModule, setEditModule] = useState({
    title: '',
    topicName: '',
    subtopicName: '',
    videoUrl: ''
  })

  const coursesPerPage = 9

  // Function to fetch all courses across multiple pages
  const fetchAllCourses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let allCourses: Course[] = []
      let currentPage = 1
      let hasMorePages = true
      
      // Fetch courses page by page until we get all of them
      while (hasMorePages) {
        const res = await axios.get<CoursesResponse>('/courses', {
          params: {
            limit: 20, // Fetch 20 per page
            page: currentPage
          },
          timeout: 10000
        })
        
        if (res.data.success) {
          const { data: courses, pagination } = res.data
          allCourses = [...allCourses, ...courses]
          
          // Check if there are more pages
          hasMorePages = currentPage < pagination.totalPages
          currentPage++
        } else {
          throw new Error('Failed to fetch courses')
        }
      }
      
      // Set courses first without module counts to show them immediately
      setCourses(allCourses)
      setFilteredCourses(allCourses)
      setTotalRecords(allCourses.length)
      setTotalPages(1) // Since we're showing all on one page
      setPage(1)
      
      // Then fetch module counts in the background and update progressively
      setLoadingModuleCounts(true)
      
      // Fetch module counts in batches to avoid overwhelming the server
      const batchSize = 5
      for (let i = 0; i < allCourses.length; i += batchSize) {
        const batch = allCourses.slice(i, i + batchSize)
        
        // Process batch in parallel
        await Promise.all(batch.map(async (course) => {
          try {
            const modulesRes = await axios.get<ModulesResponse>(
              `/courses/${course._id}/modules`
            )
            if (modulesRes.data.success) {
              const moduleCount = modulesRes.data.count || modulesRes.data.data.length || 0
              setCourses(prevCourses => 
                prevCourses.map(c => 
                  c._id === course._id 
                    ? { ...c, moduleCount }
                    : c
                )
              )
              setFilteredCourses(prevCourses => 
                prevCourses.map(c => 
                  c._id === course._id 
                    ? { ...c, moduleCount }
                    : c
                )
              )
            }
          } catch (err) {
            console.warn(`Failed to fetch modules for course ${course._id}:`, err)
            // Set module count to 0 on error
            setCourses(prevCourses => 
              prevCourses.map(c => 
                c._id === course._id 
                  ? { ...c, moduleCount: 0 }
                  : c
              )
            )
            setFilteredCourses(prevCourses => 
              prevCourses.map(c => 
                c._id === course._id 
                  ? { ...c, moduleCount: 0 }
                  : c
              )
            )
          }
        }))
        
        // Small delay between batches to be nice to the server
        if (i + batchSize < allCourses.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setLoadingModuleCounts(false)
      
    } catch (err: any) {
      console.error('Failed to load all courses:', err)
      setError('Failed to load all courses. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Prevent double API calls in StrictMode
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await axios.get<CoursesResponse>('/courses', {
          params: {
            limit: 50, // Request more courses to show all 18
            page: 1
          },
          timeout: 10000
        })
        
        if (res.data.success) {
          const { data: courses, pagination } = res.data
          
          setCourses(courses)
          setFilteredCourses(courses)
          setTotalRecords(pagination.totalCount)
          setTotalPages(pagination.totalPages)
          setPage(pagination.currentPage)
        } else {
          setError('Failed to load courses. Please try again later.')
        }
      } catch (err: any) {
        console.error('Failed to load courses:', err)
        if (err.response) {
          if (err.response.status === 503) {
            setError('The server is temporarily unavailable. Please try again in a moment.')
          } else if (err.response.status === 401) {
            setError('Your session has expired. Please log in again.')
          } else {
            setError(err.response.data?.error || 'Failed to load courses. Please try again later.')
          }
        } else if (err.request) {
          setError('No response from server. Please check your connection.')
        } else {
          setError('Failed to load courses. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }
    
    // Use the new function to fetch all courses
    fetchAllCourses()
    
    const fromCreateCourse = window.location.search.includes('newCourse=true')
    if (fromCreateCourse) {
      const retryTimer = setTimeout(() => {
        fetchAllCourses()
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    const toLower = (value?: string | null) => (value ?? '').toString().toLowerCase()
    const term = toLower(searchTerm)

    let results = courses.filter(course => {
      const title = toLower((course as any).title)
      const description = toLower((course as any).description)
      const slug = toLower((course as any).slug)
      return (
        title.includes(term) ||
        description.includes(term) ||
        slug.includes(term)
      )
    })

    if (sortByLevel) {
      results = results.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return aTime - bTime
      })
    }

    setFilteredCourses(results)
    setTotalPages(Math.ceil(results.length / coursesPerPage))
    setPage(1)
  }, [searchTerm, courses, sortByLevel])

  const fetchModules = async (courseId: string) => {
    setModulesLoading(true)
    setModulesError(null)
    try {
      const res = await axios.get<ModulesResponse>(
        `/courses/${courseId}/modules`
      )
      if (res.data.success) {
        setModules(res.data.data)
        
        // Update the course's module count in the courses list
        const moduleCount = res.data.count || res.data.data.length || 0
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === courseId 
              ? { ...course, moduleCount }
              : course
          )
        )
        setFilteredCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === courseId 
              ? { ...course, moduleCount }
              : course
          )
        )
      } else {
        setModulesError('Failed to load modules')
      }
    } catch (err: any) {
      console.error('Failed to load modules:', err)
      setModulesError('Failed to load modules. Please try again.')
    } finally {
      setModulesLoading(false)
    }
  }

  const handleViewModules = (course: Course) => {
    setSelectedCourse(course)
    fetchModules(course._id)
    setOpenModulesDialog(true)
  }

  const extractPrimaryVideoUrl = (module: Module): string => {
    if (module.topics && module.topics.length > 0) {
      const t0 = module.topics[0]
      // Handle both topicName and topicname field naming conventions
      const topicName = t0.topicName || t0.topicname || ''
      
      if (t0.subtopics && t0.subtopics.length > 0) {
        const s0 = t0.subtopics[0]
        // Handle both subtopicName and subtopicname field naming conventions
        const subtopicName = s0.subtopicName || s0.subtopicname || ''
        if (s0.videos && s0.videos.length > 0) return s0.videos[0].videoUrl || ''
      }
      if (t0.videos && t0.videos.length > 0) return t0.videos[0].videoUrl || ''
    }
    if (module.videos && module.videos.length > 0) return module.videos[0].videoUrl || ''
    return ''
  }

  const fetchCourseContext = async (courseId: string) => {
    try {
      const res = await axios.get(`/courses/${courseId}`)
      if (res.data?.success) {
        const course = res.data.data || {}
        const board = course.board || ''
        const grade = ((course.grade ?? '') as any).toString()
        const mediumRaw = course.medium
        const medium = Array.isArray(mediumRaw) ? (mediumRaw[0] || '') : (mediumRaw || '')

        // Update quiz form only if fields are still empty
        setQuizForm(prev => ({
          ...prev,
          board: prev.board || board,
          grade: prev.grade || grade,
          medium: prev.medium || medium
        }))

        // Also enrich selectedCourse for future opens
        setSelectedCourse(prev => prev ? ({
          ...prev,
          board: board as any,
          grade: grade as any,
          medium: medium as any
        } as any) : prev)
      }
    } catch (e) {
      // Silent - optional enrichment only
    }
  }

  const handleOpenCreateQuiz = (module: Module) => {
    setModuleForQuiz(module)
    setQuizStep(1)
    // Reset update mode for new quiz creation
    setIsUpdatingQuiz(false)
    setCurrentVideoQuizId(null)
    
    const topicName = module.topics?.[0]?.topicName || module.topics?.[0]?.topicname || ''
    const subtopicName = module.topics?.[0]?.subtopics?.[0]?.subtopicName || module.topics?.[0]?.subtopics?.[0]?.subtopicname || ''
    const initialUrl = extractPrimaryVideoUrl(module)
    const courseBoard = (selectedCourse as any)?.board || ''
    const courseGrade = ((selectedCourse as any)?.grade ?? '').toString()
    // medium may be string or array; show all when array
    const m = (selectedCourse as any)?.medium
    const courseMedium = Array.isArray(m) ? (m.filter(Boolean).join(', ') || '') : (m || '')
    // Some tenants return chapter name as `chaptername` instead of `title`
    const chapterName = (module.title || (module as any).chaptername || '') as string
    setQuizForm({
      videoTitle: chapterName,
      videoUrl: initialUrl,
      ytId: '',
      moduleName: chapterName,
      topicName,
      subtopicName,
      courseName: selectedCourse?.title || '',
      board: courseBoard,
      grade: courseGrade,
      medium: courseMedium,
      quiz: [ { ...emptyQuestion } ]
    })
    setOpenCreateQuizDialog(true)
    if (selectedCourse && (!courseBoard || !courseGrade || !courseMedium)) {
      fetchCourseContext(selectedCourse._id)
    }
    
    // Show informational notification about course context
    if (selectedCourse?.title) {
      setNotification({
        open: true,
        message: `Creating video quiz for "${chapterName}" in "${selectedCourse.title}". The system will ensure this quiz is associated with the correct course context.`,
        type: 'info'
      })
    }
  }

  // Utility function for making video quiz API calls with proper error handling
  const fetchVideoQuizByModuleAndCourse = async (moduleName: string, courseName: string) => {
    try {
      // First try the new enhanced API route
      const response = await axios.get(`/vq/module/${encodeURIComponent(moduleName)}/course/${encodeURIComponent(courseName)}`);
      return response;
    } catch (error: any) {
      // If the new route fails, fallback to the old route with query parameters
      if (error.response?.status === 404) {
        console.log('New API route not found, trying fallback with query parameters...');
        try {
          const fallbackResponse = await axios.get(`/vq/module/${encodeURIComponent(moduleName)}`, {
            params: { courseName }
          });
          return fallbackResponse;
        } catch (fallbackError: any) {
          console.log('Fallback API also failed:', fallbackError);
          throw fallbackError;
        }
      }
      throw error;
    }
  };

  // Utility function for fetching video quiz by title with course context
  const fetchVideoQuizByTitle = async (videoTitle: string, courseName: string) => {
    try {
      const response = await axios.get(`/vq/title/${encodeURIComponent(videoTitle)}`, {
        params: { courseName }
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching video quiz by title:', error);
      throw error;
    }
  };

  // Utility function for checking if video quiz exists with proper context
  const checkVideoQuizExists = async (moduleName: string, courseName: string, videoTitle?: string) => {
    try {
      if (videoTitle) {
        // If we have a video title, check by title with course context
        const response = await fetchVideoQuizByTitle(videoTitle, courseName);
        return response.data.success && response.data.data;
      } else {
        // Otherwise check by module and course
        const response = await fetchVideoQuizByModuleAndCourse(moduleName, courseName);
        return response.data.success && response.data.data.quizzes && response.data.data.quizzes.length > 0;
      }
    } catch (error) {
      console.error('Error checking if video quiz exists:', error);
      return false;
    }
  };

  // Utility function for creating or updating video quiz with proper validation
  const createOrUpdateVideoQuiz = async (quizData: any, isUpdate: boolean = false) => {
    try {
      const { moduleName, courseName, videoTitle } = quizData;
      
      // Check if video quiz already exists (for create operations)
      if (!isUpdate) {
        const exists = await checkVideoQuizExists(moduleName, courseName, videoTitle);
        if (exists) {
          throw new Error('A video quiz with this title already exists in this module and course');
        }
      }
      
      let response;
      if (isUpdate && currentVideoQuizId) {
        // Update existing quiz
        response = await axios.put(`/vq/${currentVideoQuizId}`, quizData);
      } else {
        // Create new quiz
        response = await axios.post('/vq', quizData);
      }
      
      return response;
    } catch (error: any) {
      console.error('Error in createOrUpdateVideoQuiz:', error);
      
      // Provide more specific error messages for common issues
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('already exists')) {
          throw new Error(`A video quiz with this configuration already exists. This might be due to duplicate module names across different subjects. Please ensure you're working in the correct course context.`);
        }
        throw new Error(error.response.data.error);
      }
      
      throw error;
    }
  };

  const handleDocumentAction = async (module: Module) => {
    const moduleName = (module.title || (module as any).chaptername || '').trim();
    const courseName = selectedCourse?.title || '';
    console.log('Document button clicked for module:', moduleName, 'in course:', courseName);
    console.log('Module data:', module);
    
    if (!moduleName) {
      alert('Module name is missing. Please ensure the chapter has a name.');
      return;
    }
    
    if (!courseName) {
      alert('Course name is missing. Please ensure the course has a title.');
      return;
    }
    
    try {
      console.log('Making API call to get video quiz by module name and course...');
      
      // Use the utility function for better error handling and fallback support
      const response = await fetchVideoQuizByModuleAndCourse(moduleName, courseName);
      console.log('API response:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.quizzes && response.data.data.quizzes.length > 0) {
        // Get the first video quiz ID for this module and course combination
        const videoQuizId = response.data.data.quizzes[0]._id;
        console.log('Found video quiz ID:', videoQuizId);
        
        // Set the video quiz ID and update mode
        setCurrentVideoQuizId(videoQuizId);
        setIsUpdatingQuiz(true);
        
        // Now use getVideoQuizById to get the complete quiz data
        console.log('Making API call to getVideoQuizById...');
        const quizResponse = await axios.get(`/vq/${videoQuizId}`);
        console.log('Quiz API response:', quizResponse.data);
        
        if (quizResponse.data.success) {
          const videoQuiz = quizResponse.data.data;
          console.log('Found complete video quiz:', videoQuiz);
          
          // Populate the quiz form with the existing data
          setQuizForm({
            videoTitle: videoQuiz.videoTitle || '',
            videoUrl: videoQuiz.videoUrl || '',
            ytId: videoQuiz.ytId || '',
            // Support both default-tenant (chapterName/subName/questions) and standard fields
            moduleName: (videoQuiz.moduleName || videoQuiz.chapterName || module.title || (module as any).chaptername || ''),
            topicName: videoQuiz.topicName || '',
            subtopicName: videoQuiz.subtopicName || '',
            courseName: (videoQuiz.courseName || videoQuiz.subName || selectedCourse?.title || ''),
            board: videoQuiz.board || '',
            grade: (videoQuiz.grade ?? '').toString(),
            medium: Array.isArray(videoQuiz.medium) ? videoQuiz.medium.filter(Boolean).join(', ') : (videoQuiz.medium ?? ''),
            quiz: (videoQuiz.quiz || videoQuiz.questions || [{ ...emptyQuestion }])
          });
          
          // Set the module for quiz and open the dialog
          setModuleForQuiz(module);
          setQuizStep(1);
          setOpenCreateQuizDialog(true);
          
          console.log('Video quiz data loaded and dialog opened');
        } else {
          console.log('Failed to get video quiz by ID');
          alert('Failed to get video quiz data');
        }
      } else {
        console.log('No video quiz found for module:', module.title, 'in course:', courseName);
        alert('No video quiz found for this module in the selected course');
      }
    } catch (error) {
      console.error('Error fetching video quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Error fetching video quiz: ' + errorMessage);
    }
  }

  const handleAddModule = () => {
    // Prefill board/grade from selected course when available
    const prefillBoard = ((selectedCourse as any)?.board || '') as string
    const prefillGrade = (((selectedCourse as any)?.grade ?? '') as any).toString()
    const prefillSubject = (selectedCourse?.title || '') as string
    const m = (selectedCourse as any)?.medium
    const prefillMedium = Array.isArray(m) ? (m.filter(Boolean).join(', ') || '') : (m || '')
    setNewModule({
      title: '',
      topicName: '',
      subtopicName: '',
      videoUrl: '',
      subjectname: prefillSubject,
      board: prefillBoard,
      grade: prefillGrade,
      medium: prefillMedium
    })
    setOpenAddModuleDialog(true)
  }

  const handleAddModuleSubmit = async () => {
    if (!selectedCourse) return
    
    setAddingModule(true)
    
    try {
      const modulePayload: any = {
        title: newModule.title,
        courseId: selectedCourse._id, // Add courseId to payload
        coursename: (selectedCourse?.title || newModule.subjectname || ''),
        subjectname: (newModule.subjectname || selectedCourse?.title || ''),
        board: (newModule.board || (selectedCourse as any)?.board || '').toString(),
        grade: (newModule.grade || ((selectedCourse as any)?.grade ?? '')).toString(),
        medium: (() => { const mm = newModule.medium || (selectedCourse as any)?.medium || ''; return Array.isArray(mm) ? (mm.filter(Boolean).join(', ') || '') : (mm || ''); })()
      }

      // Logic to place video URL in the correct location based on user input
      if (newModule.topicName.trim() && newModule.subtopicName.trim()) {
        // User entered chapter, topic, subtopic, and video URL
        // Video URL should go in subtopic (matching Postman format)
        modulePayload.videos = [] // Empty videos array at module level (matching Postman)
        modulePayload.topics = [
          {
            topicname: newModule.topicName.trim(), // Backend expects 'topicname' not 'topicName'
            // Send both casings to be compatible with different backends
            topicName: newModule.topicName.trim(),
            videos: [], // Empty videos array at topic level (matching Postman)
            subtopics: [
              {
                subtopicname: newModule.subtopicName.trim(), // Backend expects 'subtopicname' not 'subtopicName'
                // Send both casings to be compatible with different backends
                subtopicName: newModule.subtopicName.trim(),
                videos: [
                  createVideoObject(newModule.videoUrl)
                ]
              }
            ]
          }
        ]
      } else if (newModule.topicName.trim()) {
        // User entered chapter, topic, and video URL (no subtopic)
        // Video URL should go in topic (matching Postman format)
        modulePayload.videos = [] // Empty videos array at module level (matching Postman)
        modulePayload.topics = [
          {
            topicname: newModule.topicName.trim(), // Backend expects 'topicname' not 'topicName'
            // Send both casings to be compatible with different backends
            topicName: newModule.topicName.trim(),
            videos: [
              createVideoObject(newModule.videoUrl)
            ],
            subtopics: [] // Empty subtopics array (matching Postman)
          }
        ]
      } else {
        // User entered only chapter and video URL (no topic/subtopic)
        // Video URL should go in chapter (module level)
        modulePayload.videos = [
          createVideoObject(newModule.videoUrl)
        ]
      }
      
      const res = await axios.post(
        `/courses/${selectedCourse._id}/modules`,
        modulePayload
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module added successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
        
        // Update the course's module count in the courses list
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === selectedCourse._id 
              ? { ...course, moduleCount: (course.moduleCount || 0) + 1 }
              : course
          )
        )
        setFilteredCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === selectedCourse._id 
              ? { ...course, moduleCount: (course.moduleCount || 0) + 1 }
              : course
          )
        )
        
        setOpenAddModuleDialog(false)
        // Reset add module form
        const prefillBoard = ((selectedCourse as any)?.board || '') as string
        const prefillGrade = (((selectedCourse as any)?.grade ?? '') as any).toString()
        const prefillSubject = (selectedCourse?.title || '') as string
        const mm = (selectedCourse as any)?.medium
        const prefillMedium = Array.isArray(mm) ? (mm.filter(Boolean).join(', ') || '') : (mm || '')
        setNewModule({
          title: '',
          topicName: '',
          subtopicName: '',
          videoUrl: '',
          subjectname: prefillSubject,
          board: prefillBoard,
          grade: prefillGrade,
          medium: prefillMedium
        })
      } else {
        throw new Error(res.data.message || 'Failed to add module')
      }
    } catch (err: any) {
      console.error('Failed to add module:', err)
      
      let errorMessage = 'Failed to add module. Please try again.'
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        type: 'error'
      })
      
      setModulesError(errorMessage)
    } finally {
      setAddingModule(false)
    }
  }

  const handleEditModule = (module: Module) => {
    setModuleToEdit(module)
    
    // Extract video URL from the correct location based on module structure
    let videoUrl = ''
    let topicName = ''
    let subtopicName = ''
    
    if (module.topics && module.topics.length > 0) {
      const topic = module.topics[0]
      topicName = topic.topicName || topic.topicname || ''
      
      if (topic.subtopics && topic.subtopics.length > 0) {
        // Video URL is in subtopic
        const subtopic = topic.subtopics[0]
        subtopicName = subtopic.subtopicName || subtopic.subtopicname || ''
        if (subtopic.videos && subtopic.videos.length > 0) {
          videoUrl = subtopic.videos[0].videoUrl || ''
        }
      } else if (topic.videos && topic.videos.length > 0) {
        // Video URL is in topic
        videoUrl = topic.videos[0].videoUrl || ''
      }
    } else if (module.videos && module.videos.length > 0) {
      // Video URL is at module level
      videoUrl = module.videos[0].videoUrl || ''
    }
    
    // Populate the edit module form with existing data
    setEditModule({
      title: (module.title || (module as any).chaptername || ''),
       topicName: topicName,
       subtopicName: subtopicName,
       videoUrl: videoUrl
    })
    setOpenEditModuleDialog(true)
  }

  const handleUpdateModule = async () => {
    if (!moduleToEdit || !selectedCourse) return
    
    setEditingModule(true)
    
    try {
      const modulePayload: any = {
        title: editModule.title,
        courseId: selectedCourse._id // Add courseId to payload
      }

      // Logic to place video URL in the correct location based on user input
      if (editModule.topicName.trim() && editModule.subtopicName.trim()) {
        // User entered chapter, topic, subtopic, and video URL
        // Video URL should go in subtopic (matching Postman format)
        modulePayload.videos = [] // Empty videos array at module level (matching Postman)
        modulePayload.topics = [
          {
            topicname: editModule.topicName.trim(), // Backend expects 'topicname' not 'topicName'
            // Send both casings to be compatible with different backends
            topicName: editModule.topicName.trim(),
            videos: [], // Empty videos array at topic level (matching Postman)
            subtopics: [
              {
                subtopicname: editModule.subtopicName.trim(), // Backend expects 'subtopicname' not 'subtopicName'
                // Send both casings to be compatible with different backends
                subtopicName: editModule.subtopicName.trim(),
                videos: [
                  createVideoObject(editModule.videoUrl)
                ]
              }
            ]
          }
        ]
      } else if (editModule.topicName.trim()) {
        // User entered chapter, topic, and video URL (no subtopic)
        // Video URL should go in topic (matching Postman format)
        modulePayload.videos = [] // Empty videos array at module level (matching Postman)
        modulePayload.topics = [
          {
            topicname: editModule.topicName.trim(), // Backend expects 'topicname' not 'topicName'
            // Send both casings to be compatible with different backends
            topicName: editModule.topicName.trim(),
            videos: [
              createVideoObject(editModule.videoUrl)
            ],
            subtopics: [] // Empty subtopics array (matching Postman)
          }
        ]
      } else {
        // User entered only chapter and video URL (no topic/subtopic)
        // Video URL should go in chapter (module level)
        modulePayload.videos = [
          createVideoObject(editModule.videoUrl)
        ]
        // Explicitly clear topics when user removed topic/subtopic during edit
        modulePayload.topics = []
      }
      
      const res = await axios.put(
        `/courses/${selectedCourse._id}/modules/${moduleToEdit._id}`,
        modulePayload
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module updated successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
        setOpenEditModuleDialog(false)
        setModuleToEdit(null)
                 // Reset edit module form
         setEditModule({
           title: '',
           topicName: '',
           subtopicName: '',
           videoUrl: ''
         })
      } else {
        throw new Error(res.data.message || 'Failed to update module')
      }
    } catch (err: any) {
      console.error('Failed to update module:', err)
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Failed to update module',
        type: 'error'
      })
    } finally {
      setEditingModule(false)
    }
  }

  const handleDeleteModule = (module: Module) => {
    setModuleToDelete(module)
  }

  const confirmDeleteModule = async () => {
    if (!moduleToDelete || !selectedCourse) return
    
    setDeletingModule(true)
    try {
      const res = await axios.delete(
        `/courses/${selectedCourse._id}/modules/${moduleToDelete._id}`
      )
      
      if (res.data.success) {
        setNotification({
          open: true,
          message: 'Module deleted successfully!',
          type: 'success'
        })
        
        fetchModules(selectedCourse._id)
        
        // Update the course's module count in the courses list
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === selectedCourse._id 
              ? { ...course, moduleCount: Math.max(0, (course.moduleCount || 0) - 1) }
              : course
          )
        )
        setFilteredCourses(prevCourses => 
          prevCourses.map(course => 
            course._id === selectedCourse._id 
              ? { ...course, moduleCount: Math.max(0, (course.moduleCount || 0) - 1) }
              : course
          )
        )
      } else {
        throw new Error(res.data.message || 'Failed to delete module')
      }
    } catch (err: any) {
      console.error('Failed to delete module:', err)
      setNotification({
        open: true,
        message: err.response?.data?.message || 'Failed to delete module',
        type: 'error'
      })
    } finally {
      setDeletingModule(false)
      setModuleToDelete(null)
    }
  }

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course)
    setOpenDeleteDialog(true)
  }

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return
    
    setDeleting(true)
    try {
      const response = await axios.delete(
        `/courses/${courseToDelete._id}`
      )
      
      if (response.data.success) {
        setNotification({
          open: true,
          message: 'Course deleted successfully!',
          type: 'success'
        })
        setCourses(courses.filter(course => course._id !== courseToDelete._id))
        setFilteredCourses(filteredCourses.filter(course => course._id !== courseToDelete._id))
      }
    } catch (err: any) {
      console.error('Failed to delete course:', err)
      setNotification({
        open: true,
        message: 'Failed to delete course. Please try again.',
        type: 'error'
      })
    } finally {
      setDeleting(false)
      setOpenDeleteDialog(false)
      setCourseToDelete(null)
    }
  }

  const handleEditCourse = (course: Course) => {
    setCourseToEdit(course)
    navigate(`/coursestest/update/${course._id}`)
  }

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false })
  }

  const handleEnroll = async (courseId: string) => {
    try {
      await axios.post(`/courses/${courseId}/enroll`)
      
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, progress: 0 }
          : course
      ))
    } catch (err: any) {
      setError('Failed to enroll in course. Please try again.')
      console.error(err)
    }
  }

  const handlePageChange = (value: number) => {
    setPage(value)
  }

  const handleFilterToggle = () => {
    setSortByLevel(!sortByLevel)
  }

  const paginatedCourses = filteredCourses.slice(
    (page - 1) * coursesPerPage,
    page * coursesPerPage
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Validation for add module form
  const isAddModuleFormValid = () => {
    return newModule.title.trim() 
      && newModule.videoUrl.trim() 
      && (newModule.board || (selectedCourse as any)?.board || '').toString().trim() 
      && (newModule.grade || ((selectedCourse as any)?.grade ?? '')).toString().trim()
  }

  // Validation for edit module form
  const isEditModuleFormValid = () => {
    return (editModule.title || '').trim() && (editModule.videoUrl || '').trim()
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text}`}>Courses</h1>
              <p className={themeClasses.textMuted}>
                {totalRecords} courses available
                {loadingModuleCounts && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs">
                    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Loading chapter counts...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchAllCourses}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer 
              border shadow-sm bg-gradient-to-r
              ${darkMode
                ? 'from-blue-500/20 to-purple-500/20 border-blue-400/40 text-blue-200 hover:from-blue-500/30 hover:to-purple-500/30 focus:ring-blue-400/50 focus:ring-offset-slate-900'
                : 'from-blue-500/10 to-purple-500/10 border-blue-600/40 text-blue-700 hover:from-blue-500/20 hover:to-purple-500/20 focus:ring-blue-600/50 focus:ring-offset-white'}
              hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh All Courses'}
          </button>
        </div>

        {/* Filter Status */}
        {sortByLevel && (
          <div className={`mb-6 border rounded-lg p-4 flex items-center gap-2 ${themeClasses.notification.info}`}>
            <ArrowsUpDownIcon className="h-5 w-5" />
            <span>Courses sorted by creation date (oldest first)</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 border rounded-lg p-4 flex justify-between items-center ${themeClasses.notification.error}`}>
            <div className="flex items-center gap-2">
              <span>{error}</span>
            </div>
            <button 
              className={`hover:opacity-70 ${themeClasses.text}`}
              onClick={() => {
                setLoading(true)
                setError(null)
                setTimeout(() => {
                  const fetchCourses = async () => {
                    try {
                      const res = await axios.get<CoursesResponse>('/courses', {
                        timeout: 15000
                      })
                      if (res.data.success) {
                        setCourses(res.data.data)
                        setFilteredCourses(res.data.data)
                        setTotalRecords(res.data.pagination.totalCount)
                        setTotalPages(res.data.pagination.totalPages)
                        setPage(res.data.pagination.currentPage)
                      }
                    } catch (err: any) {
                      console.error('Retry failed:', err)
                      setError('Retry failed. Please try again later.')
                    } finally {
                      setLoading(false)
                    }
                  }
                  fetchCourses()
                }, 1000)
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${themeClasses.cardBg} rounded-lg overflow-hidden animate-pulse border ${themeClasses.border}`}>
                <div className={`h-48 ${themeClasses.skeletonBg}`}></div>
                <div className="p-6 space-y-4">
                  <div className={`h-6 ${themeClasses.skeletonBg} rounded w-3/4`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-full`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-5/6`}></div>
                  <div className={`h-4 ${themeClasses.skeletonBg} rounded w-2/3`}></div>
                  <div className={`h-10 ${themeClasses.skeletonBg} rounded mt-6`}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className={`${themeClasses.cardBg} rounded-xl p-12 text-center border border-dashed ${themeClasses.border}`}>
            <AcademicCapIcon className={`h-16 w-16 mx-auto mb-4 ${themeClasses.textMuted}`} />
            <h3 className={`text-xl font-medium mb-2 ${themeClasses.text}`}>
              No courses found
            </h3>
            <p className={`mb-6 ${themeClasses.textMuted}`}>
              {searchTerm ? 'Try adjusting your search query' : 'There are currently no courses available'}
            </p>
            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <Link
                to="/coursestest/add"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Course
              </Link>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!loading && filteredCourses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => (
                <div 
                  key={course._id}
                  className={`${themeClasses.cardBg} rounded-lg overflow-hidden border ${themeClasses.border} transition-all hover:shadow-lg hover:-translate-y-1`}
                >
                  {/* Course Image/Icon Placeholder */}
                  <div className={`h-48 ${themeClasses.gradientBg} flex items-center justify-center relative`}>
                    {course.iconName ? (
                      <div className="text-center">
                        <div className="text-6xl mb-2">{course.iconName}</div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>Custom Icon</div>
                      </div>
                    ) : (
                      <AcademicCapIcon className={`h-16 w-16 opacity-50 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                    )}
                    
                    {/* Course Type Indicator */}
                    {course.slug && (
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium bg-white/20 backdrop-blur-sm ${themeClasses.text}`}>
                          {course.slug}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold line-clamp-2 ${themeClasses.text}`}>{course.title}</h3>
                        {/* Course Status Badge */}
                        {course.status && (
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              course.status === 'published' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : course.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditCourse(course)}
                            className={`p-1 rounded-md transition-colors ${themeClasses.hoverBg}`}
                            title="Edit Course"
                          >
                            <PencilIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course)}
                            className={`p-1 rounded-md transition-colors ${themeClasses.hoverBg}`}
                            title="Delete Course"
                          >
                            <TrashIcon className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className={`line-clamp-3 mb-4 ${themeClasses.textMuted}`}>{course.description}</p>
                    
                    {/* Educational Context Information */}
                    <div className="mb-4 space-y-2">
                      {(course.board || course.grade || course.medium) && (
                        <div className="flex flex-wrap gap-2">
                          {course.board && (
                            <span className={`px-2 py-1 text-xs rounded-full ${themeClasses.gradientBg} ${themeClasses.textAccent} font-medium`}>
                              {course.board}
                            </span>
                          )}
                          {course.grade && (
                            <span className={`px-2 py-1 text-xs rounded-full ${themeClasses.gradientBg} ${themeClasses.textAccent} font-medium`}>
                              Grade {course.grade}
                            </span>
                          )}
                          {course.medium && (
                            <span className={`px-2 py-1 text-xs rounded-full ${themeClasses.gradientBg} ${themeClasses.textAccent} font-medium`}>
                              {Array.isArray(course.medium) ? course.medium.join(', ') : course.medium}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className={`text-sm ${themeClasses.textMuted} inline-flex items-center gap-1`}>
                          <CalendarIcon className="h-4 w-4" />
                          <span>Created: {formatDate(course.createdAt)}</span>
                        </span>
                        {course.createdBy && (course.createdBy.name || course.createdBy.email) && (
                          <span className={`text-sm ${themeClasses.textMuted} inline-flex items-center gap-1`}>
                            <UserIcon className="h-4 w-4" />
                            <span>Created by: {course.createdBy.name || course.createdBy.email}</span>
                          </span>
                        )}
                        {course.updatedAt && course.updatedAt !== course.createdAt && (
                          <span className={`text-sm ${themeClasses.textMuted} inline-flex items-center gap-1`}>
                            <ArrowPathIcon className="h-4 w-4" />
                            <span>Updated: {formatDate(course.updatedAt)}</span>
                          </span>
                        )}
                      </div>
                      {/* Progress Indicator */}
                      {course.progress !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs ${themeClasses.textMuted}`}>
                            {course.progress}% Complete
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {/* Course Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${themeClasses.textMuted} flex items-center gap-1`}>
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>
                            Chapters: {
                              loadingModuleCounts && course.moduleCount === undefined 
                                ? (
                                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                )
                                : (course.moduleCount || 0)
                            }
                          </span>
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <button
                          onClick={() => handleViewModules(course)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer 
                            border shadow-sm bg-gradient-to-r
                            ${darkMode
                              ? 'from-blue-500/20 to-purple-500/20 border-blue-400/40 text-blue-200 hover:from-blue-500/30 hover:to-purple-500/30 focus:ring-blue-400/50 focus:ring-offset-slate-900'
                              : 'from-blue-500/10 to-purple-500/10 border-blue-600/40 text-blue-700 hover:from-blue-500/20 hover:to-purple-500/20 focus:ring-blue-600/50 focus:ring-offset-white'}
                            hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        >
                          <PlusIcon className="h-5 w-5" />
                          Add Chapters
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : `${themeClasses.cardBg} ${themeClasses.textMuted} ${themeClasses.hoverBg}`
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modules Dialog */}
      {openModulesDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden border ${themeClasses.dialogBorder}`}>
            {/* Header */}
            <div className={`p-6 border-b flex-shrink-0 ${themeClasses.dialogBorder}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
                  {selectedCourse?.title} - Modules
                </h2>
                <button 
                  onClick={() => setOpenModulesDialog(false)}
                  className={`p-2 rounded-md transition-colors ${themeClasses.hoverBg}`}
                >
                  <XMarkIcon className={`h-6 w-6 ${themeClasses.textMuted} hover:${themeClasses.text}`} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {modulesLoading ? (
                <div className="flex justify-center py-8">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : modulesError ? (
                <div className={`border rounded-lg p-4 mb-4 ${themeClasses.notification.error}`}>
                  {modulesError}
                </div>
              ) : modules.length === 0 ? (
                <div className={`text-center py-8 ${themeClasses.textMuted}`}>
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>No modules available for this course yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div 
                      key={module._id}
                      className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-medium ${themeClasses.text}`}>{module.title || (module as any).chaptername}</h3>
                          <p className={`text-sm mt-1 ${themeClasses.textMuted}`}>{module.description}</p>
                        </div>
                        {user && (user.role === 'instructor' || user.role === 'admin') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditModule(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <PencilIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                            </button>
                            <button
                              onClick={() => handleOpenCreateQuiz(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <VideoCameraIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                            </button>
                            <button
                              onClick={() => handleDocumentAction(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <DocumentTextIcon className="h-5 w-5 text-green-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(module)}
                              className={`p-1 rounded-md ${themeClasses.hoverBg}`}
                            >
                              <TrashIcon className="h-5 w-5 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center mt-4 gap-4">
                        {(module as any).videoUrl && (
                          <div className={`flex items-center text-sm ${themeClasses.textMuted}`}>
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className={`p-4 border-t flex justify-end gap-3 ${themeClasses.dialogBorder}`}>
              {user && (user.role === 'instructor' || user.role === 'admin') && (
                <button
                  onClick={handleAddModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all cursor-pointer`}
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Chapter
                </button>
              )}
              <button
                onClick={() => setOpenModulesDialog(false)}
                className={`px-4 py-2 rounded-md border cursor-pointer ${themeClasses.button}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Dialog */}
      {openAddModuleDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${themeClasses.text}`}>
                Add New Chapter
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Chapter Name
                    </label>
                    <input
                      type="text"
                      value={newModule.title}
                      onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="Chapter name"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Topic Name
                    </label>
                    <input
                      type="text"
                      value={newModule.topicName}
                      onChange={(e) => setNewModule({...newModule, topicName: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="Topic name"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Subtopic Name
                    </label>
                    <input
                      type="text"
                      value={newModule.subtopicName}
                      onChange={(e) => setNewModule({...newModule, subtopicName: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="Subtopic name"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newModule.subjectname}
                      onChange={(e) => setNewModule({...newModule, subjectname: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder={selectedCourse?.title || ''}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                        Board
                      </label>
                      <input
                        type="text"
                        value={newModule.board}
                        onChange={(e) => setNewModule({...newModule, board: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                        placeholder={(selectedCourse as any)?.board || 'ssc/cbse/...'}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                        Grade
                      </label>
                      <input
                        type="text"
                        value={newModule.grade}
                        onChange={(e) => setNewModule({...newModule, grade: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                        placeholder={(((selectedCourse as any)?.grade ?? '') as any).toString() || '10'}
                      />
                    </div>
                  </div>

                  {newModule.board !== 'CBSE' && (
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                        Medium
                      </label>
                      <input
                        type="text"
                        value={newModule.medium}
                        onChange={(e) => setNewModule({...newModule, medium: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                        placeholder={`${(() => { const m = (selectedCourse as any)?.medium; return Array.isArray(m) ? (m.filter(Boolean).join(', ') || '') : (m || 'English'); })()}`}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                      Video URL
                    </label>
                    <input
                      type="text"
                      value={newModule.videoUrl}
                      onChange={(e) => setNewModule({...newModule, videoUrl: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setOpenAddModuleDialog(false)
                                         // Reset form when canceling
                    const prefillBoard = ((selectedCourse as any)?.board || '') as string
                    const prefillGrade = (((selectedCourse as any)?.grade ?? '') as any).toString()
                    const prefillSubject = (selectedCourse?.title || '') as string
                    const mmm = (selectedCourse as any)?.medium
                    const prefillMedium = Array.isArray(mmm) ? (mmm[0] || '') : (mmm || '')
                    setNewModule({
                      title: '',
                      topicName: '',
                      subtopicName: '',
                      videoUrl: '',
                      subjectname: prefillSubject,
                      board: prefillBoard,
                      grade: prefillGrade,
                      medium: prefillMedium
                    })
                  }}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddModuleSubmit}
                  disabled={!isAddModuleFormValid() || addingModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all ${
                    (!isAddModuleFormValid() || addingModule) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {addingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Chapter'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Dialog */}
      {openEditModuleDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-6 ${themeClasses.text}`}>
                Edit Module
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text.sm font-medium mb-1 ${themeClasses.text}`}>
                    Chapter Name
                  </label>
                  <input
                    type="text"
                    value={editModule.title}
                    onChange={(e) => setEditModule({...editModule, title: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Chapter name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={editModule.topicName}
                    onChange={(e) => setEditModule({...editModule, topicName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Topic name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Subtopic Name
                  </label>
                  <input
                    type="text"
                    value={editModule.subtopicName}
                    onChange={(e) => setEditModule({...editModule, subtopicName: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Subtopic name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={editModule.videoUrl}
                    onChange={(e) => setEditModule({...editModule, videoUrl: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setOpenEditModuleDialog(false)
                    setModuleToEdit(null)
                                         // Reset edit form when canceling
                     setEditModule({
                       title: '',
                       topicName: '',
                       subtopicName: '',
                       videoUrl: ''
                     })
                  }}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateModule}
                  disabled={!isEditModuleFormValid() || editingModule}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all ${
                    (!isEditModuleFormValid() || editingModule) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {editingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Module'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Video Quiz Dialog */}
      {openCreateQuizDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 96px)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Create Video Quiz</h2>
                <div className="flex items-center gap-2">
                  <span className={`${themeClasses.textMuted}`}>Step</span>
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${quizStep === 1 ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                    <span className={`h-2 w-2 rounded-full ${quizStep === 2 ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                  </div>
                </div>
              </div>

              {quizStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Video Title</label>
                  <input
                    type="text"
                    value={quizForm.videoTitle}
                    onChange={(e) => setQuizForm({ ...quizForm, videoTitle: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="Enter video title"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Video URL</label>
                  <input
                    type="text"
                    value={quizForm.videoUrl}
                    onChange={(e) => setQuizForm({ ...quizForm, videoUrl: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="https://youtu.be/..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Chapter (Module)</label>
                  <input
                    type="text"
                    value={quizForm.moduleName}
                    onChange={(e) => setQuizForm({ ...quizForm, moduleName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Subject (Course)</label>
                  <input
                    type="text"
                    value={quizForm.courseName}
                    onChange={(e) => setQuizForm({ ...quizForm, courseName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Topic (optional)</label>
                  <input
                    type="text"
                    value={quizForm.topicName || ''}
                    onChange={(e) => setQuizForm({ ...quizForm, topicName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Subtopic (optional)</label>
                  <input
                    type="text"
                    value={quizForm.subtopicName || ''}
                    onChange={(e) => setQuizForm({ ...quizForm, subtopicName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Board</label>
                  <input
                    type="text"
                    value={quizForm.board}
                    onChange={(e) => setQuizForm({ ...quizForm, board: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="ssc/cbse/..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Grade</label>
                  <input
                    type="text"
                    value={quizForm.grade}
                    onChange={(e) => setQuizForm({ ...quizForm, grade: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                    placeholder="10"
                  />
                </div>
                {quizForm.board?.toUpperCase() !== 'CBSE' && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>Medium</label>
                    <input
                      type="text"
                      value={quizForm.medium}
                      onChange={(e) => setQuizForm({ ...quizForm, medium: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.input}`}
                      placeholder="English/Semi-English"
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className={`${themeClasses.textMuted} text-sm`}>
                    Board, Grade and Medium are required before creating the quiz. You can fill them now or on the next step.
                  </p>
                </div>
              </div>
              )}

              <div className="mt-6">
                {quizStep === 2 && (
                  <>
                <div className={`flex items-center justify-between mb-2 ${themeClasses.text}`}>
                  <h3 className="font-medium">Quiz Questions</h3>
                  <button
                    onClick={() => setQuizForm({ ...quizForm, quiz: [...quizForm.quiz, { ...emptyQuestion }] })}
                    className={`px-3 py-1 rounded-md border ${themeClasses.button}`}
                  >
                    Add Question
                  </button>
                </div>
                <div className="space-y-4 pr-2" style={{ maxHeight: 'calc(90vh - 240px)', overflowY: 'auto' }}>
                  {quizForm.quiz.map((q, idx) => (
                    <div key={idx} className={`p-4 rounded-md border ${themeClasses.border} ${themeClasses.cardBg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={themeClasses.text}>Question {idx + 1}</span>
                        {quizForm.quiz.length > 1 && (
                          <button
                            onClick={() => setQuizForm({ ...quizForm, quiz: quizForm.quiz.filter((_, i) => i !== idx) })}
                            className={`px-2 py-1 rounded-md border ${themeClasses.button}`}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={q.que}
                        onChange={(e) => {
                          const quiz = [...quizForm.quiz]
                          quiz[idx] = { ...quiz[idx], que: e.target.value }
                          setQuizForm({ ...quizForm, quiz })
                        }}
                        className={`w-full mb-3 px-4 py-2 border rounded-lg ${themeClasses.input}`}
                        placeholder="Enter the question"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['a','b','c','d'] as CorrectAnswerKey[]).map((key) => (
                          <input
                            key={key}
                            type="text"
                            value={q.opt[key]}
                            onChange={(e) => {
                              const quiz = [...quizForm.quiz]
                              quiz[idx] = { ...quiz[idx], opt: { ...quiz[idx].opt, [key]: e.target.value } }
                              setQuizForm({ ...quizForm, quiz })
                            }}
                            className={`w-full px-4 py-2 border rounded-lg ${themeClasses.input}`}
                            placeholder={`Option ${key.toUpperCase()}`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 items-start">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>Correct Answer</label>
                          <div className="flex gap-4">
                            {(['a','b','c','d'] as CorrectAnswerKey[]).map((key) => (
                              <label key={key} className={`flex items-center gap-2 ${themeClasses.text}`}>
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={q.correctAnswer === key}
                                  onChange={() => {
                                    const quiz = [...quizForm.quiz]
                                    quiz[idx] = { ...quiz[idx], correctAnswer: key }
                                    setQuizForm({ ...quizForm, quiz })
                                  }}
                                />
                                <span>{key.toUpperCase()}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>Explanation</label>
                          <textarea
                            rows={2}
                            value={q.explanation}
                            onChange={(e) => {
                              const quiz = [...quizForm.quiz]
                              quiz[idx] = { ...quiz[idx], explanation: e.target.value }
                              setQuizForm({ ...quizForm, quiz })
                            }}
                            className={`w-full px-4 py-2 border rounded-lg ${themeClasses.input}`}
                            placeholder="Why is this answer correct?"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setOpenCreateQuizDialog(false)
                    setModuleForQuiz(null)
                    setIsUpdatingQuiz(false)
                    setCurrentVideoQuizId(null)
                  }}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                {quizStep === 1 && (
                  <button
                    onClick={() => {
                      if ((quizForm.videoTitle || '').trim() && (quizForm.videoUrl || '').trim()) {
                        setQuizStep(2)
                      } else {
                        setNotification({ open: true, message: 'Please provide Video Title and Video URL to continue.', type: 'error' })
                      }
                    }}
                    className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all`}
                  >
                    Next
                  </button>
                )}
                {quizStep === 2 && (
                  <>
                    <button
                      onClick={() => setQuizStep(1)}
                      className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                    >
                      Back
                    </button>
                <button
                  onClick={async () => {
                    if (!selectedCourse || !moduleForQuiz) return
                    setCreatingQuiz(true)
                    try {
                      const boardUpper = (quizForm.board || '').toUpperCase()
                      const payload = {
                        videoTitle: quizForm.videoTitle.trim(),
                        videoUrl: quizForm.videoUrl.trim(),
                        ytId: quizForm.ytId?.trim() || undefined,
                        moduleName: quizForm.moduleName.trim(),
                        topicName: quizForm.topicName?.trim() || undefined,
                        subtopicName: quizForm.subtopicName?.trim() || undefined,
                        courseName: quizForm.courseName.trim(),
                        // Backend (default tenant) expects courseId which maps to subjectId
                        courseId: selectedCourse._id,
                        board: quizForm.board.trim(),
                        grade: quizForm.grade.trim(),
                        medium: boardUpper === 'CBSE' ? undefined : Array.isArray(quizForm.medium) ? quizForm.medium : quizForm.medium.split(',').map((s: string) => s.trim()).filter(Boolean),
                        quiz: quizForm.quiz
                      }

                      // basic validation
                      const requiredFields = ['videoTitle','videoUrl','moduleName','courseName','board','grade'] as const
                      for (const f of requiredFields) {
                        if (!(payload as any)[f]) {
                          throw new Error(`${f} is required`)
                        }
                      }
                      if (boardUpper !== 'CBSE' && (!quizForm.medium || (Array.isArray(quizForm.medium) ? quizForm.medium.length === 0 : !quizForm.medium.trim()))) {
                        throw new Error('medium is required')
                      }

                      // Use the new utility function for better error handling and course context validation
                      const res = await createOrUpdateVideoQuiz(payload, isUpdatingQuiz);
                      
                      if (res.data.success) {
                        const message = isUpdatingQuiz ? 'Video quiz updated successfully!' : 'Video quiz created successfully!';
                        setNotification({ open: true, message, type: 'success' });
                        setOpenCreateQuizDialog(false);
                        setModuleForQuiz(null);
                        setIsUpdatingQuiz(false);
                        setCurrentVideoQuizId(null);
                      } else {
                        throw new Error(res.data.message || `Failed to ${isUpdatingQuiz ? 'update' : 'create'} video quiz`);
                      }
                    } catch (err: any) {
                      setNotification({ open: true, message: err.response?.data?.error || err.message || 'Failed to create video quiz', type: 'error' })
                    } finally {
                      setCreatingQuiz(false)
                    }
                  }}
                  disabled={creatingQuiz}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all ${creatingQuiz ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {creatingQuiz ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      {isUpdatingQuiz ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isUpdatingQuiz ? 'Update Quiz' : 'Create Quiz'
                  )}
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Module Confirmation */}
      {moduleToDelete && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>
                Delete Module
              </h2>
              <p className={`mb-6 ${themeClasses.textMuted}`}>
                Are you sure you want to delete the module "{moduleToDelete.title}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModuleToDelete(null)}
                  className={`px-4 py-2 rounded-md border ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteModule}
                  disabled={deletingModule}
                  className={`px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all ${
                    deletingModule ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deletingModule ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Module'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation */}
      {openDeleteDialog && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${themeClasses.overlay}`}>
          <div className={`${themeClasses.dialogBg} rounded-lg shadow-xl w-full max-w-md overflow-hidden border ${themeClasses.dialogBorder}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>
                Delete Course
              </h2>
              <p className={`mb-6 ${themeClasses.textMuted}`}>
                Are you sure you want to delete the course "{courseToDelete?.title}"? This will also delete all associated modules and cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenDeleteDialog(false)}
                  className={`px-4 py-2 rounded-md border cursor-pointer ${themeClasses.button}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  disabled={deleting}
                  className={`px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer ${
                    deleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deleting ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Course'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg border flex items-center gap-3 z-[9999] ${themeClasses.notification[notification.type]}`}>
          {notification.type === 'success' && (
            <CheckCircleIcon className="h-6 w-6" />
          )}
          <span>{notification.message}</span>
          <button 
            onClick={handleCloseNotification}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <Link
          to="/coursestest/add"
          className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all md:hidden"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>
      )}
    </div>
  )
}

export default Courses;