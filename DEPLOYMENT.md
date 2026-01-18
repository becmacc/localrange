# Local Roots Farm - Serverless Setup

## ✅ API Key Now Protected!

Your Gemini API key is now secured using Vercel serverless functions.

## 📁 What Changed

- **[api/chat-endpoint.ts](api/chat-endpoint.ts)** - New serverless function endpoint
- **[vite.config.ts](vite.config.ts)** - Removed exposed API key
- **[components/ChatAssistant.tsx](components/ChatAssistant.tsx)** - Updated to call serverless API
- **[vercel.json](vercel.json)** - Vercel deployment configuration

## 🚀 Deploy to Vercel

1. **Install Vercel CLI** (optional for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Add Environment Variable** in Vercel Dashboard:
   - Go to your project settings
   - Navigate to: Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `AIzaSyBHsT-iCvNy6dKQuwiCnvAXYs16KS-giSg`
   - Add it for: Production, Preview, and Development

4. **Redeploy** after adding the environment variable

## 🧪 Testing Locally

For local development with serverless functions:
```bash
vercel dev
```

This will run both your Vite app and serverless functions locally.

## 🔒 Security Features

✅ API key never sent to client  
✅ Rate limiting (20 requests/minute)  
✅ CORS protection  
✅ Server-side validation  

## 📝 Notes

- Your `.env.local` is for local dev only (not deployed)
- Vercel automatically handles the `/api` routes
- Rate limiting persists per serverless function instance
