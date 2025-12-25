# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SmartMemory Admin is a React-based superadmin console for managing the SmartMemory platform. It provides cross-tenant system operations including user management, tenant management, billing oversight, deployments, system monitoring, and feature flags.

## Development Commands

### Essential Commands
```bash
# Start development server (runs on port 5174)
npm run dev

# Build for production
npm run build

# Lint the codebase
npm run lint

# Preview production build locally
npm run preview
```

### Node Requirements
- Node.js >= 20.0.0
- npm >= 10.0.0

## Architecture

### Technology Stack
- **Framework**: React 18 with Vite 6
- **Routing**: React Router v7
- **Styling**: TailwindCSS with custom theme system
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **State Management**: React Context (AuthContext)
- **Notifications**: Sonner toast library

### Project Structure

```
src/
├── components/ui/      # Reusable UI components (Radix-based)
├── context/            # React context providers (AuthContext)
├── lib/                # Core utilities and configurations
│   ├── api.js         # Main API client (SuperAdminAPI class)
│   ├── errorTracking.jsx  # Error tracking and ErrorBoundary
│   └── utils.js       # TailwindCSS utility helpers
├── pages/              # Page components and routing
│   ├── index.jsx      # Main router with ProtectedRoute logic
│   ├── Layout.jsx     # App layout with navigation
│   ├── Dashboard.jsx  # System overview and stats
│   ├── Users.jsx      # User management
│   ├── Tenants.jsx    # Tenant management
│   ├── Billing.jsx    # Billing and revenue metrics
│   ├── Deployments.jsx # Deployment management
│   ├── System.jsx     # System health and monitoring
│   ├── Activity.jsx   # Activity logs
│   ├── FeatureFlags.jsx # Feature flag management
│   └── Login.jsx      # Authentication page
└── utils/              # Utility functions (formatters, etc.)
```

### Key Architectural Patterns

#### Authentication Flow
- All API requests use JWT tokens stored in localStorage (`admin_access_token`)
- Automatic token refresh using refresh tokens (`admin_refresh_token`)
- AuthContext provides authentication state and methods throughout the app
- Only users with `superadmin` role can access the application
- Protected routes redirect to login if unauthenticated or show access denied if not superadmin

#### API Client Pattern
- Centralized API client in `src/lib/api.js` (SuperAdminAPI class)
- All backend communication goes through this client
- Automatic token refresh on 401 responses
- Error tracking integration for failed requests
- Base URL configured via `VITE_API_URL` environment variable

#### Component Architecture
- UI components in `src/components/ui/` are reusable Radix UI-based primitives
- Page components consume the API client and manage their own state
- Layout component handles navigation and user menu
- ErrorBoundary wraps the entire app for graceful error handling

#### Path Alias Configuration
- `@/` is aliased to `./src` in vite.config.js
- Always use path aliases for imports: `import { api } from '@/lib/api'`

## Environment Configuration

Required environment variables in `.env`:
```
VITE_API_URL=http://localhost:9001  # Backend API URL
NODE_ENV=development
```

Optional:
```
VITE_ERROR_TRACKING_ENDPOINT=...  # Error tracking endpoint
```

## Deployment

The project auto-deploys to Hetzner on push to `main` branch via GitHub Actions. The workflow:
1. Checks out both `smart-memory-admin` and `smart-memory-infra` repos
2. Uses Python/uv to run deployment scripts from smart-memory-infra
3. Deploys to server at 135.181.102.1:/opt/smartmemory

Manual deployment trigger: Use GitHub Actions workflow dispatch

## Development Guidelines

### Adding New API Endpoints
1. Add method to SuperAdminAPI class in `src/lib/api.js`
2. Follow existing pattern with error tracking integration
3. Use proper HTTP methods (GET for reads, POST/PUT for writes, DELETE for deletions)

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/pages/index.jsx`
3. Add navigation item in `src/pages/Layout.jsx` navigation array
4. Wrap route with `ProtectedLayout` component

### Styling Guidelines
- Use TailwindCSS utility classes for styling
- Reference theme colors via HSL variables (e.g., `bg-primary`, `text-foreground`)
- Use existing UI components from `src/components/ui/` whenever possible
- Custom admin theme color available as `admin` color in Tailwind config

### Error Handling
- All API errors are automatically tracked via errorTracker
- Use ErrorBoundary for component-level error handling
- Toast notifications (sonner) should be used for user-facing error messages
- Console errors in development, sent to backend in production (if VITE_ERROR_TRACKING_ENDPOINT set)

## Common Patterns

### Fetching Data in Pages
```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      const result = await api.someMethod();
      setData(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

### Using Protected Routes
All authenticated pages automatically get `user`, `logout`, `isAuthenticated`, and `isSuperadmin` from AuthContext via useAuth hook.

### Form Handling
Use React Hook Form with Zod for form validation. See existing pages for examples.
