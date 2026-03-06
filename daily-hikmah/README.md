# Daily Hikmah Notifications - حكمة اليوم

A production-ready full-stack web application that sends Arabic wisdom notifications using **Web Push API** and **Service Workers**. Built with Go backend (webpush-go library) and Vanilla JavaScript frontend.

**🚀 [View Production Deployment Guide →](DEPLOYMENT.md)**

---

## ✨ Features

### Push Notifications
✅ **Real Web Push Notifications** - Works even when browser is closed  
✅ **VAPID Authentication** - Secure push notification delivery  
✅ **Service Worker** - Background notification handling with RTL support  
✅ **Frequency Selection** - Users choose 6h, 12h, or 24h intervals  

### Content & UX
✅ **99 Arabic Wisdom Sayings** - Loaded from external JSON file  
✅ **Sequential Rotation** - Counter-based wisdom delivery  
✅ **Subscribe/Unsubscribe** - Full subscription management  
✅ **Smart UI** - Auto-hides instructions when subscribed  
✅ **Modern Design** - Responsive gradient UI with RTL support  

### Production Ready
✅ **Environment Variables** - VAPID keys and PORT configuration  
✅ **CORS Support** - Cross-origin requests for Vercel frontend  
✅ **Render Compatible** - Dynamic port assignment  
✅ **Vercel Compatible** - Optimized static frontend deployment  
✅ **Health Monitoring** - `/health` endpoint for status checks  
✅ **Error Handling** - Automatic removal of invalid subscriptions  

---

## 📁 Project Structure

```
daily-hikmah/
├── main.go                    # Original backend (local development)
├── main-production.go         # Production backend with env vars & CORS
├── generate_vapid_keys.go     # VAPID key generator utility
├── go.mod                     # Dependencies (webpush-go v1.4.0)
├── go.sum                     # Dependency checksums
│
├── data/
│   └── hikmah.json           # 99 unique Arabic wisdom sayings
│
├── frontend/                  # Vercel-ready frontend
│   ├── index.html            # UI with frequency selection
│   ├── script.js             # Push subscription with configurable API_URL
│   ├── sw.js                 # Service Worker with RTL support
│   ├── style.css             # Modern RTL gradient styling
│   └── vercel.json           # Vercel deployment configuration
│
├── static/                    # Original static files (local dev)
│   ├── index.html
│   ├── script.js
│   ├── sw.js
│   └── style.css
│
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore file (includes vapid_keys.json)
├── README.md                 # This file
└── DEPLOYMENT.md             # Complete deployment guide
```

---

## 🏗️ Architecture

### Backend (Go) - Production Version

**File**: `main-production.go`

**Key Features:**
- ✅ **Environment Variables**: Loads VAPID keys from `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- ✅ **Dynamic Port**: Uses `PORT` environment variable (required by Render)
- ✅ **CORS Middleware**: Allows cross-origin requests from Vercel frontend
- ✅ **Frequency Support**: Each subscriber can choose 6h, 12h, or 24h intervals
- ✅ **Smart Scheduling**: Checks each subscriber individually and sends based on their preference
- ✅ **Auto-cleanup**: Removes invalid subscriptions (410 Gone, 404 Not Found)
- ✅ **Health Endpoint**: `/health` for monitoring subscriber count and status

**API Endpoints:**
```
POST   /subscribe          - Subscribe with frequency preference
GET    /vapid-public-key   - Get VAPID public key for frontend
GET    /today              - Get current wisdom saying
GET    /health             - Health check endpoint
```

**Data Flow:**
1. Loads VAPID keys from environment or generates new ones
2. Loads 99 Arabic sayings from `data/hikmah.json` on startup
3. Runs hourly scheduler checking each subscriber
4. Sends notification if subscriber's frequency interval has passed
5. Rotates wisdom counter after each notification

### Frontend (JavaScript) - Vercel Ready

**Location**: `frontend/` folder

**Key Features:**
- ✅ **Configurable API URL**: Automatically detects localhost vs production
- ✅ **Frequency Selection UI**: Radio buttons for 6h, 12h, 24h options
- ✅ **Smart Subscription**: Sends both subscription and frequency preference
- ✅ **Subscribe/Unsubscribe**: Full lifecycle management
- ✅ **Auto-hiding UI**: Instructions disappear when subscribed
- ✅ **RTL Support**: Proper Arabic text rendering throughout

### Service Worker (`sw.js`)

Runs in background, independent of browser state:
- 📬 Receives push notifications from browser push service
- 📱 Displays notifications with RTL Arabic text
- 🔔 Handles notification clicks (opens/focuses app)
- 🔄 Manages push subscription changes
- ✅ Works even when browser is closed or tab is inactive

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Go 1.16+ installed
- Modern web browser (Chrome, Firefox, Edge, Safari 16+)

### Local Development Setup

1. **Clone and navigate**:
```bash
cd /Users/hassanomran/div/Ali/daily-hikmah
```

2. **Install dependencies**:
```bash
go mod download
```

3. **Run the backend**:
```bash
go run main.go
```

4. **Open in browser**:
```
http://localhost:8080
```

5. **Test subscription**:
   - Select frequency (6h, 12h, or 24h)
   - Click "اشترك الآن" (Subscribe Now)
   - Allow notifications when prompted
   - Receive immediate welcome notification

---

## 🌐 Production Deployment

For deploying to **Render (backend)** and **Vercel (frontend)**:

### 📖 [Follow the Complete Deployment Guide →](DEPLOYMENT.md)

### Quick Production Checklist

- [ ] Generate VAPID keys: `go run generate_vapid_keys.go`
- [ ] Rename `main-production.go` to `main.go`
- [ ] Push backend to GitHub → Deploy on Render
- [ ] Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` on Render
- [ ] Update `API_URL` in `frontend/script.js` with Render URL
- [ ] Push frontend to GitHub → Deploy on Vercel
- [ ] Test notifications on production URL

### Environment Variables (Production)

On Render, set these environment variables:

```bash
VAPID_PUBLIC_KEY=<your_generated_public_key>
VAPID_PRIVATE_KEY=<your_generated_private_key>
PORT=<automatically_set_by_render>
```

---

## 📡 API Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/subscribe` | POST | Subscribe with frequency | `{subscription: PushSubscription, frequency: 6\|12\|24}` | `{success: true, message: "...", frequency: 24}` |
| `/vapid-public-key` | GET | Get VAPID public key | - | `{publicKey: "..."}` |
| `/today` | GET | Get current wisdom | - | `{title: "حكمة اليوم", message: "..."}` |
| `/health` | GET | Health check & stats | - | `{status: "ok", subscribers: 10, sayings: 99}` |

### Subscription Request Example

```javascript
POST /subscribe
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BKq...",
      "auth": "xYz..."
    }
  },
  "frequency": 24  // 6, 12, or 24 hours
}
```

---

## ⚙️ Configuration

### Backend Configuration

**Original version** (`main.go`):
- Port: `8080` (hardcoded)
- VAPID keys: Auto-generated and saved to `vapid_keys.json`
- Broadcast: Fixed interval

**Production version** (`main-production.go`):
- Port: `PORT` environment variable (Render compatible)
- VAPID keys: `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from environment
- Broadcast: Per-subscriber frequency (6h, 12h, or 24h)
- Scheduler: Checks every 1 hour, sends based on individual preferences

### Frontend Configuration

**Local development**:
- API URL: `http://localhost:8080` (auto-detected)

**Production** (`frontend/script.js`, line 8):
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080'
  : 'https://your-app-name.onrender.com';  // ← Update this
```

### Notification Frequencies

Users can choose from:
- **6 hours** - 4 notifications per day
- **12 hours** - 2 notifications per day  
- **24 hours** - 1 notification per day (recommended)

---

## ⚠️ Important Notes

### Production Web Push
✅ Uses `webpush-go` library (v1.4.0) for proper VAPID authentication  
✅ Automatic cleanup of invalid subscriptions (410/404 responses)  
✅ Per-subscriber frequency management with thread-safe storage

### HTTPS Requirement
🔒 Web Push and Service Workers **require HTTPS** in production  
🔒 `localhost` works for local testing (no HTTPS needed)  
🔒 Render and Vercel provide HTTPS automatically  
🔒 Use ngrok for local public HTTPS testing

### Storage Considerations
💾 **Current**: In-memory storage with `sync.RWMutex` (thread-safe)  
💾 **Limitation**: Subscriptions lost on server restart  
💾 **Production**: Consider PostgreSQL, MySQL, or Redis for persistence  
💾 **Trade-off**: Simple deployment vs data persistence

### VAPID Keys Security
🔑 **Development**: Auto-generated on first run  
🔑 **Production**: Load from environment variables (Render)  
🔑 **Important**: Never commit VAPID keys to git (`.gitignore` included)  
🔑 **Changing keys**: Invalidates all existing subscriptions  
🔑 **Solution**: Users must re-subscribe after key changes

### Notification Scheduling
🔄 **Scheduler**: Runs every 1 hour (checks all subscribers)  
🔄 **Per-user**: Sends only if their frequency interval has passed  
🔄 **Wisdom rotation**: Sequential counter-based (1→99, then repeats)  
🔄 **Welcome message**: Immediate notification on new subscription

---

## 🧪 Troubleshooting

### Backend Issues

**"VAPID keys not found in environment"**
- ✅ Solution: Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Render environment variables

**"Failed to load sayings"**
- ✅ Solution: Ensure `data/hikmah.json` is committed to repository

**"Port already in use"**
- ✅ Solution: Kill process using: `lsof -ti:8080 | xargs kill -9`

### Frontend Issues

**"Failed to get server public key"**
- ✅ Solution: Check that `API_URL` in `script.js` points to correct backend
- ✅ Verify Render backend is running

**CORS errors in browser console**
- ✅ Solution: Backend includes CORS middleware (check Render logs)
- ✅ Ensure backend is accessible and running

**Notifications not working**
- ✅ Ensure HTTPS (Vercel provides this)
- ✅ Check notification permissions in browser settings
- ✅ Try Incognito mode (clears cached permissions)

### Push Notification Issues

**403 Push Service Errors**
- ✅ VAPID keys might have changed
- ✅ Clear browser cache and re-subscribe
- ✅ Check Render logs for detailed error messages

**Service Worker registration failed**
- ✅ Ensure `sw.js` is in the root of frontend deployment
- ✅ Check browser console for specific errors
- ✅ Verify HTTPS is enabled

---

## 💻 Tech Stack

### Backend
- **Go** (standard library for HTTP server)
- **webpush-go** v1.4.0 (VAPID keys & push notifications)
- **jwt** v5.2.1 (dependency of webpush-go)
- **crypto** v0.31.0 (ECDSA key generation)

### Frontend
- **Vanilla JavaScript** (no frameworks)
- **Service Workers API**
- **Push API** (PushManager)
- **Notification API**
- **Responsive CSS** with gradient design and RTL support

### Deployment
- **Render** (Go backend hosting with free tier)
- **Vercel** (Static frontend hosting with free tier)
- **Go modules** (dependency management)

---

## 🌟 Future Improvements

### Backend
- [ ] PostgreSQL/MongoDB for persistent subscription storage
- [ ] Admin API for managing sayings
- [ ] Analytics endpoint (delivery rates, subscriber growth)
- [ ] Email fallback for failed push notifications
- [ ] Multi-language support
- [ ] User authentication (optional)

### Frontend
- [ ] PWA manifest for "Add to Home Screen"
- [ ] Offline support with Service Worker caching
- [ ] Settings panel (change frequency after subscription)
- [ ] Dark mode toggle
- [ ] Multi-language UI
- [ ] Push notification history view

### DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing (unit + integration)
- [ ] Monitoring and alerting (Prometheus/Grafana)
- [ ] Rate limiting for API endpoints

---

## 📊 Browser Compatibility

- ✅ **Chrome 42+** (Full support)
- ✅ **Firefox 44+** (Full support)
- ✅ **Edge 17+** (Full support)
- ✅ **Safari 16+** (macOS 13+, iOS 16.4+)
- ❌ **Internet Explorer** (Not supported - no Service Worker support)

---

## 📄License

MIT

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

**🎉 Built with ❤️ for daily wisdom seekers**

**Need help?** Check the [Deployment Guide](DEPLOYMENT.md) for detailed instructions.
