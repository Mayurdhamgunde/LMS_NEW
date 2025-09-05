import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  CheckCircle, 
  FileText, 
  Video, 
  ChevronRight, 
  ChevronDown, 
  PlayCircle, 
  BookOpen, 
  Download, 
  Menu,
  Search,
  Plus,
  HelpCircle // Replaced Quiz with HelpCircle
} from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

// Enhanced interfaces
type CorrectAnswerKey = 'a' | 'b' | 'c' | 'd';

interface QuizQuestion {
  que: string;
  opt: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: CorrectAnswerKey;
  explanation: string;
}

interface VideoQuiz {
  _id?: string;
  videoTitle: string;
  videoUrl: string;
  ytId?: string;
  // For non-default tenants
  moduleName?: string;
  topicName?: string;
  subtopicName?: string;
  courseName?: string;
  // For default tenants
  chapterName?: string;
  subName?: string;
  subjectId?: string;
  board: string;
  grade: string;
  medium: string[];
  quiz?: QuizQuestion[];
  questions?: QuizQuestion[];
  tenantId: string;
}

interface VideoItem {
  _id: string;
  videoUrl: string;
  videoTitle?: string;
  quiz?: VideoQuiz;
}

interface Subtopic {
  _id: string;
  subtopicname: string;
  videos: VideoItem[];
}

interface Topic {
  _id: string;
  topicname: string;
  subtopics: Subtopic[];
  videos: VideoItem[];
}

interface Module {
  _id: string;
  title?: string; // For non-default tenants
  chaptername?: string; // For default tenants
  description: string;
  duration: string;
  courseId: {
    _id: string;
    title?: string;
    subject?: string; // For default tenants
    description: string;
    calculatedProgress?: number;
  };
  coursename?: string; // For non-default tenants
  subjectname?: string; // For default tenants
  isCompleted: boolean;
  videoUrl?: string;
  difficulty: string;
  rating: number;
  enrolledUsers: number;
  tenantId: string;
  board?: string;
  grade?: string;
  medium?: string[];
  createdAt: string;
  updatedAt: string;
  videos: VideoItem[];
  topics: Topic[];
}

interface Course {
  _id: string;
  title?: string;
  subject?: string; // For default tenants
  description: string;
  slug: string;
  price: number;
  status: string;
  isPublic: boolean;
  iconName?: string;
  progress?: number;
  tenantId: string;
  board?: string;
  grade?: string;
  medium?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface SelectedVideo extends VideoItem {
  moduleName: string;
  topicName?: string;
  subtopicName?: string;
  courseName: string;
}

const ExploreCourses = ({ darkMode }: { darkMode: boolean }) => {
  const { courseId } = useParams();
  const { user, tenantId } = useContext(AuthContext);
  const isDefaultTenant = (tenantId || 'default') === 'default'
  
  // State management
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress] = useState<Record<string, boolean>>({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});
  const [videoQuizzes, setVideoQuizzes] = useState<Record<string, VideoQuiz>>({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<VideoQuiz | null>(null);

  // Theme classes
  const themeClasses = {
    container: darkMode ? 'bg-gray-950' : 'bg-gray-50',
    title: darkMode ? 'text-white' : 'text-gray-900',
    card: darkMode ? 'bg-white/10 backdrop-blur-md border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]' : 'bg-white shadow-sm border border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-300' : 'text-gray-600',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-700',
    input: darkMode 
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
    button: darkMode
      ? 'border-white/10 text-white hover:bg-white/10'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600',
    dialog: darkMode ? 'bg-[#0f172a]' : 'bg-white',
    overlay: darkMode ? 'bg-black/60' : 'bg-gray-900/50',
    divider: darkMode ? 'border-white/10' : 'border-gray-200',
    error: darkMode 
      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
      : 'bg-red-50 border-red-200 text-red-700',
    success: darkMode 
      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
      : 'bg-green-50 border-green-200 text-green-700',
    progress: darkMode ? 'bg-white/10' : 'bg-gray-200',
    badge: darkMode 
      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/30' 
      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/10',
    iconBg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
    iconColor: darkMode ? 'text-blue-400' : 'text-blue-600',
    gradientBg: 'bg-gradient-to-r from-blue-500 to-purple-500',
    hoverBg: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50',
    sidebarBg: darkMode ? 'bg-white/5 backdrop-blur-md border-white/10' : 'bg-white shadow-xl border-gray-200',
    topBarBg: darkMode ? 'bg-white/5 backdrop-blur-md border-white/10' : 'bg-white shadow-sm border-gray-200'
  };

  // Utility functions
  const getDisplayName = (module: Module): string => {
    return user?.tenantId === 'default' ? (module.chaptername || '') : (module.title || '');
  };

  const getCourseName = (module: Module): string => {
    return user?.tenantId === 'default' ? (module.subjectname || '') : (module.coursename || '');
  };

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

  // Helper function to find first video in hierarchy
  const findFirstVideoInHierarchy = (
    module?: Module, 
    topic?: Topic, 
    subtopic?: Subtopic
  ): VideoItem | null => {
    if (module && module.videoUrl) {
      return {
        _id: module._id,
        videoUrl: module.videoUrl,
        videoTitle: getDisplayName(module),
      };
    }

    if (subtopic && subtopic.videos && subtopic.videos.length > 0) {
      return subtopic.videos[0];
    }
    
    if (topic) {
      if (topic.videos && topic.videos.length > 0) {
        return topic.videos[0];
      }
      
      if (topic.subtopics) {
        for (const sub of topic.subtopics) {
          if (sub.videos && sub.videos.length > 0) {
            return sub.videos[0];
          }
        }
      }
    }
    
    if (module) {
      if (module.videos && module.videos.length > 0) {
        return module.videos[0];
      }
      
      if (module.topics) {
        for (const top of module.topics) {
          const video = findFirstVideoInHierarchy(undefined, top);
          if (video) return video;
        }
      }
    }
    
    return null;
  };

  // Create video object with fallback title
  const createVideoWithTitle = (
    video: VideoItem, 
    fallbackTitle: string
  ): VideoItem => ({
    ...video,
    videoTitle: video.videoTitle || fallbackTitle
  });

  // Helper functions to check if expansion is needed
  const moduleHasExpandableContent = (module: Module): boolean => {
    return module.topics && module.topics.length > 0;
  };

  const topicHasExpandableContent = (topic: Topic): boolean => {
    return topic.subtopics && topic.subtopics.length > 0;
  };

  const subtopicHasExpandableContent = (subtopic: Subtopic): boolean => {
    return subtopic.videos && subtopic.videos.length > 0;
  };

  // API functions for video quizzes
  const fetchVideoQuizByModuleAndCourse = async (moduleName: string, courseName: string) => {
    try {
      const response = await axios.get(`/vq/module/${encodeURIComponent(moduleName)}/course/${encodeURIComponent(courseName)}`);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          const fallbackResponse = await axios.get(`/vq/module/${encodeURIComponent(moduleName)}`, {
            params: { courseName }
          });
          return fallbackResponse;
        } catch (fallbackError: any) {
          throw fallbackError;
        }
      }
      throw error;
    }
  };

  const fetchVideoQuizByTitle = async (videoTitle: string, courseName: string) => {
    try {
      const response = await axios.get(`/vq/title/${encodeURIComponent(videoTitle)}`, {
        params: { courseName }
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  const checkVideoQuizExists = async (moduleName: string, courseName: string, videoTitle?: string) => {
    try {
      if (videoTitle) {
        const response = await fetchVideoQuizByTitle(videoTitle, courseName);
        return response.data.success && response.data.data ? response.data.data : false;
      } else {
        const response = await fetchVideoQuizByModuleAndCourse(moduleName, courseName);
        return response.data.success && response.data.data ? response.data.data : false;
      }
    } catch (error) {
      return false;
    }
  };

  // Enhanced event handlers
  const handleModuleClick = (module: Module) => {
    const hasExpandableContent = moduleHasExpandableContent(module);
    
    if (hasExpandableContent) {
      // If module has topics, toggle expansion instead of playing video
      setExpandedModules(prev => ({
        ...prev,
        [module._id]: !prev[module._id]
      }));
    } else {
      // If module has no topics, play video directly
      const video = findFirstVideoInHierarchy(module);
      if (video) {
        const displayName = getDisplayName(module);
        const courseName = getCourseName(module);
        const videoWithTitle = createVideoWithTitle(video, displayName);
        
        setSelectedVideo({
          ...videoWithTitle,
          moduleName: displayName,
          courseName
        });
        
        if (window.innerWidth < 1024) {
          setShowSidebar(false);
        }
      }
    }
  };

  const handleTopicClick = (topic: Topic, moduleName: string) => {
    const hasExpandableContent = topicHasExpandableContent(topic);
    
    if (hasExpandableContent) {
      // If topic has subtopics, toggle expansion instead of playing video
      setExpandedTopics(prev => ({
        ...prev,
        [topic._id]: !prev[topic._id]
      }));
    } else {
      // If topic has no subtopics, play video directly
      const video = findFirstVideoInHierarchy(undefined, topic);
      if (video) {
        const courseName = course?.title || course?.subject || '';
        const videoWithTitle = createVideoWithTitle(video, topic.topicname);
        
        setSelectedVideo({
          ...videoWithTitle,
          moduleName,
          topicName: topic.topicname,
          courseName
        });
        
        if (window.innerWidth < 1024) {
          setShowSidebar(false);
        }
      }
    }
  };

  const handleSubtopicClick = (subtopic: Subtopic, moduleName: string, topicName: string) => {
    // Subtopic is the final level, so always play video
    const video = findFirstVideoInHierarchy(undefined, undefined, subtopic);
    if (video) {
      const courseName = course?.title || course?.subject || '';
      const videoWithTitle = createVideoWithTitle(video, subtopic.subtopicname);
      
      setSelectedVideo({
        ...videoWithTitle,
        moduleName,
        topicName,
        subtopicName: subtopic.subtopicname,
        courseName
      });
      
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    }
  };

  // Fetch course and modules data
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseResponse = await axios.get<ApiResponse<Course>>(`/courses/${courseId}`);
      
      if (!courseResponse.data.success) {
        throw new Error('Failed to fetch course details');
      }
      
      const modulesResponse = await axios.get<ApiResponse<Module[]>>(`/courses/${courseId}/modules`);
      
      if (!modulesResponse.data.success) {
        throw new Error('Failed to fetch modules');
      }
      
      setCourse(courseResponse.data.data);
      setModules(modulesResponse.data.data);
      
      // Fetch video quizzes for all videos
      await fetchAllVideoQuizzes(modulesResponse.data.data);
      
      // Auto-expand first module, topic, and subtopic if they have content
      if (modulesResponse.data.data.length > 0) {
        const firstModule = modulesResponse.data.data[0];
        if (moduleHasExpandableContent(firstModule)) {
          setExpandedModules({ [firstModule._id]: true });
        }
        
        // Auto-expand first topic and subtopic if available
        if (firstModule.topics && firstModule.topics.length > 0) {
          const firstTopic = firstModule.topics[0];
          if (topicHasExpandableContent(firstTopic)) {
            setExpandedTopics({ [firstTopic._id]: true });
            if (firstTopic.subtopics && firstTopic.subtopics.length > 0) {
              const firstSubtopic = firstTopic.subtopics[0];
              if (subtopicHasExpandableContent(firstSubtopic)) {
                setExpandedSubtopics({ [firstSubtopic._id]: true });
              }
            }
          }
        }
        
        // Try to find and select the first video
        const firstVideo = findFirstVideoInHierarchy(firstModule);
        if (firstVideo) {
          const displayName = getDisplayName(firstModule);
          const courseName = getCourseName(firstModule);
          const videoWithTitle = createVideoWithTitle(firstVideo, displayName);
          
          setSelectedVideo({
            ...videoWithTitle,
            moduleName: displayName,
            courseName
          });
        }
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

  const fetchAllVideoQuizzes = async (modulesList: Module[]) => {
    const quizzes: Record<string, VideoQuiz> = {};
    
    for (const module of modulesList) {
      const moduleName = getDisplayName(module);
      const courseName = getCourseName(module);
      
      try {
        // Check for module-level quiz
        const moduleQuiz = await checkVideoQuizExists(moduleName, courseName);
        if (moduleQuiz) {
          quizzes[`video-${module._id}`] = moduleQuiz;
        }
        
        // Check for video-specific quizzes
        const allVideos = [
          ...(module.videos || []),
          ...(module.topics?.flatMap(topic => [
            ...(topic.videos || []),
            ...(topic.subtopics?.flatMap(subtopic => subtopic.videos || []) || [])
          ]) || [])
        ];
        
        for (const video of allVideos) {
          if (video.videoTitle) {
            try {
              const videoQuiz = await checkVideoQuizExists(moduleName, courseName, video.videoTitle);
              if (videoQuiz) {
                quizzes[`video-${video._id}`] = videoQuiz;
              }
            } catch (error) {
              console.log(`No quiz found for video: ${video.videoTitle}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching quizzes for module ${moduleName}:`, error);
      }
    }
    
    setVideoQuizzes(quizzes);
  };

  // Event handlers
  const handleVideoSelect = (video: VideoItem, moduleName: string, topicName?: string, subtopicName?: string) => {
    const courseName = course?.title || course?.subject || '';
    setSelectedVideo({
      ...video,
      moduleName,
      topicName,
      subtopicName,
      courseName
    });
    
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };


  const handleShowQuiz = (video: VideoItem) => {
    const quiz = videoQuizzes[`video-${video._id}`];
    if (quiz) {
      setSelectedQuiz(quiz);
      setShowQuizModal(true);
    }
  };

  const handleCreateQuiz = async (video: VideoItem) => {
    if (!selectedVideo) return;
    // Navigate to quiz creation page or open modal
    console.log('Create quiz for video:', video);
    // Implement quiz creation flow here
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

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    } else {
      setError('Course ID is required');
      setLoading(false);
    }
  }, [courseId]);

  // Filter modules based on search query
  const filteredModules = modules.filter(module => {
    const displayName = getDisplayName(module).toLowerCase();
    const description = (module.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return displayName.includes(query) || description.includes(query);
  });

  // Render functions
  const renderVideo = (video: VideoItem, moduleName: string, topicName?: string, subtopicName?: string, level: number = 0) => {
    const isSelected = selectedVideo?._id === video._id;
    const hasQuiz = videoQuizzes[`video-${video._id}`];
    const paddingClass = level === 0 ? 'pl-4' : level === 1 ? 'pl-8' : 'pl-12';
    const videoTitle = video.videoTitle || (subtopicName || topicName || moduleName);
    
    return (
      <div
        key={video._id}
        className={`
          group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-300
          ${paddingClass}
          ${isSelected 
            ? `${darkMode ? 'bg-white/10 hover:bg-white/10 border-blue-400 ring-1 ring-blue-400/60' : 'bg-gray-50 hover:bg-gray-50 border-blue-500 ring-1 ring-blue-300/70'} border-l-4 shadow-md scale-[1.01]` 
            : `${themeClasses.hoverBg} border-transparent scale-100`
          }
        `}
        onClick={() => handleVideoSelect(video, moduleName, topicName, subtopicName)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
            ${isSelected 
              ? `text-white ${themeClasses.gradientBg}` 
              : `${darkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`
            }
          `}>
            <Play className="w-3 h-3" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`
                text-sm font-medium truncate
                ${isSelected 
                  ? `${darkMode ? 'text-blue-400' : 'text-blue-700'}` 
                  : themeClasses.text
                }
              `}>
                {videoTitle}
              </span>
              {/* removed per request: no playing icon on video rows */}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasQuiz ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowQuiz(video);
              }}
              className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              title="View Quiz"
            >
              <HelpCircle className="w-4 h-4 text-green-500" />
            </button>
          ) : (
            user && (user.role === 'instructor' || user.role === 'admin') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateQuiz(video);
                }}
                className={`p-1 rounded ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                title="Create Quiz"
              >
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  const renderSubtopic = (subtopic: Subtopic, moduleName: string, topicName: string) => {
    const isExpanded = expandedSubtopics[subtopic._id];
    const hasVideos = subtopic.videos && subtopic.videos.length > 0;
    const isSubtopicActive = !!selectedVideo && selectedVideo.moduleName === moduleName && selectedVideo.topicName === topicName && selectedVideo.subtopicName === subtopic.subtopicname;
    const activeRowClass = `${darkMode ? 'bg-white/10 ring-1 ring-blue-400/60' : 'bg-gray-50 ring-1 ring-blue-300/70'} border-l-4 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`;

    return (
      <div key={subtopic._id} className="ml-6">
        <div
          className={`
            flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors transition-transform duration-300
            ${isSubtopicActive ? activeRowClass + ' shadow-sm scale-[1.01]' : themeClasses.hoverBg + ' scale-100'}
          `}
          onClick={() => hasVideos && handleSubtopicClick(subtopic, moduleName, topicName)}
        >
          <div className="flex items-center">
            <div className={`w-4 h-4 mr-2 flex items-center justify-center`}>
              <Video className="w-4 h-4 text-green-500" />
            </div>
            <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              {subtopic.subtopicname}
            </span>
            {/* removed per request: no playing icon on subtopic rows */}
          </div>

          <div className="flex items-center space-x-2">
            {hasVideos && (
              <span className={`text-xs ${themeClasses.textMuted}`}>
                {Math.floor(Math.random() * (10 - 2 + 1)) + 2} min
              </span>
            )}
            
          </div>
        </div>

        {isExpanded && hasVideos && (
          <div className="space-y-1 ml-2">
            {subtopic.videos.map(video =>
              renderVideo(video, moduleName, topicName, subtopic.subtopicname, 2)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTopic = (topic: Topic, moduleName: string) => {
    const isExpanded = expandedTopics[topic._id];
    const hasTopicVideos = topic.videos && topic.videos.length > 0;
    const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
    const hasContent = hasTopicVideos || hasSubtopics;
    const hasExpandableContent = topicHasExpandableContent(topic);
    const isTopicActive = !!selectedVideo && selectedVideo.moduleName === moduleName && selectedVideo.topicName === topic.topicname && !selectedVideo.subtopicName;
    const activeRowClass = `${darkMode ? 'bg-white/10 ring-1 ring-blue-400/60' : 'bg-gray-50 ring-1 ring-blue-300/70'} border-l-4 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`;
    
    return (
      <div key={topic._id} className="ml-4">
        <div
          className={`
            flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors transition-transform duration-300
            ${isTopicActive ? activeRowClass + ' shadow-sm scale-[1.01]' : themeClasses.hoverBg + ' scale-100'}
          `}
          onClick={() => handleTopicClick(topic, moduleName)}
        >
          <div className="flex items-center">
            <div className={`w-4 h-4 mr-2 flex items-center justify-center`}>
              <Video className="w-4 h-4 text-blue-500" />
            </div>
            <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              {topic.topicname}
            </span>
            {/* removed per request: no playing icon on topic rows */}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${themeClasses.textMuted}`}>
              {Math.floor(Math.random() * (10 - 2 + 1)) + 2} min
            </span>
            {hasExpandableContent && (
              <div className={`p-1 rounded ${themeClasses.iconBg}`}>
                {isExpanded ? (
                  <ChevronDown className={`w-4 h-4 ${themeClasses.iconColor}`} />
                ) : (
                  <ChevronRight className={`w-4 h-4 ${themeClasses.iconColor}`} />
                )}
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasContent && (
          <div className="space-y-1 ml-2">
            {topic.videos?.map(video => 
              renderVideo(video, moduleName, topic.topicname, undefined, 1)
            )}
            {topic.subtopics?.map(subtopic => 
              renderSubtopic(subtopic, moduleName, topic.topicname)
            )}
          </div>
        )}
      </div>
    );
  };

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
            Back to {user?.tenantId === 'default' ? 'Subjects' : 'Courses'}
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
        ${showSidebar ? 'fixed lg:static' : 'fixed lg:fixed'} 
        inset-y-0 left-0 z-50 w-80 ${themeClasses.sidebarBg}
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:w-96 border-r h-full
      `}>
        {/* Sidebar Header */}
        <div className={`flex-shrink-0 p-4 border-b ${themeClasses.divider} text-white ${themeClasses.gradientBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{course.title || course.subject}</h2>
              <div className="flex items-center space-x-2 text-white/90 text-sm mt-1">
                <span className="bg-white/20 px-2 py-1 rounded">{modules.length} {user?.tenantId === 'default' ? 'Chapters' : 'Modules'}</span>
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
              placeholder={isDefaultTenant ? 'Search chapters...' : 'Search modules...'}
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
                <p>No {user?.tenantId === 'default' ? 'chapters' : 'modules'} found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredModules.map((module, index) => {
                  const isExpanded = expandedModules[module._id];
                  const displayName = getDisplayName(module);
                  const hasExpandableContent = moduleHasExpandableContent(module);
                  const shouldShowContent = hasExpandableContent ? isExpanded : false;
                  const isModuleActive = !!selectedVideo && selectedVideo.moduleName === displayName;
                  const activeRowClass = `${darkMode ? 'bg-white/10 ring-1 ring-blue-400/60' : 'bg-gray-50 ring-1 ring-blue-300/70'} border-l-4 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`;
                  
                  return (
                    <div key={module._id} className={`border rounded-lg ${themeClasses.card}`}>
                      <div
                        className={`p-3 cursor-pointer transition-all duration-300 rounded-lg ${themeClasses.hoverBg} ${isModuleActive && !hasExpandableContent ? (darkMode ? 'border-l-4 border-blue-400' : 'border-l-4 border-blue-500') : ''} scale-100`}
                        onClick={() => handleModuleClick(module)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1
                              ${themeClasses.gradientBg} text-white
                            `}>
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm leading-tight mt-2.5 mb-1 ${themeClasses.text}`}>
                                {displayName}
                              </h3>
                              <p className={`text-xs ${themeClasses.textMuted} mb-2 line-clamp-2`}>
                                {module.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isModuleActive && (
                              <PlayCircle className={`${darkMode ? 'text-green-400' : 'text-green-600'} w-4 h-4 animate-pulse`} />
                            )}
                            {hasExpandableContent && (
                              <div className={`p-1 rounded ${themeClasses.iconBg}`}>
                                {isExpanded ? (
                                  <ChevronDown className={`w-4 h-4 ${themeClasses.iconColor}`} />
                                ) : (
                                  <ChevronRight className={`w-4 h-4 ${themeClasses.iconColor}`} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {shouldShowContent && (
                        <div className="px-3 pb-3 space-y-1">
                          {module.videoUrl && (
                            renderVideo(
                              {
                                _id: module._id,
                                videoUrl: module.videoUrl,
                                videoTitle: displayName,
                              },
                              displayName,
                              undefined,
                              undefined,
                              0
                            )
                          )}
                          {module.videos?.map(video => 
                            renderVideo(video, displayName, undefined, undefined, 0)
                          )}
                          {module.topics?.map(topic => renderTopic(topic, displayName))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-shrink-0 p-4 border-t ${themeClasses.divider} ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`text-sm ${themeClasses.textMuted} text-center`}>
            {modules.filter(m => m.isCompleted || userProgress[m._id]).length} of {modules.length} {user?.tenantId === 'default' ? 'chapters' : 'modules'} completed
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        ${showSidebar ? '' : 'ml-0'}
      `}>
        <div className={`${themeClasses.topBarBg} shadow-sm border-b p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 ${themeClasses.hoverBg} rounded-lg transition-colors`}
              >
                <Menu className={`w-5 h-5 ${themeClasses.text}`} />
              </button>
              {selectedVideo && (
                <div className="hidden sm:block">
                  <h1 className={`text-lg font-semibold ${themeClasses.text}`}>
                    {selectedVideo.courseName}
                  </h1>
                  <p className={`text-sm ${themeClasses.textMuted}`}>
                    {selectedVideo.moduleName} 
                    {selectedVideo.topicName && ` > ${selectedVideo.topicName}`}
                    {selectedVideo.subtopicName && ` > ${selectedVideo.subtopicName}`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to="/learner/courses"
                className={`px-3 py-1 text-sm border rounded-lg transition-colors ${themeClasses.button}`}
              >
                Back to {user?.tenantId === 'default' ? 'Subjects' : 'Courses'}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={`p-4 lg:p-6 transition-all duration-300 ${!showSidebar ? 'max-w-7xl mx-auto' : ''}`}>
            {selectedVideo ? (
              <div className="space-y-6">
                <div className={`${themeClasses.card} rounded-xl shadow-lg overflow-hidden`}>
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    {selectedVideo.videoUrl ? (
                      (() => {
                        const youtubeId = extractYoutubeId(selectedVideo.videoUrl);
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

                <div className={`${themeClasses.card} rounded-xl p-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                        {selectedVideo.videoTitle || selectedVideo.courseName || 'Untitled Video'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span className={themeClasses.textSecondary}>{selectedVideo.moduleName}</span>
                        </div>
                        {selectedVideo.topicName && (
                          <div className="flex items-center space-x-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className={themeClasses.textSecondary}>{selectedVideo.topicName}</span>
                          </div>
                        )}
                        {selectedVideo.subtopicName && (
                          <div className="flex items-center space-x-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className={themeClasses.textSecondary}>{selectedVideo.subtopicName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {videoQuizzes[`video-${selectedVideo._id}`] ? (
                      <button
                        onClick={() => handleShowQuiz(selectedVideo)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${themeClasses.buttonPrimary} shadow-lg hover:shadow-xl`}
                      >
                        <HelpCircle className="h-5 w-5" />
                        <span>Take Quiz</span>
                      </button>
                    ) : (
                      user && (user.role === 'instructor' || user.role === 'admin') && (
                        <button
                          onClick={() => handleCreateQuiz(selectedVideo)}
                          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${themeClasses.buttonPrimary} shadow-lg hover:shadow-xl`}
                        >
                          <Plus className="h-5 w-5" />
                          <span>Create Quiz</span>
                        </button>
                      )
                    )}
                    <button className={`px-6 py-3 border rounded-lg transition-colors font-medium flex items-center space-x-2 ${themeClasses.button}`}>
                      <Download className="h-5 w-5" />
                      <span>Resources</span>
                    </button>
                  </div>
                </div>

                <div className={`${themeClasses.card} rounded-xl p-6`}>
                  <h3 className={`flex items-center space-x-2 text-lg font-medium ${themeClasses.text} mb-4`}>
                    <FileText className={`h-5 w-5 ${themeClasses.iconColor}`} />
                    <span>What You'll Learn</span>
                  </h3>
                  <ul className="space-y-3">
                    {[
                      `Complete understanding of ${(selectedVideo.videoTitle || selectedVideo.moduleName || 'the topic').toLowerCase()}`,
                      "Best practices and industry standards",
                      "Practical exercises and real-world examples",
                      "Tools and resources for implementation",
                    ].map((outcome, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className={themeClasses.textSecondary}>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {videoQuizzes[`video-${selectedVideo._id}`] && (
                  <div className={`${themeClasses.card} rounded-xl p-6`}>
                    <h3 className={`flex items-center space-x-2 text-lg font-medium ${themeClasses.text} mb-4`}>
                      <HelpCircle className={`h-5 w-5 ${themeClasses.iconColor}`} />
                      <span>Quiz Available</span>
                    </h3>
                    <p className={`${themeClasses.textSecondary} mb-4`}>
                      Test your knowledge with our interactive quiz covering the key concepts from this video.
                    </p>
                    <button
                      onClick={() => handleShowQuiz(selectedVideo)}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${themeClasses.buttonPrimary}`}
                    >
                      <Play className="h-5 w-5" />
                      <span>Start Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${themeClasses.card} rounded-xl p-12 text-center`}>
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
                  Welcome to {course.title || course.subject}
                </h2>
                <p className={`${themeClasses.textSecondary} mb-6`}>
                  Click on any module, topic, or subtopic to start playing the first video
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className={`${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {modules.length}
                    </div>
                    <div className={themeClasses.textSecondary}>
                      {user?.tenantId === 'default' ? 'Chapters' : 'Modules'}
                    </div>
                  </div>
                  <div className={`${darkMode ? 'bg-green-500/10' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {modules.reduce((acc, mod) => 
                        acc + (mod.videoUrl ? 1 : 0) + (mod.videos?.length || 0) + 
                        (mod.topics?.reduce((acc2, topic) => 
                          acc2 + (topic.videos?.length || 0) + 
                          (topic.subtopics?.reduce((acc3, st) => acc3 + (st.videos?.length || 0), 0) || 0), 0) || 0), 0)}
                    </div>
                    <div className={themeClasses.textSecondary}>Total Videos</div>
                  </div>
                  <div className={`${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {Object.keys(videoQuizzes).length}
                    </div>
                    <div className={themeClasses.textSecondary}>Quizzes</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuizModal && selectedQuiz && (
        <div className={`fixed inset-0 z-50 ${themeClasses.overlay} flex items-center justify-center p-4`}>
          <div className={`${themeClasses.dialog} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                  Quiz: {selectedQuiz.videoTitle}
                </h2>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className={`p-2 ${themeClasses.hoverBg} rounded-lg`}
                >
                  <XMarkIcon className={`w-6 h-6 ${themeClasses.text}`} />
                </button>
              </div>
              
              <div className="space-y-6">
                {(selectedQuiz.quiz || selectedQuiz.questions || []).map((question, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${themeClasses.divider}`}>
                    <h3 className={`font-semibold mb-3 ${themeClasses.text}`}>
                      {index + 1}. {question.que}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {Object.entries(question.opt).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            key === question.correctAnswer
                              ? `${themeClasses.success} border-2`
                              : `${themeClasses.card} ${themeClasses.hoverBg}`
                          }`}
                        >
                          <span className="font-medium">{key.toUpperCase()})</span> {value}
                        </div>
                      ))}
                    </div>
                    <div className={`p-3 rounded-lg ${themeClasses.success}`}>
                      <p className="text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowQuizModal(false)}
                  className={`px-6 py-3 rounded-lg ${themeClasses.buttonPrimary}`}
                >
                  Close Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreCourses;