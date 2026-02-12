import { useState } from 'react'
import { useTaskContext } from '../context/TaskContext'

export default function TaskList() {
  const { 
    tasks, 
    projects,
    activeTask, 
    setActiveTask, 
    addTask,
    updateTask,
    deleteTask,
    addProject,
  } = useTaskContext()
  
  const [newTask, setNewTask] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [showProjectInput, setShowProjectInput] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const handleAddTask = () => {
    if (!newTask.trim()) return
    addTask(newTask.trim(), selectedProject || undefined, 1)
    setNewTask('')
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    addProject(newProjectName.trim())
    setNewProjectName('')
    setShowProjectInput(false)
  }

  const toggleComplete = (task: typeof tasks[0]) => {
    updateTask(task.id, { completed: !task.completed })
  }

  const selectTask = (task: typeof tasks[0]) => {
    if (task.completed) return
    setActiveTask(activeTask?.id === task.id ? null : task)
  }

  const incompleteTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tasks</h2>
        {projects.length > 0 && (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-sm px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Add project button */}
      {!showProjectInput ? (
        <button
          onClick={() => setShowProjectInput(true)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 mb-4"
        >
          + Add Project
        </button>
      ) : (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
            placeholder="Project name..."
            autoFocus
            className="flex-1 px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleAddProject}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Add
          </button>
          <button
            onClick={() => setShowProjectInput(false)}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Active tasks */}
      <ul className="space-y-2">
        {incompleteTasks
          .filter(t => !selectedProject || t.project_id === selectedProject)
          .map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={activeTask?.id === task.id}
            onSelect={() => selectTask(task)}
            onToggle={() => toggleComplete(task)}
            onDelete={() => deleteTask(task.id)}
          />
        ))}
      </ul>

      {incompleteTasks.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-6">
          No tasks yet. Add one to get started!
        </p>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Completed ({completedTasks.length})
          </h3>
          <ul className="space-y-2">
            {completedTasks.slice(0, 5).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={false}
                onSelect={() => {}}
                onToggle={() => toggleComplete(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface Task {
  id: string
  title: string
  project_id?: string
  project_name?: string
  completed: boolean
  estimated_pomodoros: number
  actual_pomodoros: number
}

function TaskItem({
  task,
  isActive,
  onSelect,
  onToggle,
  onDelete,
}: {
  task: Task
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <li
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-500'
          : task.completed
          ? 'bg-gray-50 dark:bg-gray-700/50'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
      }`}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 dark:border-gray-500 hover:border-red-500'
        }`}
      >
        {task.completed && '✓'}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`block truncate ${
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-800 dark:text-gray-200'
          }`}
        >
          {task.title}
        </span>
        {task.project_name && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {task.project_name}
          </span>
        )}
      </div>

      <span className={`text-sm flex-shrink-0 ${
        task.actual_pomodoros > task.estimated_pomodoros 
          ? 'text-orange-500' 
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        🍅 {task.actual_pomodoros}/{task.estimated_pomodoros}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
      >
        ✕
      </button>
    </li>
  )
}
