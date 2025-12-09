import { Priority, ParsedTaskInput } from '@/types';

// Special syntax patterns
// @ for time/date
// ! for priority  
// # for tags
// ~ for lists

const PATTERNS = {
  TIME: /@(\w+(?:\s+\w+)*)/g,
  PRIORITY: /!([1-4]|low|medium|high|none)/gi,
  TAGS: /#(\w+)/g,
  LIST: /~(\w+(?:\s+\w+)*)/g,
};

const PRIORITY_MAP: Record<string, Priority> = {
  '1': 'low',
  '2': 'medium', 
  '3': 'high',
  '4': 'high',
  'low': 'low',
  'medium': 'medium',
  'high': 'high',
  'none': 'none',
};

const TIME_KEYWORDS: Record<string, () => Date> = {
  'today': () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  },
  'tomorrow': () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(23, 59, 59, 999);
    return date;
  },
  'next week': () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date;
  },
  'next month': () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setHours(23, 59, 59, 999);
    return date;
  },
};

export function parseTaskInput(input: string, availableLists: Array<{id: string, name: string}> = []): ParsedTaskInput {
  let cleanTitle = input;
  const result: ParsedTaskInput = {
    title: '',
  };

  // Parse priority
  const priorityMatches = Array.from(input.matchAll(PATTERNS.PRIORITY));
  if (priorityMatches.length > 0) {
    const priorityValue = priorityMatches[priorityMatches.length - 1][1].toLowerCase();
    result.priority = PRIORITY_MAP[priorityValue] || 'none';
    
    // Remove priority syntax from title
    priorityMatches.forEach(match => {
      cleanTitle = cleanTitle.replace(match[0], '');
    });
  }

  // Parse time/date
  const timeMatches = Array.from(input.matchAll(PATTERNS.TIME));
  if (timeMatches.length > 0) {
    const timeValue = timeMatches[timeMatches.length - 1][1].toLowerCase();
    
    if (TIME_KEYWORDS[timeValue]) {
      result.dueDate = TIME_KEYWORDS[timeValue]();
    } else {
      // Try to parse as date
      const parsedDate = parseDate(timeValue);
      if (parsedDate) {
        result.dueDate = parsedDate;
      }
    }
    
    // Remove time syntax from title
    timeMatches.forEach(match => {
      cleanTitle = cleanTitle.replace(match[0], '');
    });
  }

  // Parse tags
  const tagMatches = Array.from(input.matchAll(PATTERNS.TAGS));
  if (tagMatches.length > 0) {
    result.tags = tagMatches.map(match => match[1].toLowerCase());
    
    // Remove tag syntax from title
    tagMatches.forEach(match => {
      cleanTitle = cleanTitle.replace(match[0], '');
    });
  }

  // Parse list
  const listMatches = Array.from(input.matchAll(PATTERNS.LIST));
  if (listMatches.length > 0) {
    const listName = listMatches[listMatches.length - 1][1].toLowerCase();
    
    // Find matching list by name
    const matchingList = availableLists.find(list => 
      list.name.toLowerCase() === listName || 
      list.name.toLowerCase().includes(listName)
    );
    
    if (matchingList) {
      result.listId = matchingList.id;
    }
    
    // Remove list syntax from title
    listMatches.forEach(match => {
      cleanTitle = cleanTitle.replace(match[0], '');
    });
  }

  // Clean up the title
  result.title = cleanTitle.trim().replace(/\s+/g, ' ');

  return result;
}

function parseDate(dateStr: string): Date | null {
  // Handle various date formats
  const formats = [
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // DD/MM/YYYY or DD-MM-YYYY (European format)
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY-MM-DD (ISO format)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year: number, month: number, day: number;
      
      if (format === formats[2]) { // ISO format
        [, year, month, day] = match.map(Number);
      } else {
        // Assume MM/DD/YYYY format for now
        [, month, day, year] = match.map(Number);
      }
      
      const date = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      // Validate the date
      if (date.getFullYear() === year && 
          date.getMonth() === month - 1 && 
          date.getDate() === day) {
        return date;
      }
    }
  }

  // Try native Date parsing as fallback
  const nativeDate = new Date(dateStr);
  if (!isNaN(nativeDate.getTime())) {
    nativeDate.setHours(23, 59, 59, 999);
    return nativeDate;
  }

  return null;
}

// Helper function to format parsed input for display
export function formatParsedInput(parsed: ParsedTaskInput): string {
  let formatted = parsed.title;
  
  if (parsed.priority && parsed.priority !== 'none') {
    formatted += ` !${parsed.priority}`;
  }
  
  if (parsed.dueDate) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (isSameDay(parsed.dueDate, today)) {
      formatted += ' @today';
    } else if (isSameDay(parsed.dueDate, tomorrow)) {
      formatted += ' @tomorrow';
    } else {
      formatted += ` @${parsed.dueDate.toLocaleDateString()}`;
    }
  }
  
  if (parsed.tags && parsed.tags.length > 0) {
    formatted += ' ' + parsed.tags.map(tag => `#${tag}`).join(' ');
  }
  
  return formatted;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Export utility for getting suggestions based on current input
export function getSuggestions(input: string, availableLists: Array<{id: string, name: string}>, availableTags: Array<{id: string, name: string}>): {
  type: 'time' | 'priority' | 'tag' | 'list';
  suggestions: string[];
} | null {
  const lastChar = input[input.length - 1];
  const words = input.split(' ');
  const lastWord = words[words.length - 1];
  
  if (lastChar === '@' || (lastWord.startsWith('@') && lastWord.length > 1)) {
    return {
      type: 'time',
      suggestions: ['today', 'tomorrow', 'next week', 'next month']
    };
  }
  
  if (lastChar === '!' || (lastWord.startsWith('!') && lastWord.length > 1)) {
    return {
      type: 'priority',
      suggestions: ['low', 'medium', 'high', 'none']
    };
  }
  
  if (lastChar === '#' || (lastWord.startsWith('#') && lastWord.length > 1)) {
    return {
      type: 'tag',
      suggestions: availableTags.map(tag => tag.name)
    };
  }
  
  if (lastChar === '~' || (lastWord.startsWith('~') && lastWord.length > 1)) {
    return {
      type: 'list',
      suggestions: availableLists.map(list => list.name)
    };
  }
  
  return null;
}