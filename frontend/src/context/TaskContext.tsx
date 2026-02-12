import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useGuestData, GuestTask, GuestProject, GuestPomodoro } from '../hooks/useLocalStorage'

interface Task {
  id: string
  title: string
  project_id?: string
  project_name?: string
  completed: boolean
  estimated_pomodoros: number
  actual_pomodoros: number
}

interface Project {
  id: string
  name: string
  color: string
  completed: boolean
}

interface TaskContextType {
  tasks: Task[]
  projects: Project[]
  activeTask: Task | null
  todayPomodoros: number
  pomodoros: GuestPomodoro[]
  guestTasks: GuestTask[]
  guestProjects: GuestProject[]
  
  addTask: (title: string, projectId?: string, estimate?: number) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  setActiveTask: (task: Task | null) => void
  
  addProject: (name: string, color?: string) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  
  recordPomodoro: (interrupted: boolean) => void
}

const TaskContext = createContext<TaskContextType | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const guestData = useGuestData()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Convert guest data to standard format
  const tasks: Task[] = guestData.tasks.map((t: GuestTask) => ({
    id: t.id,
    title: t.title,
    project_id: t.projectId,
    project_name: guestData.projects.find((p: GuestProject) => p.id === t.projectId)?.name,
    completed: t.completed,
    estimated_pomodoros: t.estimatedPomodoros,
    actual_pomodoros: t.actualPomodoros,
  }))

  const projects: Project[] = guestData.projects.map((p: GuestProject) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    completed: p.completed,
  }))

  const addTask = useCallback((title: string, projectId?: string, estimate = 1) => {
    guestData.addTask(title, projectId, estimate)
  }, [guestData])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    guestData.updateTask(id, {
      title: updates.title,
      projectId: updates.project_id,
      completed: updates.completed,
      estimatedPomodoros: updates.estimated_pomodoros,
    })
  }, [guestData])

  const deleteTask = useCallback((id: string) => {
    guestData.deleteTask(id)
    if (activeTask?.id === id) {
      setActiveTask(null)
    }
  }, [guestData, activeTask])

  const addProject = useCallback((name: string, color?: string) => {
    guestData.addProject(name, color)
  }, [guestData])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    guestData.updateProject(id, updates)
  }, [guestData])

  const deleteProject = useCallback((id: string) => {
    guestData.deleteProject(id)
  }, [guestData])

  const recordPomodoro = useCallback((interrupted: boolean) => {
    guestData.recordPomodoro(activeTask?.id, interrupted)
  }, [guestData, activeTask])

  // Clear active task if it gets completed
  useEffect(() => {
    if (activeTask) {
      const task = tasks.find(t => t.id === activeTask.id)
      if (!task || task.completed) {
        setActiveTask(null)
      }
    }
  }, [tasks, activeTask])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        activeTask,
        todayPomodoros: guestData.todayPomodoros,
        pomodoros: guestData.pomodoros,
        guestTasks: guestData.tasks,
        guestProjects: guestData.projects,
        addTask,
        updateTask,
        deleteTask,
        setActiveTask,
        addProject,
        updateProject,
        deleteProject,
        recordPomodoro,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider')
  return ctx
}
