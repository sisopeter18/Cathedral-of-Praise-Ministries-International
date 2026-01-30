# Cathedral of Praise Ministries - Backend Setup Guide

## Quick Start

### Prerequisites
- Node.js 14+ and npm
- Git
- Text editor (VS Code recommended)

### Step 1: Clone/Setup Backend
```bash
# Navigate to backend folder
cd copmi-backend

# Install dependencies
npm install
```

### Step 2: Configure Environment
Edit `.env` file:
```env
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8000

JWT_SECRET=your_secret_key_here_change_this_in_production

# Email - Using Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CHURCH_EMAIL=info@copmii.org

# M-Pesa Sandbox Credentials
MPESA_CONSUMER_KEY=test_key
MPESA_CONSUMER_SECRET=test_secret
MPESA_PAYBILL=808080
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a7fde4f0906d5086cf13c7b
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=http://localhost:5000/api/payments/mpesa-callback

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Step 3: Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production
npm start
```

Server starts at: **http://localhost:5000**

### Step 4: Test API
```bash
# Health check
curl http://localhost:5000/api/health

# Register admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@copmii.org","password":"admin123","full_name":"Admin"}'
```

---

## Backend Structure

```
copmi-backend/
├── src/
│   ├── config/
│   │   └── database.js          # SQLite setup
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── contactController.js # Contact form handling
│   │   ├── paymentController.js # Payment processing
│   │   └── mediaController.js   # Media upload & approval
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validation.js        # Input validation
│   │   └── errorHandler.js      # Error handling
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── contacts.js          # Contact endpoints
│   │   ├── payments.js          # Payment endpoints
│   │   └── media.js             # Media endpoints
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   ├── mailer.js            # Email service
│   │   └── mpesa.js             # M-Pesa integration
│   └── server.js                # Main app file
├── uploads/
│   └── media/                   # Uploaded files
├── logs/                        # Log files
├── .env                         # Environment variables
├── package.json
└── API_DOCUMENTATION.md
```

---

## API Overview

### Public Endpoints (No Auth Required)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/contacts` - Submit contact form
- `POST /api/payments` - Record payment
- `POST /api/payments/mpesa/initiate` - Start M-Pesa payment
- `GET /api/media/published` - View published media

### Admin Endpoints (Auth Required)
- `GET /api/contacts` - View all contacts
- `PATCH /api/contacts/:id/status` - Update contact status
- `GET /api/payments` - View all payments
- `GET /api/payments/stats/summary` - Payment statistics
- `GET /api/media` - View pending media
- `PATCH /api/media/:id/approve` - Approve/reject media

---

## Frontend Integration

### Update Frontend Files

Edit `offerings.html` - Update M-Pesa form:
```html
<button class="submit-btn" onclick="initiatePayment()">Initiate M-Pesa Payment</button>

<script>
async function initiatePayment() {
  const phone = document.querySelector('input[type="tel"]').value;
  const amount = document.querySelector('input[type="number"]').value;
  
  const response = await fetch('http://localhost:5000/api/payments/mpesa/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone, amount,
      payment_type: 'tithe',
      payer_name: 'Donor Name'
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    alert('Payment initiated! Check your phone for M-Pesa prompt.');
  } else {
    alert('Error: ' + data.error);
  }
}
</script>
```

Edit `contact.html` - Update contact form:
```html
<form onsubmit="submitContact(event)">
  <input type="text" id="name" placeholder="Your Name" required>
  <input type="email" id="email" placeholder="Your Email" required>
  <textarea id="message" placeholder="Your Message" required></textarea>
  <button type="submit">Send Message</button>
</form>

<script>
async function submitContact(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  };
  
  const response = await fetch('http://localhost:5000/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    alert('Thank you! Your message has been sent.');
    e.target.reset();
  }
}
</script>
```

Edit `media.html` - Update upload form:
```html
<form onsubmit="uploadMedia(event)">
  <input type="file" id="mediaFile" accept="image/*,video/*" required>
  <button type="submit">Upload</button>
</form>

<script>
async function uploadMedia(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('media', document.getElementById('mediaFile').files[0]);
  formData.append('category', 'sermon');
  
  const token = localStorage.getItem('token'); // Store after login
  const response = await fetch('http://localhost:5000/api/media/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  
  if (response.ok) {
    alert('Media uploaded! Pending admin approval.');
  }
}
</script>
```

---

## Database

### Default Location
`src/config/database.db` - SQLite database file

### Tables Created Automatically
- `users` - Admin accounts
- `payments` - Tithe & offering records
- `contacts` - Contact form submissions
- `media` - Uploaded files
- `audit_logs` - Activity logs

---

## M-Pesa Integration

### Sandbox Testing
1. Credentials already in `.env`
2. Test numbers: `254701234567`, `254708374149`
3. Test amounts: any positive number
4. Payments auto-complete in sandbox after ~5 seconds

### Production Setup
1. Get M-Pesa API credentials from Safaricom
2. Update `.env`:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_PAYBILL` (real paybill)
   - `MPESA_ENVIRONMENT=production`
3. Update callback URL to production domain

---

## Email Setup

### Gmail (Recommended for Testing)
1. Open Gmail account
2. Enable 2-Step Verification
3. Create App Password (for this app only)
4. Copy 16-char password
5. Update `.env`:
   ```
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### Production Email
Use SendGrid, Mailgun, or your email provider with SMTP details.

---

## Monitoring & Logs

### View Logs
```bash
# Real-time (development)
npm run dev

# Check specific endpoint
curl -v http://localhost:5000/api/health
```

### Database Backup
```bash
# Backup
cp src/config/database.db src/config/database.backup.db

# Restore
cp src/config/database.backup.db src/config/database.db
```

---

## Common Issues

**Issue**: Port 5000 already in use
```bash
# Find what's using it
lsof -i :5000
# Kill the process
kill -9 <PID>
```

**Issue**: Database locked
- Restart server: `npm run dev`

**Issue**: M-Pesa callback not received
- Check backend is running and accessible
- Verify callback URL in `.env`
- Check firewall/router settings

**Issue**: Email not sending
- Verify SMTP credentials
- Check spam folder
- Ensure Gmail app password (not regular password)

---

## Production Deployment

### Before Going Live
1. Change all default passwords
2. Change `JWT_SECRET`
3. Get real M-Pesa credentials
4. Configure production email
5. Update `FRONTEND_URL` to domain
6. Set `NODE_ENV=production`
7. Use HTTPS only
8. Enable backups

### Deploy to Heroku (Free)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create copmi-backend

# Set env variables
heroku config:set JWT_SECRET=your_secret_here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## Support & Questions

**Backend Issues**: Check API_DOCUMENTATION.md
**M-Pesa Help**: Contact Safaricom developer support
**Email Help**: Gmail app password support
**General**: info@copmii.org

Happy building! 🚀
