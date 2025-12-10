'use client';

import { useState, useEffect, useRef } from 'react';
import { useTaskerContext } from '@/contexts/TaskerContext';
import { exportTasks } from '@/lib/export';

export default function Header() {
  const { 
    lists, 
    tags, 
    filteredTasks, 
    selectedListId, 
    filter, 
    setFilter, 
    sort, 
    setSort, 
    theme, 
    toggleTheme 
  } = useTaskerContext();
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart lists definition (should match Sidebar)
  const smartLists = [
    { id: 'inbox', name: 'Inbox', icon: '📥' },
    { id: 'today', name: 'Today', icon: '📅' },
    { id: 'upcoming', name: 'Upcoming', icon: '📆' },
  ];

  const selectedList = smartLists.find(list => list.id === selectedListId) || 
                      lists.find(list => list.id === selectedListId);
  const taskCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(task => task.completed).length;

  const handleExport = (format: 'markdown' | 'csv') => {
    exportTasks(filteredTasks, lists, tags, format, {
      includeCompleted: true,
      includeSubtasks: true,
      listId: selectedListId !== 'all' ? selectedListId : undefined,
    });
    setShowExportMenu(false);
  };

  const handleSortChange = (field: string) => {
    if (sort.field === field) {
      setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field: field as any, direction: 'asc' });
    }
  };

  return (
    <header className="border-b border-base-300 bg-base-100 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - List info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              {selectedList?.icon} {selectedList?.name || 'All Tasks'}
            </h1>
            <p className="text-sm text-base-content/70">
              {taskCount} tasks • {completedCount} completed
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="form-control">
            <input
              type="text"
              placeholder="Search tasks..."
              className="input input-bordered input-sm w-64"
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value || undefined })}
            />
          </div>

          {/* Filter dropdown */}
          <div className="dropdown dropdown-end" ref={filterRef}>
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filter
            </div>
            {showFilterMenu && (
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <label className="label cursor-pointer">
                    <span className="label-text">Show completed</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={filter.completed !== false}
                      onChange={(e) => setFilter({ 
                        ...filter, 
                        completed: e.target.checked ? undefined : false 
                      })}
                    />
                  </label>
                </li>
                <li>
                  <select
                    className="select select-sm w-full"
                    value={filter.priority || ''}
                    onChange={(e) => setFilter({ 
                      ...filter, 
                      priority: e.target.value || undefined 
                    })}
                  >
                    <option value="">All priorities</option>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                    <option value="none">No priority</option>
                  </select>
                </li>
              </ul>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
              </svg>
              Sort
            </div>
            <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={() => handleSortChange('order')}>
                  Order {sort.field === 'order' && (sort.direction === 'asc' ? '↑' : '↓')}
                </a>
              </li>
              <li>
                <a onClick={() => handleSortChange('title')}>
                  Title {sort.field === 'title' && (sort.direction === 'asc' ? '↑' : '↓')}
                </a>
              </li>
              <li>
                <a onClick={() => handleSortChange('priority')}>
                  Priority {sort.field === 'priority' && (sort.direction === 'asc' ? '↑' : '↓')}
                </a>
              </li>
              <li>
                <a onClick={() => handleSortChange('dueDate')}>
                  Due Date {sort.field === 'dueDate' && (sort.direction === 'asc' ? '↑' : '↓')}
                </a>
              </li>
              <li>
                <a onClick={() => handleSortChange('createdAt')}>
                  Created {sort.field === 'createdAt' && (sort.direction === 'asc' ? '↑' : '↓')}
                </a>
              </li>
            </ul>
          </div>

          {/* Export dropdown */}
          <div className="dropdown dropdown-end" ref={exportRef}>
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </div>
            {showExportMenu && (
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <a onClick={() => handleExport('markdown')}>
                    📄 Export as Markdown
                  </a>
                </li>
                <li>
                  <a onClick={() => handleExport('csv')}>
                    📊 Export as CSV
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Theme toggle */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          
          {/* Clear Storage Button (for debugging) */}
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            title="Clear all data and refresh"
          >
            🗑️
          </button>
        </div>
      </div>
    </header>
  );
}