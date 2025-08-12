import { useState } from 'react';

/**
 * Custom hook for managing token display state
 */
export const useTokenDisplay = (initialCount: number = 5) => {
  const [showAll, setShowAll] = useState(false);

  /**
   * Get items to display based on current state
   */
  const getDisplayItems = <T>(items: T[]): T[] => {
    return showAll ? items : items.slice(0, initialCount);
  };

  /**
   * Toggle between showing all items and limited items
   */
  const toggleShowAll = () => {
    setShowAll(prev => !prev);
  };

  /**
   * Check if there are more items to show
   */
  const hasMoreItems = <T>(items: T[]): boolean => {
    return items.length > initialCount;
  };

  /**
   * Get the count of hidden items
   */
  const getHiddenCount = <T>(items: T[]): number => {
    return Math.max(0, items.length - initialCount);
  };

  return {
    showAll,
    setShowAll,
    toggleShowAll,
    getDisplayItems,
    hasMoreItems,
    getHiddenCount,
  };
};