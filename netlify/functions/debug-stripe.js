exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check environment variables
    const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLIC_KEY;
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasStripeSecretKey: !!stripeSecretKey,
      hasStripePublicKey: !!stripePublicKey,
      stripeSecretKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 8) + '...' : 'missing',
      availableEnvVars: Object.keys(process.env).filter(key => key.includes('STRIPE')),
      allEnvVars: Object.keys(process.env).length
    };

    // Test Stripe initialization
    if (stripeSecretKey) {
      try {
        const stripe = require('stripe')(stripeSecretKey);
        debug.stripeInitialized = true;
        
        // Test API call
        const account = await stripe.accounts.retrieve();
        debug.stripeApiWorking = true;
        debug.stripeAccountId = account.id;
      } catch (error) {
        debug.stripeInitialized = false;
        debug.stripeError = error.message;
      }
    } else {
      debug.stripeInitialized = false;
      debug.stripeError = 'No secret key found';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debug, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};