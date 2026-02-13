import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch,
  orderBy
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { GuestTask, GuestProject, GuestPomodoro } from './useLocalStorage'

/**
 * Firestore data hook - syncs data in real-time across devices.
 * Data structure: /users/{userId}/tasks, /users/{userId}/projects, /users/{userId}/pomodoros
 */
export function useFirestoreData(userId: string | null) {
  const [tasks, setTasks] = useState<GuestTask[]>([])
  const [projects, setProjects] = useState<GuestProject[]>([])
  const [pomodoros, setPomodoros] = useState<GuestPomodoro[]>([])
  const [todayPomodoros, setTodayPomodoros] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Real-time listeners
  useEffect(() => {
    if (!userId || !db || !isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Subscribe to tasks
    const tasksRef = collection(db, 'users', userId, 'tasks')
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestTask[]
      setTasks(data)
    }, (error) => {
      console.error('Tasks listener error:', error)
    })

    // Subscribe to projects
    const projectsRef = collection(db, 'users', userId, 'projects')
    const unsubProjects = onSnapshot(projectsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestProject[]
      setProjects(data)
    }, (error) => {
      console.error('Projects listener error:', error)
    })

    // Subscribe to today's pomodoros
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    const pomodorosRef = collection(db, 'users', userId, 'pomodoros')
    const pomodorosQuery = query(
      pomodorosRef,
      where('completedAt', '>=', todayISO),
      orderBy('completedAt', 'desc')
    )
    const unsubPomodoros = onSnapshot(pomodorosQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as GuestPomodoro[]
      setPomodoros(data)
      setTodayPomodoros(data.filter(p => !p.interrupted).length)
      setIsLoading(false)
    }, (error) => {
      console.error('Pomodoros listener error:', error)
      setIsLoading(false)
    })

    return () => {
      unsubTasks()
      unsubProjects()
      unsubPomodoros()
    }
  }, [userId])

  const generateId = () => crypto.randomUUID()

  const addTask = useCallback(async (title: string, projectId?: string, estimatedPomodoros = 1, dueDate?: string) => {
    console.log('[Firestore] addTask called:', { userId, hasDb: !!db, title })
    if (!userId || !db) {
      console.warn('[Firestore] addTask early return - userId:', userId, 'db:', !!db)
      return null
    }
    
    // Firestore doesn't accept undefined values, so only include defined fields
    const now = new Date().toISOString()
    const newTask: GuestTask = {
      id: generateId(),
      title,
      completed: false,
      estimatedPomodoros,
      actualPomodoros: 0,
      createdAt: now,
      updatedAt: now,
    }
    // Only add optional fields if they're defined
    if (projectId !== undefined) newTask.projectId = projectId
    if (dueDate !== undefined) newTask.dueDate = dueDate

    try {
      console.log('[Firestore] Writing task to:', `users/${userId}/tasks/${newTask.id}`)
      await setDoc(doc(db, 'users', userId, 'tasks', newTask.id), newTask)
      console.log('[Firestore] Task written successfully:', newTask.id)
      return newTask
    } catch (error) {
      console.error('[Firestore] Error adding task:', error)
      return null
    }
  }, [userId])

  const updateTask = useCallback(async (id: string, updates: Partial<GuestTask>) => {
    if (!userId || !db) return

    // Filter out undefined values - Firestore doesn't accept them
    // Always set updatedAt on any update
    const cleanUpdates = Object.fromEntries(
      Object.entries({ ...updates, updatedAt: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )

    try {
      await setDoc(doc(db, 'users', userId, 'tasks', id), cleanUpdates, { merge: true })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }, [userId])

  const deleteTask = useCallback(async (id: string) => {
    if (!userId || !db) return

    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }, [userId])

  const addProject = useCallback(async (name: string, color = '#6366f1') => {
    if (!userId || !db) return null

    const now = new Date().toISOString()
    const newProject: GuestProject = {
      id: generateId(),
      name,
      color,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await setDoc(doc(db, 'users', userId, 'projects', newProject.id), newProject)
      return newProject
    } catch (error) {
      console.error('Error adding project:', error)
      return null
    }
  }, [userId])

  const updateProject = useCallback(async (id: string, updates: Partial<GuestProject>) => {
    if (!userId || !db) return

    // Filter out undefined values - Firestore doesn't accept them
    // Always set updatedAt on any update
    const cleanUpdates = Object.fromEntries(
      Object.entries({ ...updates, updatedAt: new Date().toISOString() }).filter(([_, v]) => v !== undefined)
    )

    try {
      await setDoc(doc(db, 'users', userId, 'projects', id), cleanUpdates, { merge: true })
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }, [userId])

  const deleteProject = useCallback(async (id: string) => {
    if (!userId || !db) return

    try {
      await deleteDoc(doc(db, 'users', userId, 'projects', id))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }, [userId])

  const recordPomodoro = useCallback(async (taskId?: string, interrupted = false) => {
    if (!userId || !db) return

    const newPomodoro: GuestPomodoro = {
      id: generateId(),
      taskId,
      durationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      interrupted,
    }

    try {
      await setDoc(doc(db, 'users', userId, 'pomodoros', newPomodoro.id), newPomodoro)
      
      // Also increment task's actualPomodoros
      if (taskId && !interrupted) {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          await setDoc(
            doc(db, 'users', userId, 'tasks', taskId), 
            { actualPomodoros: task.actualPomodoros + 1 }, 
            { merge: true }
          )
        }
      }
    } catch (error) {
      console.error('Error recording pomodoro:', error)
    }
  }, [userId, tasks])

  const reorderTasks = useCallback(async (taskIds: string[]) => {
    if (!userId || !db) return
    
    const firestore = db // Store after null check for TypeScript

    try {
      const batch = writeBatch(firestore)
      taskIds.forEach((id, index) => {
        const ref = doc(firestore, 'users', userId, 'tasks', id)
        batch.update(ref, { sortOrder: index })
      })
      await batch.commit()
    } catch (error) {
      console.error('Error reordering tasks:', error)
    }
  }, [userId])

  return {
    tasks,
    projects,
    pomodoros,
    todayPomodoros,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    recordPomodoro,
    reorderTasks,
  }
}

/**
 * Merge localStorage data into Firestore on sign-in.
 * - Adds items that don't exist in Firestore
 * - For items that exist in both, keeps the one with later updatedAt timestamp
 */
export async function mergeLocalToFirestore(
  localData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  existingData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  userId: string
): Promise<{ added: { tasks: number; projects: number; pomodoros: number }; updated: { tasks: number; projects: number } }> {
  if (!db || !isFirebaseConfigured) {
    console.error('Firebase not configured')
    return { added: { tasks: 0, projects: 0, pomodoros: 0 }, updated: { tasks: 0, projects: 0 } }
  }

  const firestore = db
  
  // Build maps of existing items by ID
  const existingTaskMap = new Map(existingData.tasks.map(t => [t.id, t]))
  const existingProjectMap = new Map(existingData.projects.map(p => [p.id, p]))
  const existingPomodoroIds = new Set(existingData.pomodoros.map(p => p.id))
  
  // Separate into new items and items needing conflict resolution
  const newTasks: GuestTask[] = []
  const updatedTasks: GuestTask[] = []
  for (const localTask of localData.tasks) {
    const existing = existingTaskMap.get(localTask.id)
    if (!existing) {
      newTasks.push(localTask)
    } else {
      // Conflict: compare timestamps, keep newer
      const localTime = new Date(localTask.updatedAt || localTask.createdAt).getTime()
      const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime()
      if (localTime > existingTime) {
        updatedTasks.push(localTask)
      }
    }
  }
  
  const newProjects: GuestProject[] = []
  const updatedProjects: GuestProject[] = []
  for (const localProject of localData.projects) {
    const existing = existingProjectMap.get(localProject.id)
    if (!existing) {
      newProjects.push(localProject)
    } else {
      // Conflict: compare timestamps, keep newer
      const localTime = new Date(localProject.updatedAt || localProject.createdAt).getTime()
      const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime()
      if (localTime > existingTime) {
        updatedProjects.push(localProject)
      }
    }
  }
  
  const newPomodoros = localData.pomodoros.filter(p => !existingPomodoroIds.has(p.id)).slice(0, 500)

  console.log('[Merge] For user:', userId)
  console.log('[Merge] New tasks:', newTasks.length, '| Updated tasks:', updatedTasks.length)
  console.log('[Merge] New projects:', newProjects.length, '| Updated projects:', updatedProjects.length)
  console.log('[Merge] New pomodoros:', newPomodoros.length)

  const totalChanges = newTasks.length + updatedTasks.length + newProjects.length + updatedProjects.length + newPomodoros.length
  if (totalChanges === 0) {
    console.log('[Merge] Nothing to merge')
    return { added: { tasks: 0, projects: 0, pomodoros: 0 }, updated: { tasks: 0, projects: 0 } }
  }

  try {
    const batch = writeBatch(firestore)

    for (const task of [...newTasks, ...updatedTasks]) {
      const ref = doc(firestore, 'users', userId, 'tasks', task.id)
      batch.set(ref, task)
    }

    for (const project of [...newProjects, ...updatedProjects]) {
      const ref = doc(firestore, 'users', userId, 'projects', project.id)
      batch.set(ref, project)
    }

    for (const pomo of newPomodoros) {
      const ref = doc(firestore, 'users', userId, 'pomodoros', pomo.id)
      batch.set(ref, pomo)
    }

    await batch.commit()
    console.log('[Merge] Complete!')
    return { 
      added: { tasks: newTasks.length, projects: newProjects.length, pomodoros: newPomodoros.length },
      updated: { tasks: updatedTasks.length, projects: updatedProjects.length }
    }
  } catch (error) {
    console.error('[Merge] Failed:', error)
    return { added: { tasks: 0, projects: 0, pomodoros: 0 }, updated: { tasks: 0, projects: 0 } }
  }
}

/**
 * @deprecated Use mergeLocalToFirestore instead
 */
export async function migrateLocalToFirestore(
  localData: {
    tasks: GuestTask[]
    projects: GuestProject[]
    pomodoros: GuestPomodoro[]
  },
  userId: string
): Promise<boolean> {
  // For backward compatibility, treat as merge with empty existing data
  const result = await mergeLocalToFirestore(localData, { tasks: [], projects: [], pomodoros: [] }, userId)
  return result.added.tasks > 0 || result.added.projects > 0 || result.added.pomodoros > 0
}

/**
 * Clear local storage after successful migration.
 * Uses same keys as useGuestData hook: 'pomodoro:guest:*'
 */
export function clearLocalData(): void {
  localStorage.removeItem('pomodoro:guest:tasks')
  localStorage.removeItem('pomodoro:guest:projects')
  localStorage.removeItem('pomodoro:guest:pomodoros')
  console.log('Local data cleared after migration')
}

/**
 * Save Firestore data to localStorage on sign-out.
 * This preserves user data locally so they can continue without signing in.
 * Uses same keys as useGuestData hook: 'pomodoro:guest:*'
 */
export function saveToLocalStorage(data: {
  tasks: GuestTask[]
  projects: GuestProject[]
  pomodoros: GuestPomodoro[]
}): void {
  console.log('Saving Firestore data to localStorage on sign-out')
  console.log('Tasks:', data.tasks.length)
  console.log('Projects:', data.projects.length)
  console.log('Pomodoros:', data.pomodoros.length)
  
  // Use same keys as useGuestData hook
  localStorage.setItem('pomodoro:guest:tasks', JSON.stringify(data.tasks))
  localStorage.setItem('pomodoro:guest:projects', JSON.stringify(data.projects))
  localStorage.setItem('pomodoro:guest:pomodoros', JSON.stringify(data.pomodoros))
  
  console.log('Data saved to localStorage')
}
