import { useContext } from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  VideoCameraIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  ClockIcon,
  CheckCircleIcon,
  LightBulbIcon,
  BookOpenIcon,
  MoonIcon,
  SunIcon,
  UserGroupIcon,
  CalendarIcon,
  TrophyIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import AuthContext from '../context/AuthContext'

const Home = ({ darkMode }: { darkMode: boolean }) => {
  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: darkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white shadow-sm',
    cardHover: darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    textAccent: darkMode ? 'text-blue-400' : 'text-blue-600',
    hoverBg: darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100',
    buttonText: darkMode ? 'text-white' : 'text-gray-900',
    gradientBg: darkMode 
      ? 'bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-gray-900' 
      : 'bg-gradient-to-br from-blue-50 via-purple-50 to-gray-50',
    gradientText: darkMode 
      ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400'
      : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600'
  };

  const { user } = useContext(AuthContext)

  const features = [
    {
      icon: VideoCameraIcon,
      title: "Video-Based",
      description: "Engaging video content for effective learning",
      color: "text-red-400"
    },
    {
      icon: ArrowPathIcon,
      title: "AI-Generated Quizzes",
      description: "Personalized quizzes based on your learning",
      color: "text-blue-400"
    },
    {
      icon: ChartBarIcon,
      title: "Progress Tracking",
      description: "Monitor your learning journey and improvements",
      color: "text-green-400"
    },
    {
      icon: PuzzlePieceIcon,
      title: "Interactive",
      description: "Active participation enhances retention",
      color: "text-yellow-400"
    },
    {
      icon: ClockIcon,
      title: "Self-Paced",
      description: "Learn at your own convenience and speed",
      color: "text-purple-400"
    }
  ]

  const facts = [
    {
      icon: LightBulbIcon,
      text: "Your brain uses 20% of your body's energy, even though it's only 2% of your body weight!",
      category: "Brain Science",
      color: "text-yellow-400"
    },
    {
      icon: BookOpenIcon,
      text: "Teaching someone else what you've learned is one of the most effective ways to master new concepts!",
      category: "Learning Techniques",
      color: "text-blue-400"
    },
    {
      icon: CheckCircleIcon,
      text: "Taking breaks every 25 minutes while studying can improve retention by up to 40%",
      category: "Study Tips",
      color: "text-green-400"
    },
    {
      icon: MoonIcon,
      text: "Students who get 7-9 hours of sleep perform 23% better on tests than those who sleep less!",
      category: "Health & Performance",
      color: "text-indigo-400"
    },
    {
      icon: TrophyIcon,
      text: "Writing down your goals makes you 42% more likely to achieve them according to research!",
      category: "Goal Setting",
      color: "text-red-400"
    },
    {
      icon: CalendarIcon,
      text: "Learning a new skill for just 15 minutes a day can make you proficient in under a year!",
      category: "Skill Development",
      color: "text-purple-400"
    }
  ]

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      <section className={`relative py-24 overflow-hidden ${themeClasses.gradientBg}`}>
  {/* Animated Background Elements */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-20 left-10 w-56 h-56 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
  </div>

  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-4xl mx-auto text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-blue-400/40 bg-gradient-to-r from-blue-400/15 to-purple-400/15 backdrop-blur-sm shadow-md hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
        <SparklesIcon className="h-5 w-5 text-blue-400 animate-pulse" />
        <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🚀 Next-Gen Interactive Learning Platform
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-lg">
        <span className={themeClasses.gradientText}>
          Learn Smarter, Not Harder
        </span>
      </h1>

      {/* Subtitle */}
      <p className={`text-base md:text-lg mb-8 ${themeClasses.textSecondary} max-w-2xl mx-auto leading-relaxed`}>
        Transform your learning experience with engaging video content, AI-powered quizzes,
        and a personalized journey designed to make learning effortless.
      </p>

      
      

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        {/* Feature 1 */}
        <div className="group relative p-6 rounded-xl bg-gradient-to-br from-blue-400/10 to-purple-400/10 border border-blue-400/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.03] overflow-hidden">
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center shadow-lg z-10">
            <BookOpenIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-blue-400 mt-12">Personalized</h3>
          <p className={`text-sm ${themeClasses.textSecondary}`}>AI adapts to your unique learning style and pace</p>
        </div>

        {/* Feature 2 */}
        <div className="group relative p-6 rounded-xl bg-gradient-to-br from-purple-400/10 to-pink-400/10 border border-purple-400/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.03] overflow-hidden">
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg z-10">
            <LightBulbIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-purple-400 mt-12">Interactive</h3>
          <p className={`text-sm ${themeClasses.textSecondary}`}>Engaging video-based learning with real-time feedback</p>
        </div>

        {/* Feature 3 */}
        <div className="group relative p-6 rounded-xl bg-gradient-to-br from-green-400/10 to-blue-400/10 border border-green-400/20 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.03] overflow-hidden">
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center shadow-lg z-10">
            <ChartBarIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2 text-green-400 mt-12">Results-Driven</h3>
          <p className={`text-sm ${themeClasses.textSecondary}`}>Track progress with smart analytics and insights</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-15">
        <Link 
          to="learner/courses" 
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-blue-500/20 font-medium"
            >
          <AcademicCapIcon className="h-5 w-5" />
          Explore Courses
        </Link>

        {!user && (
          <Link 
            to="/register" 
            className={`px-6 py-3 border rounded-lg shadow-sm backdrop-blur-md 
                       hover:scale-105 active:scale-95 transition-all font-medium flex items-center gap-2 text-sm
                       ${darkMode ? 'border-gray-700 bg-white/5 hover:bg-white/10' : 'border-gray-300 bg-white/60 hover:bg-white/80'}`}
          >
            <UserGroupIcon className="h-5 w-5" />
            Sign Up Free
          </Link>
        )}
      </div>
    </div>
  </div>

  {/* Bottom wave */}
  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
</section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className={`text-lg ${themeClasses.textSecondary}`}>
              Our platform combines cutting-edge technology with proven learning methodologies
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border ${themeClasses.border} ${themeClasses.cardBg} transition-all hover:shadow-lg hover:-translate-y-1 ${themeClasses.cardHover}`}
              >
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={themeClasses.textMuted}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LMS?</h2>
            <p className={`text-lg ${themeClasses.textSecondary}`}>
              Discover the features that make our platform unique and effective
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                  <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                </div>
                <span className={themeClasses.gradientText}>Personalized Learning</span>
              </h3>
              <p className={`mb-8 text-lg ${themeClasses.textSecondary}`}>
                Our AI adapts to your learning style and pace, creating a customized experience that maximizes retention and understanding.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-1">Smart Quizzes</h4>
                    <p className={themeClasses.textMuted}>
                      AI-generated quizzes adapt to your knowledge level, focusing on areas that need improvement.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <PuzzlePieceIcon className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-1">Interactive Exercises</h4>
                    <p className={themeClasses.textMuted}>
                      Hands-on activities reinforce concepts through practical application and experimentation.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                      <ClockIcon className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-1">Flexible Scheduling</h4>
                    <p className={themeClasses.textMuted}>
                      Learn when it suits you best with 24/7 access to all course materials and resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl overflow-hidden ${themeClasses.cardBg} border ${themeClasses.border}`}>
              <div className="p-8 h-full">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <LightBulbIcon className="h-6 w-6 text-yellow-400" />
                  <span>Did You Know?</span>
                </h3>
                <div className="space-y-8">
                  {facts.slice(0, 3).map((fact, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <fact.icon className={`h-5 w-5 ${fact.color}`} />
                        </div>
                      </div>
                      <div>
                        <p className={`mb-2 text-lg ${themeClasses.textSecondary}`}>{fact.text}</p>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {fact.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Facts Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Learning Science Insights</h2>
            <p className={`text-lg ${themeClasses.textSecondary}`}>
              Discover fascinating facts about how we learn and retain information
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facts.map((fact, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border ${themeClasses.border} ${themeClasses.cardBg} transition-all hover:shadow-lg hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                  <fact.icon className={`h-6 w-6 ${fact.color}`} />
                </div>
                <p className={`mb-4 text-lg ${themeClasses.textSecondary}`}>{fact.text}</p>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {fact.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${themeClasses.gradientBg}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Learning?</h2>
            <p className={`text-xl mb-8 ${themeClasses.textSecondary}`}>
              Join thousands of learners who are already benefiting from our interactive platform.
            </p>
            <Link 
              to={user ? "learner/courses" : "/register"} 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-blue-500/20 font-medium"
            >
              {user ? "Continue Learning" : "Get Started Now"}
              <ArrowPathIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${themeClasses.border}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                <span>LMS</span>
              </h3>
              <p className={themeClasses.textMuted}>
                Empowering students with interactive learning experiences and personalized education.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link to="/" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Home</Link></li>
                <li><Link to="/courses" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Courses</Link></li>
                <li><Link to="/about" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>About</Link></li>
                <li><Link to="/dashboard" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Dashboard</Link></li>
                <li><Link to="/faq" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <address className={`not-italic ${themeClasses.textMuted} space-y-2`}>
                <p>3rd Floor, Siddhaganga Plaza,</p>
                <p>No.12/1, 6/5,Kanakapura Main Road,</p>
                <p>Above Apple Fitness and Reliance Digital,</p>
                <p>Raghuvanahalli, Bengaluru, Karnataka- 560062</p>
                <p className="mt-3">
                  <strong className={themeClasses.text}>Phone:</strong> +91 7411620955
                </p>
                <p>
                  <strong className={themeClasses.text}>Email:</strong> lmsindia@outlook.com
                </p>
              </address>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Privacy Policy</Link></li>
                <li><Link to="/terms" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Terms of Service</Link></li>
                <li><Link to="/cookies" className={`hover:underline ${themeClasses.textSecondary} transition-colors`}>Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t ${themeClasses.border} mt-12 pt-8 text-center ${themeClasses.textMuted}`}>
            <p>© 2025 Lms. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home