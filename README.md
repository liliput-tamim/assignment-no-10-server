# Study Partner Backend API

A complete backend API for the Study Partner application built with Express.js, MongoDB, and Firebase Authentication.

## Features

- **Authentication**: Firebase Auth with JWT token verification
- **CRUD Operations**: Full Create, Read, Update, Delete for partner profiles
- **Search & Filter**: Search partners by subject and sort by experience/rating
- **Partner Requests**: Send, update, and delete partner connection requests
- **User Management**: Profile management and request tracking
- **Security**: Protected routes with Firebase token verification

## API Endpoints

### Authentication
- `POST /auth/verify` - Verify Firebase ID token

### Partners
- `GET /partners` - Get all partners (supports ?search=subject&sort=rating)
- `GET /partners/:id` - Get single partner details
- `POST /partners` - Create new partner profile (protected)
- `PUT /partners/:id` - Update partner profile (owner only)
- `DELETE /partners/:id` - Delete partner profile (owner only)
- `GET /partners/top-rated` - Get top-rated partners

### Requests
- `POST /requests` - Send partner request (protected)
- `GET /requests/:email` - Get user's sent requests (protected)
- `PUT /requests/:id` - Update request (owner only)
- `DELETE /requests/:id` - Delete request (owner only)

### Profile
- `GET /profile/:email` - Get user profile (protected)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Firebase Setup**
   - Create a Firebase project
   - Generate a service account key
   - Download the JSON file and place it in your project
   - Update the path in `.env` file

3. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Update Firebase credentials path

4. **Start Server**
   ```bash
   npm start
   ```

## Database Collections

### users
- Stores user information from Firebase Auth
- Fields: email, name, photoURL, createdAt

### partners
- Stores study partner profiles
- Fields: name, subject, experienceLevel, rating, partnerCount, createdBy, etc.

### requests
- Stores partner connection requests
- Fields: senderEmail, partnerId, message, status, createdAt

## Authentication

All protected routes require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error