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

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'

// Create Stripe Checkout Session
export const createCheckoutSession = async (priceId, userId, userEmail) => {
  try {
    console.log('🔄 Creating checkout session...', { priceId, userId, userEmail, isDevelopment })
    
    // In development, use mock checkout or direct Stripe checkout
    if (isDevelopment) {
      console.log('🔧 Development mode detected - using direct Stripe checkout')
      return await createDirectStripeCheckout(priceId, userId, userEmail)
    }
    
    // Production: Use Netlify function
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
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
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    console.log('📊 Response status:', response.status, response.statusText)

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        // Try to get error details from response
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage
        }
      } catch {
        // If we can't read the response, use the status
        console.error('❌ Could not read error response')
      }
      
      throw new Error(`Checkout session creation failed: ${errorMessage}`)
    }

    // Parse JSON response
    let session
    try {
      session = await response.json()
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response from server. Please try again.')
    }
    
    if (session.error) {
      throw new Error(session.error)
    }

    if (!session.id) {
      throw new Error('Invalid session response - missing session ID')
    }

    console.log('✅ Checkout session created:', session.id)

    const stripe = await stripePromise
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id
    })

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('❌ Stripe checkout error:', error)
    throw error
  }
}

// Development checkout using local server
const createDirectStripeCheckout = async (priceId, userId, userEmail) => {
  try {
    console.log('🔧 Development mode: Creating checkout via local server...')
    
    // Try to call a local development server endpoint
    const response = await fetch('http://localhost:8888/.netlify/functions/create-checkout-session', {
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

    if (response.ok) {
      const session = await response.json()
      console.log('✅ Local server checkout session created:', session.id)

      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id
      })

      if (error) {
        throw new Error(error.message)
      }
      return
    }
    
    throw new Error('Local server not available')
    
  } catch (error) {
    console.error('❌ Local server checkout failed:', error.message)
    
    // Fallback to enhanced mock for development
    console.log('🔄 Falling back to enhanced mock checkout...')
    return await mockCreateCheckoutSession(priceId, userId, userEmail)
  }
}

// Create Customer Portal Session
export const createCustomerPortalSession = async (customerId) => {
  try {
    console.log('🔄 Creating customer portal session...', { customerId, isDevelopment })
    
    // In development, use mock portal
    if (isDevelopment) {
      console.log('🔧 Development mode detected - using mock customer portal')
      return await mockCreateCustomerPortalSession(customerId)
    }
    
    // Production: Use Netlify function
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('/.netlify/functions/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/billing`
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    console.log('📊 Response status:', response.status, response.statusText)

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        // Try to get error details from response
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage
        }
      } catch {
        // If we can't read the response, use the status
        console.error('❌ Could not read error response')
      }
      
      throw new Error(`Portal session creation failed: ${errorMessage}`)
    }

    // Parse JSON response
    let session
    try {
      session = await response.json()
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response from server. Please try again.')
    }
    
    if (session.error) {
      throw new Error(session.error)
    }

    if (!session.url) {
      throw new Error('Invalid session response - missing portal URL')
    }

    console.log('✅ Portal session created, redirecting...')
    window.location.href = session.url
  } catch (error) {
    console.error('❌ Customer portal error:', error)
    throw error
  }
}

// Enhanced mock functions for development
export const mockCreateCheckoutSession = async (priceId, userId, userEmail) => {
  console.log('🔄 Mock Stripe Checkout:', { priceId, userId, userEmail })
  
  // Find the plan details for better mock experience
  const plan = Object.values(PRICING_PLANS).find(p => p.priceId === priceId)
  const planName = plan ? plan.name : 'Unknown Plan'
  
  // Simulate checkout flow with user interaction
  return new Promise((resolve) => {
    const shouldProceed = confirm(
      `🔧 DEVELOPMENT MODE\n\n` +
      `Mock Stripe Checkout for: ${planName}\n` +
      `Price: $${plan?.price || 'Unknown'}/month\n` +
      `User: ${userEmail}\n\n` +
      `Click OK to simulate successful payment\n` +
      `Click Cancel to simulate payment failure`
    )
    
    setTimeout(() => {
      if (shouldProceed) {
        console.log('✅ Mock checkout completed successfully')
        // Simulate successful checkout by redirecting to success page
        window.location.href = `${window.location.origin}/dashboard?success=true&mock=true`
        resolve({ success: true })
      } else {
        console.log('❌ Mock checkout cancelled')
        // Simulate cancelled checkout
        window.location.href = `${window.location.origin}/billing?canceled=true&mock=true`
        resolve({ success: false, cancelled: true })
      }
    }, 500)
  })
}

export const mockCreateCustomerPortalSession = async (customerId) => {
  console.log('🔄 Mock Customer Portal:', { customerId })
  
  // Simulate portal with user interaction
  return new Promise((resolve) => {
    const action = confirm(
      `🔧 DEVELOPMENT MODE\n\n` +
      `Mock Stripe Customer Portal\n` +
      `Customer ID: ${customerId}\n\n` +
      `This would normally open the Stripe billing portal where customers can:\n` +
      `• View billing history\n` +
      `• Update payment methods\n` +
      `• Cancel subscriptions\n` +
      `• Download invoices\n\n` +
      `Click OK to simulate portal access\n` +
      `Click Cancel to simulate access denied`
    )
    
    setTimeout(() => {
      if (action) {
        console.log('✅ Mock portal access granted')
        alert('🔧 Mock Portal: In production, this would redirect to Stripe\'s customer portal.')
        resolve({ success: true })
      } else {
        console.log('❌ Mock portal access denied')
        throw new Error('Portal access denied (mock)')
      }
    }, 500)
  })
}
