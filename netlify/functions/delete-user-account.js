const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { userId } = JSON.parse(event.body)

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      }
    }

    // Delete user's businesses and related data (cascading deletes should handle reviews, customers, etc.)
    const { error: businessError } = await supabase
      .from('businesses')
      .delete()
      .eq('user_id', userId)

    if (businessError) {
      console.error('Error deleting businesses:', businessError)
    }

    // Delete user's subscriptions
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    if (subscriptionError) {
      console.error('Error deleting subscriptions:', subscriptionError)
    }

    // Delete the user account using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({ success: true }),
    }
  } catch (error) {
    console.error('Account deletion error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}