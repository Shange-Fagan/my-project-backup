import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOut, getSubscription } from '../lib/supabase'
import Button from '../components/Button'
import ProfileUpdateModal from '../components/ProfileUpdateModal'
import PasswordChangeModal from '../components/PasswordChangeModal'
import DeleteAccountModal from '../components/DeleteAccountModal'
import { User, Mail, Calendar, Settings, Download, Trash2, CreditCard } from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return
      
      try {
        const { data, error } = await getSubscription(user.id)
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error loading subscription:', error)
        } else {
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error loading subscription:', error)
      }
    }

    loadSubscription()
  }, [user])

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  const handleExportData = () => {
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      email_confirmed: user.email_confirmed_at
    }

    const dataStr = JSON.stringify(userData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'user_data.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const handleUpdateProfile = () => {
    setShowProfileModal(true)
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center">
            <div className="bg-white p-3 rounded-full mr-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
              <p className="text-blue-200">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Mail className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Email</span>
              </div>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">User ID</span>
              </div>
              <p className="text-gray-900 text-sm font-mono">{user.id}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Member Since</span>
              </div>
              <p className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Last Login</span>
              </div>
              <p className="text-gray-900">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Subscription</span>
              </div>
              <p className="text-gray-900">
                {subscription ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subscription.plan_name || 'Active'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No active plan
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleUpdateProfile}
                  className="flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>

                <Button
                  onClick={handleChangePassword}
                  variant="secondary"
                  className="flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                <Button
                  onClick={handleExportData}
                  variant="success"
                  className="flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  disabled={loading}
                  className="flex items-center justify-center"
                >
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button
                  onClick={handleDeleteAccount}
                  variant="danger"
                  className="flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileUpdateModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user}
      />
      
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
      
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        userEmail={user.email}
      />
    </div>
  )
}

export default Profile
