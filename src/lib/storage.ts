import { Task, TaskList, Tag, AppState } from '@/types';

const STORAGE_KEYS = {
  TASKS: 'tasker_tasks',
  LISTS: 'tasker_lists',
  TAGS: 'tasker_tags',
  APP_STATE: 'tasker_app_state',
} as const;

// Default data
const DEFAULT_LISTS: TaskList[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    color: '#0ea5e9',
    icon: '📥',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'today',
    name: 'Today',
    color: '#10b981',
    icon: '📅',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'upcoming',
    name: 'Upcoming',
    color: '#f59e0b',
    icon: '📆',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'work', name: 'Work', color: '#ef4444' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'urgent', name: 'Urgent', color: '#f59e0b' },
];

// Storage utilities
export const storage = {
  // Generic storage methods
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      
      // Convert date strings back to Date objects
      if (Array.isArray(parsed)) {
        return parsed.map(item => convertDates(item)) as T;
      } else if (typeof parsed === 'object' && parsed !== null) {
        return convertDates(parsed) as T;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  // Specific data methods
  getTasks(): Task[] {
    return this.get<Task[]>(STORAGE_KEYS.TASKS, []);
  },

  setTasks(tasks: Task[]): void {
    this.set(STORAGE_KEYS.TASKS, tasks);
  },

  getLists(): TaskList[] {
    const lists = this.get<TaskList[]>(STORAGE_KEYS.LISTS, []);
    return lists.length > 0 ? lists : DEFAULT_LISTS;
  },

  setLists(lists: TaskList[]): void {
    this.set(STORAGE_KEYS.LISTS, lists);
  },

  getTags(): Tag[] {
    const tags = this.get<Tag[]>(STORAGE_KEYS.TAGS, []);
    return tags.length > 0 ? tags : DEFAULT_TAGS;
  },

  setTags(tags: Tag[]): void {
    this.set(STORAGE_KEYS.TAGS, tags);
  },

  getAppState(): Partial<AppState> {
    return this.get<Partial<AppState>>(STORAGE_KEYS.APP_STATE, {
      selectedListId: 'inbox',
      filter: {},
      sort: { field: 'order', direction: 'asc' },
      theme: 'light',
    });
  },

  setAppState(state: Partial<AppState>): void {
    this.set(STORAGE_KEYS.APP_STATE, state);
  },

  // Export data
  exportData() {
    return {
      tasks: this.getTasks(),
      lists: this.getLists(),
      tags: this.getTags(),
      appState: this.getAppState(),
      exportedAt: new Date().toISOString(),
    };
  },

  // Import data
  importData(data: any): boolean {
    try {
      if (data.tasks) this.setTasks(data.tasks);
      if (data.lists) this.setLists(data.lists);
      if (data.tags) this.setTags(data.tags);
      if (data.appState) this.setAppState(data.appState);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => this.remove(key));
  },
};

// Helper function to convert date strings back to Date objects
function convertDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  }
  
  const converted = { ...obj };
  
  // Convert known date fields
  const dateFields = ['createdAt', 'updatedAt', 'dueDate'];
  dateFields.forEach(field => {
    if (converted[field] && typeof converted[field] === 'string') {
      converted[field] = new Date(converted[field]);
    }
  });
  
  // Recursively convert nested objects and arrays
  Object.keys(converted).forEach(key => {
    if (Array.isArray(converted[key])) {
      converted[key] = converted[key].map(convertDates);
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertDates(converted[key]);
    }
  });
  
  return converted;
}

// Utility functions for task operations
export const taskUtils = {
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  createTask(
    title: string,
    listId: string = 'inbox',
    parentId?: string
  ): Task {
    const now = new Date();
    return {
      id: this.generateId(),
      title: title.trim(),
      completed: false,
      priority: 'none',
      createdAt: now,
      updatedAt: now,
      listId,
      parentId,
      tags: [],
      subtasks: [],
      order: Date.now(),
    };
  },

  createList(name: string, color: string = '#0ea5e9'): TaskList {
    const now = new Date();
    return {
      id: this.generateId(),
      name: name.trim(),
      color,
      createdAt: now,
      updatedAt: now,
    };
  },

  createTag(name: string, color: string = '#64748b'): Tag {
    return {
      id: this.generateId(),
      name: name.trim(),
      color,
    };
  },
};