
# NLA Blog Platform

A full-stack blog website built with modern web technologies, providing a platform for creating, managing, and sharing blog posts. This project is designed to be a feature-rich and user-friendly content management system.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Image Hosting**: Cloudinary
- **Email Service**: Brevo (formerly Sendinblue)
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**:
  - `body-parser` for parsing request bodies
  - `cors` for enabling Cross-Origin Resource Sharing
  - `dotenv` for managing environment variables
  - `express-session` for session management
  - `multer` for handling file uploads
  - `sharp` for image processing
  - `slugify` for creating URL-friendly slugs

## Project Structure

```
nla-blog-website/
├── admin/            # Admin panel for managing posts
├── config/           # Configuration files for database, environment, etc.
├── controllers/      # Controllers for handling business logic
├── data/             # JSON data for posts and quotes
├── middlewares/      # Custom middleware for authentication, validation, etc.
├── models/           # Mongoose models for database schemas
├── public/           # Static assets (CSS, JS, images)
├── routes/           # Express routes for different API endpoints
├── services/         # Services for interacting with external APIs and database
├── uploads/          # Local directory for file uploads
├── utils/            # Utility functions
├── server.js         # Main server entry point
└── package.json      # Project metadata and dependencies
```

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/nla-blog-website.git
   cd nla-blog-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following variables:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   BASE_URL=http://localhost:3000

   # Admin Credentials
   ADMIN_ID=your_admin_id
   ADMIN_PASSWORD=your_admin_password

   # Brevo (Sendinblue) API for Newsletter
   BREVO_SUBSCRIBE_API=your_brevo_api_key
   BREVO_LIST_ID=your_brevo_list_id
   BREVO_SENDER_EMAIL=your_brevo_sender_email

   # Newsletter Logo (Optional)
   NEWSLETTER_LOGO_URL=your_newsletter_logo_url

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/nla-local-server

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Run the server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## Usage

- **Home Page**: View all blog posts.
- **Admin Panel**: Navigate to `/admin` to access the admin login page. After logging in, you can:
  - **Create a new post**: Write a new blog post using the rich text editor.
  - **Edit an existing post**: Update the content, title, or other details of a post.
  - **Delete a post**: Remove a post from the blog.

## Features

- **Full-stack Architecture**: A complete client-server application with a separate admin panel.
- **RESTful API**: A well-structured API for managing blog posts.
- **CRUD Operations**: Create, read, update, and delete functionality for blog posts.
- **Rich Text Editor**: An intuitive editor for writing and formatting blog content.
- **File Uploads**: Support for uploading images and thumbnails for posts.
- **Newsletter Subscription**: Integration with Brevo for managing newsletter subscribers.
- **Responsive Design**: A mobile-friendly layout for a seamless user experience on all devices.

## Future Improvements

- **User Authentication**: Implement a full user authentication system with roles and permissions.
- **Search Functionality**: Add a search feature to easily find blog posts.
- **Comments Section**: Allow readers to comment on blog posts.
- **Social Sharing**: Integrate social media sharing buttons for posts.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details. 