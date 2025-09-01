import { useState, FormEvent, useContext, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import Select from 'react-select'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  LockClosedIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface CourseFormData {
  title: string;
  status: string;
  isPublic: boolean;
  grade: string;
  board: string;
  medium: string[];
}

const steps = ['Basic Info', 'Settings'];

const UpdateCourse = ({ darkMode }: { darkMode: boolean }) => {
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
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-blue-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500',
    button: darkMode
      ? 'border-white/10 text-white hover:bg-white/5 hover:text-white'
      : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800',
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
    },
    toggleBg: darkMode ? 'bg-gray-600' : 'bg-gray-200',
    toggleHandle: darkMode ? 'bg-white' : 'bg-white',
    toggleChecked: darkMode ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    status: 'draft',
    isPublic: false,
    grade: '',
    board: '',
    medium: []
  });

  const isValidGrade = (g: string) => {
    const n = Number(g);
    return Number.isInteger(n) && n >= 1 && n <= 12;
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please choose a file under 5MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };


  const mediumOptions = [
    { value: 'Semi-English', label: 'Semi-English' },
    { value: 'मराठी', label: 'मराठी' },
    { value: 'English', label: 'English' },
  ];

  const boardOptions = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'SSC', label: 'SSC (Maharashtra)' },
  ];

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': 'default'
          }
        };
        
        const response = await axios.get(`/courses/${id}`, config);
        
        if (response.data.success) {
          const course = response.data.data;
          setFormData({
            title: course.title || '',
            status: course.status || 'draft',
            isPublic: !!course.isPublic,
            grade: (course.grade ?? '').toString(),
            board: course.board || '',
            medium: Array.isArray(course.medium) ? course.medium : (course.medium ? [course.medium] : [])
          });
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoadingCourse(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id, token]);

  const handleNext = () => {
    if (activeStep === 0 && (!formData.title || !isValidGrade(formData.grade))) {
      setError('Please fill in all required fields. Grade must be an integer between 1 and 12.');
      return;
    }
    
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleMediumChange = (selected: any) => {
    const values = (selected || []).map((opt: any) => opt.value);
    setFormData({
      ...formData,
      medium: values
    });
  };

  const handleBoardChange = (selected: any) => {
    const nextBoard = selected ? selected.value : '';
    setFormData({
      ...formData,
      board: nextBoard,
      medium: nextBoard === 'CBSE' ? [] : formData.medium
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.title || !isValidGrade(formData.grade)) {
      setError('Please fill in all required fields. Grade must be an integer between 1 and 12.');
      setLoading(false);
      return;
    }
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('status', formData.status);
      if (formData.grade) data.append('grade', String(Number(formData.grade)));
      if (formData.board) data.append('board', formData.board);
      if (formData.medium && formData.medium.length > 0) {
        formData.medium.forEach((m) => data.append('medium', m));
      }
      if (coverImage) data.append('coverImg', coverImage);

      const response = await axios.put(`/courses/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'default'
        }
      });
      
      setSuccess('Course updated successfully!');
      
      setTimeout(() => {
        navigate('/coursestest');
      }, 2000);
    } catch (err: any) {
      console.error('Course update error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to update courses.');
        } else if (err.response.status === 404) {
          setError('Course not found. It may have been deleted.');
        } else if (err.response.status === 504 || err.response.status === 408) {
          setError('Request timed out. Please try again later.');
        } else {
          setError(err.response.data?.message || 'Failed to update course. Please try again.');
        }
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while updating the course. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>Subject Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AcademicCapIcon className={`h-5 w-5 ${themeClasses.textMuted}`} />
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={loading}
                    className={`block w-full pl-10 pr-3 py-3 border ${themeClasses.input} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                {!formData.title && error && (
                  <p className={`mt-1 text-sm ${themeClasses.notification.error}`}>Subject name is required</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>Grade Level *</label>
                <input
                  type="number"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={loading}
                  className={`block w-full px-3 py-3 border ${themeClasses.input} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., 10"
                  min="1"
                  max="12"
                  step="1"
                />
                {(!isValidGrade(formData.grade)) && error && (
                  <p className={`mt-1 text-sm ${themeClasses.notification.error}`}>Grade must be an integer between 1 and 12</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>Educational Board</label>
              <Select
                name="board"
                value={boardOptions.find(opt => opt.value === formData.board) || null}
                onChange={handleBoardChange}
                isDisabled={loading}
                options={boardOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db',
                    color: darkMode ? 'white' : '#111827',
                    minHeight: '14px'
                  }),
                  menu: (base) => ({ 
                    ...base, 
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    color: darkMode ? 'white' : '#111827'
                  }),
                  option: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: isFocused 
                      ? (darkMode ? '#374151' : '#f3f4f6')
                      : (darkMode ? '#1f2937' : 'white'),
                    color: darkMode ? 'white' : '#111827'
                  }),
                  singleValue: (base) => ({ 
                    ...base, 
                    color: darkMode ? 'white' : '#111827' 
                  }),
                  input: (base) => ({ 
                    ...base, 
                    color: darkMode ? 'white' : '#111827' 
                  })
                }}
              />
            </div>

            {formData.board !== 'CBSE' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>Medium</label>
                <Select
                  isMulti
                  name="medium"
                  value={mediumOptions.filter(opt => formData.medium.includes(opt.value))}
                  onChange={handleMediumChange}
                  isDisabled={loading}
                  options={mediumOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db',
                      color: darkMode ? 'white' : '#111827',
                      minHeight: '14px'
                    }),
                    menu: (base) => ({ 
                      ...base, 
                      backgroundColor: darkMode ? '#1f2937' : 'white',
                      color: darkMode ? 'white' : '#111827'
                    }),
                    option: (base, { isFocused }) => ({
                      ...base,
                      backgroundColor: isFocused 
                        ? (darkMode ? '#374151' : '#f3f4f6')
                        : (darkMode ? '#1f2937' : 'white'),
                      color: darkMode ? 'white' : '#111827'
                    }),
                    singleValue: (base) => ({ 
                      ...base, 
                      color: darkMode ? 'white' : '#111827' 
                    }),
                    input: (base) => ({ 
                      ...base, 
                      color: darkMode ? 'white' : '#111827' 
                    }),
                    multiValue: (base) => ({ 
                      ...base, 
                      backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' 
                    }),
                    multiValueLabel: (base) => ({ 
                      ...base, 
                      color: darkMode ? 'white' : '#1e40af' 
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: darkMode ? 'white' : '#1e40af',
                      ':hover': { 
                        backgroundColor: darkMode ? 'rgba(59,130,246,0.3)' : '#bfdbfe', 
                        color: darkMode ? 'white' : '#1e40af' 
                      }
                    })
                  }}
                />
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <label className={`block text-sm font-medium mb-4 ${themeClasses.textSecondary}`}>Course Status</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'draft', label: 'Draft', desc: 'Work in progress', color: 'yellow' },
                  { value: 'published', label: 'Published', desc: 'Live and accessible', color: 'green' }
                ].map((status) => (
                  <label key={status.value} className="cursor-pointer">
                    <input type="radio" name="status" value={status.value} checked={formData.status === status.value} onChange={handleChange} disabled={loading} className="sr-only peer" />
                    <div className={`p-4 rounded-lg border-2 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500/10 ${
                      formData.status === status.value 
                        ? darkMode 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-blue-500 bg-blue-50'
                        : darkMode 
                          ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center ${
                        status.color === 'yellow' 
                          ? darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                          : status.color === 'green' 
                          ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                          : darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className="w-3 h-3 rounded-full bg-current"></div>
                      </div>
                      <h4 className={`font-medium mb-1 ${themeClasses.text}`}>{status.label}</h4>
                      <p className={`text-sm ${themeClasses.textMuted}`}>{status.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <PhotoIcon className={`h-5 w-5 ${themeClasses.textAccent}`} />
                <span className={`font-semibold text-base md:text-lg tracking-wide ${themeClasses.text}`}>Cover Image</span>
              </div>
              <label htmlFor="cover-upload-update" className={`group block cursor-pointer rounded-xl border-2 border-dashed transition-all focus-within:ring-2 focus-within:ring-blue-500/50 ${
                darkMode 
                  ? 'border-white/15 bg-white/5 hover:bg-white/10' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}>
                <div className="flex items-center justify-between p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 ${
                      darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <EyeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${themeClasses.text}`}>Click to upload new cover</p>
                      <p className={`text-xs ${themeClasses.textMuted}`}>High‑quality banner works best. JPG, PNG, WebP up to 5MB</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3.5 py-2 rounded-md text-sm font-semibold bg-blue-500 text-white group-hover:bg-blue-600 shadow-sm">Choose File</span>
                </div>
              </label>
              <input id="cover-upload-update" type="file" accept="image/*" onChange={handleImageUpload} disabled={loading} className="sr-only" />
              {coverImage && (
                <p className={`mt-2 text-xs ${themeClasses.textMuted}`}>Selected: {coverImage.name}</p>
              )}
              {imagePreview && (
                <div className="mt-4">
                  <p className={`text-sm font-medium mb-2 ${themeClasses.text}`}>Preview:</p>
                  <img src={imagePreview} alt="Cover preview" className={`w-40 h-24 object-cover rounded-lg border ${
                    darkMode ? 'border-white/10' : 'border-gray-200'
                  }`} />
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            {/* Course Visibility Setting */}
            <div className={`rounded-lg p-6 border ${themeClasses.border} ${themeClasses.cardBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    formData.isPublic 
                      ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                      : darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formData.isPublic ? (
                      <GlobeAltIcon className="h-6 w-6" />
                    ) : (
                      <LockClosedIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${themeClasses.text}`}>
                      {formData.isPublic ? 'Public Course' : 'Private Course'}
                    </h3>
                    <p className={`text-sm ${themeClasses.textMuted}`}>
                      {formData.isPublic 
                        ? 'Visible to all users on the platform' 
                        : 'Only visible to enrolled students'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    disabled={loading}
                    className="sr-only peer"
                  />
                  <div className={`w-14 h-7 ${themeClasses.toggleBg} peer-focus:outline-none peer-focus:ring-4 ${
                    darkMode ? 'peer-focus:ring-blue-300/30' : 'peer-focus:ring-blue-300/50'
                  } rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:${themeClasses.toggleHandle} after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:${themeClasses.toggleChecked}`}></div>
                </label>
              </div>
            </div>
            
            {/* Course Status */}
            <div>
              <label className={`block text-sm font-medium mb-4 ${themeClasses.textSecondary}`}>
                Course Status
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'draft', label: 'Draft', desc: 'Work in progress', color: 'yellow' },
                  { value: 'published', label: 'Published', desc: 'Live and accessible', color: 'green' },
                  { value: 'archived', label: 'Archived', desc: 'Hidden from view', color: 'gray' }
                ].map((status) => (
                  <label key={status.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={handleChange}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all peer-checked:border-blue-500 ${
                      darkMode 
                        ? formData.status === status.value 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                        : formData.status === status.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center ${
                        status.color === 'yellow' 
                          ? darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                        : status.color === 'green' 
                          ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                        : darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className="w-3 h-3 rounded-full bg-current"></div>
                      </div>
                      <h4 className={`font-medium mb-1 ${themeClasses.text}`}>{status.label}</h4>
                      <p className={`text-sm ${themeClasses.textMuted}`}>{status.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Simplified Preview Section */}
            <div className={`rounded-lg border overflow-hidden ${themeClasses.border} ${themeClasses.cardBg}`}>
              <div className={`p-6 border-b ${themeClasses.border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <EyeIcon className={`h-6 w-6 ${themeClasses.textMuted}`} />
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Course Preview</h3>
                </div>
                
                {/* Course Card Preview */}
                <div className={`rounded-lg border overflow-hidden ${themeClasses.border} ${
                  darkMode ? 'bg-white/5' : 'bg-white'
                }`}>
                  {/* Course Header */}
                  <div className={`h-32 flex items-center justify-center relative ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
                      : 'bg-gradient-to-r from-blue-100 to-purple-100'
                  }`}>
                    <AcademicCapIcon className={`h-12 w-12 ${
                      darkMode ? 'text-white opacity-40' : 'text-blue-600 opacity-40'
                    }`} />
                    <div className={`absolute top-3 right-3 rounded-full px-2 py-1 text-xs ${
                      darkMode 
                        ? 'bg-black/40 backdrop-blur-sm text-white' 
                        : 'bg-white/90 backdrop-blur-sm text-gray-800'
                    }`}>
                      {formData.isPublic ? 'Public' : 'Private'}
                    </div>
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`text-lg font-semibold truncate ${themeClasses.text}`}>
                        {formData.title || 'Course Title'}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        formData.status === 'published' 
                          ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                        : formData.status === 'archived' 
                          ? darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800'
                        : darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-3 line-clamp-2 ${themeClasses.textMuted}`}>{'Course description will appear here...'}</p>
                    
                    {/* No tags in simplified form */}
                    
                    <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md text-sm font-medium">
                      Start Course
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Setup Progress */}
              <div className="p-6">
                <h4 className={`text-sm font-medium mb-3 ${themeClasses.textSecondary}`}>Setup Progress</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Course title', completed: !!formData.title },
                    { label: 'Settings configured', completed: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        item.completed 
                          ? 'bg-green-500' 
                          : darkMode ? 'bg-white/10' : 'bg-gray-200'
                      }`}>
                        {item.completed && <CheckCircleIcon className="h-3 w-3 text-white" />}
                      </div>
                      <span className={item.completed ? themeClasses.text : themeClasses.textMuted}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={themeClasses.textMuted}>Complete</span>
                    <span className={themeClasses.text}>
                      {Math.round([
                        !!formData.title,
                        true
                      ].filter(Boolean).length * 50)}%
                    </span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${
                    darkMode ? 'bg-white/10' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${[
                          !!formData.title,
                          true
                        ].filter(Boolean).length * 50}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return 'Unknown step';
    }
  };

  if (loadingCourse) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <h2 className={`mt-4 text-xl font-semibold ${themeClasses.text}`}>Loading course data...</h2>
          <p className={`mt-2 ${themeClasses.textMuted}`}>Please wait while we load your course information</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text}`}>Edit Course</h1>
            <p className={themeClasses.textMuted}>Modify the details below to update your course. You can save as draft and come back later.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`rounded-xl border overflow-hidden ${themeClasses.border} ${themeClasses.cardBg}`}>
          {/* Alerts */}
          {error && (
            <div className={`border-b p-4 flex items-center gap-2 ${themeClasses.notification.error}`}>
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className={`border-b p-4 flex items-center gap-2 ${themeClasses.notification.success}`}>
              <CheckCircleIcon className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Stepper */}
          <div className={`p-6 border-b ${themeClasses.border}`}>
            <div className="flex items-center justify-center gap-12">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                return (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 text-white' 
                        : darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? themeClasses.text : themeClasses.textMuted
                    }`}>
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-px mx-4 ${
                        isCompleted ? 'bg-green-500' : darkMode ? 'bg-white/10' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {getStepContent(activeStep)}
          </div>

          {/* Navigation */}
          <div className={`p-6 border-t ${themeClasses.border} flex justify-between`}>
            <button
              type="button"
              onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 border rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'border-white/10 text-white hover:bg-white/5' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </button>
            
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  loading ||
                  (activeStep === 0 && (!formData.title || !isValidGrade(formData.grade)))
                }
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.title || !isValidGrade(formData.grade)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:from-green-600 hover:to-blue-600 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Updating Course...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Update Course
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateCourse;