// AI Sentiment Analysis Service
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export const analyzeSentiment = async (text) => {
  try {
    // Mock implementation for demo - replace with actual OpenAI API call
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return mockSentimentAnalysis(text)
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of customer feedback and respond with a JSON object containing: sentiment (positive/negative/neutral), confidence (0-1), and keywords (array of key phrases).'
          },
          {
            role: 'user',
            content: `Analyze this customer feedback: "${text}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)
    
    return {
      sentiment: result.sentiment,
      confidence: result.confidence,
      keywords: result.keywords,
      shouldRequestReview: result.sentiment === 'positive' && result.confidence > 0.7
    }
  } catch (error) {
    console.error('AI sentiment analysis error:', error)
    // Fallback to mock analysis
    return mockSentimentAnalysis(text)
  }
}

// Mock sentiment analysis for demo purposes
const mockSentimentAnalysis = (text) => {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'love', 'awesome', 'perfect', 'wonderful', 'outstanding']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disappointing', 'poor', 'failed', 'broken']
  
  const lowercaseText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length
  
  let sentiment = 'neutral'
  let confidence = 0.5
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive'
    confidence = Math.min(0.9, 0.6 + (positiveCount * 0.1))
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative'
    confidence = Math.min(0.9, 0.6 + (negativeCount * 0.1))
  }
  
  return {
    sentiment,
    confidence,
    keywords: extractKeywords(text),
    shouldRequestReview: sentiment === 'positive' && confidence > 0.7
  }
}

const extractKeywords = (text) => {
  const words = text.toLowerCase().split(/\\s+/)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']
  
  const keywords = words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 5)
  
  return keywords
}

export const generateReviewResponse = async (reviewText, businessName) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return mockReviewResponse(reviewText, businessName)
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional customer service representative for ${businessName}. Generate a personalized, professional response to this customer review. Keep it concise, grateful, and professional.`
          },
          {
            role: 'user',
            content: `Review: "${reviewText}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('AI response generation error:', error)
    return mockReviewResponse(reviewText, businessName)
  }
}

const mockReviewResponse = (reviewText, businessName) => {
  const sentiment = mockSentimentAnalysis(reviewText).sentiment
  
  if (sentiment === 'positive') {
    return `Thank you so much for your wonderful review! We're thrilled to hear about your positive experience with ${businessName}. Your feedback means the world to us, and we look forward to serving you again soon!`
  } else if (sentiment === 'negative') {
    return `Thank you for bringing this to our attention. We sincerely apologize for not meeting your expectations. At ${businessName}, we take all feedback seriously and would love the opportunity to make this right. Please contact us directly so we can resolve this issue.`
  } else {
    return `Thank you for taking the time to share your feedback about ${businessName}. We appreciate all customer input as it helps us continue to improve our services. We look forward to serving you again!`
  }
}
