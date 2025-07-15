import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createWidget, getWidgets, getAnalytics, createBusiness, getBusiness } from '../lib/supabase'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'
import { Code, Copy, Settings, BarChart3, Eye, Trash2, Plus, ExternalLink, Palette, Zap, MessageSquare, Star, Users, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [widgets, setWidgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState(null)
  const [widgetConfig, setWidgetConfig] = useState({
    title: 'How was your experience?',
    subtitle: 'We\'d love to hear your feedback!',
    theme: 'light',
    position: 'bottom-right',
    showAfter: 5000,
    buttonText: 'Leave a Review',
    colors: {
      primary: '#007cba',
      secondary: '#f8f9fa',
      text: '#333333'
    }
  })
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalClicks: 0,
    conversionRate: 0,
    averageRating: 0
  })

  useEffect(() => {
    fetchWidgets()
    fetchAnalytics()
  }, [])

  const fetchWidgets = async () => {
    try {
      // First ensure user has a business
      let business = await ensureUserHasBusiness()
      if (!business) return
      
      const { data, error } = await getWidgets(business.id)
      if (error) throw error
      setWidgets(data || [])
    } catch (error) {
      console.error('Error fetching widgets:', error)
      setWidgets([]) // Set empty array on error
    }
  }

  const ensureUserHasBusiness = async () => {
    try {
      // Try to get existing business
      const { data: existingBusiness, error: getError } = await getBusiness(user.id)
      if (existingBusiness && !getError) {
        return existingBusiness
      }
      
      // Create default business if none exists
      const { data: newBusiness, error: createError } = await createBusiness({
        user_id: user.id,
        name: `${user.email?.split('@')[0] || 'My'} Business`,
        email: user.email,
        industry: 'General',
        created_at: new Date().toISOString()
      })
      
      if (createError) {
        console.error('Error creating business:', createError)
        throw new Error('Failed to create business: ' + createError.message)
      }
      
      return newBusiness
    } catch (error) {
      console.error('Error ensuring business:', error)
      throw error // Don't fall back to mock business
    }
  }

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await getAnalytics(user.id)
      if (error) throw error
      
      // Calculate analytics from data
      const totalViews = data?.reduce((sum, item) => sum + (item.views || 0), 0) || 0
      const totalClicks = data?.reduce((sum, item) => sum + (item.clicks || 0), 0) || 0
      const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
      
      setAnalytics({
        totalViews,
        totalClicks,
        conversionRate,
        averageRating: 4.8 // Mock data
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
    setLoading(false)
  }

  const generateWidgetCode = (widget) => {
    const widgetId = widget?.id || 'demo-widget'
    const businessId = user.id
    
    return `<!-- Smart Review Widget - Add this code before the closing </body> tag -->
<div data-smart-review-widget 
     data-business-id="${businessId}" 
     data-widget-id="${widgetId}"
     data-theme="${widgetConfig.theme}"
     data-position="${widgetConfig.position}"
     data-show-after="${widgetConfig.showAfter}">
</div>
<script src="${window.location.origin}/widget.js" async></script>
<!-- End Smart Review Widget -->`
  }

  const generateInstallationInstructions = (widget) => {
    return `📋 INSTALLATION INSTRUCTIONS:

1. Copy the code snippet below
2. Open your website's HTML file (usually index.html)
3. Paste the code just before the closing </body> tag
4. Save and refresh your website

✅ The widget will automatically appear on your site!

💡 TIPS:
- The widget will show after ${widgetConfig.showAfter/1000} seconds
- It will appear in the ${widgetConfig.position} corner
- Customize colors and text in the dashboard

🔧 TROUBLESHOOTING:
- Make sure the script loads (check browser console)
- Verify your domain is added to CORS settings
- Test on different pages of your website`
  }

  const handleCreateWidget = async () => {
    try {
      // First ensure user has a business
      let business = await ensureUserHasBusiness()
      if (!business) return

      const { data, error } = await createWidget({
        business_id: business.id,
        name: `Widget ${widgets.length + 1}`,
        config: widgetConfig,
        is_active: true
      })

      console.log('Widget creation result:', { data, error })

      if (error) throw error
      if (!data) throw new Error('Widget creation returned no data')
      
      await fetchWidgets()
      setShowWidgetBuilder(false)
      toast.success('Widget created successfully!')
    } catch (error) {
      toast.error('Error creating widget: ' + error.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copied to clipboard!')
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Eye}
          title="Total Views"
          value={analytics.totalViews}
          color="bg-blue-500"
        />
        <StatCard
          icon={Zap}
          title="Total Clicks"
          value={analytics.totalClicks}
          color="bg-green-500"
        />
        <StatCard
          icon={BarChart3}
          title="Conversion Rate"
          value={`${analytics.conversionRate}%`}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Star}
          title="Average Rating"
          value={analytics.averageRating}
          color="bg-purple-500"
        />
      </div>

      {/* Widget Builder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Widget Builder</h2>
            <Button 
              onClick={() => setShowWidgetBuilder(true)} 
              className="flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Widget
            </Button>
          </div>
          
          <div className="space-y-4">
            {widgets.map((widget, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{widget.name || 'Unnamed Widget'}</h3>
                    <p className="text-sm text-gray-600 mt-1">ID: {widget.id || 'demo-widget'}</p>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(widget.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedWidget(widget)
                        setShowInstallModal(true)
                      }} 
                      className="flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Get Code
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {widgets.length === 0 && (
              <div className="text-center py-8">
                <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No widgets created yet</p>
                <Button 
                  onClick={() => setShowWidgetBuilder(true)}
                  variant="secondary"
                >
                  Create Your First Widget
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Widget Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Widget Preview</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-sm mx-auto p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">{widgetConfig.title}</h3>
              <p className="text-gray-600 mb-4">{widgetConfig.subtitle}</p>
              <div className="flex justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-6 h-6 text-gray-300" />
                ))}
              </div>
              <Button size="sm" className="w-full">
                {widgetConfig.buttonText}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Theme: {widgetConfig.theme}</p>
            <p>Position: {widgetConfig.position}</p>
          </div>
        </div>
      </div>

      {/* Widget Builder Modal */}
      {showWidgetBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Widget</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Widget Title
                </label>
                <input
                  type="text"
                  value={widgetConfig.title}
                  onChange={(e) => setWidgetConfig({...widgetConfig, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <textarea
                  value={widgetConfig.subtitle}
                  onChange={(e) => setWidgetConfig({...widgetConfig, subtitle: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    value={widgetConfig.theme}
                    onChange={(e) => setWidgetConfig({...widgetConfig, theme: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={widgetConfig.position}
                    onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => setShowWidgetBuilder(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWidget}>
                Create Widget
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
