import axios from 'axios'

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY
const GOOGLE_REVIEWS_API_KEY = import.meta.env.VITE_GOOGLE_REVIEWS_API_KEY

// ============= TWILIO SMS SERVICE =============
export const sendSMS = async (to, message) => {
  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: to,
        Body: message
      }),
      {
        auth: {
          username: TWILIO_ACCOUNT_SID,
          password: TWILIO_AUTH_TOKEN
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Twilio SMS error:', error);
    throw error
  }
}

// ============= SENDGRID EMAIL SERVICE =============
export const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: { email: TWILIO_PHONE_NUMBER },
        content: [
          {
            type: 'text/plain',
            value: text
          },
          {
            type: 'text/html',
            value: html
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('SendGrid email error:', error);
    throw error
  }
}

// ============= GOOGLE REVIEWS SERVICE =============
export const getGoogleReviews = async (placeId) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          placeid: placeId,
          key: GOOGLE_REVIEWS_API_KEY
        }
      }
    )
    return response.data.result.reviews
  } catch (error) {
    console.error('Google Reviews error:', error);
    throw error
  }
}

// Export additional functions if needed for Yelp, CRM, etc...
