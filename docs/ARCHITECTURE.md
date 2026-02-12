# Architecture

## Overview

Pomodoro Timer is a full-stack application built with a domain-driven design approach.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Database      │
│   (React)       │     │   (Go)          │     │   (PostgreSQL)  │
│                 │     │                 │     │                 │
│   - Timer UI    │     │   - REST API    │     │   - Users       │
│   - Task List   │     │   - Auth        │     │   - Tasks       │
│   - Settings    │     │   - Business    │     │   - Projects    │
│                 │     │     Logic       │     │   - Pomodoros   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Firebase              Cloud Run              Cloud SQL
     Hosting
```

## Backend Architecture

The backend follows a simplified Domain-Driven Design pattern:

```
backend/
├── cmd/server/           # Application entry point
├── internal/
│   ├── domain/           # Core business logic (no dependencies)
│   │   ├── pomodoro.go   # Pomodoro entity
│   │   ├── task.go       # Task entity  
│   │   ├── project.go    # Project entity
│   │   └── user.go       # User & settings
│   ├── repository/       # Interface definitions (ports)
│   │   └── interfaces.go # Repository contracts
│   ├── postgres/         # Database implementation (adapter)
│   │   └── *.go          # PostgreSQL repositories
│   ├── service/          # Application layer (use cases)
│   │   └── *.go          # Business operations
│   └── http/             # HTTP handlers (adapter)
│       ├── router.go     # Route definitions
│       └── *_handler.go  # Request handlers
└── migrations/           # Database schema
```

### Design Principles

1. **Domain Layer is Pure**
   - No external dependencies
   - Contains all business rules
   - Easy to test in isolation

2. **Dependency Inversion**
   - Service layer depends on repository interfaces, not implementations
   - Allows swapping PostgreSQL for any other storage

3. **Hexagonal Architecture (Ports & Adapters)**
   - Ports: Repository interfaces
   - Adapters: PostgreSQL implementation, HTTP handlers

## Frontend Architecture

```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── Timer.tsx     # Main timer display
│   │   ├── TaskList.tsx  # Task management
│   │   └── Header.tsx    # Navigation & settings
│   ├── hooks/            # Custom React hooks
│   │   ├── useTimer.ts   # Timer logic
│   │   ├── useAuth.ts    # Authentication state
│   │   └── useSettings.ts # User preferences
│   ├── context/          # React context
│   │   └── TaskContext.tsx # Global task state
│   └── version.ts        # App version
└── dist/                 # Production build
```

### State Management

- **Guest Mode**: All state in localStorage (no backend needed)
- **Authenticated Mode**: State synced with backend API
- **Settings**: Persisted locally, synced when authenticated

## Data Flow

### Guest Mode (No Auth)
```
User Action → React State → localStorage
                ↓
            UI Update
```

### Authenticated Mode
```
User Action → React State → API Call → Database
                ↓              ↓
            UI Update    State Sync
```

## Infrastructure

### GCP Resources (Terraform)

| Resource | Purpose |
|----------|---------|
| Cloud Run | Backend API hosting |
| Cloud SQL | PostgreSQL database |
| Artifact Registry | Container images |
| Secret Manager | Sensitive configuration |
| Firebase Hosting | Frontend static files |
| VPC | Private networking |

### CI/CD Pipeline

```
Push to main
     │
     ├──▶ Run Tests (ci.yml)
     │
     ├──▶ Terraform Apply (deploy-infra.yml)
     │         [if infra/ changed]
     │
     └──▶ Build & Deploy (deploy-app.yml)
               [if backend/ or frontend/ changed]
               │
               ├──▶ Run Migrations
               ├──▶ Build Container
               ├──▶ Deploy to Cloud Run
               └──▶ Deploy to Firebase
```

## Security

- **Authentication**: Google OAuth 2.0
- **Authorization**: JWT tokens with 7-day expiry
- **Secrets**: Stored in GCP Secret Manager
- **Database**: Private IP, VPC-only access
- **HTTPS**: Enforced on all endpoints
