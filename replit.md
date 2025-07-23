# Anger Management Recording System

## Overview

This is a full-stack web application designed to help users track and analyze their anger through a structured seven-column cognitive behavioral therapy (CBT) approach. The application provides tools for recording anger incidents, detecting cognitive distortions, and analyzing patterns over time to support emotional regulation and mental health improvement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Style**: RESTful API
- **Database**: PostgreSQL (via Drizzle ORM)
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between client and server

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **Storage Interface**: Abstract storage layer with in-memory fallback for development
- **Session Storage**: PostgreSQL-based sessions (connect-pg-simple)

## Key Components

### Seven-Column CBT Form
The core feature implementing the cognitive behavioral therapy seven-column technique:
1. **Situation**: Description of the triggering event
2. **Emotions**: Multiple emotions with intensity ratings (0-100)
3. **Automatic Thoughts**: Initial reactive thoughts
4. **Evidence**: Facts supporting the thoughts
5. **Counter Evidence**: Facts challenging the thoughts
6. **Balanced Thinking**: Rational reframing
7. **Mood Rating**: Before and after mood scores

### Cognitive Distortion Detection Service
Automated pattern recognition system that identifies common cognitive distortions in Japanese text:
- **Labeling**: Detecting negative labels or name-calling
- **Mind Reading**: Identifying assumptions about others' thoughts
- **All-or-Nothing Thinking**: Recognizing extreme or absolute language
- **Personalization**: (Partially implemented)
- **Externalization**: (Partially implemented)

### Analytics and Visualization
- Mood improvement tracking over time
- Emotion frequency and intensity analysis
- Cognitive distortion pattern identification
- Weekly and monthly trend analysis
- Data export functionality (CSV format)

### Navigation and UI Components
- Responsive design with mobile-first approach
- Clean, accessible interface using shadcn/ui components
- Dashboard with key statistics and insights
- History view with filtering and search capabilities
- Analysis page with charts and progress tracking

## Data Flow

1. **Record Creation**: User fills seven-column form → Client validation (Zod) → Server validation → Cognitive distortion analysis → Database storage
2. **Data Retrieval**: Client requests → Server queries database → Response with pagination support
3. **Analytics**: Aggregated database queries → Server-side calculations → Client visualization
4. **Real-time Analysis**: Form input triggers cognitive distortion detection as user types

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM with PostgreSQL driver
- **UI Library**: Radix UI primitives via shadcn/ui
- **Validation**: Zod for runtime type checking
- **HTTP Client**: Native fetch API
- **Date Handling**: date-fns utility library

### Development Tools
- **Build**: Vite with TypeScript support
- **Development**: tsx for TypeScript execution
- **Database Tools**: Drizzle Kit for schema management
- **Styling**: PostCSS with Tailwind CSS
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` script

### Environment Configuration
- **Development**: Uses tsx for hot reloading, Vite dev server
- **Production**: Serves static files from Express, uses compiled JavaScript
- **Database**: Requires `DATABASE_URL` environment variable

### Scaling Considerations
- Stateless server design supports horizontal scaling
- PostgreSQL database can handle concurrent users
- Session storage in database enables multi-instance deployment
- CDN-ready static asset serving

The application is designed as a therapeutic tool with a focus on user privacy, data accuracy, and meaningful insights for anger management and emotional regulation.