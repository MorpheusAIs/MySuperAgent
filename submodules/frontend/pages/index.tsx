import type { NextPage } from "next";
import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { Chat } from "@/components/Chat";
import { useState } from "react";
import { HeaderBar } from "@/components/HeaderBar";
import { ChatProviderDB } from "@/contexts/chat/ChatProviderDB";
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
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box className={styles.container}>
      <HeaderBar />
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
          <Chat isSidebarOpen={isSidebarOpen} />
        </Box>
      </Flex>
    </Box>
  );
};

export default HomeWithProvider;
