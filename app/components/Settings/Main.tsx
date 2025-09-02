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
import React, { useState } from 'react';
import { A2AManagement } from './A2AManagement';
import { AccountSettings } from './AccountSettings';
import { AgentSelection } from './AgentSelection';
import { GeneralSettings } from './GeneralSettings';
import styles from './Main.module.css';
import { MCPConfiguration } from './MCPConfiguration';
import { RulesAndMemories } from './RulesAndMemories';
import { UserCredentials } from './UserCredentials';

interface SettingsMainProps {
  isSidebarOpen?: boolean;
}

export const SettingsMain: React.FC<SettingsMainProps> = ({
  isSidebarOpen = true,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

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
              onChange={setTabIndex}
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
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    Account
                  </Text>
                </Tab>
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    General
                  </Text>
                </Tab>
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    Rules & Memories
                  </Text>
                </Tab>
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    Credentials
                  </Text>
                </Tab>
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    MCP Servers
                  </Text>
                </Tab>
                <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    A2A Agents
                  </Text>
                </Tab>
                {/* <Tab className={styles.tab}>
                  <Text fontSize="sm" fontWeight="500">
                    Agent Selection
                  </Text>
                </Tab> */}
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
                <TabPanel p={0} h="full">
                  <Box className={styles.tabContent}>
                    <AgentSelection onSave={() => {}} />
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
