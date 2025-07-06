
# 🛡️ Admin Access Protection & Secure Routing Setup

This guide implements a secure access mechanism for your **admin panel** in a Node.js + Express project, using a new route (`/super-secret-admin-page`) and a minimal custom `auth.html` login interface.

> ✅ Your existing admin panel logic, dashboard functionality, and post-related requests **must not be modified**. This guide ensures integration without breaking anything.

---

## 📁 Directory Structure (Final Setup)

```
project/
├── public/                     → Public frontend assets (blog pages)
│   └── index.html
├── admin/                      → Admin panel (HTML, CSS, JS)
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── auth.html               → Simple login page (username/password)
│   └── dashboard.html          → Main admin dashboard (already functional)
├── .env                        → Environment variables
├── server.js                   → Express backend server
```

---

## 🔐 Environment Variables (.env)

Configured necessary admin credentials in the `.env` file at the root of the project:
They're ready. Don't anything related with .env file. Credentials in below are ready, they've been set up. You make sure to use these credential keys in the logic you're going to implement.
```
ADMIN_ID=
ADMIN_PASSWORD=
```
---

## 📄 server.js – Backend Logic

Update your `server.js` file to do the following:

1. Use `dotenv` to load credentials
2. Serve `public/` as usual
3. Protect `/super-secret-admin-page` route with a custom HTML form (`auth.html`)
4. Authenticate using session or in-memory state (simplified)
5. Serve `admin/` statically **only** after successful login

```js
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: "superadminsecretkey",
  resave: false,
  saveUninitialized: true,
}));

// Serve public site
app.use("/", express.static(path.join(__dirname, "public")));

// Login GET - render login page
app.get("/super-secret-admin-page", (req, res) => {
  if (req.session.authenticated) {
    return res.redirect("/super-secret-admin-page/dashboard.html");
  }
  res.sendFile(path.join(__dirname, "admin", "auth.html"));
});

// Login POST - handle login form
app.post("/super-secret-admin-page/login", (req, res) => {
  const { id, password } = req.body;
  if (id === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect("/super-secret-admin-page/dashboard.html");
  }
  return res.status(401).send("Unauthorized: Invalid credentials");
});

// Auth middleware for static files
app.use("/super-secret-admin-page", (req, res, next) => {
  if (req.session.authenticated) return next();
  res.redirect("/super-secret-admin-page");
});

// Serve admin assets after login
app.use("/super-secret-admin-page", express.static(path.join(__dirname, "admin")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
```

---

## 🧾 auth.html – Minimal Login Page

Create `admin/auth.html` with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Admin Login</title>
</head>
<body style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
  <form method="POST" action="/super-secret-admin-page/login">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <input type="text" name="id" placeholder="Admin ID" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </div>
  </form>
</body>
</html>
```

---

## ✅ What This Does

- Prevents public access to `/admin` assets
- Requires login at `/super-secret-admin-page`
- Once logged in, gives access to `dashboard.html` and other admin resources
- Keeps existing functionality **fully intact**

---

## 🧠 Notes

- No changes are required to your admin JS, CSS, or dashboard logic.
- Use a strong password and change the secret URL (`/super-secret-admin-page`) if necessary.
- You can use Cloudflare or NGINX for additional IP-based rate limits or blocking.

---

Happy blogging! 📝
