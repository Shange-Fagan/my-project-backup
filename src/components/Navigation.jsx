import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../lib/supabase'
import Button from './Button'

const Navigation = () => {
  const { user } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Smart Review
            </Link>
            
            {user && (
              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/reviews"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/reviews')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews
                </Link>
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/billing"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/billing')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Billing
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.email}</span>
                <Button onClick={handleSignOut} variant="secondary">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
