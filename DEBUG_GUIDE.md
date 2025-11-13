# Debug Guide: Partner Request Issues

## Common Issues & Solutions

### 1. **Network Error when creating profile/requests**

**Possible Causes:**
- Server not running
- Wrong port/URL
- CORS issues
- Authentication problems

**Solutions:**
```bash
# Start the server
npm start

# Check if server is running
netstat -an | findstr :4000

# Test API directly
node test-requests.js
```

### 2. **Requests not showing in "My Connections"**

**Check these on client side:**

1. **API URL**: Make sure client is calling correct endpoint
   ```javascript
   // Correct endpoints:
   POST /requests - Send request
   GET /requests/:email - Get user's requests
   ```

2. **Request Data**: Ensure proper data is sent
   ```javascript
   const requestData = {
     partnerId: "partner_id_here",
     message: "Your message",
     senderEmail: "user@email.com",
     senderName: "User Name"
   };
   ```

3. **Response Handling**: Check if client handles response correctly
   ```javascript
   // After sending request, refresh the connections list
   await sendRequest(requestData);
   await fetchUserConnections(userEmail);
   ```

### 3. **Authentication Issues**

The server is configured for development mode:
- No Firebase token required
- Pass email/name in request body
- Server will use these for user identification

### 4. **Database Issues**

Check MongoDB connection:
- Verify MONGODB_URI in .env
- Check if collections exist: `users`, `partners`, `requests`

## Testing Steps

1. **Start Server:**
   ```bash
   npm start
   ```

2. **Test API:**
   ```bash
   node test-requests.js
   ```

3. **Check Logs:**
   - Server logs show all requests
   - Look for error messages
   - Verify data is being saved

4. **Client Side:**
   - Check browser network tab
   - Verify API calls are made
   - Check response data
   - Ensure state updates after requests

## Quick Fix Checklist

- [ ] Server running on port 4000
- [ ] Client using correct API URL
- [ ] Request includes senderEmail and senderName
- [ ] Client refreshes connections after sending request
- [ ] No CORS errors in browser console
- [ ] MongoDB connection working