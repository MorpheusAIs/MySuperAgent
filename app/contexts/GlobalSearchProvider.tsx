import { JobSearchModal } from '@/components/JobsList/JobSearchModal';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { trackEvent } from '@/services/analytics';
import JobsAPI from '@/services/api-clients/jobs';
import { Job } from '@/services/database/db';
import { useWalletAddress } from '@/services/wallet/utils';
import { useRouter } from 'next/router';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface GlobalUIContextType {
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectedJobId: string | null;
  selectJob: (jobId: string) => void;
}

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(
  undefined
);

export const useGlobalUI = () => {
  const context = useContext(GlobalUIContext);
  if (!context) {
    throw new Error('useGlobalUI must be used within a GlobalUIProvider');
  }
  return context;
};

// Keep the old hook for backward compatibility
export const useGlobalSearch = () => {
  return useGlobalUI();
};

interface GlobalSearchProviderProps {
  children: ReactNode;
}

export const GlobalSearchProvider: React.FC<GlobalSearchProviderProps> = ({
  children,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { getAddress } = useWalletAddress();
  const router = useRouter();

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    // Load jobs inline to avoid circular dependency
    const loadJobsInline = async () => {
      setIsLoading(true);
      try {
        const walletAddress = getAddress();
        if (!walletAddress) {
          const { getStorageData } = await import(
            '@/services/local-storage/core'
          );
          const data = getStorageData();

          const localJobs: Job[] = Object.entries(data.conversations).map(
            ([id, conversation]) => ({
              id,
              name: conversation.name,
              description: '',
              initial_message:
                conversation.messages?.[0]?.content || 'No messages yet',
              status: 'completed' as const,
              created_at: new Date(conversation.createdAt || Date.now()),
              updated_at: new Date(conversation.createdAt || Date.now()),
              completed_at: new Date(conversation.createdAt || Date.now()),
              is_scheduled: false,
              has_uploaded_file: conversation.hasUploadedFile || false,
              wallet_address: '',
              run_count: 0,
              is_active: true,
              schedule_type: null,
              schedule_time: null,
              next_run_time: null,
              interval_days: null,
              max_runs: null,
              weekly_days: null,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              last_run_at: null,
            })
          );

          setJobs(localJobs);
          setScheduledJobs([]);
        } else {
          const [regularJobs, scheduledJobsList] = await Promise.all([
            JobsAPI.getJobs(walletAddress),
            JobsAPI.getScheduledJobs(walletAddress),
          ]);

          setJobs(regularJobs);
          setScheduledJobs(scheduledJobsList);
        }
      } catch (error) {
        console.error('Error loading jobs for search:', error);
        setJobs([]);
        setScheduledJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobsInline();
  }, [getAddress]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const selectJob = useCallback((jobId: string) => {
    console.log('[GlobalSearch] Setting selectedJobId to:', jobId);
    setSelectedJobId(jobId);
    // Reset after a brief moment to allow it to be selected again later
    setTimeout(() => setSelectedJobId(null), 500);
  }, []);

  const handleJobSelect = useCallback(
    (jobId: string) => {
      console.log('[GlobalSearch] Job selected:', jobId);
      console.log('[GlobalSearch] Current pathname:', router.pathname);

      trackEvent('job.clicked', {
        jobId,
      });

      if (router.pathname === '/') {
        // If on home page, use direct state communication
        console.log('[GlobalSearch] On home page - using direct state');
        selectJob(jobId);
      } else {
        // If on other pages, navigate to home with the job
        console.log('[GlobalSearch] On other page - navigating to home');
        router.push(`/?job=${jobId}`);
      }

      closeSearch();
    },
    [router, closeSearch, selectJob]
  );

  // Global keyboard shortcuts
  useKeyboardShortcut({ key: 'k', metaKey: true }, openSearch, []);
  useKeyboardShortcut({ key: 'b', metaKey: true }, toggleSidebar, []);

  const contextValue: GlobalUIContextType = {
    openSearch,
    closeSearch,
    isSearchOpen,
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    selectedJobId,
    selectJob,
  };

  return (
    <GlobalUIContext.Provider value={contextValue}>
      {children}
      <JobSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        jobs={jobs}
        scheduledJobs={scheduledJobs}
        onJobSelect={handleJobSelect}
      />
    </GlobalUIContext.Provider>
  );
};
