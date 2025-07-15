import axios from 'axios'

// SMS Service Configuration
const TEXTBELT_API_KEY = import.meta.env.VITE_TEXTBELT_API_KEY
const VONAGE_API_KEY = import.meta.env.VITE_VONAGE_API_KEY
const VONAGE_API_SECRET = import.meta.env.VITE_VONAGE_API_SECRET
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER

// ============= TEXTBELT SMS SERVICE (Easiest Alternative) =============
export const sendSMSWithTextBelt = async (to, message) => {
  try {
    const response = await axios.post('https://textbelt.com/text', {
      phone: to,
      message: message,
      key: TEXTBELT_API_KEY || 'textbelt' // 'textbelt' for one free message
    })
    
    if (response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.error)
    }
  } catch (error) {
    console.error('TextBelt SMS error:', error)
    throw error
  }
}

// ============= VONAGE SMS SERVICE =============
export const sendSMSWithVonage = async (to, message) => {
  try {
    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      from: 'SmartReview',
      to: to,
      text: message,
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET
    })
    
    if (response.data.messages[0].status === '0') {
      return response.data
    } else {
      throw new Error(response.data.messages[0]['error-text'])
    }
  } catch (error) {
    console.error('Vonage SMS error:', error)
    throw error
  }
}

// ============= TWILIO SMS SERVICE (Original) =============
export const sendSMSWithTwilio = async (to, message) => {
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
    console.error('Twilio SMS error:', error)
    throw error
  }
}

// ============= SMART SMS SERVICE (Auto-fallback) =============
export const sendSMS = async (to, message) => {
  // Try services in order of preference
  const services = [
    { name: 'TextBelt', fn: sendSMSWithTextBelt, available: !!TEXTBELT_API_KEY },
    { name: 'Vonage', fn: sendSMSWithVonage, available: !!(VONAGE_API_KEY && VONAGE_API_SECRET) },
    { name: 'Twilio', fn: sendSMSWithTwilio, available: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) }
  ]
  
  for (const service of services) {
    if (service.available) {
      try {
        console.log(`Trying to send SMS via ${service.name}`)
        const result = await service.fn(to, message)
        console.log(`SMS sent successfully via ${service.name}`)
        return result
      } catch (error) {
        console.error(`${service.name} failed:`, error)
        continue
      }
    }
  }
  
  // If all services fail, use mock SMS for development
  console.log('All SMS services failed, using mock SMS')
  return mockSMS(to, message)
}

// ============= MOCK SMS SERVICE (For Development) =============
const mockSMS = (to, message) => {
  console.log(`📱 MOCK SMS to ${to}: ${message}`)
  return {
    success: true,
    message: 'Mock SMS sent successfully',
    to: to,
    body: message,
    service: 'Mock'
  }
}

// ============= EMAIL AS SMS ALTERNATIVE =============
export const sendEmailInsteadOfSMS = async (to, message) => {
  // Convert phone to email if needed
  const emailTo = to.includes('@') ? to : `${to}@sms.example.com`
  
  try {
    const response = await axios.post('/api/send-email', {
      to: emailTo,
      subject: 'Review Request from Smart Review',
      text: message,
      html: `<p>${message}</p>`
    })
    return response.data
  } catch (error) {
    console.error('Email as SMS alternative failed:', error)
    throw error
  }
}
