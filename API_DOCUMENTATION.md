# COPMI Backend API Documentation

## Setup Instructions

### 1. Install Dependencies
```bash
cd copmi-backend
npm install
```

### 2. Configure Environment
Edit `.env` file with your settings:
- `JWT_SECRET` - Change from default
- `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` - Get from Safaricom
- `SMTP_USER` and `SMTP_PASS` - Email configuration
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` - Initial admin credentials

### 3. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## API Endpoints

### Authentication
**POST** `/api/auth/register`
- Register new user
- Body: `{ username, email, password, full_name }`
- Response: User object + JWT token

**POST** `/api/auth/login`
- Login user
- Body: `{ username, password }`
- Response: User object + JWT token

**GET** `/api/auth/me`
- Get current user (requires auth)
- Headers: `Authorization: Bearer {token}`

**POST** `/api/auth/change-password`
- Change password (requires auth)
- Body: `{ currentPassword, newPassword }`

---

### Contacts
**POST** `/api/contacts`
- Submit contact form (public)
- Body: `{ name, email, phone, subject, message }`
- Auto-sends confirmation email

**GET** `/api/contacts`
- Get all contacts (admin only)
- Query: `?status=new|responded|closed`

**GET** `/api/contacts/:id`
- Get contact details (admin only)

**PATCH** `/api/contacts/:id/status`
- Update contact status (admin only)
- Body: `{ status: "new|responded|closed" }`

**DELETE** `/api/contacts/:id`
- Delete contact (admin only)

---

### Payments
**POST** `/api/payments`
- Create payment record (public)
- Body: `{ user_name, email, phone, amount, currency, payment_method, payment_type }`

**POST** `/api/payments/mpesa/initiate`
- Initiate M-Pesa STK push (public)
- Body: `{ phone, amount, payment_type, payer_name }`
- Response: `{ paymentId, checkoutRequestId }`

**POST** `/api/payments/mpesa-callback`
- M-Pesa callback URL (Safaricom -> Backend)
- Automatically updates payment status

**GET** `/api/payments`
- Get all payments (admin only)
- Query: `?status=pending|completed|failed&method=mpesa|bank|cash`

**GET** `/api/payments/stats/summary`
- Get payment statistics (admin only)
- Returns: total, completed count, tithe/offering breakdown

---

### Media
**POST** `/api/media/upload`
- Upload media file (requires auth)
- Form-data: `media` (file), `category`, `description`
- File types: JPEG, PNG, GIF, MP4, MOV
- Max size: 50MB
- Auto-pending approval

**GET** `/api/media/published`
- Get published media (public)

**GET** `/api/media/:id`
- Get media details

**GET** `/api/media/:id/download`
- Download media file

**GET** `/api/media`
- Get pending uploads (admin only)

**PATCH** `/api/media/:id/approve`
- Approve/reject media (admin only)
- Body: `{ approved: true|false }`
- Auto-sends notification email

**DELETE** `/api/media/:id`
- Delete media and file (admin only)

---

## Testing with Postman/cURL

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@copmii.org",
    "password": "admin123",
    "full_name": "Admin User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Submit Contact Form
```bash
curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254701234567",
    "subject": "Prayer Request",
    "message": "Please pray for my family"
  }'
```

### 4. Initiate M-Pesa Payment (Sandbox)
```bash
curl -X POST http://localhost:5000/api/payments/mpesa/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254701234567",
    "amount": 100,
    "payment_type": "tithe",
    "payer_name": "Jane Doe"
  }'
```

### 5. Upload Media
```bash
curl -X POST http://localhost:5000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "media=@/path/to/file.jpg" \
  -F "category=sermon" \
  -F "description=Sunday Sermon"
```

---

## Database Schema

### users
- id, username, email, password_hash, full_name, role, is_active, timestamps

### payments
- id, transaction_id, user_name, email, phone, amount, currency, payment_method, payment_type, status, mpesa_receipt, mpesa_transaction_date, bank_reference, notes, timestamps

### contacts
- id, name, email, phone, subject, message, status, is_read, responded_at, timestamps

### media
- id, file_name, original_file_name, file_type, file_size, file_path, uploaded_by, category, approval_status, approved_by, approved_at, description, is_published, timestamps

---

## M-Pesa Integration (Sandbox)

### Test Credentials
- **Consumer Key**: Check `.env`
- **Consumer Secret**: Check `.env`
- **Paybill**: 808080 (sandbox)
- **Account Reference**: Payment1, Payment2, etc.

### Test Phone Numbers
- `254701234567` - Standard test number
- `254708374149` - Another test number

### Testing Flow
1. Call `/api/payments/mpesa/initiate` with test phone
2. In sandbox, payment auto-completes after ~5 seconds
3. Callback posts to `/api/payments/mpesa-callback`
4. Payment status updated to "completed"
5. Confirmation email sent

---

## Email Configuration

### Using Gmail
1. Enable 2-Factor Authentication
2. Create App Password (16 chars)
3. Set in `.env`:
   ```
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### Using Other SMTP
Update `.env` with your provider's details:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

---

## Deployment Notes

### Production Checklist
- [ ] Change `JWT_SECRET` to secure random string
- [ ] Change `ADMIN_PASSWORD` 
- [ ] Set `NODE_ENV=production`
- [ ] Use real M-Pesa credentials (not sandbox)
- [ ] Configure email with production sender
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Use HTTPS in production
- [ ] Backup database regularly
- [ ] Monitor logs

### Database Backup
```bash
cp src/config/database.db src/config/database.backup.db
```

---

## Troubleshooting

**Port Already in Use**
```bash
lsof -i :5000  # Find process
kill -9 <PID>  # Kill it
```

**Database Locked**
- Restart server
- Check no other processes accessing database

**M-Pesa Callback Not Working**
- Check `MPESA_CALLBACK_URL` is publicly accessible
- Verify firewall/router port forwarding
- Check Safaricom console logs

**Email Not Sending**
- Verify SMTP credentials
- Check Gmail app password (not regular password)
- Disable 2FA temporarily if testing
- Check spam folder

---

## Support
For issues or questions, contact: info@copmii.org
