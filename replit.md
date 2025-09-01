# Overview

SportFitness is a comprehensive gym management system built as a full-stack web application. The system provides gym members with tools to manage their fitness journey, including check-ins, workout tracking, class bookings, equipment reservations, and membership management. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and Drizzle ORM for database operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 and TypeScript, utilizing a modern component-based architecture. Key architectural decisions include:

- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives for consistent, accessible design patterns
- **State Management**: Implements TanStack Query (React Query) for server state management, eliminating the need for complex client-side state solutions
- **Routing**: Uses Wouter for lightweight, declarative routing without the overhead of React Router
- **Styling**: Employs Tailwind CSS with CSS custom properties for theming and responsive design
- **Authentication**: Implements localStorage-based authentication with JWT-like user session management

## Backend Architecture
The server follows a RESTful API design pattern using Express.js:

- **Framework**: Express.js with TypeScript for type safety
- **API Structure**: Modular route organization with separate auth, user, class, workout, and equipment endpoints
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Request Logging**: Custom middleware for API request logging and performance monitoring

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: PostgreSQL hosted on Neon for serverless database capabilities
- **ORM**: Drizzle ORM chosen for its TypeScript-first approach and lightweight nature
- **Schema Design**: Comprehensive schema covering users, plans, classes, workouts, equipment, and check-ins
- **Migrations**: Database schema versioning through Drizzle Kit migration system

## Authentication and Authorization
Simple authentication system focused on user experience:

- **Strategy**: Email/password authentication with client-side session storage
- **Session Management**: localStorage-based user session persistence
- **Route Protection**: Client-side route guards for protected dashboard access
- **User Registration**: Combined login/register flow for streamlined onboarding

## External Dependencies

- **Database Hosting**: Neon PostgreSQL for serverless database infrastructure
- **UI Components**: Radix UI primitives for accessibility-compliant component foundation
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Vite for fast development builds and hot module replacement
- **CSS Framework**: Tailwind CSS for utility-first styling approach
- **Form Handling**: React Hook Form with Zod schema validation
- **Build System**: esbuild for production server bundling

The architecture prioritizes developer experience with TypeScript throughout, fast development cycles with Vite, and a component-driven UI approach that scales well for gym management features.