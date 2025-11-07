'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
}

interface MentionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export default function MentionAutocomplete({
  value,
  onChange,
  onKeyDown,
  textareaRef,
  placeholder,
  className = '',
  rows = 2,
}: MentionAutocompleteProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search users when mention query changes
  useEffect(() => {
    if (mentionQuery.length > 0) {
      // Debounce search
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users || []);
            setShowDropdown(true);
            setSelectedIndex(0);
          }
        } catch (error) {
          console.error('Error searching users:', error);
        }
      }, 200);
    } else {
      setUsers([]);
      setShowDropdown(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mentionQuery]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(text);

    // Check if user is typing @mention
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if there's a space after @ (meaning @mention ended)
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (afterAt.includes(' ') || afterAt.includes('\n')) {
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStart(null);
        return;
      }

      // Extract query after @
      const query = afterAt.toLowerCase();
      setMentionQuery(query);
      setMentionStart(lastAtIndex);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStart(null);
    }
  };

  // Handle keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectUser(users[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStart(null);
        return;
      }
    }

    // Call parent onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Select a user
  const selectUser = (user: User) => {
    if (!mentionStart) return;

    const textBeforeMention = value.substring(0, mentionStart);
    const textAfterMention = value.substring(mentionStart).replace(/@[\w]*/, '');
    const newText = `${textBeforeMention}@${user.userId}${textAfterMention}`;

    onChange(newText);
    setShowDropdown(false);
    setMentionQuery('');
    setMentionStart(null);

    // Set cursor position after @mention
    setTimeout(() => {
      if (textareaRef?.current) {
        const newCursorPos = mentionStart + user.userId.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef?.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [textareaRef]);

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />
      {showDropdown && users.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || user.userId}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm">{user.name || 'Unknown'}</div>
                <div className="text-gray-500 text-xs">@{user.userId}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

