# Closet Concierge Web Application

## Overview

Closet Concierge is a full-stack web application built with a modern tech stack that helps users manage their wardrobe and get outfit suggestions. The application features a React frontend with TypeScript, an Express.js backend, and uses PostgreSQL with Drizzle ORM for data persistence. The system includes AI-powered outfit recommendations based on user preferences, weather, and occasion.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Uploads**: Multer for handling clothing item images
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful endpoints with structured error handling

### Database Schema
The application uses seven main tables:
- `users`: User authentication and profile data
- `clothing_items`: Individual wardrobe items with metadata
- `outfits`: Saved outfit combinations
- `outfit_history`: Track when outfits were worn
- `notification_subscriptions`: Push notification subscription data (endpoint, keys)
- `avatars`: User uploaded avatar photos for dress-up mode
- `outfit_compositions`: Saved dress-up outfits with positioning data (x, y, scale, rotation)

## Key Components

### Wardrobe Management
- **Clothing Items**: Users can add, view, and manage individual clothing pieces
- **Categories**: Items are organized by type (tops, bottoms, shoes, accessories)
- **Metadata**: Each item includes colors, seasons, occasions, and wear tracking
- **Image Upload**: Photos are stored locally with file upload handling

### Outfit Suggestion System
- **AI Logic**: Rule-based recommendation engine in `client/src/lib/outfit-ai.ts`
- **Filtering**: Suggestions based on occasion, weather, and season compatibility
- **Wear Tracking**: Prevents recently worn items from being suggested
- **Scoring**: Confidence scores for outfit combinations

### User Interface
- **Mobile-First**: Responsive design optimized for mobile devices
- **Navigation**: Bottom navigation bar with four main sections
- **Modal System**: Add items and view outfit suggestions via modals
- **Toast Notifications**: User feedback for actions and errors

### Push Notifications System
- **Web Push API**: Browser-native push notifications using VAPID authentication
- **Service Worker**: Background notification handling in `public/sw.js`
- **Subscription Management**: Users can enable/disable notifications from settings
- **Daily Outfit Suggestions**: Morning notifications with weather-based outfit recommendations
- **Notification Preferences**: Dedicated page for managing notification settings
- **Backend Integration**: web-push library for sending notifications to subscribed users

### Dress-Up Mode (Virtual Try-On)
- **Mannequin System**: SVG-based cartoon body templates (male, female, slim, tall) with stylized silhouettes
- **Avatar Integration**: Circular face crops from user photos positioned on mannequin heads
- **Interactive Clothing**: Drag-and-drop positioning for clothing items with real-time overlay
- **Transform Controls**: Zoom in/out (scale: 0.5x-2.0x) and rotation (-180° to 180°) for each item
- **Position Tracking**: Each item stores x%, y%, scale, and rotation values
- **Visual Depth**: Drop-shadow filters applied to clothing overlays for realistic layering
- **Outfit Compositions**: Save complete outfits with positioning data for later viewing
- **Persistent Storage**: Body type and item transforms saved to database via outfit_compositions table
- **Navigation**: Accessible via Profile → Dress-Up Mode

## Data Flow

1. **User Authentication**: Demo user system (ID: 1) for MVP
2. **Clothing Management**: 
   - Add items via form with image upload
   - Store metadata in PostgreSQL
   - Display in filterable grid layout
3. **Outfit Generation**:
   - User selects occasion and weather
   - AI engine filters compatible items
   - Returns scored outfit combinations
4. **History Tracking**: Record worn outfits to improve future suggestions

## External Dependencies

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL hosting)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod for schema validation
- **File Storage**: Local file system for image uploads
- **Push Notifications**: web-push library with VAPID authentication

### Frontend Dependencies
- **UI Library**: Radix UI components with shadcn/ui styling
- **State Management**: TanStack Query for API state
- **Styling**: Tailwind CSS with custom color scheme
- **Icons**: Lucide React icons
- **Date Handling**: date-fns for date formatting

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full type safety across the stack
- **Path Aliases**: Configured for clean imports
- **Hot Reload**: Vite dev server with HMR

## Deployment Strategy

### Development
- **Script**: `npm run dev` starts both frontend and backend
- **Database**: `npm run db:push` applies schema changes
- **Type Checking**: `npm run check` validates TypeScript

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: esbuild bundles Express server
- **Assets**: Static files served from dist/public
- **Database**: Migrations applied via Drizzle Kit

### Environment Configuration
- **Database URL**: Required environment variable
- **File Uploads**: Configurable upload directory
- **CORS**: Configured for development and production
- **VAPID Keys**: Required for push notifications (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)

## Scheduling Daily Notifications

The application includes a `/api/daily-outfit-notification` endpoint that sends weather-based outfit suggestions to subscribed users. To schedule this for daily delivery:

### Manual Testing
```bash
# Test notification with warm weather
curl -X POST http://localhost:5000/api/daily-outfit-notification \
  -H "Content-Type: application/json" \
  -d '{"weather":"warm","occasion":"casual"}'
```

### Production Scheduling Options

1. **Replit Deployments (Cron)**:
   - Use Replit's built-in cron functionality to schedule daily notifications
   - Set trigger time (e.g., 8:00 AM local time)
   - Example cron expression: `0 8 * * *` for daily at 8 AM

2. **External Cron Service** (e.g., cron-job.org, EasyCron):
   - Create a scheduled HTTP POST request to the endpoint
   - Configure authentication if needed
   - Set timezone and frequency

3. **Node.js Scheduler** (node-cron):
   - Install: `npm install node-cron`
   - Add to server code:
   ```javascript
   import cron from 'node-cron';
   
   // Schedule daily at 8 AM
   cron.schedule('0 8 * * *', async () => {
     // Get current weather from API or use default
     const weather = 'warm'; // Could integrate weather API
     await sendDailyOutfitNotification(weather);
   });
   ```

### Weather Integration (Future Enhancement)
Consider integrating a weather API (OpenWeather, WeatherAPI) to automatically determine the weather condition for more accurate outfit suggestions.

## Changelog

```
Changelog:
- July 03, 2025. Initial setup
- September 30, 2025. Added push notification system with web push API, VAPID authentication, notification subscription management, daily outfit suggestion notifications, and service worker for background handling
- September 30, 2025. Implemented interactive dress-up mode with:
  - Multiple mannequin body templates (male, female, slim, tall) with SVG-based cartoon silhouettes
  - Drag-and-drop clothing positioning with real-time overlay
  - Zoom in/out controls (0.5x-2.0x scale range)
  - Rotation controls (-180° to 180°)
  - Drop-shadow visual effects for depth
  - Outfit composition storage with complete positioning data (x, y, scale, rotation, bodyType)
  - Outfit compositions display page showing saved dress-up outfits with positioning details
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```