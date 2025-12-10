'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTasker } from '@/hooks/useTasker';

type TaskerContextType = ReturnType<typeof useTasker>;

const TaskerContext = createContext<TaskerContextType | null>(null);

export function TaskerProvider({ children }: { children: ReactNode }) {
  const taskerState = useTasker();
  
  return (
    <TaskerContext.Provider value={taskerState}>
      {children}
    </TaskerContext.Provider>
  );
}

export function useTaskerContext() {
  const context = useContext(TaskerContext);
  if (!context) {
    throw new Error('useTaskerContext must be used within a TaskerProvider');
  }
  return context;
}