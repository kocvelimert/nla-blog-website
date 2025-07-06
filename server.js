const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")
const session = require("express-session")
const postRoutes = require("./routes/postRoutes")
const quoteRoutes = require("./routes/quoteRoutes")
const newsletterRoutes = require("./routes/newsletterRoutes")
const connectDB = require("./config/db")

// Load configuration
const { config, logConfigDebug } = require("./config/environment")

// Debug configuration
logConfigDebug()

require("./config/cloudinary")

const app = express()
const PORT = config.PORT

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
// Increase body parser limits to 100MB
app.use(bodyParser.json({ limit: "100mb" }))
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }))

// Session middleware for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || "superadminsecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Register API routes
app.use("/posts", postRoutes)
app.use("/quotes", quoteRoutes)
app.use("/api/newsletter", newsletterRoutes)

// Serve static files from the public folder (blog frontend)
app.use(express.static(path.join(__dirname, 'public')))

// Admin authentication routes
// Login GET - render login page
app.get("/super-secret-admin-page", (req, res) => {
  if (req.session.authenticated) {
    return res.redirect("/super-secret-admin-page/dashboard.html")
  }
  res.sendFile(path.join(__dirname, "admin", "auth.html"))
})

// Login POST - handle login form
app.post("/super-secret-admin-page/login", (req, res) => {
  const { id, password } = req.body
  
  // Debug logging
  console.log('🔍 Login attempt:')
  console.log('- Received ID:', id)
  console.log('- Received Password:', password ? '***' : 'undefined')
  console.log('- Config ADMIN_ID:', config.ADMIN.ID)
  console.log('- Config ADMIN_PASSWORD:', config.ADMIN.PASSWORD ? '***' : 'undefined')
  
  // Validate credentials from configuration
  if (id === config.ADMIN.ID && password === config.ADMIN.PASSWORD) {
    req.session.authenticated = true
    req.session.adminId = id
    console.log('✅ Login successful for:', id)
    return res.redirect("/super-secret-admin-page/dashboard.html")
  }
  
  // Invalid credentials - redirect back to login with error
  console.log('❌ Login failed - credentials do not match')
  return res.status(401).send(`
    <html>
      <head>
        <title>Login Failed</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .error { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
          .error h1 { color: #e74c3c; margin: 0 0 15px 0; }
          .error p { color: #666; margin: 0 0 20px 0; }
          .retry-btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>🚫 Access Denied</h1>
          <p>Invalid admin credentials provided.</p>
          <a href="/super-secret-admin-page" class="retry-btn">Try Again</a>
        </div>
      </body>
    </html>
  `)
})

// Logout route
app.post("/super-secret-admin-page/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err)
    }
    res.redirect("/super-secret-admin-page")
  })
})

// Auth middleware for protecting admin static files
app.use("/super-secret-admin-page", (req, res, next) => {
  if (req.session.authenticated) {
    return next()
  }
  res.redirect("/super-secret-admin-page")
})

// Serve admin assets after authentication
app.use("/super-secret-admin-page", express.static(path.join(__dirname, "admin")))

// Default route - serve index.html for the blog
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log(`🔐 Admin panel available at http://localhost:${PORT}/super-secret-admin-page`)
})
