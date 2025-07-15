const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// PayPal API configuration
const getPayPalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const baseUrl = environment === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  return { clientId, clientSecret, baseUrl, environment };
};

// Get PayPal access token
const getAccessToken = async () => {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig();
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
};

// Get subscription details from PayPal
const getSubscriptionDetails = async (subscriptionId) => {
  const accessToken = await getAccessToken();
  const { baseUrl } = getPayPalConfig();
  
  const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get subscription details: ${response.statusText}`);
  }

  return await response.json();
};

exports.handler = async (event, context) => {
  // Add CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { subscriptionId, userId, planId } = JSON.parse(event.body);
    
    // Validate required parameters
    if (!subscriptionId || !userId || !planId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('Processing PayPal subscription approval:', { subscriptionId, userId, planId });

    // Get subscription details from PayPal
    const subscriptionDetails = await getSubscriptionDetails(subscriptionId);
    
    if (subscriptionDetails.status !== 'ACTIVE') {
      throw new Error(`Subscription is not active. Status: ${subscriptionDetails.status}`);
    }

    // Map plan names
    const planNames = {
      'starter': 'Starter',
      'professional': 'Professional', 
      'enterprise': 'Enterprise'
    };

    // Save subscription to database
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        paypal_subscription_id: subscriptionId,
        status: subscriptionDetails.status.toLowerCase(),
        plan_name: planNames[planId] || planId,
        current_period_start: subscriptionDetails.start_time,
        current_period_end: subscriptionDetails.billing_info?.next_billing_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save subscription to database');
    }

    console.log('Subscription saved successfully:', data);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: subscriptionId,
          status: subscriptionDetails.status.toLowerCase(),
          plan_name: planNames[planId] || planId
        }
      }),
    };

  } catch (error) {
    console.error('PayPal approval error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};