
import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  tenantId: string;
  createdAt: string;
  board?: string;
  grade?: string;
  medium?: string[];
  subject?: string;
  coverImg?: string;
  courseProgress?: number;
  enrolledStd?: number;
  rating?: number;
  duration?: string;
  lessons?: number;
}

interface CoursesResponse {
  success: boolean;
  data: Course[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

const Courses = ({ darkMode }: { darkMode: boolean }) => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(9);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<CoursesResponse>(`/courses?page=${currentPage}&limit=${limit}`);
      if (res.data.success) {
        setCourses(res.data.data);
        setTotalCount(res.data.pagination.totalCount);
        setTotalPages(res.data.pagination.totalPages);
      } else {
        setError('Failed to load courses. Please try again later.');
      }
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = user?.tenantId === 'default' ? 'Subjects' : 'Courses';

  // Theme classes for light/dark mode consistency
  const themeClasses = {
    container: darkMode ? 'bg-gray-900' : 'bg-gray-100',
    card: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white',
    divider: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-700',
    progress: darkMode ? 'bg-white/10' : 'bg-gray-200',
    gradientPanel: darkMode ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10' : 'bg-gradient-to-br from-indigo-100 to-purple-100',
    cardHover: darkMode ? 'hover:border-blue-500/20 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)]' : 'hover:shadow-xl',
    chipIndigo: darkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-indigo-50 text-indigo-700',
    chipGreen: darkMode ? 'bg-green-500/10 text-green-300' : 'bg-green-50 text-green-700',
    chipPurple: darkMode ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700',
    buttonPrimary: darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
  };

  const handleEnrollAndRedirect = async (courseId: string) => {
    navigate(`/explore-courses/${courseId}`);
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }

    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-1 text-xs text-gray-500">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center px-4 py-2 rounded-full border ${themeClasses.divider} ${darkMode ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer`}
      >
        <svg className="w-4 h-4 mr-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Prev
      </button>
    );

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={`px-4 py-2 rounded-full border ${themeClasses.divider} ${darkMode ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'} transition-all duration-200 cursor-pointer`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer ${
            currentPage === i
              ? (darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md' : 'bg-indigo-600 text-white border-indigo-600')
              : `${themeClasses.divider} ${darkMode ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'}`
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`px-4 py-2 rounded-full border ${themeClasses.divider} ${darkMode ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'} transition-all duration-200 cursor-pointer`}
        >
          {totalPages}
        </button>
      );
    }

    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center px-4 py-2 rounded-full border ${themeClasses.divider} ${darkMode ? 'bg-white/5 text-gray-200 hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-300'} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer`}
      >
        Next
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );

    return pages;
  };

  return (
    <div className={`min-h-screen ${themeClasses.container} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            {pageTitle}
          </h1>
          <p className={`mt-3 text-lg ${themeClasses.textMuted} flex items-center justify-center gap-2`}>
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {totalCount} {pageTitle.toLowerCase()} available
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-8 p-4 ${darkMode ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200'} border rounded-xl flex items-center justify-between max-w-3xl mx-auto`}>
            <span>{error}</span>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className={`${themeClasses.card} rounded-xl overflow-hidden border ${themeClasses.divider} shadow-sm animate-pulse h-[480px]`}
              >
                <div className={`h-48 ${darkMode ? 'bg-white/5' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}></div>
                <div className="p-6 space-y-4">
                  <div className={`h-6 rounded w-3/4 ${themeClasses.progress}`}></div>
                  <div className={`h-4 rounded w-full ${themeClasses.progress}`}></div>
                  <div className={`h-4 rounded w-5/6 ${themeClasses.progress}`}></div>
                  <div className={`h-10 rounded w-32 mt-4 ${themeClasses.progress}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && courses.length === 0 && (
          <div className={`${themeClasses.card} rounded-xl p-8 text-center border border-dashed ${themeClasses.divider} shadow-sm max-w-lg mx-auto`}>
            <svg className="w-16 h-16 mx-auto text-indigo-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
              No {pageTitle.toLowerCase()} found
            </h3>
            <p className={`${themeClasses.textMuted} mb-6`}>
              There are currently no {pageTitle.toLowerCase()} available. Check back later or create your own.
            </p>
            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <Link
                to="/coursestest/add"
                className="inline-flex items-center px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Create {pageTitle.slice(0, -1)}
              </Link>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!loading && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className={`${themeClasses.card} rounded-xl overflow-hidden border ${themeClasses.divider} shadow-sm ${themeClasses.cardHover} transition-all duration-300 group flex flex-col h-[480px] hover:-translate-y-0.5`}
                >
                  {/* Course Image */}
                  <div className="h-48 relative overflow-hidden">
                    {course.coverImg ? (
                      <img
                        src={course.coverImg}
                        alt={course.title || course.subject}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`w-full h-full ${themeClasses.gradientPanel} flex items-center justify-center`}>
                        <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200`}>
                        {course.title || course.subject}
                      </h3>
                      <p className={`text-sm ${themeClasses.textMuted} mb-4 line-clamp-2`}>{course.description}</p>

                      {/* Price and Enrollment */}
                      <div className="flex justify-between items-center mb-4">
                        <div className={`flex items-center text-base font-medium ${themeClasses.text}`}>
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {course.price > 0 ? `₹${course.price.toLocaleString()}` : 'Free'}
                        </div>
                        {course.enrolledStd !== undefined && (
                          <div className={`flex items-center text-sm ${themeClasses.textMuted}`}>
                            <svg className="w-5 h-5 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {course.enrolledStd}
                          </div>
                        )}
                      </div>

                      {/* Rating and Duration */}
                      <div className="flex justify-between items-center mb-4">
                        {course.rating !== undefined && renderStars(course.rating)}
                        <div className={`flex items-center text-xs ${themeClasses.textMuted}`}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {course.duration || '10+ hours'}
                        </div>
                      </div>

                      {/* Metadata */}
                      {user?.tenantId === 'default' && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {course.board && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${themeClasses.chipIndigo}`}>
                              {course.board}
                            </span>
                          )}
                          {course.grade && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${themeClasses.chipGreen}`}>
                              Grade {course.grade}
                            </span>
                          )}
                          {course.medium && course.medium.length > 0 && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${themeClasses.chipPurple}`}>
                              {course.medium.join(', ')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress Bar */}
                      {course.courseProgress !== undefined && (
                        <div className="mb-4">
                          <div className={`flex justify-between text-xs ${themeClasses.textMuted} mb-1`}>
                            <span>Progress</span>
                            <span>{course.courseProgress}%</span>
                          </div>
                          <div className={`w-full ${themeClasses.progress} rounded-full h-1.5`}>
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${course.courseProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explore Button */}
                    <button
                      onClick={() => handleEnrollAndRedirect(course._id)}
                      className={`mt-auto w-full py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${themeClasses.buttonPrimary} shadow-sm hover:shadow-md cursor-pointer`}
                    >
                      Explore {user?.tenantId === 'default' ? 'Subject' : 'Course'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">{renderPagination()}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;