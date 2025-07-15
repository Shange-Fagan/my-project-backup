import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============= AUTH FUNCTIONS =============
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const updateUserProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  return { data, error }
}

export const updateUserPassword = async (password) => {
  const { data, error } = await supabase.auth.updateUser({
    password
  })
  return { data, error }
}

export const deleteUserAccount = async () => {
  // First get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'No user found' } }

  try {
    // Call the Netlify function to delete the user account
    const response = await fetch('/.netlify/functions/delete-user-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete account')
    }

    return { error: null }
  } catch (error) {
    console.error('Account deletion error:', error)
    return { error }
  }
}

// ============= BUSINESS FUNCTIONS =============
export const createBusiness = async (businessData) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert([businessData])
    .select()
  return { data, error }
}

export const getBusiness = async (userId) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const updateBusiness = async (businessId, updates) => {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
  return { data, error }
}

// ============= REVIEW FUNCTIONS =============
export const createReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert([reviewData])
    .select()
  return { data, error }
}

export const getReviews = async (businessId = null) => {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      businesses (
        name,
        industry
      )
    `)
    .order('created_at', { ascending: false })
  
  if (businessId) {
    query = query.eq('business_id', businessId)
  }
  
  const { data, error } = await query
  return { data, error }
}

export const updateReview = async (reviewId, updates) => {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
  return { data, error }
}

export const deleteReview = async (id) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
  return { error }
}

// ============= CUSTOMER FUNCTIONS =============
export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
  return { data, error }
}

export const getCustomers = async (businessId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateCustomer = async (customerId, updates) => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
  return { data, error }
}

// ============= REVIEW REQUESTS FUNCTIONS =============
export const createReviewRequest = async (requestData) => {
  const { data, error } = await supabase
    .from('review_requests')
    .insert([requestData])
    .select()
  return { data, error }
}

export const getReviewRequests = async (businessId) => {
  const { data, error } = await supabase
    .from('review_requests')
    .select(`
      *,
      customers (
        name,
        email,
        phone
      )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateReviewRequest = async (requestId, updates) => {
  const { data, error } = await supabase
    .from('review_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
  return { data, error }
}

// ============= WIDGET FUNCTIONS =============
export const createWidget = async (widgetData) => {
  const { data, error } = await supabase
    .from('widgets')
    .insert([widgetData])
    .select()
  return { data, error }
}

export const getWidgets = async (businessId) => {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const updateWidget = async (widgetId, updates) => {
  const { data, error } = await supabase
    .from('widgets')
    .update(updates)
    .eq('id', widgetId)
    .select()
  return { data, error }
}

export const getWidgetByCode = async (widgetCode) => {
  const { data, error } = await supabase
    .from('widgets')
    .select(`
      *,
      businesses (
        name,
        industry,
        google_place_id,
        yelp_business_id
      )
    `)
    .eq('widget_code', widgetCode)
    .eq('is_active', true)
    .single()
  return { data, error }
}

// ============= ANALYTICS FUNCTIONS =============
export const getAnalytics = async (businessId, dateRange = '30d') => {
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', getDateRangeStart(dateRange))
    .order('date', { ascending: false })
  return { data, error }
}

export const createAnalyticsEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('analytics')
    .insert([eventData])
    .select()
  return { data, error }
}

// ============= HELPER FUNCTIONS =============
function getDateRangeStart(range) {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

// ============= SUBSCRIPTION FUNCTIONS =============
export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const createSubscription = async (subscriptionData) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
  return { data, error }
}

export const updateSubscription = async (subscriptionId, updates) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
  return { data, error }
}

export const getUserStripeCustomerId = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const getUserPayPalSubscriptionId = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('paypal_subscription_id')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

// ============= PAYPAL SUBSCRIPTION FUNCTIONS =============
export const createPayPalSubscription = async (subscriptionData) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      ...subscriptionData,
      provider: 'paypal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export const updatePayPalSubscription = async (userId, updates) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .select()
  return { data, error }
}

export const getPayPalSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .single()
  return { data, error }
}

export const cancelPayPalSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .select()
  return { data, error }
}

export const storePayPalSubscriptionData = async (userId, paypalData) => {
  const subscriptionData = {
    user_id: userId,
    provider: 'paypal',
    paypal_subscription_id: paypalData.subscriptionId || paypalData.id,
    plan_id: paypalData.planId,
    status: paypalData.status || 'active',
    current_period_start: paypalData.createTime || new Date().toISOString(),
    current_period_end: paypalData.billingInfo?.nextBillingTime || null,
    metadata: {
      paypal_plan_id: paypalData.planId,
      paypal_subscriber_id: paypalData.subscriber?.payerId,
      approval_url: paypalData.approvalUrl
    }
  }

  // Check if subscription already exists
  const { data: existing } = await getPayPalSubscription(userId)
  
  if (existing) {
    // Update existing subscription
    return await updatePayPalSubscription(userId, subscriptionData)
  } else {
    // Create new subscription
    return await createPayPalSubscription(subscriptionData)
  }
}

// Backward compatibility function that works with both Stripe and PayPal
export const getUserSubscription = async (userId) => {
  // First try to get PayPal subscription
  const { data: paypalSub, error: paypalError } = await getPayPalSubscription(userId)
  
  if (paypalSub && !paypalError) {
    return { data: paypalSub, error: null }
  }
  
  // Fallback to general subscription query (for Stripe or other providers)
  return await getSubscription(userId)
}
