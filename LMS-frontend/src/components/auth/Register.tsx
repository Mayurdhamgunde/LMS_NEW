import { useState, useContext, FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { 
  LockClosedIcon, 
  ArrowPathIcon, 
  ChevronDownIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [role, setRole] = useState('student')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Track password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Track confirm password visibility
  const [formErrors, setFormErrors] = useState<{
    name?: string,
    email?: string,
    password?: string,
    confirmPassword?: string,
    organization?: string
  }>({})
  const [successMessage, setSuccessMessage] = useState<string>('')
  
  const { register, error, clearError, tenantId, setTenantId } = useContext(AuthContext)

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, color: 'gray', text: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/(?=.*[a-z])/.test(password)) strength++
    if (/(?=.*[A-Z])/.test(password)) strength++
    if (/(?=.*\d)/.test(password)) strength++
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++
    
    const strengthMap = {
      0: { color: 'gray', text: '' },
      1: { color: 'red', text: 'Very Weak' },
      2: { color: 'orange', text: 'Weak' },
      3: { color: 'yellow', text: 'Fair' },
      4: { color: 'lime', text: 'Good' },
      5: { color: 'green', text: 'Strong' },
      6: { color: 'emerald', text: 'Very Strong' }
    }
    
    return { strength, ...strengthMap[strength as keyof typeof strengthMap] }
  }

  // Available organizations with user-friendly names
  const organizations = [
    { id: 'default', name: 'Learnomic' },
    { id: 'ngo', name: 'NobleGiving' }
  ]

  // Available roles
  const roles = [
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' },
    { value: 'student', label: 'Student' }
  ]

  const handleOrgInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setOrgName(inputValue)

    // Find matching organization (case-insensitive)
    const matchedOrg = organizations.find(
      org => org.name.toLowerCase() === inputValue.toLowerCase()
    )

    if (matchedOrg) {
      setSelectedOrg(matchedOrg)
      setTenantId(matchedOrg.id)
      // Clear any existing organization error
      setFormErrors(prev => ({ ...prev, organization: undefined }))
    } else {
      setSelectedOrg(null)
      setTenantId('')
    }
  }

  const validateForm = () => {
    const errors: {
      name?: string,
      email?: string,
      password?: string,
      confirmPassword?: string,
      organization?: string
    } = {}
    let isValid = true

    // Name validation
    if (!name.trim()) {
      errors.name = 'Name is required'
      isValid = false
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
      isValid = false
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Password validation
    if (!password.trim()) {
      errors.password = 'Password is required'
      isValid = false
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
      isValid = false
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      isValid = false
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password'
      isValid = false
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
      isValid = false
    }

    // Organization validation
    if (!selectedOrg) {
      errors.organization = 'Please enter a valid organization name'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setSuccessMessage('')
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      try {
        console.log(`Registering user with email: ${email}, tenant: ${selectedOrg?.id}, role: ${role}`)
        await register(name, email, password, selectedOrg!.id, role)
        console.log('Registration successful through context')
        setSuccessMessage('Registration successful! Redirecting...')
      } catch (err) {
        console.error('Registration error:', err)
        // The AuthContext has already set the error message
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Enhanced input change handlers with real-time validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    // Clear name error if user starts typing
    if (formErrors.name) {
      setFormErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    // Clear email error if user starts typing
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    // Clear password error if user starts typing
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: undefined }))
    }
    // Clear confirm password error if passwords now match
    if (formErrors.confirmPassword && value === confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    // Clear confirm password error if user starts typing
    if (formErrors.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value)
  }

  const isOrgValid = selectedOrg !== null
  const hasOrgError = formErrors.organization && orgName.trim() !== ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1c] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 shadow-xl animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            {/* Animated gradient border with reduced intensity */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-pink-500/80 animate-gradient p-0.5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-spin-slow blur-sm opacity-30"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 flex items-center justify-center overflow-hidden shadow-md shadow-blue-500/10">
                  <LockClosedIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="mt-6 text-3xl font-bold text-white">
              Create Account
            </h1>
            <p className="mt-2 text-gray-400">
              Please fill in your details to get started
            </p>
          </div>
          
          {/* Success message */}
          {successMessage && !error && (
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg animate-slide-in-down">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg animate-slide-in-down">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          <form className="mt-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-200 mb-2">
                  Organization
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={orgName}
                    onChange={handleOrgInputChange}
                    className={`block w-full pl-10 pr-10 py-2 bg-white/5 border ${
                      isOrgValid 
                        ? 'border-green-500/50 focus:ring-green-500' 
                        : hasOrgError 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="Enter organization name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isOrgValid && (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    )}
                    {hasOrgError && (
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                {/* Organization validation feedback */}
                {isOrgValid && (
                  <p className="mt-2 text-sm text-green-400 flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Valid organization: {selectedOrg.name}
                  </p>
                )}
                
                {formErrors.organization && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.organization}
                  </p>
                )}
                
                {/* Helper text showing valid organizations */}
                {/* <div className="mt-2 p-2 bg-white/5 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Valid organizations:</p>
                  <div className="text-xs text-gray-300 space-y-1">
                    {organizations.map(org => (
                      <div key={org.id} className="flex justify-between">
                        <span>{org.name}</span>
                        <span className="text-gray-500">({org.id})</span>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={handleNameChange}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.name && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {formErrors.name && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className={`block w-full pl-10 pr-3 py-2 bg-white/5 border ${
                      formErrors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="Enter your email"
                  />
                  {formErrors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.email}
                  </p>
                )}
              </div>
              
              {/* 
              {
    "name": "Learnomic Admin",
  "email": "admin25@gmail.com",
  "password":"Admin@25",
  "role": "admin"
  
}
              */}
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className={`block w-full pl-10 pr-12 py-2 bg-white/5 border ${
                      formErrors.password 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="••••••••"
                  />
                  
                  {/* Password visibility toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  {formErrors.password && (
                    <div className="absolute inset-y-0 right-0 pr-12 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.password}
                  </p>
                )}
                
                {/* Password strength indicator */}
                {password && !formErrors.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Password strength:</span>
                      <span className={`text-${getPasswordStrength(password).color}-400 font-medium`}>
                        {getPasswordStrength(password).text}
                      </span>
                    </div>
                    <div className="mt-1 flex space-x-1">
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= getPasswordStrength(password).strength
                              ? `bg-${getPasswordStrength(password).color}-500`
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`block w-full pl-10 pr-12 py-2 bg-white/5 border ${
                      formErrors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/10 focus:ring-blue-500'
                    } rounded-md focus:outline-none focus:ring-2 focus:border-transparent text-white placeholder-gray-400 transition-colors`}
                    placeholder="••••••••"
                  />
                  
                  {/* Confirm password visibility toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  {formErrors.confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-12 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0f1c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="animate-spin h-5 w-5" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <RouterLink 
                to="/login" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register