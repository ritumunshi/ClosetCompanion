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
The application uses four main tables:
- `users`: User authentication and profile data
- `clothing_items`: Individual wardrobe items with metadata
- `outfits`: Saved outfit combinations
- `outfit_history`: Track when outfits were worn

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

## Changelog

```
Changelog:
- July 03, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```