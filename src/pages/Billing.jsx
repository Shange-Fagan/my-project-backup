import React, { useState, useEffect } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useAuth } from '../contexts/AuthContext'
import { PRICING_PLANS, createCustomerPortalSession } from '../lib/paypalService'
import { getSubscription, getUserPayPalSubscriptionId } from '../lib/supabase'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'

const Billing = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('paypal') // 'paypal' or 'card'

  // PayPal configuration
  const paypalOptions = {
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'subscription',
    vault: true,
    components: 'buttons,hosted-fields'
  }

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
      } finally {
        setSubscriptionLoading(false)
      }
    }

    loadSubscription()
  }, [user])

  const handleDebugPayPal = async () => {
    try {
      const response = await fetch('/.netlify/functions/debug-paypal')
      const debug = await response.json()
      console.log('🔍 PayPal Debug Info:', debug)
      toast.success('Debug info logged to console')
    } catch (error) {
      console.error('Debug failed:', error)
      toast.error('Debug failed: ' + error.message)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      // First try to get the PayPal subscription ID from subscription
      let paypalSubscriptionId = subscription?.paypal_subscription_id
      
      if (!paypalSubscriptionId) {
        // If not found in subscription, try to get it from the database
        const { data, error } = await getUserPayPalSubscriptionId(user.id)
        if (error || !data?.paypal_subscription_id) {
          throw new Error('No active subscription found. Please subscribe to a plan first.')
        }
        paypalSubscriptionId = data.paypal_subscription_id
      }

      await createCustomerPortalSession(paypalSubscriptionId)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // PayPal subscription creation
  const createSubscription = (data, actions) => {
    if (!selectedPlan) {
      toast.error('Please select a plan first')
      return
    }

    const plan = PRICING_PLANS[selectedPlan.toUpperCase()]
    
    return actions.subscription.create({
      plan_id: plan.planId,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: 'Smart Review SaaS',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
      },
      custom_id: user.id
    })
  }

  // Handle successful subscription approval
  const onApprove = async (data, actions) => {
    try {
      setLoading(true)
      
      // Call our backend to handle the subscription approval
      const response = await fetch('/.netlify/functions/handle-paypal-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          userId: user.id,
          planId: selectedPlan
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process subscription')
      }

      const result = await response.json()
      
      toast.success('Subscription activated successfully!')
      
      // Refresh subscription data
      const { data: subscriptionData } = await getSubscription(user.id)
      setSubscription(subscriptionData)
      setSelectedPlan(null)
      
    } catch (error) {
      console.error('Subscription approval error:', error)
      toast.error('Failed to activate subscription: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle subscription errors
  const onError = (err) => {
    console.error('PayPal subscription error:', err)
    toast.error('Payment failed. Please try again.')
    setLoading(false)
  }

  // Handle subscription cancellation
  const onCancel = (data) => {
    console.log('PayPal subscription cancelled:', data)
    toast.info('Payment cancelled')
    setSelectedPlan(null)
    setLoading(false)
  }

  // PayPal Buttons component for subscriptions
  const PayPalSubscriptionButton = ({ plan }) => (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'subscribe'
      }}
      createSubscription={(data, actions) => {
        setSelectedPlan(plan.id)
        return createSubscription(data, actions)
      }}
      onApprove={onApprove}
      onError={onError}
      onCancel={onCancel}
      disabled={loading || (subscription && subscription.status === 'active')}
    />
  )

  // Development mode check
  const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_PAYPAL_CLIENT_ID

  if (isDevelopment) {
    console.log('🚧 Development Mode: PayPal integration disabled')
  }

  // Mock subscription function for development
  const handleMockSubscribe = async (planId) => {
    setLoading(true)
    try {
      console.log('🚧 Mock subscription for plan:', planId)
      toast.success(`Mock subscription created for ${planId} plan`)
      
      // Simulate subscription creation
      setTimeout(() => {
        setSubscription({
          id: 'mock-sub-' + Date.now(),
          status: 'active',
          plan_name: PRICING_PLANS[planId.toUpperCase()].name,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Billing</h1>
            <div className="flex items-center gap-2 mt-2">
              <img 
                src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                alt="PayPal" 
                className="h-6"
              />
              <span className="text-sm text-gray-600">Secure payments powered by PayPal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleDebugPayPal} className="bg-yellow-600 hover:bg-yellow-700">
              Debug PayPal
            </Button>
            {subscription && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Current Plan: {subscription.plan_name || 'Active'}
              </div>
            )}
          </div>
        </div>

        {isDevelopment && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
                <p className="text-sm text-yellow-700">PayPal integration is disabled. Using mock functions for testing.</p>
              </div>
            </div>
          </div>
        )}

        {subscriptionLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading subscription...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {Object.values(PRICING_PLANS).map(plan => (
              <div key={plan.id} className={`bg-white p-6 rounded-lg shadow-md relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <div className="my-2 text-4xl font-bold text-gray-900">${plan.price}/mo</div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-gray-600 flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {subscription && subscription.status === 'active' ? (
                    <Button disabled className="w-full bg-gray-400">
                      Current Plan
                    </Button>
                  ) : isDevelopment ? (
                    <Button
                      onClick={() => handleMockSubscribe(plan.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Subscribe (Mock)'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Payment method selector */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPaymentMethod('paypal')}
                          className={`flex-1 py-2 px-3 text-sm rounded-md border ${
                            paymentMethod === 'paypal' 
                              ? 'bg-blue-50 border-blue-500 text-blue-700' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          PayPal
                        </button>
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 py-2 px-3 text-sm rounded-md border ${
                            paymentMethod === 'card' 
                              ? 'bg-blue-50 border-blue-500 text-blue-700' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Card
                        </button>
                      </div>

                      {/* PayPal Buttons */}
                      {paymentMethod === 'paypal' ? (
                        <PayPalSubscriptionButton plan={plan} />
                      ) : (
                        <PayPalButtons
                          style={{
                            layout: 'vertical',
                            color: 'black',
                            shape: 'rect',
                            label: 'pay'
                          }}
                          fundingSource="card"
                          createSubscription={(data, actions) => {
                            setSelectedPlan(plan.id)
                            return createSubscription(data, actions)
                          }}
                          onApprove={onApprove}
                          onError={onError}
                          onCancel={onCancel}
                          disabled={loading}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Subscription Management Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Manage Your Subscription</h2>
              <p className="text-gray-600 mb-4">Access your PayPal billing portal to view or cancel your subscription at any time.</p>
              
              {subscription ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Status:</strong> {subscription.status || 'Active'}
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-sm text-gray-700">
                      <strong>Next billing:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-700">
                    No active subscription found. Subscribe to a plan to access the billing portal.
                  </p>
                </div>
              )}

              <Button
                onClick={handleManageSubscription}
                disabled={loading || !subscription}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </Button>

              {/* PayPal branding */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <img 
                    src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" 
                    alt="PayPal" 
                    className="h-4"
                  />
                  <span>Secure billing powered by PayPal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  )
}

export default Billing

