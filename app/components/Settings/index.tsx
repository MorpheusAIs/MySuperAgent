import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { Settings } from "lucide-react";
import React from "react";
import { AgentSelection } from "./AgentSelection";
import { GeneralSettings } from "./GeneralSettings";
import { UserCredentials } from "./UserCredentials";
import { MCPConfiguration } from "./MCPConfiguration";
import { A2AManagement } from "./A2AManagement";
import styles from "./index.module.css";

export const SettingsButton: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Flex
        as="button"
        align="center"
        gap={3}
        width="100%"
        onClick={() => setIsOpen(true)}
        pl={1}
      >
        <Settings className={styles.icon} size={20} />
        <Text fontSize="14px" color="white">
          SuperAgent Configurations
        </Text>
      </Flex>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        motionPreset="none"
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent
          position="fixed"
          left="16px"
          top="70px"
          margin={0}
          width="344px"
          maxHeight="calc(100vh - 86px)"
          bg="#080808"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
          color="white"
        >
          <ModalHeader
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            padding="16px"
            fontSize="16px"
            fontWeight="500"
          >
            Settings
          </ModalHeader>
          <ModalCloseButton
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          />

          <ModalBody padding="16px">
            <Tabs>
              <TabList mb={4} gap={2} borderBottom="none">
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  General
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Credentials
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  MCP Servers
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  A2A Agents
                </Tab>
                {/* Temporarily disabling the ability to select agents */}
                {/* <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Agents
                </Tab> */}
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <GeneralSettings onSave={() => setIsOpen(false)} />
                </TabPanel>
                <TabPanel p={0}>
                  <UserCredentials onSave={() => setIsOpen(false)} />
                </TabPanel>
                <TabPanel p={0}>
                  <MCPConfiguration onSave={() => setIsOpen(false)} />
                </TabPanel>
                <TabPanel p={0}>
                  <A2AManagement onSave={() => setIsOpen(false)} />
                </TabPanel>
                <TabPanel p={0}>
                  <AgentSelection onSave={() => setIsOpen(false)} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
