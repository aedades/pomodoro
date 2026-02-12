# API Documentation

Base URL: `https://your-project.run.app/api/v1`

## Authentication

### Google OAuth Login
```http
POST /auth/google
Content-Type: application/json

{
  "access_token": "google-oauth-access-token"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://..."
  }
}
```

### Get Current User
```http
GET /me
Authorization: Bearer <token>
```

## Settings

### Get Settings
```http
GET /settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "daily_pomodoro_goal": 8,
  "auto_start_breaks": false,
  "dark_mode": false,
  "sound_enabled": true,
  "notifications_enabled": true,
  "work_duration_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}
```

### Update Settings
```http
PUT /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "daily_pomodoro_goal": 10,
  "auto_start_breaks": true
}
```

## Tasks

### List Tasks
```http
GET /tasks?project_id=<uuid>&completed=true
Authorization: Bearer <token>
```

### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Task name",
  "project_id": "uuid (optional)",
  "estimated_pomodoros": 3
}
```

### Update Task
```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated name",
  "completed": true,
  "estimated_pomodoros": 5
}
```

### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <token>
```

## Projects

### List Projects
```http
GET /projects?archived=true
Authorization: Bearer <token>
```

### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project name",
  "color": "#6366f1"
}
```

### Update Project
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated name",
  "completed": true
}
```

**Note:** Setting `completed: true` will auto-complete all tasks in the project.

### Delete Project
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

## Pomodoros

### List Pomodoros
```http
GET /pomodoros?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <token>
```

### Record Pomodoro
```http
POST /pomodoros
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_id": "uuid (optional)",
  "duration_minutes": 25,
  "interrupted": false,
  "notes": "Completed auth implementation"
}
```

### Get Statistics
```http
GET /pomodoros/stats?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_pomodoros": 42,
  "total_minutes": 1050,
  "completed_tasks": 12,
  "average_per_day": 6.0,
  "daily_goal": 8,
  "today_count": 5,
  "by_day": [
    {"date": "2026-01-01", "count": 8, "minutes": 200}
  ],
  "by_project": [
    {"project_id": "uuid", "project_name": "Work", "count": 20, "minutes": 500}
  ]
}
```

## Health Check

```http
GET /health
```

**Response:**
```json
{"status": "ok"}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error
