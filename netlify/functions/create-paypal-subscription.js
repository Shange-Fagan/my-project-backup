const { Client, Environment, OrdersController } = require('@paypal/paypal-server-sdk');

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

// Initialize PayPal client for orders (fallback)
const getPayPalClient = () => {
  const { clientId, clientSecret, environment } = getPayPalConfig();

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: environment === 'live' ? Environment.Production : Environment.Sandbox,
  });
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
    const { planId, userId, userEmail, returnUrl, cancelUrl, mode = 'subscription' } = JSON.parse(event.body);
    
    // Validate required parameters
    if (!planId || !userId || !userEmail || !returnUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('Creating PayPal subscription for:', { planId, userId, userEmail, mode });

    const client = getPayPalClient();

    if (mode === 'subscription') {
      // Create subscription using REST API
      const accessToken = await getAccessToken();
      const { baseUrl } = getPayPalConfig();
      
      const subscriptionRequest = {
        plan_id: planId,
        subscriber: {
          email_address: userEmail,
        },
        application_context: {
          brand_name: 'Smart Review SaaS',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: returnUrl,
          cancel_url: cancelUrl
        },
        custom_id: userId, // Store user ID for webhook processing
      };

      const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(subscriptionRequest)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`PayPal API error: ${response.status} - ${errorData}`);
      }

      const subscription = await response.json();
      
      // Find the approval link
      const approvalLink = subscription.links?.find(link => link.rel === 'approve');
      
      if (!approvalLink) {
        throw new Error('No approval link found in PayPal response');
      }

      console.log('PayPal subscription created successfully:', subscription.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          subscriptionId: subscription.id,
          approvalUrl: approvalLink.href,
          status: subscription.status
        }),
      };

    } else {
      // Create one-time payment order
      const ordersController = new OrdersController(client);
      
      // Extract amount from planId (this is a simplified approach)
      // In a real implementation, you'd have a mapping of planId to amount
      let amount = '29.00'; // Default starter plan
      if (planId.includes('professional')) amount = '59.00';
      if (planId.includes('enterprise')) amount = '99.00';

      const orderRequest = {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            amount: {
              currencyCode: 'USD',
              value: amount
            },
            description: `Smart Review SaaS - ${planId}`,
            customId: userId,
          }
        ],
        applicationContext: {
          brandName: 'Smart Review SaaS',
          locale: 'en-US',
          landingPage: 'BILLING',
          shippingPreference: 'NO_SHIPPING',
          userAction: 'PAY_NOW',
          returnUrl: returnUrl,
          cancelUrl: cancelUrl
        }
      };

      const response = await ordersController.ordersCreate({
        body: orderRequest,
        prefer: 'return=representation'
      });

      if (response.statusCode !== 201) {
        throw new Error(`PayPal API error: ${response.statusCode}`);
      }

      const order = response.result;
      
      // Find the approval link
      const approvalLink = order.links?.find(link => link.rel === 'approve');
      
      if (!approvalLink) {
        throw new Error('No approval link found in PayPal response');
      }

      console.log('PayPal order created successfully:', order.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: order.id,
          approvalUrl: approvalLink.href,
          status: order.status
        }),
      };
    }

  } catch (error) {
    console.error('PayPal error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
