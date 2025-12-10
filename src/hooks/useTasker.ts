'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskList, Tag, AppState, FilterOptions, SortOptions, Priority } from '@/types';
import { storage, taskUtils } from '@/lib/storage';

export function useTasker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('inbox');
  const [filter, setFilter] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'order', direction: 'asc' });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedTasks = storage.getTasks();
        const storedLists = storage.getLists();
        const storedTags = storage.getTags();
        const storedAppState = storage.getAppState();

        setTasks(storedTasks);
        setLists(storedLists);
        setTags(storedTags);
        setSelectedListId(storedAppState.selectedListId || 'inbox');
        setFilter(storedAppState.filter || {});
        setSort(storedAppState.sort || { field: 'order', direction: 'asc' });
        setTheme(storedAppState.theme || 'light');
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save app state when it changes
  useEffect(() => {
    if (!isLoading) {
      storage.setAppState({
        selectedListId,
        filter,
        sort,
        theme,
      });
    }
  }, [selectedListId, filter, sort, theme, isLoading]);

  // Task operations
  const addTask = useCallback((title: string, listId?: string, parentId?: string, additionalProps?: Partial<Task>) => {
    const newTask = { 
      ...taskUtils.createTask(title, listId || selectedListId, parentId),
      ...additionalProps
    };
    
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, newTask];
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });
    
    return newTask;
  }, [selectedListId]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, ...updates, updatedAt: new Date() };
          
          // Update subtasks if they exist
          if (task.subtasks.length > 0) {
            updatedTask.subtasks = task.subtasks.map(subtask => ({
              ...subtask,
              listId: updatedTask.listId, // Keep subtasks in same list as parent
            }));
          }
          
          return updatedTask;
        }
        
        // Update subtasks
        if (task.subtasks.some(subtask => subtask.id === taskId)) {
          return {
            ...task,
            subtasks: task.subtasks.map(subtask =>
              subtask.id === taskId
                ? { ...subtask, ...updates, updatedAt: new Date() }
                : subtask
            ),
            updatedAt: new Date(),
          };
        }
        
        return task;
      });
      
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks
        .filter(task => task.id !== taskId && task.parentId !== taskId)
        .map(task => ({
          ...task,
          subtasks: task.subtasks.filter(subtask => subtask.id !== taskId),
        }));
      
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: !task.completed, updatedAt: new Date() };
        }
        
        // Handle subtasks
        if (task.subtasks.some(subtask => subtask.id === taskId)) {
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === taskId
              ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
              : subtask
          );
          
          return {
            ...task,
            subtasks: updatedSubtasks,
            updatedAt: new Date(),
          };
        }
        
        return task;
      });
      
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });
  }, []);

  const addSubtask = useCallback((parentId: string, title: string) => {
    const parentTask = tasks.find(task => task.id === parentId);
    if (!parentTask) return null;

    const newSubtask = taskUtils.createTask(title, parentTask.listId, parentId);
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
            updatedAt: new Date(),
          };
        }
        return task;
      });
      
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });
    
    return newSubtask;
  }, [tasks]);

  // List operations
  const addList = useCallback((name: string, color?: string) => {
    const newList = taskUtils.createList(name, color);
    
    setLists(prevLists => {
      const updatedLists = [...prevLists, newList];
      storage.setLists(updatedLists);
      return updatedLists;
    });
    
    return newList;
  }, []);

  const updateList = useCallback((listId: string, updates: Partial<TaskList>) => {
    setLists(prevLists => {
      const updatedLists = prevLists.map(list =>
        list.id === listId
          ? { ...list, ...updates, updatedAt: new Date() }
          : list
      );
      
      storage.setLists(updatedLists);
      return updatedLists;
    });
  }, []);

  const deleteList = useCallback((listId: string) => {
    // Move tasks to inbox before deleting list
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.listId === listId
          ? { ...task, listId: 'inbox', updatedAt: new Date() }
          : task
      );
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });

    setLists(prevLists => {
      const updatedLists = prevLists.filter(list => list.id !== listId);
      storage.setLists(updatedLists);
      return updatedLists;
    });

    // Switch to inbox if current list is deleted
    if (selectedListId === listId) {
      setSelectedListId('inbox');
    }
  }, [selectedListId]);

  // Tag operations
  const addTag = useCallback((name: string, color?: string) => {
    const newTag = taskUtils.createTag(name, color);
    
    setTags(prevTags => {
      const updatedTags = [...prevTags, newTag];
      storage.setTags(updatedTags);
      return updatedTags;
    });
    
    return newTag;
  }, []);

  const updateTag = useCallback((tagId: string, updates: Partial<Tag>) => {
    setTags(prevTags => {
      const updatedTags = prevTags.map(tag =>
        tag.id === tagId ? { ...tag, ...updates } : tag
      );
      
      storage.setTags(updatedTags);
      return updatedTags;
    });
  }, []);

  const deleteTag = useCallback((tagId: string) => {
    // Remove tag from all tasks
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => ({
        ...task,
        tags: task.tags.filter(id => id !== tagId),
        subtasks: task.subtasks.map(subtask => ({
          ...subtask,
          tags: subtask.tags.filter(id => id !== tagId),
        })),
        updatedAt: new Date(),
      }));
      storage.setTasks(updatedTasks);
      return updatedTasks;
    });

    setTags(prevTags => {
      const updatedTags = prevTags.filter(tag => tag.id !== tagId);
      storage.setTags(updatedTags);
      return updatedTags;
    });
  }, []);

  // Theme operations
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // Filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Don't show subtasks as top-level tasks
      if (task.parentId) return false;
      
      // List filter
      if (selectedListId && selectedListId !== 'all') {
        if (selectedListId === 'today') {
          const today = new Date();
          // Show tasks that are either assigned to 'today' list OR have today's due date
          const isAssignedToToday = task.listId === 'today';
          const hasTodayDueDate = task.dueDate && (() => {
            const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
            return dueDate.getDate() === today.getDate() &&
              dueDate.getMonth() === today.getMonth() &&
              dueDate.getFullYear() === today.getFullYear();
          })();
          
          if (!isAssignedToToday && !hasTodayDueDate) return false;
        } else if (selectedListId === 'upcoming') {
          const today = new Date();
          // Show tasks that are either assigned to 'upcoming' list OR have future due dates
          const isAssignedToUpcoming = task.listId === 'upcoming';
          const hasFutureDueDate = task.dueDate && (() => {
            const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
            return dueDate > today;
          })();
          
          if (!isAssignedToUpcoming && !hasFutureDueDate) return false;
        } else {
          if (task.listId !== selectedListId) return false;
        }
      }
      
      // Additional filters
      if (filter.completed !== undefined && task.completed !== filter.completed) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tagId => task.tags.includes(tagId));
        if (!hasMatchingTag) return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      
      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { none: 0, low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = a.dueDate?.getTime() || Infinity;
          bValue = b.dueDate?.getTime() || Infinity;
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'order':
        default:
          aValue = a.order;
          bValue = b.order;
          break;
      }
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, selectedListId, filter, sort]);

  return {
    // State
    tasks,
    lists,
    tags,
    selectedListId,
    filter,
    sort,
    theme,
    isLoading,
    
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addSubtask,
    
    // List operations
    addList,
    updateList,
    deleteList,
    
    // Tag operations
    addTag,
    updateTag,
    deleteTag,
    
    // App operations
    setSelectedListId,
    setFilter,
    setSort,
    toggleTheme,
    
    // Computed values
    filteredTasks,
  };
}