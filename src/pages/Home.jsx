import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import { Star, MessageSquare, TrendingUp, Shield, Zap, Users } from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: MessageSquare,
      title: 'Smart Reviews',
      description: 'Intelligent review management with automated insights and analytics.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Analytics',
      description: 'Track performance metrics and customer satisfaction in real-time.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Built with security first using Supabase backend infrastructure.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for speed with modern React and efficient data loading.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together with your team to manage and respond to reviews.'
    },
    {
      icon: Star,
      title: 'Rating System',
      description: 'Comprehensive rating system with detailed feedback collection.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">
              Smart Review
              <span className="block text-blue-200">Management Platform</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
              Streamline your review process, gain actionable insights, and boost customer satisfaction with our intelligent SaaS platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary" className="border-white text-white hover:bg-white hover:text-blue-600">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage reviews effectively and grow your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Review Management?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Smart Review to improve their customer experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="secondary" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Schedule Demo
                </Button>
              </>
            )}
            {user && (
              <Link to="/reviews">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Manage Reviews
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Smart Review</h3>
              <p className="text-gray-400">Powered by Supabase</p>
            </div>
            <div className="flex space-x-6">
              <Button variant="secondary" size="sm">
                Documentation
              </Button>
              <Button variant="secondary" size="sm">
                Support
              </Button>
              <Button variant="secondary" size="sm">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
