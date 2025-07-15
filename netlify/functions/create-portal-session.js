const stripe = require('stripe')(process.env.VITE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY);

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
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe not initialized - missing secret key');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe configuration error' })
      };
    }

    const { customerId, returnUrl } = JSON.parse(event.body);
    
    // Validate required parameters
    if (!customerId || !returnUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('Creating portal session for customer:', customerId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    console.log('Portal session created successfully:', session.url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
