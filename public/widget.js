(function() {
  'use strict';
  
  // Widget configuration
  const WIDGET_BASE_URL = 'https://your-domain.com'; // Replace with your actual domain
  const WIDGET_VERSION = '1.0.0';
  
  // Find all widget containers on the page
  const widgetContainers = document.querySelectorAll('[data-smart-review-widget]');
  
  widgetContainers.forEach(container => {
    const businessId = container.getAttribute('data-business-id');
    const widgetId = container.getAttribute('data-widget-id');
    const theme = container.getAttribute('data-theme') || 'light';
    
    if (!businessId || !widgetId) {
      console.error('Smart Review Widget: Missing required attributes');
      return;
    }
    
    // Create the widget HTML
    const widgetHTML = `
      <div class="smart-review-widget" data-theme="${theme}">
        <div class="sr-header">
          <h3>How was your experience?</h3>
          <p>We'd love to hear your feedback!</p>
        </div>
        
        <div class="sr-rating">
          <div class="sr-stars">
            <button class="sr-star" data-rating="1">★</button>
            <button class="sr-star" data-rating="2">★</button>
            <button class="sr-star" data-rating="3">★</button>
            <button class="sr-star" data-rating="4">★</button>
            <button class="sr-star" data-rating="5">★</button>
          </div>
          <span class="sr-rating-text">Click to rate</span>
        </div>
        
        <div class="sr-form" style="display: none;">
          <textarea class="sr-textarea" placeholder="Tell us about your experience..."></textarea>
          <input type="email" class="sr-email" placeholder="Email (optional)">
          <input type="text" class="sr-name" placeholder="Name (optional)">
          <div class="sr-buttons">
            <button class="sr-submit">Submit Review</button>
            <button class="sr-cancel">Cancel</button>
          </div>
        </div>
        
        <div class="sr-success" style="display: none;">
          <h4>Thank you for your feedback!</h4>
          <p>Your review helps us improve our service.</p>
        </div>
        
        <div class="sr-powered">
          <a href="${WIDGET_BASE_URL}" target="_blank">Powered by Smart Review</a>
        </div>
      </div>
    `;
    
    // Add styles
    const styles = `
      .smart-review-widget {
        max-width: 400px;
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .sr-header h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 18px;
      }
      
      .sr-header p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 14px;
      }
      
      .sr-stars {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
      }
      
      .sr-star {
        background: none;
        border: none;
        font-size: 24px;
        color: #ddd;
        cursor: pointer;
        transition: color 0.2s;
      }
      
      .sr-star:hover,
      .sr-star.active {
        color: #ffd700;
      }
      
      .sr-rating-text {
        font-size: 14px;
        color: #666;
      }
      
      .sr-form {
        margin-top: 20px;
      }
      
      .sr-textarea,
      .sr-email,
      .sr-name {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 10px;
        box-sizing: border-box;
      }
      
      .sr-textarea {
        height: 80px;
        resize: vertical;
      }
      
      .sr-buttons {
        display: flex;
        gap: 10px;
      }
      
      .sr-submit,
      .sr-cancel {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .sr-submit {
        background: #007cba;
        color: white;
      }
      
      .sr-submit:hover {
        background: #005a8b;
      }
      
      .sr-cancel {
        background: #f0f0f0;
        color: #333;
      }
      
      .sr-cancel:hover {
        background: #e0e0e0;
      }
      
      .sr-success {
        text-align: center;
        color: #28a745;
      }
      
      .sr-success h4 {
        margin: 0 0 10px 0;
      }
      
      .sr-powered {
        text-align: center;
        margin-top: 15px;
        font-size: 12px;
      }
      
      .sr-powered a {
        color: #666;
        text-decoration: none;
      }
      
      .sr-powered a:hover {
        color: #007cba;
      }
    `;
    
    // Add styles to page
    if (!document.getElementById('smart-review-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'smart-review-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
    
    // Insert widget HTML
    container.innerHTML = widgetHTML;
    
    // Add event listeners
    const widget = container.querySelector('.smart-review-widget');
    const stars = widget.querySelectorAll('.sr-star');
    const ratingText = widget.querySelector('.sr-rating-text');
    const form = widget.querySelector('.sr-form');
    const textarea = widget.querySelector('.sr-textarea');
    const emailInput = widget.querySelector('.sr-email');
    const nameInput = widget.querySelector('.sr-name');
    const submitBtn = widget.querySelector('.sr-submit');
    const cancelBtn = widget.querySelector('.sr-cancel');
    const successDiv = widget.querySelector('.sr-success');
    
    let selectedRating = 0;
    
    // Star rating functionality
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        selectedRating = index + 1;
        
        // Update star display
        stars.forEach((s, i) => {
          s.classList.toggle('active', i < selectedRating);
        });
        
        // Update rating text
        const ratingTexts = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        ratingText.textContent = ratingTexts[selectedRating - 1];
        
        // Show form for ratings 4 and 5 (positive feedback)
        if (selectedRating >= 4) {
          form.style.display = 'block';
          textarea.placeholder = 'We\'d love to hear what you liked! This helps us improve.';
        } else {
          form.style.display = 'block';
          textarea.placeholder = 'Please tell us how we can improve your experience.';
        }
      });
    });
    
    // Submit functionality
    submitBtn.addEventListener('click', async () => {
      const reviewData = {
        businessId: businessId,
        widgetId: widgetId,
        rating: selectedRating,
        comment: textarea.value,
        email: emailInput.value,
        name: nameInput.value,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      try {
        // Submit to your backend
        const response = await fetch(`${WIDGET_BASE_URL}/api/widget/submit-review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData)
        });
        
        if (response.ok) {
          // Show success message
          form.style.display = 'none';
          successDiv.style.display = 'block';
          
          // If rating is 4 or 5, suggest leaving a Google/Yelp review
          if (selectedRating >= 4) {
            setTimeout(() => {
              const reviewPlatform = confirm('Thank you! Would you also like to leave a review on Google?');
              if (reviewPlatform) {
                // Redirect to Google Reviews (you'll need to set this up)
                window.open('https://www.google.com/maps/place/YOUR_BUSINESS_ID', '_blank');
              }
            }, 2000);
          }
        } else {
          throw new Error('Failed to submit review');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Sorry, there was an error submitting your review. Please try again.');
      }
    });
    
    // Cancel functionality
    cancelBtn.addEventListener('click', () => {
      form.style.display = 'none';
      selectedRating = 0;
      stars.forEach(s => s.classList.remove('active'));
      ratingText.textContent = 'Click to rate';
      textarea.value = '';
      emailInput.value = '';
      nameInput.value = '';
    });
  });
})();
