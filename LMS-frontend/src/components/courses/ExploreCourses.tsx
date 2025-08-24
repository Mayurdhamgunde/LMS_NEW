import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  CheckCircle, 
  FileText, 
  Video, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  PlayCircle, 
  BookOpen, 
  Download, 
  Star, 
  Award, 
  ArrowUp,
  Lock,
  Menu,
  Search
} from 'lucide-react';
import { ArrowPathIcon, XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

interface Module {
  _id: string;
  title: string;
  description: string;
  duration: string;
  courseId: {
    _id: string;
    title: string;
    description: string;
  };
  isCompleted: boolean;
  videoUrl?: string;
  difficulty: string;
  rating: number;
  enrolledUsers: number;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  status: string;
  isPublic: boolean;
  iconName?: string;
  progress?: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const ExploreCourses = ({ darkMode }: { darkMode: boolean }) => {
  const { courseId } = useParams();
  const { user } = useContext(AuthContext);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Updated theme classes matching Profile component
  const themeClasses = {
    container: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    title: darkMode ? 'text-white' : 'text-gray-900',
    card: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-sm border border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-700',
    input: darkMode 
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:ring-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
    button: darkMode
      ? 'border-white/10 text-white hover:bg-white/5'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600',
    dialog: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    overlay: darkMode ? 'bg-black/50' : 'bg-gray-900/50',
    divider: darkMode ? 'border-white/10' : 'border-gray-200',
    error: darkMode 
      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
      : 'bg-red-50 border-red-200 text-red-700',
    success: darkMode 
      ? 'bg-green-500/10 border-green-500/20 text-green-500' 
      : 'bg-green-50 border-green-200 text-green-700',
    progress: darkMode ? 'bg-white/5' : 'bg-gray-200',
    badge: darkMode 
      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/20' 
      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/10',
    iconBg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
    iconColor: darkMode ? 'text-blue-500' : 'text-blue-600',
    gradientBg: 'bg-gradient-to-r from-blue-500 to-purple-500',
    hoverBg: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    sidebarBg: darkMode ? 'bg-white/5 backdrop-blur-sm border-white/10' : 'bg-white shadow-xl border-gray-200',
    topBarBg: darkMode ? 'bg-white/5 backdrop-blur-sm border-white/10' : 'bg-white shadow-sm border-gray-200'
  };

  // Icon mapping function
  const getIconComponent = (iconName: string): React.ReactNode => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5 text-blue-600" />;
      case 'Video': return <Video className="w-5 h-5 text-purple-600" />;
      case 'FileText': return <FileText className="w-5 h-5 text-orange-600" />;
      default: return <BookOpen className="w-5 h-5 text-gray-600" />;
    }
  };

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract YouTube ID function
  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/live\/([^?&]+)/,
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].split('?')[0];
      }
    }
    return null;
  };

  // Check if module is unlocked
  const isModuleUnlocked = (moduleIndex: number): boolean => {
    if (!user) return true; // If not logged in, all modules are unlocked
    if (moduleIndex === 0) return true; // First module is always unlocked
    
    // Check if previous module is completed
    const previousModule = modules[moduleIndex - 1];
    if (!previousModule) return false;
    
    return previousModule.isCompleted || userProgress[previousModule._id];
  };

  // Fetch course data
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course details
              const courseResponse = await axios.get<ApiResponse<Course>>(`/courses/${courseId}`);
      
      if (!courseResponse.data.success) {
        throw new Error('Failed to fetch course details');
      }
      
      // Fetch modules
              const modulesResponse = await axios.get<ApiResponse<Module[]>>(`/courses/${courseId}/modules`);
      
      if (!modulesResponse.data.success) {
        throw new Error('Failed to fetch modules');
      }
      
      setCourse(courseResponse.data.data);
      setModules(modulesResponse.data.data);
      
      // Auto-select first module if available
      if (modulesResponse.data.data.length > 0) {
        setSelectedModule(modulesResponse.data.data[0]);
      }
      
    } catch (err: any) {
      console.error('Error fetching course data:', err);
      let errorMessage = 'Failed to load course';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Course not found';
        } else if (err.response.status === 401) {
          errorMessage = 'Please log in to access this course';
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    } else {
      setError('Course ID is required');
      setLoading(false);
    }
  }, [courseId]);

  const markAsCompleted = async (moduleId: string) => {
    try {
              const response = await axios.post(`/courses/modules/${moduleId}/complete`);
      
      if (response.data.success) {
        setUserProgress(prev => ({ ...prev, [moduleId]: true }));
        
        // Update module completion status
        setModules(prev => 
          prev.map(m => m._id === moduleId ? { ...m, isCompleted: true } : m)
        );
        
        // Update selected module if it's the one being marked
        if (selectedModule?._id === moduleId) {
          setSelectedModule({ ...selectedModule, isCompleted: true });
        }
        
        // Update course progress
        if (course) {
          const completedCount = modules.filter(m => m._id === moduleId || m.isCompleted).length;
          const newProgress = Math.round((completedCount / modules.length) * 100);
          setCourse(prev => prev ? { ...prev, progress: newProgress } : null);
        }

        // Auto-advance to next module when current module is completed
        if (selectedModule?._id === moduleId) {
          const currentIndex = modules.findIndex(m => m._id === moduleId);
          if (currentIndex < modules.length - 1) {
            const nextModule = modules[currentIndex + 1];
            setTimeout(() => {
              handleModuleSelect(nextModule, currentIndex + 1);
            }, 2000);
          }
        }
      }
    } catch (err) {
      console.error('Error marking module as completed:', err);
      setError('Failed to mark module as completed');
    }
  };

  const handleModuleSelect = (module: Module, moduleIndex: number) => {
    // Check if module is unlocked before allowing selection
    if (!isModuleUnlocked(moduleIndex)) {
      console.log('Module is locked');
      return;
    }

    setSelectedModule(module);
    
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleNextModule = () => {
    if (selectedModule) {
      const currentIndex = modules.findIndex(m => m._id === selectedModule._id);
      if (currentIndex < modules.length - 1) {
        const nextModule = modules[currentIndex + 1];
        if (isModuleUnlocked(currentIndex + 1)) {
          handleModuleSelect(nextModule, currentIndex + 1);
        }
      }
    }
  };

  const handlePreviousModule = () => {
    if (selectedModule) {
      const currentIndex = modules.findIndex(m => m._id === selectedModule._id);
      if (currentIndex > 0) {
        handleModuleSelect(modules[currentIndex - 1], currentIndex - 1);
      }
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': 
        return darkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200';
      case 'Intermediate': 
        return darkMode ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Advanced': 
        return darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200';
      default: 
        return darkMode ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Filter modules based on search query
  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses.container}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={themeClasses.textSecondary}>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${themeClasses.container}`}>
        <div className={`text-center p-8 ${themeClasses.card} rounded-lg`}>
          <div className={`${themeClasses.error} rounded-lg p-4 mb-4`}>
            {error || 'Course not found'}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg transition-colors mr-4`}
          >
            Try Again
          </button>
          <Link 
            to="/courses"
            className={`px-4 py-2 border rounded-lg transition-colors ${themeClasses.button}`}
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${themeClasses.container} overflow-hidden`}>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className={`fixed inset-0 z-40 lg:hidden ${themeClasses.overlay}`}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 ${themeClasses.sidebarBg}
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}
        lg:w-96 border-r h-full
      `}>
        {/* Sidebar Header */}
        <div className={`flex-shrink-0 p-4 border-b ${themeClasses.divider} text-white ${themeClasses.gradientBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{course.title}</h2>
              <div className="flex items-center space-x-2 text-white/90 text-sm mt-1">
                <span className="bg-white/20 px-2 py-1 rounded">{course.status}</span>
                <span>•</span>
                <span className="bg-white/20 px-2 py-1 rounded">{modules.length} Modules</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`flex-shrink-0 p-4 border-b ${themeClasses.divider}`}>
          <div className="mb-4">
            <div className={`flex justify-between text-sm ${themeClasses.textSecondary} mb-2`}>
              <span>Course Progress</span>
              <span>{course.progress || 0}%</span>
            </div>
            <div className={`w-full ${themeClasses.progress} rounded-full h-2`}>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${themeClasses.gradientBg}`}
                style={{ width: `${course.progress || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}`} />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${themeClasses.input}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className={`w-4 h-4 ${themeClasses.textMuted}`} />
              </button>
            )}
          </div>
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2">
            {filteredModules.length === 0 ? (
              <div className={`text-center py-8 ${themeClasses.textMuted}`}>
                <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No modules found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredModules.map((module, index) => {
                  const actualIndex = modules.findIndex(m => m._id === module._id);
                  const isCurrentModule = selectedModule?._id === module._id;
                  const isCompleted = module.isCompleted || userProgress[module._id];
                  const isUnlocked = isModuleUnlocked(actualIndex);
                  
                  return (
                    <div
                      key={module._id}
                      onClick={() => isUnlocked && handleModuleSelect(module, actualIndex)}
                      className={`
                        group p-3 rounded-lg transition-all duration-200 border
                        ${isCurrentModule 
                          ? `${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-300'} border-l-4` 
                          : isUnlocked 
                            ? `${themeClasses.hoverBg} border-transparent cursor-pointer` 
                            : 'border-transparent opacity-60 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${isCurrentModule 
                            ? `text-white ${themeClasses.gradientBg}` 
                            : isUnlocked
                              ? `${darkMode ? 'bg-white/5 text-gray-300 group-hover:bg-blue-500/10 group-hover:text-blue-400' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`
                              : `${darkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-200 text-gray-500'}`
                          }
                        `}>
                          {!isUnlocked ? (
                            <Lock className="w-3 h-3" />
                          ) : isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : isCurrentModule ? (
                            <Play className="w-3 h-3" />
                          ) : (
                            actualIndex + 1
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-semibold text-sm leading-tight mb-1
                            ${isCurrentModule 
                              ? `${darkMode ? 'text-blue-400' : 'text-blue-700'}` 
                              : isUnlocked 
                                ? themeClasses.text 
                                : themeClasses.textMuted
                            }
                          `}>
                            {module.title}
                            {!isUnlocked && user && (
                              <span className={`block text-xs ${themeClasses.textMuted} mt-1`}>
                                Complete previous module to unlock
                              </span>
                            )}
                          </h3>
                          
                          <div className={`flex items-center space-x-3 text-xs ${themeClasses.textMuted}`}>
                            <span className="flex items-center">
                              <Video className="w-3 h-3 mr-1" />
                              {module.duration} min
                            </span>
                            <span className={`px-2 py-1 rounded border text-xs ${getDifficultyClass(module.difficulty)}`}>
                              {module.difficulty}
                            </span>
                          </div>

                          {/* Progress indicator for current/completed modules */}
                          {(isCompleted || isCurrentModule) && isUnlocked && (
                            <div className="mt-2">
                              <div className="flex justify-between items-center">
                                {isCompleted ? (
                                  <span className={`text-xs font-medium flex items-center ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    In Progress
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`flex-shrink-0 p-4 border-t ${themeClasses.divider} ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`text-sm ${themeClasses.textMuted} text-center`}>
            {modules.filter(m => m.isCompleted || userProgress[m._id]).length} of {modules.length} modules completed
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!showSidebar ? 'lg:max-w-6xl lg:mx-auto lg:w-full' : ''}`}>
        {/* Top Bar */}
        <div className={`${themeClasses.topBarBg} shadow-sm border-b p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 ${themeClasses.hoverBg} rounded-lg transition-colors lg:hidden`}
              >
                <Menu className={`w-5 h-5 ${themeClasses.text}`} />
              </button>
              {selectedModule && (
                <h1 className={`text-lg font-semibold ${themeClasses.text} hidden sm:block`}>
                  {selectedModule.title}
                </h1>
              )}
            </div>
            
            {selectedModule && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousModule}
                  disabled={modules.findIndex(m => m._id === selectedModule._id) === 0}
                  className={`px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${themeClasses.button}`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextModule}
                  disabled={
                    modules.findIndex(m => m._id === selectedModule._id) === modules.length - 1 ||
                    (!user ? false : !isModuleUnlocked(modules.findIndex(m => m._id === selectedModule._id) + 1))
                  }
                  className={`px-3 py-1 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${themeClasses.buttonPrimary}`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {selectedModule ? (
              <div className="space-y-6">
                {/* Video Player */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg overflow-hidden`}>
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    {selectedModule.videoUrl ? (
                      (() => {
                        const youtubeId = extractYoutubeId(selectedModule.videoUrl);
                        return youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}`}
                            title="Module video"
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className={`absolute inset-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} flex items-center justify-center`}>
                            <div className="text-center text-white">
                              <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p>Invalid video URL</p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className={`absolute inset-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} flex items-center justify-center`}>
                        <div className="text-center text-white">
                          <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>No video available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Module Info */}
                <div className={`${themeClasses.card} rounded-xl p-6`}>
                  <h1 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                    {selectedModule.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyClass(selectedModule.difficulty)}`}>
                      {selectedModule.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className={`text-sm ${themeClasses.textSecondary}`}>{selectedModule.rating || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className={`text-sm ${themeClasses.textSecondary}`}>
                        {selectedModule.enrolledUsers?.toLocaleString() || 0} enrolled
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span className={`text-sm ${themeClasses.textSecondary}`}>{selectedModule.duration} min</span>
                    </div>
                  </div>

                  <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>{selectedModule.description}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => markAsCompleted(selectedModule._id)}
                      disabled={selectedModule.isCompleted || userProgress[selectedModule._id]}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        selectedModule.isCompleted || userProgress[selectedModule._id]
                          ? `${darkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'} cursor-not-allowed`
                          : `${themeClasses.buttonPrimary} shadow-lg hover:shadow-xl cursor-pointer`
                      }`}
                    >
                      {selectedModule.isCompleted || userProgress[selectedModule._id] ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Award className="h-5 w-5" />
                          <span>Mark as Complete</span>
                        </>
                      )}
                    </button>

                    <button className={`px-6 py-3 border rounded-lg transition-colors font-medium flex items-center space-x-2 ${themeClasses.button}`}>
                      <Download className="h-5 w-5" />
                      <span>Resources</span>
                    </button>

                    {modules.findIndex(m => m._id === selectedModule._id) < modules.length - 1 && 
                     (user ? isModuleUnlocked(modules.findIndex(m => m._id === selectedModule._id) + 1) : true) && (
                      <button
                        onClick={handleNextModule}
                        className={`px-6 py-3 border rounded-lg transition-colors font-medium ${themeClasses.button}`}
                      >
                        Next Module
                      </button>
                    )}
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className={`${themeClasses.card} rounded-xl p-6`}>
                  <h3 className={`flex items-center space-x-2 text-lg font-medium ${themeClasses.text} mb-4`}>
                    <FileText className={`h-5 w-5 ${themeClasses.iconColor}`} />
                    <span>What You'll Learn</span>
                  </h3>
                  <ul className="space-y-3">
                    {[
                      `Complete understanding of ${selectedModule.title.toLowerCase()}`,
                      'Best practices and industry standards',
                      'Practical exercises and real-world examples',
                      'Tools and resources for implementation'
                    ].map((outcome, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className={themeClasses.textSecondary}>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className={`${themeClasses.card} rounded-xl p-12 text-center`}>
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Welcome to {course.title}</h2>
                <p className={`${themeClasses.textSecondary} mb-6`}>Select a module from the sidebar to begin your learning journey</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className={`${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{modules.length}</div>
                    <div className={themeClasses.textSecondary}>Modules</div>
                  </div>
                  <div className={`${darkMode ? 'bg-green-500/10' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{course.progress || 0}%</div>
                    <div className={themeClasses.textSecondary}>Complete</div>
                  </div>
                  <div className={`${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {modules.length > 0 ? 
                        Math.round(modules.reduce((acc, mod) => acc + (mod.rating || 0), 0) / modules.length * 10) / 10 : 
                        0
                      }★
                    </div>
                    <div className={themeClasses.textSecondary}>Rating</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCourses;