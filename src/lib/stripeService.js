import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// Pricing Plans Configuration
export const PRICING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: 'price_1RkpmOCx4JpdOBsxz4r7xmNH',
    reviewRequests: 100,
    features: [
      'Up to 100 review requests per month',
      'Basic sentiment analysis',
      'Email notifications',
      'Basic analytics dashboard'
    ],
    popular: false
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 59,
    priceId: 'price_1RkpoRCx4JpdOBsxDFVGHIuy',
    reviewRequests: 500,
    features: [
      'Up to 500 review requests per month',
      'Advanced AI sentiment analysis',
      'SMS + Email notifications',
      'Advanced analytics & insights',
      'Custom widget branding',
      'Priority support'
    ],
    popular: true
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceId: 'price_1RkpptCx4JpdOBsxKCPooLQg',
    reviewRequests: 'Unlimited',
    features: [
      'Unlimited review requests',
      'Advanced AI sentiment analysis',
      'SMS + Email notifications',
      'Advanced analytics & insights',
      'Custom widget branding',
      'White-label solution',
      'Dedicated account manager',
      'API access',
      'Custom integrations'
    ],
    popular: false
  }
}

// Create Stripe Checkout Session
export const createCheckoutSession = async (priceId, userId, userEmail) => {
  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`
      })
    })

    const session = await response.json()
    
    if (session.error) {
      throw new Error(session.error)
    }

    const stripe = await stripePromise
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id
    })

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Stripe checkout error:', error)
    throw error
  }
}

// Create Customer Portal Session
export const createCustomerPortalSession = async (customerId) => {
  try {
    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/billing`
      })
    })

    const session = await response.json()
    
    if (session.error) {
      throw new Error(session.error)
    }

    window.location.href = session.url
  } catch (error) {
    console.error('Customer portal error:', error)
    throw error
  }
}

// Mock functions for development (replace with actual API calls)
export const mockCreateCheckoutSession = async (priceId, userId, userEmail) => {
  console.log('🔄 Mock Stripe Checkout:', { priceId, userId, userEmail })
  
  // Simulate checkout flow
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Mock checkout completed')
      resolve({ success: true })
    }, 1000)
  })
}

export const mockCreateCustomerPortalSession = async (customerId) => {
  console.log('🔄 Mock Customer Portal:', { customerId })
  
  // Simulate portal redirect
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Mock portal opened')
      resolve({ success: true })
    }, 1000)
  })
}
