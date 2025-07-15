# Stripe Integration Setup for Netlify

## Issue: "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

This error occurs when the Netlify functions return empty responses, typically due to missing environment variables.

## Required Environment Variables in Netlify Dashboard

Go to your Netlify site dashboard → Site settings → Environment variables and add:

### Required Variables:
```
VITE_STRIPE_SECRET_KEY = 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
VITE_STRIPE_PUBLIC_KEY = pk_live_51Rg1oBCx4JpdOBsxAbfIW8zwZGHG53YEtho2UhCV6vdrX7aogmlEghxa8FKJHgiuILfgCmk9hUulvQh76pSXYEl700yCakGM99
STRIPE_SECRET_KEY = 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
STRIPE_PUBLIC_KEY = pk_live_51Rg1oBCx4JpdOBsxAbfIW8zwZGHG53YEtho2UhCV6vdrX7aogmlEghxa8FKJHgiuILfgCmk9hUulvQh76pSXYEl700yCakGM99
```

## Testing Steps:

1. **Deploy the changes** with the debug function
2. **Go to the billing page** and click "Debug Stripe" button
3. **Check the browser console** for debug information
4. **Verify** that:
   - `hasStripeSecretKey: true`
   - `stripeInitialized: true`
   - `stripeApiWorking: true`

## If Debug Shows Missing Keys:

The environment variables are not properly set in Netlify. You need to:

1. Go to Netlify Dashboard
2. Select your site
3. Go to Site settings → Environment variables
4. Add the variables listed above
5. Redeploy the site

## Price IDs Used:
- STARTER: `price_1RkpmOCx4JpdOBsxz4r7xmNH`
- PROFESSIONAL: `price_1RkpoRCx4JpdOBsxDFVGHIuy`
- ENTERPRISE: `price_1RkpptCx4JpdOBsxKCPooLQg`

## After Environment Variables Are Set:

The subscribe buttons should work properly and redirect to Stripe checkout.