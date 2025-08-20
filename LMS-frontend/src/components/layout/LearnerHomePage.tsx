import { useState, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { 
  MoonIcon,
  SunIcon,
  HomeIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon,
  UserIcon,
  Cog8ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import AuthContext from '../../context/AuthContext'

interface User {
  _id: string
  name: string
  email: string
  role: string
  tenantId?: String
  profile?: {
    avatar?: string
    bio?: string
  }
}

interface LearnerHomePageProps {
  toggleDarkMode: () => void
  darkMode: boolean
}

const LearnerHomePage = ({ toggleDarkMode, darkMode }: LearnerHomePageProps) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { user, logout, isAuthenticated } = useContext(AuthContext)

  // Theme-aware styling
  const themeClasses = {
    bg: darkMode ? 'bg-[#0f172a]' : 'bg-gray-50',
    navBg: darkMode ? 'bg-[#1e2736]/95' : 'bg-white/95',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-500',
    hoverBg: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100',
    cardBg: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    modalBg: darkMode ? 'bg-[#1e2736]' : 'bg-white',
    buttonText: darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900',
    gradientText: 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent',
    activeLink: darkMode 
      ? 'text-white font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
      : 'text-gray-900 font-semibold bg-gradient-to-r from-blue-500/20 to-purple-500/20',
    inactiveLink: darkMode 
      ? 'text-gray-400 hover:text-white' 
      : 'text-gray-600 hover:text-gray-900'
  }

  const handleUserMenuToggle = () => setUserMenuOpen(!userMenuOpen)
  const handleLogoutClick = () => {
    setUserMenuOpen(false)
    setShowLogoutConfirm(true)
  }
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false)
    logout()
  }
  const handleLogoutCancel = () => setShowLogoutConfirm(false)

  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return undefined
    if (imagePath.startsWith('data:')) return imagePath
    if (imagePath.startsWith('/')) return `${window.location.origin}${imagePath}`
    return imagePath
  }

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-800'
      case 'instructor': return darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-800'
      default: return darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-800'
    }
  }

  const getActiveLinkClass = (path: string) => {
    const currentPath = window.location.pathname
    return currentPath === path || currentPath.startsWith(path + "/") 
      ? themeClasses.activeLink 
      : themeClasses.inactiveLink
  }

  const isAdmin = user?.role === 'admin'

  if (!isAuthenticated) return <Outlet />

  return (
    <>
      <div className={`min-h-screen ${themeClasses.bg}`}>
        {/* Professional Navbar */}
        <nav className={`sticky top-0 z-50 ${themeClasses.navBg} backdrop-blur-md border-b ${themeClasses.border}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center transition-transform hover:scale-105">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary} font-medium hidden sm:block`}>
      Tenant ID: {user?.tenantId || 'N/A'}
    </div>
                    {/* <div className={`text-xs ${themeClasses.textSecondary} font-medium hidden sm:block`}>
                      {user?.tenantId?.description || 'Learning Hub'}
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="/learner" className={`transition-colors font-medium px-3 py-2 rounded-lg ${getActiveLinkClass('/')}`}>
                  Dashboard 
                </a>
                <a href="learner/course" className={`transition-colors font-medium px-3 py-2 rounded-lg ${getActiveLinkClass('/courses')}`}>
                  Courses
                </a>
                <a href="/learner" className={`transition-colors font-medium px-3 py-2 rounded-lg ${getActiveLinkClass('/assignments')}`}>
                  Knowledge Check
                </a>
                {isAdmin && (
                  <a href="/admin/users" className={`transition-colors font-medium px-3 py-2 rounded-lg ${getActiveLinkClass('/admin/users')}`}>
                    User Management
                  </a>
                )}
                <a href="/learner/profile" className={`transition-colors font-medium px-3 py-2 rounded-lg ${getActiveLinkClass('/profile')}`}>
                  Profile
                </a>
              </div>

              {/* Right side actions */}
              <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <button 
                  onClick={toggleDarkMode}
                  className={`p-2 ${themeClasses.buttonText} transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-lg`}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={handleUserMenuToggle}
                    className="group w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium ring-0 ring-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 focus:ring-4 cursor-pointer"
                  >
                    {user?.profile?.avatar ? (
                      <img 
                        src={getFullImageUrl(user.profile.avatar)} 
                        alt={user.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm">{user?.name?.charAt(0) || 'U'}</span>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 ${darkMode ? 'border-[#1e2736]' : 'border-white'} rounded-full`} />
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-pointer"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      
                      <div className={`absolute right-0 mt-2 w-72 ${themeClasses.modalBg} rounded-lg shadow-xl ${darkMode ? 'shadow-black/40' : 'shadow-black/10'} border ${themeClasses.border} overflow-hidden z-50`}>
                        <div className={`p-4 border-b ${themeClasses.border}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              {user?.profile?.avatar ? (
                                <img 
                                  src={getFullImageUrl(user.profile.avatar)} 
                                  alt={user.name}
                                  className="w-full h-full rounded-lg object-cover"
                                />
                              ) : (
                                <span className="text-base text-white">{user?.name?.charAt(0) || 'U'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${themeClasses.text} truncate`}>{user?.name}</div>
                              <div className={`text-sm ${themeClasses.textSecondary} truncate mb-2`}>{user?.email}</div>
                              <div className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                                {user?.role || 'Student'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <a
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className={`flex items-center w-full gap-3 px-3 py-2 text-sm ${themeClasses.textSecondary} rounded-md ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} hover:${themeClasses.text} transition-colors group cursor-pointer`}
                          >
                            <UserIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>View Profile</span>
                          </a>
                          
                          <button
                            onClick={handleLogoutClick}
                            className={`flex items-center w-full gap-3 px-3 py-2 text-sm ${themeClasses.textSecondary} rounded-md ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} hover:${themeClasses.text} transition-colors group cursor-pointer`}
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden p-2 ${themeClasses.buttonText} transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} rounded-lg`}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className={`md:hidden border-t ${themeClasses.border} py-4`}>
                <div className="space-y-2">
                  <a href="/" className={`block px-3 py-2 rounded-lg transition-colors font-medium ${getActiveLinkClass('/')}`}>
                    Dashboard
                  </a>
                  <a href="/coursestest" className={`block px-3 py-2 rounded-lg transition-colors font-medium ${getActiveLinkClass('/courses')}`}>
                    Courses
                  </a>
                  <a href="/assignments" className={`block px-3 py-2 rounded-lg transition-colors font-medium ${getActiveLinkClass('/assignments')}`}>
                    Knowledge Check
                  </a>
                  {isAdmin && (
                    <a href="/admin/users" className={`block px-3 py-2 rounded-lg transition-colors font-medium ${getActiveLinkClass('/admin/users')}`}>
                      User Management
                    </a>
                  )}
                  <a href="/profile" className={`block px-3 py-2 rounded-lg transition-colors font-medium ${getActiveLinkClass('/profile')}`}>
                    Profile
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Page content */}
        <main className={`min-h-screen ${themeClasses.bg}`}>
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" 
          style={{ zIndex: 9999 }}
          onClick={handleLogoutCancel}
        >
          <div 
            className={`relative ${themeClasses.modalBg} rounded-lg shadow-xl w-full max-w-sm mx-auto border ${themeClasses.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Sign Out</h3>
                <button 
                  onClick={handleLogoutCancel}
                  className={`${themeClasses.buttonText} transition-colors rounded-lg p-1 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} cursor-pointer`}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <p className={`${themeClasses.textSecondary} mb-4`}>
                Are you sure you want to sign out?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className={`px-4 py-2 text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors rounded-lg ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'} cursor-pointer`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LearnerHomePage