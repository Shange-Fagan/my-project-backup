import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PRICING_PLANS, createCheckoutSession, createCustomerPortalSession } from '../lib/stripeService'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'

const Billing = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

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
      await createCustomerPortalSession(user.id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

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
              disabled={loading}
              className="mt-6 w-full"
            >
              {loading ? 'Processing...' : 'Subscribe'}
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
          <p className="text-gray-600">Access your billing portal to view or cancel your subscription at any time.</p>
          <Button
            onClick={handleManageSubscription}
            disabled={loading}
            className="mt-6 w-full"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Billing

