export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  listId: string;
  parentId?: string; // For subtasks
  tags: string[]; // Array of tag IDs
  subtasks: Task[];
  order: number;
}

export interface FilterOptions {
  listId?: string;
  priority?: Priority;
  completed?: boolean;
  tags?: string[];
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

export interface SortOptions {
  field: 'title' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'order';
  direction: 'asc' | 'desc';
}

export interface AppState {
  tasks: Task[];
  lists: TaskList[];
  tags: Tag[];
  selectedListId?: string;
  filter: FilterOptions;
  sort: SortOptions;
  theme: 'light' | 'dark';
}

export interface ParsedTaskInput {
  title: string;
  priority?: Priority;
  dueDate?: Date;
  tags?: string[];
  listId?: string;
}