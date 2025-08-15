import React, { useState } from "react";
import { HeaderBar } from "@/components/HeaderBar";
import { LeftSidebar } from "@/components/LeftSidebar";
import { AgentTeamsMain } from "@/components/AgentTeams/Main";
import { Box, Flex } from "@chakra-ui/react";
import type { NextPage } from "next";
import styles from "./index.module.css";

const AgentTeamsPage: NextPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Expanded by default

  return (
    <Box className={styles.container}>
      <HeaderBar />
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
            marginLeft: isSidebarOpen ? "360px" : 0,
          }}
        >
          <AgentTeamsMain isSidebarOpen={isSidebarOpen} />
        </Box>
      </Flex>
    </Box>
  );
};

export default AgentTeamsPage;