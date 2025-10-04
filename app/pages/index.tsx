import { Chat } from '@/components/Chat';
import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ChatProviderDB } from '@/contexts/chat/ChatProviderDB';
import { useGlobalUI } from '@/contexts/GlobalSearchProvider';
import { Box, Flex, useBreakpointValue } from '@chakra-ui/react';
import type { NextPage } from 'next';
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
  const { isSidebarOpen, setSidebarOpen } = useGlobalUI();
  const [currentView, setCurrentView] = useState<'chat' | 'jobs'>('jobs');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerRef = useRef<HTMLDivElement>(null);

  const handleBackToJobs = () => {
    setCurrentView('jobs');
  };

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
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default HomeWithProvider;
