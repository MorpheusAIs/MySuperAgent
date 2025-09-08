import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { SettingsMain } from '@/components/Settings/Main';
import { useGlobalUI } from '@/contexts/GlobalSearchProvider';
import { Box, Flex } from '@chakra-ui/react';
import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './index.module.css';

const SettingsPage: NextPage = () => {
  const { isSidebarOpen, setSidebarOpen } = useGlobalUI();
  const router = useRouter();

  // Redirect to account tab if no tab is specified
  useEffect(() => {
    if (!router.query.tab) {
      router.replace('/settings?tab=account', undefined, { shallow: true });
    }
  }, [router]);

  return (
    <Box className={styles.container}>
      <HeaderBar />
      <Flex className={styles.contentWrapper}>
        <Box className={styles.sidebarWrapper} zIndex="1337">
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setSidebarOpen}
          />
        </Box>

        <Box
          className={styles.chatWrapper}
          style={{
            marginLeft: isSidebarOpen ? '360px' : 0,
          }}
        >
          <SettingsMain isSidebarOpen={isSidebarOpen} />
        </Box>
      </Flex>
    </Box>
  );
};

export default SettingsPage;
