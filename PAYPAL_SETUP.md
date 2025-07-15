# PayPal Integration Setup

This document outlines the required environment variables and setup steps for PayPal integration.

## Environment Variables

### Frontend (.env)
```
VITE_PAYPAL_CLIENT_ID=AVbwixHdlz8lYYNIAlPBenKqSJMF5RQKx0_Q4xghjEeupBRwBrVl07q9lFRZngtpqm7TmiiWZRXjO8au
```

### Server-side (Netlify Functions)
```
PAYPAL_CLIENT_ID=AVbwixHdlz8lYYNIAlPBenKqSJMF5RQKx0_Q4xghjEeupBRwBrVl07q9lFRZngtpqm7TmiiWZRXjO8au
PAYPAL_CLIENT_SECRET=EPGYm-UgquqUtY5ejIwNtGCHPqoGvY6It9dYQxxUsjqGE6ySCmg20onl-bQUx2xHEmGEzzobs7dMJDIa
PAYPAL_ENVIRONMENT=sandbox
```

### PayPal Subscription Plan IDs (to be created)
```
PAYPAL_STARTER_PLAN_ID=P-STARTER-PLAN-ID
PAYPAL_PROFESSIONAL_PLAN_ID=P-PROFESSIONAL-PLAN-ID  
PAYPAL_ENTERPRISE_PLAN_ID=P-ENTERPRISE-PLAN-ID
```

## Pricing Plans

The PayPal integration maintains the same pricing structure as Stripe:

- **Starter**: $29/month
- **Professional**: $59/month  
- **Enterprise**: $99/month

## Required Netlify Functions

The following Netlify functions need to be created to replace Stripe functionality:

1. `create-paypal-subscription.js` - Creates PayPal subscriptions
2. `create-paypal-order.js` - Creates PayPal orders (for one-time payments)
3. `create-paypal-portal-session.js` - Creates PayPal portal sessions for subscription management
4. `debug-paypal.js` - Debug function for PayPal integration

## Database Schema Updates

The `subscriptions` table should include a new column:
- `paypal_subscription_id` - Stores PayPal subscription IDs

## Dependencies Installed

- `@paypal/react-paypal-js@^8.1.3` - React PayPal integration
- `@paypal/paypal-server-sdk@^1.0.0` - Server-side PayPal SDK

## Dependencies Removed

- `@stripe/stripe-js@^7.4.0` - Stripe JavaScript SDK
- `stripe@^18.3.0` - Stripe Node.js SDK

## Files Modified

1. `package.json` - Updated dependencies
2. `src/lib/paypalService.js` - New PayPal service (replaces stripeService.js)
3. `src/lib/supabase.js` - Added `getUserPayPalSubscriptionId` function
4. `src/pages/Billing.jsx` - Updated to use PayPal service

## Next Steps

1. Create PayPal subscription plans in PayPal Developer Dashboard
2. Update plan IDs in `src/lib/paypalService.js`
3. Create the required Netlify functions
4. Set up environment variables in Netlify
5. Update database schema to include `paypal_subscription_id` column
6. Test the integration in sandbox environment