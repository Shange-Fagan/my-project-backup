const { Client, Environment } = require('@paypal/paypal-server-sdk');

// PayPal API configuration
const getPayPalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  
  const baseUrl = environment === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  return { clientId, clientSecret, baseUrl, environment };
};

// Get PayPal access token
const getAccessToken = async () => {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig();
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }
  
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
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      paypalEnvironment: paypalEnvironment,
      hasPayPalClientId: !!paypalClientId,
      hasPayPalClientSecret: !!paypalClientSecret,
      paypalClientIdPrefix: paypalClientId ? paypalClientId.substring(0, 8) + '...' : 'missing',
      availableEnvVars: Object.keys(process.env).filter(key => key.includes('PAYPAL')),
      allEnvVars: Object.keys(process.env).length
    };

    // Test PayPal initialization and API connectivity
    if (paypalClientId && paypalClientSecret) {
      try {
        // Test getting access token
        const accessToken = await getAccessToken();
        debug.paypalInitialized = true;
        debug.accessTokenObtained = !!accessToken;
        
        // Test API call - Get subscription plans
        try {
          const { baseUrl } = getPayPalConfig();
          const response = await fetch(`${baseUrl}/v1/billing/plans?page_size=5&page=1&total_required=true`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          debug.paypalApiWorking = response.ok;
          debug.apiResponseStatus = response.status;
          
          if (response.ok) {
            const data = await response.json();
            debug.availablePlans = data.plans?.length || 0;
            
            if (data.plans) {
              debug.planIds = data.plans.map(plan => ({
                id: plan.id,
                name: plan.name,
                status: plan.status
              }));
            }
          } else {
            const errorData = await response.text();
            debug.apiError = `${response.status}: ${errorData}`;
          }
        } catch (apiError) {
          debug.paypalApiWorking = false;
          debug.apiError = apiError.message;
        }

        // Test products endpoint as fallback
        if (!debug.paypalApiWorking) {
          try {
            const { baseUrl } = getPayPalConfig();
            const response = await fetch(`${baseUrl}/v1/catalogs/products?page_size=5&page=1&total_required=true`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });

            debug.paypalProductsApiWorking = response.ok;
            debug.productsApiResponseStatus = response.status;
            
            if (response.ok) {
              const data = await response.json();
              debug.availableProducts = data.products?.length || 0;
            } else {
              const errorData = await response.text();
              debug.productsApiError = `${response.status}: ${errorData}`;
            }
          } catch (productsError) {
            debug.paypalProductsApiWorking = false;
            debug.productsApiError = productsError.message;
          }
        }

      } catch (initError) {
        debug.paypalInitialized = false;
        debug.initError = initError.message;
      }
    } else {
      debug.paypalInitialized = false;
      debug.initError = 'Missing PayPal credentials';
    }

    // Check for specific plan environment variables
    const planEnvVars = {
      starterPlanId: process.env.PAYPAL_STARTER_PLAN_ID,
      professionalPlanId: process.env.PAYPAL_PROFESSIONAL_PLAN_ID,
      enterprisePlanId: process.env.PAYPAL_ENTERPRISE_PLAN_ID
    };

    debug.planConfiguration = {
      hasStarterPlan: !!planEnvVars.starterPlanId,
      hasProfessionalPlan: !!planEnvVars.professionalPlanId,
      hasEnterprisePlan: !!planEnvVars.enterprisePlanId,
      planIds: planEnvVars
    };

    // Add recommendations
    debug.recommendations = [];
    
    if (!debug.hasPayPalClientId) {
      debug.recommendations.push('Set PAYPAL_CLIENT_ID environment variable');
    }
    
    if (!debug.hasPayPalClientSecret) {
      debug.recommendations.push('Set PAYPAL_CLIENT_SECRET environment variable');
    }
    
    if (!debug.paypalApiWorking && debug.paypalInitialized) {
      debug.recommendations.push('Check PayPal API credentials and permissions');
    }
    
    if (!planEnvVars.starterPlanId || !planEnvVars.professionalPlanId || !planEnvVars.enterprisePlanId) {
      debug.recommendations.push('Configure PayPal subscription plan IDs in environment variables');
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
      body: JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
