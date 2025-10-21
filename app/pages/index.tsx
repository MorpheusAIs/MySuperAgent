import { Chat } from '@/components/Chat';
import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ChatProviderDB } from '@/contexts/chat/ChatProviderDB';
import { useGlobalUI } from '@/contexts/GlobalSearchProvider';
import { Box, Flex, useBreakpointValue } from '@chakra-ui/react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styles from './index.module.css';

// Wrapper with provider
const HomeWithProvider: NextPage = () => {
  return (
    <ChatProviderDB>
      <Home />
    </ChatProviderDB>
  );
};

const Home = () => {
  const { isSidebarOpen, setSidebarOpen, selectedJobId } = useGlobalUI();
  const [currentView, setCurrentView] = useState<'chat' | 'jobs'>('jobs');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [initialJobId, setInitialJobId] = useState<string | null>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleBackToJobs = () => {
    setCurrentView('jobs');
  };

  // Handle URL parameters (for external links and non-home-page navigation)
  useEffect(() => {
    if (router.isReady) {
      const { prompt, job } = router.query;
      if (prompt && typeof prompt === 'string') {
        setInitialPrompt(decodeURIComponent(prompt));
        router.replace('/', undefined, { shallow: true });
      }
      if (job && typeof job === 'string') {
        console.log('[Home] Detected job parameter in URL:', job);
        setInitialJobId(job);
        console.log('[Home] Set initialJobId state to:', job);
        // Clear the URL parameter after a brief delay to ensure state propagates
        setTimeout(() => {
          router.replace('/', undefined, { shallow: true });
        }, 100);
      }
    }
  }, [router.isReady, router.query, router]);

  // Handle direct job selection from search (when already on home page)
  useEffect(() => {
    if (selectedJobId) {
      console.log('[Home] Received selectedJobId from context:', selectedJobId);
      setInitialJobId(selectedJobId);
    }
  }, [selectedJobId]);

  // Track header visibility based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const scrollY = window.scrollY;

        // Header is visible if we haven't scrolled past its height
        // Add a small buffer to prevent jittery transitions
        const isVisible = scrollY < headerHeight - 10;

        setIsHeaderVisible(isVisible);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box className={styles.container}>
      <Box ref={headerRef}>
        <HeaderBar
          onBackToJobs={currentView === 'chat' ? handleBackToJobs : undefined}
        />
      </Box>
      <Flex className={styles.contentWrapper}>
        {/* Mobile overlay when sidebar is open */}
        {isMobile && isSidebarOpen && (
          <Box
            className={styles.mobileOverlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Box
          className={styles.sidebarWrapper}
          style={{
            position: isMobile ? 'fixed' : 'relative',
            transform: isMobile
              ? `translateX(${isSidebarOpen ? '0' : '-100%'})`
              : 'none',
          }}
          zIndex="1337"
        >
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setSidebarOpen}
            isHeaderVisible={isHeaderVisible}
          />
        </Box>

        <Box
          className={styles.chatWrapper}
          style={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? '240px' : 0,
          }}
        >
          <Chat
            isSidebarOpen={isSidebarOpen}
            currentView={currentView}
            setCurrentView={setCurrentView}
            initialPrompt={initialPrompt}
            initialJobId={initialJobId}
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default HomeWithProvider;
