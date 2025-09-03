import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { TeamsMain } from '@/components/Teams/Main';
import { useGlobalUI } from '@/contexts/GlobalSearchProvider';
import { Box, Flex } from '@chakra-ui/react';
import type { NextPage } from 'next';
import styles from './index.module.css';

const TeamsPage: NextPage = () => {
  const { isSidebarOpen, setSidebarOpen } = useGlobalUI();

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
          <TeamsMain isSidebarOpen={isSidebarOpen} />
        </Box>
      </Flex>
    </Box>
  );
};

export default TeamsPage;
