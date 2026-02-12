import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  title: string;
  projectId: string | null;
  completed: boolean;
  estimatedPomodoros: number;
  actualPomodoros: number;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Settings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dailyGoal: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: boolean;
  flowModeEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dailyGoal: 8,
  autoStartBreaks: false,
  soundEnabled: true,
  vibrationEnabled: true,
  darkMode: true,
  flowModeEnabled: false,
};

export function useFirestore() {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // If Firebase isn't configured, return empty state
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !user) {
      setTasks([]);
      setProjects([]);
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    // Subscribe to tasks
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          projectId: data.projectId,
          completed: data.completed,
          estimatedPomodoros: data.estimatedPomodoros,
          actualPomodoros: data.actualPomodoros,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
        } as Task;
      });
      setTasks(tasksData);
      setLoading(false);
    });

    // Subscribe to projects
    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Project;
      });
      setProjects(projectsData);
    });

    // Subscribe to settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as Settings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeProjects();
      unsubscribeSettings();
    };
  }, [isAuthenticated, user]);

  // Task operations
  const addTask = useCallback(
    async (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
      if (!user || !db) return;
      const docRef = doc(collection(db, 'tasks'));
      await setDoc(docRef, {
        ...task,
        userId: user.uid,
        createdAt: serverTimestamp(),
        completedAt: null,
      });
      return docRef.id;
    },
    [user]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      if (!user || !db) return;
      const docRef = doc(db, 'tasks', taskId);
      await setDoc(docRef, updates, { merge: true });
    },
    [user]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user || !db) return;
      await deleteDoc(doc(db, 'tasks', taskId));
    },
    [user]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      if (!user || !db) return;
      await setDoc(
        doc(db, 'tasks', taskId),
        {
          completed: true,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user]
  );

  // Project operations
  const addProject = useCallback(
    async (project: Omit<Project, 'id' | 'createdAt'>) => {
      if (!user || !db) return;
      const docRef = doc(collection(db, 'projects'));
      await setDoc(docRef, {
        ...project,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [user]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user || !db) return;
      await deleteDoc(doc(db, 'projects', projectId));
    },
    [user]
  );

  // Settings operations
  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      if (!user || !db) return;
      await setDoc(doc(db, 'settings', user.uid), updates, { merge: true });
    },
    [user]
  );

  return {
    tasks,
    projects,
    settings,
    loading,
    isFirebaseConfigured,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addProject,
    deleteProject,
    updateSettings,
  };
}
