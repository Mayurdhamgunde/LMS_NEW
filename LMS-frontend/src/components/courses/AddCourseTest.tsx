import { useState, FormEvent, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthContext from '../../context/AuthContext'
import Select from 'react-select'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
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
  description?: string;
}

const steps = ['Basic Info', 'Settings'];

const AddCourseTest = ({ darkMode = false }: { darkMode?: boolean }) => {
  const navigate = useNavigate();
  const { token, user, tenantId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    status: 'draft',
    isPublic: false,
    grade: '',
    board: '',
    medium: [],
    description: ''
  });

  const isValidGrade = (g: string) => {
    const n = Number(g);
    return Number.isInteger(n) && n >= 1 && n <= 12;
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

  const handleNext = () => {
    const isDefaultTenant = (tenantId || 'default') === 'default'
    if (
      activeStep === 0 && 
      (
        !formData.title || 
        (isDefaultTenant && !isValidGrade(formData.grade))
      )
    ) {
      setError('Please fill in all required fields. Grade must be an integer between 1 and 12.');
      return;
    }
    // no step-1 specific validation now
    
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.title) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      setUploading(true);

      const data = new FormData();
      data.append('title', formData.title);
      data.append('status', formData.status);
      if (formData.description) data.append('description', formData.description);
      if (formData.grade) data.append('grade', String(Number(formData.grade)));
      if (formData.board) data.append('board', formData.board);
      if (formData.medium && formData.medium.length > 0) {
        formData.medium.forEach((m) => data.append('medium', m));
      }
      if (user?._id) data.append('createdBy', user._id);
      if (coverImage) data.append('coverImg', coverImage);

      await axios.post('/courses', data, {
        headers: {
          // Let the browser set the correct multipart boundary
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId || 'default'
        }
      });
      
      setSuccess('Course created successfully!');
      
      setTimeout(() => {
        navigate('/coursestest?newCourse=true');
      }, 2000);
    } catch (err: any) {
      console.error('Course creation error:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (err.response.status === 403) {
          setError('You do not have permission to create courses.');
        } else if (err.response.status === 504 || err.response.status === 408) {
          setError('Request timed out. Please try again later.');
        } else {
          setError(err.response.data?.message || 'Failed to create course. Please try again.');
        }
      } else if (err.request) {
        setError('No response received from server. Please check your connection and try again.');
      } else {
        setError('An error occurred while creating the course. Please try again.');
      }
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const rootTheme = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
  const headingIcon = darkMode ? 'text-blue-400' : 'text-blue-500'
  const uploadCard = darkMode
    ? 'rounded-xl border-2 border-dashed border-white/15 bg-white/5 hover:bg-white/10 focus-within:ring-2 focus-within:ring-blue-500/50'
    : 'rounded-xl border-2 border-dashed border-gray-200 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20'
  const uploadIconWrap = darkMode
    ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30'
    : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
  const helperText = darkMode ? 'text-gray-400' : 'text-gray-500'
  const previewBorder = darkMode ? 'border-white/10' : 'border-gray-200'
  const panelClasses = darkMode
    ? 'bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden'
    : 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden'
  const sectionBorder = darkMode ? 'border-white/10' : 'border-gray-200'
  const labelText = darkMode ? 'text-gray-300' : 'text-gray-700'
  const inputBase = darkMode
    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400'
    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
  const headerSubText = darkMode ? 'text-gray-400' : 'text-gray-600'
  const stepInactive = darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'
  const stepDivider = darkMode ? 'bg-white/10' : 'bg-gray-300'
  const cancelBtn = darkMode
    ? 'border border-white/10 text-white hover:bg-white/5'
    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'

  // Tenant-aware labels
  const isDefaultTenant = (tenantId || 'default') === 'default'
  const subjectLabel = isDefaultTenant ? 'Subject Name *' : 'Course Title *'
  const subjectPlaceholder = isDefaultTenant ? 'e.g., Mathematics' : 'e.g., Web Development'
  const subjectErrorText = isDefaultTenant ? 'Subject name is required' : 'Course title is required'

  return (
    <div className={`min-h-screen ${rootTheme}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Create New Course</h1>
            <p className={`${headerSubText}`}>Fill in the details below to create your new Curriculum. You can save as draft and come back later.</p>
          </div>
        </div>
        
        <div className={`${panelClasses}`}>
          {error && (
            <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 p-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/10 border-b border-green-500/20 text-green-400 p-4 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <div className={`p-6 border-b ${sectionBorder}`}>
            <div className="flex items-center justify-center gap-8">
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
                        : stepInactive
                    }`}>
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-400' : 'text-gray-600')
                    }`}>
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-px mx-4 ${
                        isCompleted ? 'bg-green-500' : stepDivider
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeStep === 0 ? (
              // Basic Info
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${labelText} mb-2`}>{subjectLabel}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        className={`block w-full pl-10 pr-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBase}`}
                        placeholder={subjectPlaceholder}
                        required
                      />
                    </div>
                    {!formData.title && error && (
                      <p className="mt-1 text-sm text-red-400">{subjectErrorText}</p>
                    )}
                  </div>
                  {isDefaultTenant && (
                    <div>
                      <label className={`block text-sm font-medium ${labelText} mb-2`}>Grade Level *</label>
                      <input
                        type="number"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        disabled={loading}
                        className={`block w-full px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBase}`}
                        placeholder="e.g., 10"
                        min="1"
                        max="12"
                        step="1"
                      />
                      {(!isValidGrade(formData.grade)) && error && (
                        <p className="mt-1 text-sm text-red-400">Grade must be an integer between 1 and 12</p>
                      )}
                    </div>
                  )}
                </div>

                {!isDefaultTenant && (
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${labelText} mb-2`}>Course Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      disabled={loading}
                      className={`block w-full px-3 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputBase}`}
                      placeholder="Briefly describe this course"
                      rows={4}
                    />
                  </div>
                )}

                {isDefaultTenant && (
                  <div>
                    <label className={`block text-sm font-medium ${labelText} mb-2`}>Educational Board</label>
                    <Select
                      name="board"
                      value={boardOptions.find(opt => opt.value === formData.board) || null}
                      onChange={handleBoardChange}
                      isDisabled={loading}
                      options={boardOptions}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={darkMode ? {
                        control: (base) => ({ ...base, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', minHeight: '14px' }),
                        menu: (base) => ({ ...base, backgroundColor: '#1f2937', color: 'white' }),
                        option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#374151' : '#1f2937', color: 'white' }),
                        singleValue: (base) => ({ ...base, color: 'white' }),
                        input: (base) => ({ ...base, color: 'white' })
                      } : {
                        control: (base) => ({ ...base, backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', minHeight: '14px' }),
                        menu: (base) => ({ ...base, backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }),
                        option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#f3f4f6' : '#ffffff', color: '#111827' }),
                        singleValue: (base) => ({ ...base, color: '#111827' }),
                        input: (base) => ({ ...base, color: '#111827' })
                      }}
                    />
                  </div>
                )}

                {isDefaultTenant && formData.board !== 'CBSE' && (
                  <div>
                    <label className={`block text-sm font-medium ${labelText} mb-2`}>Medium</label>
                    <Select
                      isMulti
                      name="medium"
                      value={mediumOptions.filter(opt => formData.medium.includes(opt.value))}
                      onChange={handleMediumChange}
                      isDisabled={loading}
                      options={mediumOptions}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={darkMode ? {
                        control: (base) => ({ ...base, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'white', minHeight: '14px' }),
                        menu: (base) => ({ ...base, backgroundColor: '#1f2937', color: 'white' }),
                        option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#374151' : '#1f2937', color: 'white' }),
                        singleValue: (base) => ({ ...base, color: 'white' }),
                        input: (base) => ({ ...base, color: 'white' }),
                        multiValue: (base) => ({ ...base, backgroundColor: 'rgba(59, 130, 246, 0.2)' }),
                        multiValueLabel: (base) => ({ ...base, color: 'white' }),
                        multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: 'rgba(59,130,246,0.3)', color: 'white' } })
                      } : {
                        control: (base) => ({ ...base, backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', minHeight: '14px' }),
                        menu: (base) => ({ ...base, backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }),
                        option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? '#f3f4f6' : '#ffffff', color: '#111827' }),
                        singleValue: (base) => ({ ...base, color: '#111827' }),
                        input: (base) => ({ ...base, color: '#111827' }),
                        multiValue: (base) => ({ ...base, backgroundColor: '#e0f2fe' }),
                        multiValueLabel: (base) => ({ ...base, color: '#0f172a' }),
                        multiValueRemove: (base) => ({ ...base, color: '#0f172a', ':hover': { backgroundColor: '#bfdbfe', color: '#0f172a' } })
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Settings
              <div className="space-y-8">
                

                <div>
                  <label className={`block text-sm font-medium ${labelText} mb-4`}>Course Status</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'draft', label: 'Draft', desc: 'Work in progress', color: 'yellow' },
                      { value: 'published', label: 'Published', desc: 'Live and accessible', color: 'green' }
                    ].map((status) => (
                      <label key={status.value} className="cursor-pointer">
                        <input type="radio" name="status" value={status.value} checked={formData.status === status.value} onChange={handleChange} disabled={loading} className="sr-only peer" />
                        <div className={`p-4 rounded-lg border-2 transition-all peer-checked:border-blue-500 ${
                          formData.status === status.value
                            ? (darkMode ? 'bg-blue-500/10' : 'bg-blue-50')
                            : (darkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:bg-gray-50')
                        }`}>
                          <div className={`w-8 h-8 rounded-full mb-2 flex items-center justify-center ${
                            status.color === 'yellow'
                              ? (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
                              : status.color === 'green'
                                ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600')
                                : (darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600')
                          }`}>
                            <div className="w-3 h-3 rounded-full bg-current"></div>
                          </div>
                          <h4 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{status.label}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{status.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={`${panelClasses.replace('rounded-xl','rounded-lg')}`}>
                  <div className={`p-6 border-b ${sectionBorder}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <EyeIcon className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Course Preview</h3>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-lg font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formData.title || (isDefaultTenant ? 'Subject Name' : 'Course Title')}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                          formData.status === 'published'
                            ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700')
                            : (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                        }`}>{formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}</span>
                      </div>
                      <div className="mt-4">
                        <div className="mb-3 flex items-center gap-2">
                          <PhotoIcon className={`h-5 w-5 ${headingIcon}`} />
                          <span className="font-semibold text-base md:text-lg tracking-wide">Cover Image</span>
                        </div>
                        <label htmlFor="cover-upload" className={`group block cursor-pointer ${uploadCard} transition-all`}>
                          <div className="flex items-center justify-between p-5 md:p-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${uploadIconWrap}`}>
                                <EyeIcon className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Click to upload cover</p>
                                <p className={`text-xs ${helperText}`}>High‑quality banner works best. JPG, PNG, WebP up to 5MB</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-3.5 py-2 rounded-md text-sm font-semibold bg-blue-500 text-white group-hover:bg-blue-600 shadow-sm">Choose File</span>
                          </div>
                        </label>
                        <input id="cover-upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={loading || uploading} className="sr-only" />
                        {coverImage && (
                          <p className={`mt-2 text-xs ${helperText}`}>Selected: {coverImage.name}</p>
                        )}
                        {imagePreview && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Preview:</p>
                            <img src={imagePreview} alt="Cover preview" className={`w-40 h-24 object-cover rounded-lg border ${previewBorder}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className={`text-sm font-medium ${labelText} mb-3`}>Setup Progress</h4>
                    <div className="space-y-2">
                      {[
                        { label: isDefaultTenant ? 'Subject name' : 'Course title', completed: !!formData.title },
                        { label: 'Settings configured', completed: true }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.completed ? 'bg-green-500' : (darkMode ? 'bg-white/10' : 'bg-gray-200')}`}>{item.completed && <CheckCircleIcon className="h-3 w-3 text-white" />}</div>
                          <span className={item.completed ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-400' : 'text-gray-600')}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 border-t ${sectionBorder} flex justify-between`}>
            <button
              type="button"
              onClick={activeStep === 0 ? () => navigate(-1) : handleBack}
              disabled={loading}
              className={`inline-flex items-center px-6 py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cancelBtn}`}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </button>
            
            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  loading || uploading || 
                  (activeStep === 0 && (!formData.title || (isDefaultTenant && !isValidGrade(formData.grade))))
                }
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploading || !formData.title || (isDefaultTenant && !isValidGrade(formData.grade))}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || uploading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    {uploading ? 'Uploading...' : 'Creating Course...'}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Create Course
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

export default AddCourseTest;