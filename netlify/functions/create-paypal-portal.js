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
    const { subscriptionId, returnUrl, action = 'manage' } = JSON.parse(event.body);
    
    // Validate required parameters
    if (!subscriptionId || !returnUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('Creating PayPal portal session for subscription:', subscriptionId);

    const accessToken = await getAccessToken();
    const { baseUrl } = getPayPalConfig();

    if (action === 'cancel') {
      // Cancel subscription
      const cancelRequest = {
        reason: 'User requested cancellation'
      };

      const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cancelRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal cancellation failed: ${response.status} - ${errorData}`);
      }

      console.log('PayPal subscription cancelled successfully:', subscriptionId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Subscription cancelled successfully',
          redirectUrl: returnUrl
        }),
      };

    } else if (action === 'suspend') {
      // Suspend subscription
      const suspendRequest = {
        reason: 'User requested suspension'
      };

      const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(suspendRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal suspension failed: ${response.status} - ${errorData}`);
      }

      console.log('PayPal subscription suspended successfully:', subscriptionId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Subscription suspended successfully',
          redirectUrl: returnUrl
        }),
      };

    } else if (action === 'activate') {
      // Activate/reactivate subscription
      const activateRequest = {
        reason: 'User requested reactivation'
      };

      const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(activateRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal activation failed: ${response.status} - ${errorData}`);
      }

      console.log('PayPal subscription activated successfully:', subscriptionId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Subscription activated successfully',
          redirectUrl: returnUrl
        }),
      };

    } else {
      // Default: Get subscription details and return management URL
      const response = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal API error: ${response.status} - ${errorData}`);
      }

      const subscription = await response.json();
      
      // Since PayPal doesn't have a direct equivalent to Stripe's customer portal,
      // we'll create a management URL that redirects to PayPal's subscription management
      // or return subscription details for custom portal implementation
      
      // For sandbox/testing, we can redirect to PayPal's subscription management
      const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
      const baseUrl = environment === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';
      const managementUrl = `${baseUrl}/myaccount/autopay/`;

      console.log('PayPal subscription details retrieved:', subscription.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: managementUrl,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            planId: subscription.planId,
            createTime: subscription.createTime,
            updateTime: subscription.updateTime
          }
        }),
      };
    }

  } catch (error) {
    console.error('PayPal portal error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
