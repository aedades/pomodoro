# Testing Guide

## Backend Tests

### Running Tests
```bash
cd backend
go test -v ./...
```

### With Coverage
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### Test Structure

Tests follow Go idioms:
- **Table-driven tests** for multiple scenarios
- **Test files** alongside source (`foo_test.go` next to `foo.go`)
- **Package-level tests** in `*_test` package for black-box testing

### Current Test Coverage

| Package | Coverage | Tests |
|---------|----------|-------|
| `internal/domain` | ~90% | Entity validation, business rules |
| `internal/service` | TBD | Use case orchestration |
| `internal/http` | TBD | Handler integration tests |
| `internal/postgres` | TBD | Repository integration tests |

### Example: Domain Test
```go
func TestNewPomodoro(t *testing.T) {
    tests := []struct {
        name            string
        durationMinutes int
        wantErr         error
    }{
        {"valid 25 min", 25, nil},
        {"invalid 0 min", 0, ErrInvalidDuration},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := NewPomodoro("user-1", nil, tt.durationMinutes)
            if err != tt.wantErr {
                t.Errorf("got %v, want %v", err, tt.wantErr)
            }
        })
    }
}
```

## Frontend Tests

### Running Tests
```bash
cd frontend
npm test
```

### Test Structure

- **Unit tests**: Component logic
- **Integration tests**: User flows
- **E2E tests**: Full browser testing (future)

### Example: Timer Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'

test('timer starts and decrements', () => {
  const { result } = renderHook(() => useTimer({
    settings: defaultSettings,
    onComplete: jest.fn()
  }))
  
  act(() => result.current.toggle())
  expect(result.current.isRunning).toBe(true)
})
```

## CI Pipeline

Tests run automatically on:
- All pull requests
- Pushes to `main` branch

See `.github/workflows/ci.yml` for configuration.

## Writing Good Tests

### Do
- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused (one assertion per test)
- Use table-driven tests for variations

### Don't
- Test private functions directly
- Mock what you don't own
- Write flaky tests
- Skip error cases
