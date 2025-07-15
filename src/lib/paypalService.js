// PayPal Service - Replaces Stripe functionality
// Environment variables required:
// - VITE_PAYPAL_CLIENT_ID: PayPal client ID for frontend
// - PAYPAL_CLIENT_SECRET: PayPal client secret for server-side operations (Netlify functions)
// 
// Provided PayPal Credentials:
// Client ID: AVbwixHdlz8lYYNIAlPBenKqSJMF5RQKx0_Q4xghjEeupBRwBrVl07q9lFRZngtpqm7TmiiWZRXjO8au
// Secret: EPGYm-UgquqUtY5ejIwNtGCHPqoGvY6It9dYQxxUsjqGE6ySCmg20onl-bQUx2xHEmGEzzobs7dMJDIa

// Pricing Plans Configuration (same structure as Stripe)
export const PRICING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    planId: 'P-5ML4271244454362WXNWU5NQ', // PayPal Starter Plan ID (sandbox)
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
    planId: 'P-1GJ4271244454362WXNWU5NQ', // PayPal Professional Plan ID (sandbox)
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
    planId: 'P-8RX4271244454362WXNWU5NQ', // PayPal Enterprise Plan ID (sandbox)
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

// Create PayPal Subscription
export const createPayPalSubscription = async (planId, userId, userEmail) => {
  try {
    console.log('🔄 Creating PayPal subscription...', { planId, userId, userEmail })
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('/.netlify/functions/create-paypal-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId,
        userEmail,
        returnUrl: `${window.location.origin}/dashboard?success=true`,
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
      
      throw new Error(`PayPal subscription creation failed: ${errorMessage}`)
    }

    // Parse JSON response
    let subscription
    try {
      subscription = await response.json()
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response from server. Please try again.')
    }
    
    if (subscription.error) {
      throw new Error(subscription.error)
    }

    if (!subscription.approvalUrl) {
      throw new Error('Invalid subscription response - missing approval URL')
    }

    console.log('✅ PayPal subscription created, redirecting to approval...')
    
    // Redirect to PayPal for approval
    window.location.href = subscription.approvalUrl

  } catch (error) {
    console.error('❌ PayPal subscription error:', error)
    throw error
  }
}

// Create PayPal Order (for one-time payments if needed)
export const createPayPalOrder = async (amount, currency = 'USD', userId, userEmail) => {
  try {
    console.log('🔄 Creating PayPal order...', { amount, currency, userId, userEmail })
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('/.netlify/functions/create-paypal-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        userId,
        userEmail,
        returnUrl: `${window.location.origin}/dashboard?success=true`,
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
      
      throw new Error(`PayPal order creation failed: ${errorMessage}`)
    }

    // Parse JSON response
    let order
    try {
      order = await response.json()
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError)
      throw new Error('Invalid response from server. Please try again.')
    }
    
    if (order.error) {
      throw new Error(order.error)
    }

    if (!order.approvalUrl) {
      throw new Error('Invalid order response - missing approval URL')
    }

    console.log('✅ PayPal order created:', order.id)
    return order

  } catch (error) {
    console.error('❌ PayPal order error:', error)
    throw error
  }
}

// Create PayPal Portal Session (equivalent to Stripe Customer Portal)
export const createPayPalPortalSession = async (subscriptionId) => {
  try {
    console.log('🔄 Creating PayPal portal session...', { subscriptionId })
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch('/.netlify/functions/create-paypal-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
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
      
      throw new Error(`PayPal portal session creation failed: ${errorMessage}`)
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

    console.log('✅ PayPal portal session created, redirecting...')
    window.location.href = session.url
  } catch (error) {
    console.error('❌ PayPal portal error:', error)
    throw error
  }
}

// Mock functions for development (replace with actual API calls)
export const mockCreatePayPalSubscription = async (planId, userId, userEmail) => {
  console.log('🔄 Mock PayPal Subscription:', { planId, userId, userEmail })
  
  // Simulate subscription flow
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Mock subscription completed')
      resolve({ success: true })
    }, 1000)
  })
}

export const mockCreatePayPalPortalSession = async (subscriptionId) => {
  console.log('🔄 Mock PayPal Portal:', { subscriptionId })
  
  // Simulate portal redirect
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Mock portal opened')
      resolve({ success: true })
    }, 1000)
  })
}

// Backward compatibility aliases (to minimize changes in existing code)
export const createCheckoutSession = createPayPalSubscription
export const createCustomerPortalSession = createPayPalPortalSession

// Environment Variables Documentation
/*
Required Environment Variables:

Frontend (.env):
- VITE_PAYPAL_CLIENT_ID=AVbwixHdlz8lYYNIAlPBenKqSJMF5RQKx0_Q4xghjEeupBRwBrVl07q9lFRZngtpqm7TmiiWZRXjO8au

Server-side (Netlify Functions):
- PAYPAL_CLIENT_ID=AVbwixHdlz8lYYNIAlPBenKqSJMF5RQKx0_Q4xghjEeupBRwBrVl07q9lFRZngtpqm7TmiiWZRXjO8au
- PAYPAL_CLIENT_SECRET=EPGYm-UgquqUtY5ejIwNtGCHPqoGvY6It9dYQxxUsjqGE6ySCmg20onl-bQUx2xHEmGEzzobs7dMJDIa
- PAYPAL_ENVIRONMENT=sandbox (or 'live' for production)

PayPal Subscription Plan IDs (to be created in PayPal Developer Dashboard):
- PAYPAL_STARTER_PLAN_ID=P-STARTER-PLAN-ID
- PAYPAL_PROFESSIONAL_PLAN_ID=P-PROFESSIONAL-PLAN-ID  
- PAYPAL_ENTERPRISE_PLAN_ID=P-ENTERPRISE-PLAN-ID
*/
