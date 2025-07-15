import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PRICING_PLANS, createCheckoutSession, createCustomerPortalSession } from '../lib/stripeService'
import { getSubscription, getUserStripeCustomerId } from '../lib/supabase'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'

const Billing = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

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

  const handleSubscribe = async (planId) => {
    setLoading(true)
    try {
      const plan = PRICING_PLANS[planId.toUpperCase()]
      await createCheckoutSession(plan.priceId, user.id, user.email)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      // First try to get the Stripe customer ID from subscription
      let stripeCustomerId = subscription?.stripe_customer_id
      
      if (!stripeCustomerId) {
        // If not found in subscription, try to get it from the database
        const { data, error } = await getUserStripeCustomerId(user.id)
        if (error || !data?.stripe_customer_id) {
          throw new Error('No active subscription found. Please subscribe to a plan first.')
        }
        stripeCustomerId = data.stripe_customer_id
      }

      await createCustomerPortalSession(stripeCustomerId)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        {subscription && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Current Plan: {subscription.plan_name || 'Active'}
          </div>
        )}
      </div>

      {subscriptionLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading subscription...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PRICING_PLANS).map(plan => (
          <div key={plan.id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <div className="my-2 text-4xl font-bold text-gray-900">${plan.price}/mo</div>
            <ul className="mt-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-gray-600">- {feature}</li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || (subscription && subscription.status === 'active')}
              className="mt-6 w-full"
            >
              {loading ? 'Processing...' : 
               (subscription && subscription.status === 'active') ? 'Current Plan' : 'Subscribe'}
            </Button>

            {plan.popular && (
              <div className="mt-3 p-1 text-xs font-bold text-center text-white bg-green-500 rounded-md">
                Most popular
              </div>
            )}
          </div>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold">Manage Your Subscription</h2>
          <p className="text-gray-600 mb-4">Access your billing portal to view or cancel your subscription at any time.</p>
          
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
            className="mt-2 w-full"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
        </div>
      )}
    </div>
  )
}

export default Billing

