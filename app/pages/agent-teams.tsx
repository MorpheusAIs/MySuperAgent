import { AgentTeamsMain } from '@/components/AgentTeams/Main';
import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Box, Flex } from '@chakra-ui/react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from './index.module.css';

const AgentTeamsPage: NextPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Expanded by default
  const router = useRouter();

  const handleBackToMain = () => {
    router.push('/');
  };

  return (
    <Box className={styles.container}>
      <HeaderBar onBackToJobs={handleBackToMain} />
      <Flex className={styles.contentWrapper}>
        <Box className={styles.sidebarWrapper} zIndex="1337">
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setIsSidebarOpen}
          />
        </Box>

        <Box
          className={styles.chatWrapper}
          style={{
            marginLeft: isSidebarOpen ? '360px' : 0,
          }}
        >
          <AgentTeamsMain
            isSidebarOpen={isSidebarOpen}
            onBackToMain={handleBackToMain}
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default AgentTeamsPage;
