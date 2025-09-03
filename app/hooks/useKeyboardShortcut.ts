import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcut = (
  options: UseKeyboardShortcutOptions,
  callback: () => void,
  deps: any[] = []
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        key,
        metaKey = false,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        preventDefault = true,
      } = options;

      // Check if the pressed key matches our target
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      // Check if modifiers match
      const metaMatches = metaKey === event.metaKey;
      const ctrlMatches = ctrlKey === event.ctrlKey;
      const shiftMatches = shiftKey === event.shiftKey;
      const altMatches = altKey === event.altKey;

      // Don't trigger if user is typing in an input/textarea/contenteditable
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.hasAttribute('contenteditable'));

      if (
        keyMatches &&
        metaMatches &&
        ctrlMatches &&
        shiftMatches &&
        altMatches &&
        !isTyping
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, deps);
};
