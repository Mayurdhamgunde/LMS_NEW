import { useContext } from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  LightBulbIcon,
  UserGroupIcon,
  HandRaisedIcon,
  UsersIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ClockIcon,
  TrophyIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import AuthContext from '../context/AuthContext'

const About = ({ darkMode }: { darkMode: boolean }) => {
  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-white/5 backdrop-blur-sm' : 'bg-white shadow-sm',
    cardHover: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50',
    border: darkMode ? 'border-white/10' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    textAccent: darkMode ? 'text-blue-400' : 'text-blue-600',
    hoverBg: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    buttonText: darkMode ? 'text-white' : 'text-gray-900',
    gradientBg: darkMode 
      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
      : 'bg-gradient-to-r from-blue-100 to-purple-100',
  };

  const { user } = useContext(AuthContext)

  const stats = [
    { value: '500K+', label: 'Active Learners', icon: UsersIcon },
    { value: '120+', label: 'Countries Reached', icon: GlobeAltIcon },
    { value: '200+', label: 'Expert Instructors', icon: UserGroupIcon },
    { value: '92%', label: 'Completion Rate', icon: TrophyIcon }
  ]

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Hero Section */}
      <section className={`py-20 ${themeClasses.gradientBg}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Our Educational Platform
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Welcome to Learnomic, where we believe that education should be accessible, engaging, and transformative.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className={`text-xl mb-8 ${themeClasses.textSecondary}`}>
              Our mission is to provide high-quality educational content that empowers learners of all ages to reach their full potential.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Learning Methodology</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className={`text-lg mb-6 ${themeClasses.textSecondary}`}>
                  Discover how our research-backed approach to education combines cognitive science, active learning principles, and personalized feedback systems to create an effective learning experience for students of all backgrounds.
                </p>
                <p className={`text-lg mb-6 ${themeClasses.textSecondary}`}>
                  Our adaptive learning technology identifies your strengths and areas for improvement, customizing content delivery to match your pace and learning style. This approach has led to a 43% improvement in concept retention compared to traditional learning methods.
                </p>
              </div>
              <div className={`p-8 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <LightBulbIcon className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-semibold">Research-Backed Approach</h3>
                </div>
                <ul className={`space-y-4 ${themeClasses.textSecondary}`}>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Cognitive science principles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Active learning methodologies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Personalized feedback systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Adaptive learning technology</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educators Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Meet Our Educators</h2>
            <p className={`text-lg mb-12 text-center ${themeClasses.textSecondary}`}>
              Our team consists of passionate educators, industry experts, and instructional designers who collaborate to create learning experiences that bridge theory and practice.
            </p>
            
            <div className={`p-8 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg} mb-12`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <UserGroupIcon className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="text-2xl font-semibold">Expert Instructors</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className={`mb-4 ${themeClasses.textSecondary}`}>
                    With an average of 12+ years of experience in their respective fields, our educators bring diverse perspectives from academia and industry.
                  </p>
                  <p className={themeClasses.textSecondary}>
                    They undergo rigorous training in our teaching methodology to ensure content quality and engaging delivery that inspires learners.
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                  <h4 className="font-semibold mb-3">Educator Qualifications</h4>
                  <ul className={`space-y-2 ${themeClasses.textSecondary}`}>
                    <li className="flex items-center gap-2">
                      <AcademicCapIcon className="h-5 w-5 text-blue-500" />
                      <span>Advanced degrees in their field</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <HandRaisedIcon className="h-5 w-5 text-blue-500" />
                      <span>Proven teaching experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                      <span>Certified in our methodology</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Sections */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Learn by Doing */}
              <div className={`p-8 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <HandRaisedIcon className="h-7 w-7 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-semibold">Learn by Doing</h3>
                </div>
                <p className={`mb-4 ${themeClasses.textSecondary}`}>
                  We believe that practical application is essential for deep understanding. Our courses incorporate hands-on projects, simulations, and real-world case studies.
                </p>
                <p className={`mb-6 ${themeClasses.textSecondary}`}>
                  Studies show that active learning increases knowledge retention by up to 75%. That's why every module in our curriculum includes interactive elements and practical exercises that reinforce theoretical concepts through immediate application.
                </p>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                  <h4 className="font-semibold mb-2">Course Features</h4>
                  <ul className={`space-y-2 ${themeClasses.textSecondary}`}>
                    <li className="flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5 text-green-500" />
                      <span>Hands-on projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5 text-green-500" />
                      <span>Real-world simulations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-green-500" />
                      <span>Interactive case studies</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Community-Centered */}
              <div className={`p-8 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <UsersIcon className="h-7 w-7 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-semibold">Community-Centered</h3>
                </div>
                <p className={`mb-4 ${themeClasses.textSecondary}`}>
                  Learning happens best in community. Our platform fosters collaboration through discussion forums, peer reviews, and group projects that enhance the learning experience.
                </p>
                <p className={`mb-6 ${themeClasses.textSecondary}`}>
                  Our vibrant learning communities connect students across geographical boundaries, creating networks that often extend beyond coursework. Many of our students form study groups, research collaborations, and even professional collaborations that last for years.
                </p>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                  <h4 className="font-semibold mb-2">Community Features</h4>
                  <ul className={`space-y-2 ${themeClasses.textSecondary}`}>
                    <li className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-yellow-500" />
                      <span>Discussion forums</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5 text-yellow-500" />
                      <span>Peer review system</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <GlobeAltIcon className="h-5 w-5 text-yellow-500" />
                      <span>Global networking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Impact</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`p-6 rounded-lg border ${themeClasses.border} ${themeClasses.cardBg} text-center`}
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-7 w-7 text-blue-500" />
                </div>
                <p className="text-3xl font-bold mb-2">{stat.value}</p>
                <p className={themeClasses.textSecondary}>{stat.label}</p>
              </div>
            ))}
          </div>
          
          <div className="max-w-4xl mx-auto mt-12">
            <p className={`text-lg text-center ${themeClasses.textSecondary}`}>
              Since our founding in 2018, we've helped over 500,000 learners worldwide achieve their educational and career goals. Our courses have been adopted by universities, corporations, and independent learners across six continents.
            </p>
            <p className={`text-lg text-center mt-6 ${themeClasses.textSecondary}`}>
              We're committed to making education accessible to underserved communities through scholarships and partnerships with non-profit organizations.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-16 ${themeClasses.gradientBg}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Learning Community</h2>
          <p className={`text-xl mb-8 max-w-2xl mx-auto ${themeClasses.textSecondary}`}>
            Empowering students with interactive learning experiences and personalized education.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/courses" 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Browse Courses
            </Link>
            {!user && (
              <Link 
                to="/register" 
                className="px-6 py-3 border rounded-lg hover:bg-white/10 transition-all"
              >
                Sign Up Free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${themeClasses.border}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Lms</h3>
              <p className={themeClasses.textMuted}>
                Empowering students with interactive learning experiences and personalized education.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className={`hover:underline ${themeClasses.textSecondary}`}>Home</Link></li>
                <li><Link to="/courses" className={`hover:underline ${themeClasses.textSecondary}`}>Learn</Link></li>
                <li><Link to="/about" className={`hover:underline ${themeClasses.textSecondary}`}>About</Link></li>
                {user && <li><Link to="/dashboard" className={`hover:underline ${themeClasses.textSecondary}`}>Dashboard</Link></li>}
                <li><Link to="/login" className={`hover:underline ${themeClasses.textSecondary}`}>Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <address className={`not-italic ${themeClasses.textMuted}`}>
                <p>3rd Floor, Siddhaganga Plaza,</p>
                <p>No.12/1, 6/5, Kanakapura Main Road,</p>
                <p>Above Apple Fitness and Reliance Digital,</p>
                <p>Raghuvanahalli, Bengaluru, Karnataka- 560062</p>
                <p className="mt-2">
                  <strong>Phone:</strong> +91 7411620955
                </p>
                <p>
                  <strong>Email:</strong> lmsindia@outlook.com
                </p>
              </address>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className={`hover:underline ${themeClasses.textSecondary}`}>Privacy Policy</Link></li>
                <li><Link to="/terms" className={`hover:underline ${themeClasses.textSecondary}`}>Terms of Service</Link></li>
                <li><Link to="/cookies" className={`hover:underline ${themeClasses.textSecondary}`}>Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t ${themeClasses.border} mt-8 pt-8 text-center ${themeClasses.textMuted}`}>
            <p>© 2025 Lms. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About