import { Task, TaskList, Tag, Priority } from '@/types';

export interface ExportOptions {
  includeCompleted?: boolean;
  includeSubtasks?: boolean;
  listId?: string;
  format?: 'markdown' | 'csv' | 'json';
}

export function exportTasksAsMarkdown(
  tasks: Task[],
  lists: TaskList[],
  tags: Tag[],
  options: ExportOptions = {}
): string {
  const {
    includeCompleted = true,
    includeSubtasks = true,
    listId,
  } = options;

  // Filter tasks based on options
  let filteredTasks = tasks.filter(task => {
    if (!includeCompleted && task.completed) return false;
    if (listId && task.listId !== listId) return false;
    if (!includeSubtasks && task.parentId) return false;
    return true;
  });

  // Sort tasks by list, then by order
  filteredTasks.sort((a, b) => {
    if (a.listId !== b.listId) {
      const listA = lists.find(l => l.id === a.listId)?.name || '';
      const listB = lists.find(l => l.id === b.listId)?.name || '';
      return listA.localeCompare(listB);
    }
    return a.order - b.order;
  });

  // Create markdown table
  let markdown = '# Tasks Export\n\n';
  markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`;

  if (filteredTasks.length === 0) {
    markdown += 'No tasks found matching the specified criteria.\n';
    return markdown;
  }

  // Table headers
  markdown += '| Status | Task | Priority | Due Date | List | Tags |\n';
  markdown += '|--------|------|----------|----------|------|------|\n';

  // Helper functions
  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list ? list.name : 'Unknown';
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds
      .map(tagId => {
        const tag = tags.find(t => t.id === tagId);
        return tag ? `#${tag.name}` : `#${tagId}`;
      })
      .join(' ');
  };

  const formatPriority = (priority: Priority) => {
    const priorityEmojis = {
      none: '',
      low: '🔵',
      medium: '🟡',
      high: '🔴',
    };
    return priorityEmojis[priority] + (priority !== 'none' ? ` ${priority}` : '');
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };

  const formatStatus = (completed: boolean) => {
    return completed ? '✅' : '⬜';
  };

  // Add tasks to table
  filteredTasks.forEach(task => {
    const status = formatStatus(task.completed);
    const title = task.title.replace(/\|/g, '\\|'); // Escape pipes in title
    const priority = formatPriority(task.priority);
    const dueDate = formatDate(task.dueDate);
    const listName = getListName(task.listId);
    const tagNames = getTagNames(task.tags);

    markdown += `| ${status} | ${title} | ${priority} | ${dueDate} | ${listName} | ${tagNames} |\n`;

    // Add subtasks if included
    if (includeSubtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        const subStatus = formatStatus(subtask.completed);
        const subTitle = `↳ ${subtask.title.replace(/\|/g, '\\|')}`;
        const subPriority = formatPriority(subtask.priority);
        const subDueDate = formatDate(subtask.dueDate);
        const subTagNames = getTagNames(subtask.tags);

        markdown += `| ${subStatus} | ${subTitle} | ${subPriority} | ${subDueDate} | ${listName} | ${subTagNames} |\n`;
      });
    }
  });

  // Add summary
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  markdown += '\n## Summary\n\n';
  markdown += `- **Total Tasks**: ${totalTasks}\n`;
  markdown += `- **Completed**: ${completedTasks}\n`;
  markdown += `- **Pending**: ${pendingTasks}\n`;

  // Add list breakdown
  const listBreakdown = filteredTasks.reduce((acc, task) => {
    const listName = getListName(task.listId);
    acc[listName] = (acc[listName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(listBreakdown).length > 1) {
    markdown += '\n### Tasks by List\n\n';
    Object.entries(listBreakdown).forEach(([listName, count]) => {
      markdown += `- **${listName}**: ${count}\n`;
    });
  }

  // Add priority breakdown
  const priorityBreakdown = filteredTasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<Priority, number>);

  markdown += '\n### Tasks by Priority\n\n';
  Object.entries(priorityBreakdown).forEach(([priority, count]) => {
    const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : priority === 'low' ? '🔵' : '⚪';
    const label = priority === 'none' ? 'No Priority' : priority.charAt(0).toUpperCase() + priority.slice(1);
    markdown += `- ${emoji} **${label}**: ${count}\n`;
  });

  return markdown;
}

export function exportTasksAsCSV(
  tasks: Task[],
  lists: TaskList[],
  tags: Tag[],
  options: ExportOptions = {}
): string {
  const {
    includeCompleted = true,
    includeSubtasks = true,
    listId,
  } = options;

  // Filter tasks
  let filteredTasks = tasks.filter(task => {
    if (!includeCompleted && task.completed) return false;
    if (listId && task.listId !== listId) return false;
    if (!includeSubtasks && task.parentId) return false;
    return true;
  });

  // Helper functions
  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list ? list.name : 'Unknown';
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds
      .map(tagId => {
        const tag = tags.find(t => t.id === tagId);
        return tag ? tag.name : tagId;
      })
      .join(';');
  };

  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // CSV headers
  let csv = 'Status,Title,Priority,Due Date,List,Tags,Created,Updated\n';

  // Add tasks
  filteredTasks.forEach(task => {
    const status = task.completed ? 'Completed' : 'Pending';
    const title = escapeCSV(task.title);
    const priority = task.priority === 'none' ? '' : task.priority;
    const dueDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';
    const listName = escapeCSV(getListName(task.listId));
    const tagNames = escapeCSV(getTagNames(task.tags));
    const created = task.createdAt.toISOString().split('T')[0];
    const updated = task.updatedAt.toISOString().split('T')[0];

    csv += `${status},${title},${priority},${dueDate},${listName},${tagNames},${created},${updated}\n`;

    // Add subtasks
    if (includeSubtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        const subStatus = subtask.completed ? 'Completed' : 'Pending';
        const subTitle = escapeCSV(`↳ ${subtask.title}`);
        const subPriority = subtask.priority === 'none' ? '' : subtask.priority;
        const subDueDate = subtask.dueDate ? subtask.dueDate.toISOString().split('T')[0] : '';
        const subTagNames = escapeCSV(getTagNames(subtask.tags));
        const subCreated = subtask.createdAt.toISOString().split('T')[0];
        const subUpdated = subtask.updatedAt.toISOString().split('T')[0];

        csv += `${subStatus},${subTitle},${subPriority},${subDueDate},${listName},${subTagNames},${subCreated},${subUpdated}\n`;
      });
    }
  });

  return csv;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportTasks(
  tasks: Task[],
  lists: TaskList[],
  tags: Tag[],
  format: 'markdown' | 'csv' = 'markdown',
  options: ExportOptions = {}
) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'markdown') {
    const content = exportTasksAsMarkdown(tasks, lists, tags, options);
    downloadFile(content, `tasks-export-${timestamp}.md`, 'text/markdown');
  } else if (format === 'csv') {
    const content = exportTasksAsCSV(tasks, lists, tags, options);
    downloadFile(content, `tasks-export-${timestamp}.csv`, 'text/csv');
  }
}