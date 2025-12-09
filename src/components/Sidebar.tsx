'use client';

import { useState } from 'react';
import { useTasker } from '@/hooks/useTasker';

export default function Sidebar() {
  const { 
    lists, 
    tags, 
    tasks, 
    selectedListId, 
    setSelectedListId, 
    addList, 
    updateList, 
    deleteList,
    addTag,
    updateTag,
    deleteTag
  } = useTasker();
  
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Calculate task counts for each list
  const getTaskCount = (listId: string) => {
    if (listId === 'today') {
      const today = new Date();
      return tasks.filter(task => {
        if (!task.parentId && task.dueDate) {
          const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
          return dueDate.getDate() === today.getDate() &&
                 dueDate.getMonth() === today.getMonth() &&
                 dueDate.getFullYear() === today.getFullYear();
        }
        return false;
      }).length;
    }
    
    if (listId === 'upcoming') {
      const today = new Date();
      return tasks.filter(task => {
        if (!task.parentId && task.dueDate) {
          const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
          return dueDate > today;
        }
        return false;
      }).length;
    }
    
    return tasks.filter(task => !task.parentId && task.listId === listId).length;
  };

  const handleAddList = () => {
    if (newListName.trim()) {
      addList(newListName.trim());
      setNewListName('');
      setShowNewListForm(false);
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim());
      setNewTagName('');
      setShowNewTagForm(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* App Header */}
      <div className="p-6 border-b border-base-300 bg-gradient-to-r from-primary/5 to-secondary/5">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Tasker
        </h1>
        <p className="text-sm text-base-content/70 mt-1">Your personal task manager</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Smart Lists */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-3">
            Smart Lists
          </h3>
          <div className="space-y-1">
            {[
              { id: 'inbox', name: 'Inbox', icon: '📥' },
              { id: 'today', name: 'Today', icon: '📅' },
              { id: 'upcoming', name: 'Upcoming', icon: '📆' },
            ].map((smartList) => (
              <button
                key={smartList.id}
                onClick={() => setSelectedListId(smartList.id)}
                className={`sidebar-item w-full text-left ${
                  selectedListId === smartList.id ? 'active' : ''
                }`}
              >
                <span className="text-lg">{smartList.icon}</span>
                <span className="flex-1">{smartList.name}</span>
                <span className="badge badge-ghost badge-sm">
                  {getTaskCount(smartList.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Lists */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
              Lists
            </h3>
            <button
              onClick={() => setShowNewListForm(true)}
              className="btn btn-ghost btn-xs"
              title="Add new list"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-1">
            {lists
              .filter(list => !['inbox', 'today', 'upcoming'].includes(list.id))
              .map((list) => (
                <div key={list.id} className="group">
                  <button
                    onClick={() => setSelectedListId(list.id)}
                    className={`sidebar-item w-full text-left ${
                      selectedListId === list.id ? 'active' : ''
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: list.color }}
                    />
                    <span className="flex-1">{list.name}</span>
                    <span className="badge badge-ghost badge-sm">
                      {getTaskCount(list.id)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${list.name}" list?`)) {
                          deleteList(list.id);
                        }
                      }}
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete list"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                </div>
              ))}
            
            {/* New List Form */}
            {showNewListForm && (
              <div className="p-3 bg-base-200 rounded-lg">
                <input
                  type="text"
                  placeholder="List name"
                  className="input input-sm w-full mb-2"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') {
                      setShowNewListForm(false);
                      setNewListName('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddList}
                    className="btn btn-primary btn-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowNewListForm(false);
                      setNewListName('');
                    }}
                    className="btn btn-ghost btn-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
              Tags
            </h3>
            <button
              onClick={() => setShowNewTagForm(true)}
              className="btn btn-ghost btn-xs"
              title="Add new tag"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-1">
            {tags.map((tag) => {
              const taskCount = tasks.filter(task => 
                !task.parentId && task.tags.includes(tag.id)
              ).length;
              
              return (
                <div key={tag.id} className="group flex items-center gap-2 p-2 rounded hover:bg-base-200">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-sm">{tag.name}</span>
                  <span className="text-xs text-base-content/50">{taskCount}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${tag.name}" tag?`)) {
                        deleteTag(tag.id);
                      }
                    }}
                    className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete tag"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            
            {/* New Tag Form */}
            {showNewTagForm && (
              <div className="p-3 bg-base-200 rounded-lg">
                <input
                  type="text"
                  placeholder="Tag name"
                  className="input input-sm w-full mb-2"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') {
                      setShowNewTagForm(false);
                      setNewTagName('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTag}
                    className="btn btn-primary btn-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTagForm(false);
                      setNewTagName('');
                    }}
                    className="btn btn-ghost btn-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}