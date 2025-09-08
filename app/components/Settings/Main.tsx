import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { A2AManagement } from './A2AManagement';
import { AccountSettings } from './AccountSettings';
import { GeneralSettings } from './GeneralSettings';
import styles from './Main.module.css';
import { MCPConfiguration } from './MCPConfiguration';
import { RulesAndMemories } from './RulesAndMemories';
import { UserCredentials } from './UserCredentials';
import { UserPreferencesComponent } from '../UserPreferences';

interface SettingsMainProps {
  isSidebarOpen?: boolean;
}

const TAB_CONFIG = [
  { id: 'account', name: 'Account', index: 0 },
  { id: 'general', name: 'General', index: 1 },
  { id: 'scheduling', name: 'Scheduling', index: 2 },
  { id: 'rules', name: 'Rules & Memories', index: 3 },
  { id: 'credentials', name: 'Credentials', index: 4 },
  { id: 'mcp', name: 'MCP Servers', index: 5 },
  { id: 'a2a', name: 'A2A Agents', index: 6 },
];

export const SettingsMain: React.FC<SettingsMainProps> = ({
  isSidebarOpen = true,
}) => {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const tab = router.query.tab;
    if (tab && typeof tab === 'string') {
      const tabConfig = TAB_CONFIG.find((t) => t.id === tab);
      if (tabConfig) {
        setTabIndex(tabConfig.index);
      }
    }
  }, [router.query.tab]);

  // Handle tab change and update URL
  const handleTabChange = (index: number) => {
    setTabIndex(index);
    const tabConfig = TAB_CONFIG.find((t) => t.index === index);
    if (tabConfig) {
      router.push(`/settings?tab=${tabConfig.id}`, undefined, {
        shallow: true,
      });
    }
  };

  return (
    <Container maxW="full" minH="100vh" bg="#0A0A0A" color="white" p={0}>
      <Box className={styles.mainContainer}>
        <VStack spacing={6} align="stretch" minH="full">
          {/* Header */}
          <Box className={styles.header}>
            <Heading size="lg" fontWeight="600" color="white">
              Settings
            </Heading>
            <Text fontSize="md" color="rgba(255, 255, 255, 0.7)" mt={2}>
              Customize your SuperAgent experience with these comprehensive
              settings
            </Text>
          </Box>

          {/* Main Content */}
          <Box className={styles.content} flex={1}>
            <Tabs
              index={tabIndex}
              onChange={handleTabChange}
              orientation="horizontal"
              variant="unstyled"
              h="full"
            >
              <TabList
                className={styles.tabList}
                borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                pb={4}
                mb={6}
              >
                {TAB_CONFIG.map((tab) => (
                  <Tab key={tab.id} className={styles.tab}>
                    <Text fontSize="sm" fontWeight="500">
                      {tab.name}
                    </Text>
                  </Tab>
                ))}
              </TabList>

              <TabPanels h="full" className={styles.tabPanels}>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <AccountSettings onSave={() => {}} />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <GeneralSettings onSave={() => {}} />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <UserPreferencesComponent />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <RulesAndMemories onSave={() => {}} />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <UserCredentials onSave={() => {}} />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <MCPConfiguration onSave={() => {}} />
                  </Box>
                </TabPanel>
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <A2AManagement onSave={() => {}} />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};
