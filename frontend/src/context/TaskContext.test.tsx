import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskProvider, useTaskContext } from './TaskContext';

// Test component that uses the context
function TestComponent() {
  const {
    tasks,
    projects,
    activeTask,
    todayPomodoros,
    addTask,
    deleteTask,
    updateTask,
    setActiveTask,
    addProject,
    deleteProject,
  } = useTaskContext();

  return (
    <div>
      <div data-testid="task-count">{tasks.length}</div>
      <div data-testid="project-count">{projects.length}</div>
      <div data-testid="active-task">{activeTask?.title || 'none'}</div>
      <div data-testid="today-pomodoros">{todayPomodoros}</div>

      <button onClick={() => addTask('New Task')}>Add Task</button>
      <button onClick={() => addTask('Project Task', projects[0]?.id)}>
        Add Task to Project
      </button>
      <button onClick={() => addProject('New Project', '#ff0000')}>
        Add Project
      </button>

      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          <span>{task.title}</span>
          <button onClick={() => setActiveTask(task)}>Select</button>
          <button onClick={() => updateTask(task.id, { completed: true })}>
            Complete
          </button>
          <button onClick={() => deleteTask(task.id)}>Delete</button>
        </div>
      ))}

      {projects.map((project) => (
        <div key={project.id} data-testid={`project-${project.id}`}>
          <span>{project.name}</span>
          <button onClick={() => deleteProject(project.id)}>
            Delete Project
          </button>
        </div>
      ))}
    </div>
  );
}

describe('TaskContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial empty state', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
    expect(screen.getByTestId('project-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-task')).toHaveTextContent('none');
    expect(screen.getByTestId('today-pomodoros')).toHaveTextContent('0');
  });

  it('adds a task', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('deletes a task', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('completes a task', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Complete'));

    // Task should still exist but be completed
    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('sets active task', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Select'));

    expect(screen.getByTestId('active-task')).toHaveTextContent('New Task');
  });

  it('adds a project', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Project'));

    expect(screen.getByTestId('project-count')).toHaveTextContent('1');
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('deletes a project', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByTestId('project-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Delete Project'));
    expect(screen.getByTestId('project-count')).toHaveTextContent('0');
  });

  it('adds task to project', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    // First add a project
    fireEvent.click(screen.getByText('Add Project'));

    // Then add a task to that project
    fireEvent.click(screen.getByText('Add Task to Project'));

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('persists tasks to localStorage', () => {
    const { unmount } = render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));
    unmount();

    // Render again and check persistence
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
  });

  it('persists projects to localStorage', () => {
    const { unmount } = render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Project'));
    unmount();

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    expect(screen.getByTestId('project-count')).toHaveTextContent('1');
  });

  it('clears active task when task is deleted', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    fireEvent.click(screen.getByText('Add Task'));
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByTestId('active-task')).toHaveTextContent('New Task');

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('active-task')).toHaveTextContent('none');
  });
});
