'use client';

import { useState, useRef, useEffect } from 'react';
import { useTaskerContext } from '@/contexts/TaskerContext';
import { parseTaskInput, getSuggestions } from '@/lib/parser';

interface TaskFormProps {
  placeholder?: string;
  onTaskAdded?: () => void;
}

export default function TaskForm({ placeholder = "Add a task...", onTaskAdded }: TaskFormProps) {
  const { lists, tags, selectedListId, addTask, addTag } = useTaskerContext();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    type: 'time' | 'priority' | 'tag' | 'list';
    suggestions: string[];
  } | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Handle input changes and show suggestions
  useEffect(() => {
    const currentSuggestions = getSuggestions(input, lists, tags);
    setSuggestions(currentSuggestions);
    setShowSuggestions(!!currentSuggestions && input.length > 0);
    setSelectedSuggestionIndex(0);
  }, [input, lists, tags]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const parsed = parseTaskInput(input, lists);
    
    // Create new tags if they don't exist and get their IDs
    const tagIds: string[] = [];
    if (parsed.tags) {
      for (const tagName of parsed.tags) {
        let existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
        if (!existingTag) {
          existingTag = addTag(tagName);
        }
        if (existingTag) {
          tagIds.push(existingTag.id);
        }
      }
    }

    // Prepare additional properties
    const additionalProps: any = {};
    if (parsed.priority) additionalProps.priority = parsed.priority;
    if (parsed.dueDate) additionalProps.dueDate = parsed.dueDate;
    if (tagIds.length > 0) additionalProps.tags = tagIds;

    // Create the task with all properties
    addTask(
      parsed.title,
      parsed.listId || selectedListId,
      undefined,
      additionalProps
    );

    setInput('');
    setShowSuggestions(false);
    onTaskAdded?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions && suggestions && suggestions.suggestions.length > 0) {
        applySuggestion(suggestions.suggestions[selectedSuggestionIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      textareaRef.current?.blur();
    } else if (showSuggestions && suggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.suggestions.length - 1
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions.suggestions[selectedSuggestionIndex]);
      }
    }
  };

  const applySuggestion = (suggestion: string) => {
    const words = input.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') || lastWord.startsWith('!') || 
        lastWord.startsWith('#') || lastWord.startsWith('~')) {
      words[words.length - 1] = lastWord[0] + suggestion;
    } else {
      // If the last character is a trigger, replace it
      const lastChar = input[input.length - 1];
      if (['@', '!', '#', '~'].includes(lastChar)) {
        setInput(input.slice(0, -1) + lastChar + suggestion + ' ');
      } else {
        words.push(suggestion);
      }
    }
    
    setInput(words.join(' ') + ' ');
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const renderSyntaxHelp = () => (
    <div className="text-xs text-base-content/50 mt-2 flex flex-wrap gap-4">
      <span><code>@</code> for dates (today, tomorrow, 12/25)</span>
      <span><code>!</code> for priority (low, medium, high)</span>
      <span><code>#</code> for tags</span>
      <span><code>~</code> for lists</span>
    </div>
  );

  return (
    <div className="relative">
      <div className="bg-base-100 border-2 border-base-300 rounded-xl p-4 focus-within:border-primary focus-within:shadow-lg transition-all duration-200 hover:shadow-md">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="inline-form resize-none overflow-hidden text-base"
          rows={1}
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs text-base-content/70 mb-2 capitalize">
                {suggestions.type === 'time' ? 'Due dates' : 
                 suggestions.type === 'priority' ? 'Priorities' :
                 suggestions.type === 'tag' ? 'Tags' : 'Lists'}
              </div>
              {suggestions.suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => applySuggestion(suggestion)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    index === selectedSuggestionIndex
                      ? 'bg-primary text-primary-content'
                      : 'hover:bg-base-200'
                  }`}
                >
                  {suggestions.type === 'time' && suggestion === 'today' && '📅 '}
                  {suggestions.type === 'time' && suggestion === 'tomorrow' && '📅 '}
                  {suggestions.type === 'priority' && suggestion === 'high' && '🔴 '}
                  {suggestions.type === 'priority' && suggestion === 'medium' && '🟡 '}
                  {suggestions.type === 'priority' && suggestion === 'low' && '🔵 '}
                  {suggestions.type === 'tag' && '# '}
                  {suggestions.type === 'list' && '📁 '}
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="btn btn-primary btn-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
            
            {input && (
              <button
                onClick={() => setInput('')}
                className="btn btn-ghost btn-sm"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Preview parsed input */}
          {input && (
            <div className="text-xs text-base-content/70">
              {(() => {
                const parsed = parseTaskInput(input, lists);
                const parts = [];
                if (parsed.title) parts.push(`"${parsed.title}"`);
                if (parsed.priority && parsed.priority !== 'none') parts.push(`Priority: ${parsed.priority}`);
                if (parsed.dueDate) parts.push(`Due: ${parsed.dueDate.toLocaleDateString()}`);
                if (parsed.tags?.length) parts.push(`Tags: ${parsed.tags.join(', ')}`);
                if (parsed.listId) {
                  const list = lists.find(l => l.id === parsed.listId);
                  if (list) parts.push(`List: ${list.name}`);
                }
                return parts.join(' • ');
              })()}
            </div>
          )}
        </div>
        
        {/* Syntax help */}
        {!input && renderSyntaxHelp()}
      </div>
    </div>
  );
}