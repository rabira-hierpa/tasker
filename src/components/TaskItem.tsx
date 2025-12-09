'use client';

import { useState } from 'react';
import { Task, Priority } from '@/types';
import { useTasker } from '@/hooks/useTasker';

interface TaskItemProps {
  task: Task;
  isSubtask?: boolean;
}

export default function TaskItem({ task, isSubtask = false }: TaskItemProps) {
  const { 
    tags, 
    lists, 
    updateTask, 
    deleteTask, 
    toggleTaskComplete, 
    addSubtask 
  } = useTasker();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const priorityColors = {
    none: 'text-base-content',
    low: 'text-info',
    medium: 'text-warning',
    high: 'text-error',
  };

  const priorityIcons = {
    none: '',
    low: '🔵',
    medium: '🟡',
    high: '🔴',
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
    }
  };

  const formatDueDate = (date: Date | string) => {
    // Ensure we have a proper Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  const isOverdue = task.dueDate && 
    (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)) < new Date() && 
    !task.completed;

  return (
    <div className={`task-item ${isSubtask ? 'ml-8' : ''}`}>
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={() => toggleTaskComplete(task.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-primary border-primary text-primary-content'
              : 'border-base-300 hover:border-primary'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              className="input input-ghost w-full p-0 h-auto min-h-0 text-base"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={`cursor-text text-base ${
                task.completed ? 'line-through text-base-content/50' : 'text-base-content'
              }`}
            >
              {task.title}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 text-sm">
            {/* Priority */}
            {task.priority !== 'none' && (
              <span className={`flex items-center gap-1 ${priorityColors[task.priority]}`}>
                {priorityIcons[task.priority]}
                {task.priority}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${
                isOverdue ? 'text-error' : 'text-base-content/70'
              }`}>
                📅 {formatDueDate(task.dueDate)}
              </span>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {task.tags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tag.id}
                      className="tag"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* List (for subtasks) */}
            {isSubtask && (
              <span className="text-base-content/50 text-xs">
                {lists.find(l => l.id === task.listId)?.name}
              </span>
            )}
          </div>

          {/* Subtasks */}
          {!isSubtask && task.subtasks.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${showSubtasks ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                ({task.subtasks.filter(st => st.completed).length} completed)
              </button>
              
              {showSubtasks && (
                <div className="mt-2">
                  {task.subtasks.map(subtask => (
                    <TaskItem key={subtask.id} task={subtask} isSubtask />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Subtask */}
          {!isSubtask && (
            <div className="mt-3">
              {showAddSubtask ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') {
                        setShowAddSubtask(false);
                        setNewSubtaskTitle('');
                      }
                    }}
                    className="input input-sm flex-1"
                    autoFocus
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="btn btn-primary btn-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubtask(false);
                      setNewSubtaskTitle('');
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSubtask(true)}
                  className="text-sm text-base-content/50 hover:text-base-content flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add subtask
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Priority selector */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
              {(['none', 'low', 'medium', 'high'] as Priority[]).map(priority => (
                <li key={priority}>
                  <a 
                    onClick={() => updateTask(task.id, { priority })}
                    className={task.priority === priority ? 'active' : ''}
                  >
                    {priorityIcons[priority]} {priority === 'none' ? 'No priority' : priority}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm('Delete this task?')) {
                deleteTask(task.id);
              }
            }}
            className="btn btn-ghost btn-xs text-error"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}