/**
 * COPMI Frontend - Backend Integration Guide
 * 
 * This file contains all the JavaScript code needed to integrate
 * your frontend forms with the backend API
 */

const API_URL = 'http://localhost:5000/api';

// ============= AUTHENTICATION =============

async function registerUser(username, email, password, fullName) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username, email, password, full_name: fullName
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, message: 'Registration successful' };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, message: 'Login successful' };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getAuthToken() {
  return localStorage.getItem('token');
}

// ============= CONTACT FORM =============

async function submitContactForm(name, email, phone, subject, message) {
  try {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, phone, subject, message
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: 'Message sent successfully! We will respond soon.'
      };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Example usage in HTML
function setupContactForm() {
  const form = document.querySelector('form[name="contactForm"]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const result = await submitContactForm(
        document.getElementById('name').value,
        document.getElementById('email').value,
        document.getElementById('phone').value,
        document.getElementById('subject').value,
        document.getElementById('message').value
      );
      
      if (result.success) {
        alert(result.message);
        form.reset();
      } else {
        alert('Error: ' + result.error);
      }
    });
  }
}

// ============= PAYMENT - M-PESA =============

async function initiateMpesaPayment(phone, amount, paymentType, payerName) {
  try {
    const response = await fetch(`${API_URL}/payments/mpesa/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone, amount, payment_type: paymentType, payer_name: payerName
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: 'STK push sent! Check your phone for the M-Pesa prompt.',
        paymentId: data.paymentId,
        checkoutRequestId: data.checkoutRequestId
      };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Example usage for M-Pesa button
async function handleMpesaPayment() {
  const phone = document.getElementById('mpesaPhone').value;
  const amount = document.getElementById('mpesaAmount').value;
  const paymentType = document.getElementById('paymentType').value;
  const payerName = document.getElementById('payerName').value;

  if (!phone || !amount || !paymentType || !payerName) {
    alert('Please fill all fields');
    return;
  }

  const result = await initiateMpesaPayment(phone, amount, paymentType, payerName);
  
  if (result.success) {
    alert(result.message);
    // Store payment ID for reference
    localStorage.setItem('lastPaymentId', result.paymentId);
  } else {
    alert('Error: ' + result.error);
  }
}

// ============= MEDIA UPLOAD =============

async function uploadMedia(file, category, description) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'You must be logged in to upload media' };
    }

    const formData = new FormData();
    formData.append('media', file);
    formData.append('category', category || 'general');
    formData.append('description', description || '');

    const response = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      return {
        success: true,
        message: 'Media uploaded successfully! Pending admin approval.',
        mediaId: data.media.id
      };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Example usage for file input
function setupMediaUpload() {
  const fileInput = document.getElementById('mediaFile');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const result = await uploadMedia(file, 'sermon', 'Uploaded sermon video');
        if (result.success) {
          alert(result.message);
        } else {
          alert('Error: ' + result.error);
        }
      }
    });
  }
}

// ============= FETCH PUBLISHED MEDIA =============

async function getPublishedMedia(category) {
  try {
    let url = `${API_URL}/media/published`;
    if (category) {
      url += `?category=${category}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      return { success: true, media: data.media };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Display media gallery
async function displayMediaGallery(containerId, category) {
  const result = await getPublishedMedia(category);
  
  if (result.success) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    result.media.forEach(item => {
      const div = document.createElement('div');
      div.className = 'media-item';
      div.innerHTML = `
        <a href="/api/media/${item.id}/download">
          <img src="/uploads/media/${item.file_name}" alt="${item.original_file_name}" />
          <p>${item.original_file_name}</p>
        </a>
      `;
      container.appendChild(div);
    });
  }
}

// ============= INITIALIZE ON PAGE LOAD =============

document.addEventListener('DOMContentLoaded', () => {
  setupContactForm();
  setupMediaUpload();
  
  // Load user info if logged in
  const user = localStorage.getItem('user');
  if (user) {
    console.log('Logged in as:', JSON.parse(user));
  }
});

// ============= EXPORT FOR USE IN HTML =============
// Add to window so it's accessible from HTML onclick handlers
window.initiateMpesaPayment = handleMpesaPayment;
window.submitContactForm = submitContactForm;
window.uploadMedia = uploadMedia;
window.getPublishedMedia = getPublishedMedia;
