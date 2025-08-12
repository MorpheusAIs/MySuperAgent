import { Chat } from "@/components/Chat";
import { HeaderBar } from "@/components/HeaderBar";
import { LeftSidebar } from "@/components/LeftSidebar";
import { ChatProviderDB } from "@/contexts/chat/ChatProviderDB";
import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import type { NextPage } from "next";
import { useState } from "react";
import styles from "./index.module.css";

// Wrapper with provider
const HomeWithProvider: NextPage = () => {
  return (
    <ChatProviderDB>
      <Home />
    </ChatProviderDB>
  );
};

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"chat" | "jobs">("jobs");
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleBackToJobs = () => {
    setCurrentView("jobs");
  };

  return (
    <Box className={styles.container}>
      <HeaderBar
        onBackToJobs={currentView === "chat" ? handleBackToJobs : undefined}
      />
      <Flex className={styles.contentWrapper}>
        <Box
          className={styles.sidebarWrapper}
          style={{
            position: isMobile ? "absolute" : "relative",
            transform: isMobile
              ? `translateX(${isSidebarOpen ? "0" : "-100%"})`
              : "none",
          }}
          zIndex="1337"
        >
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setIsSidebarOpen}
          />
        </Box>

        <Box
          className={styles.chatWrapper}
          style={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? "240px" : 0,
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
