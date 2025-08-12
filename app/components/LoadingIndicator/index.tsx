import React, { FC } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Loader } from "@/components/LoadingIndicator/Loader";
import styles from "./index.module.css";

export const LoadingIndicator: FC = () => {
  return (
    <Box className={styles.messageContainer}>
      <div className={styles.assistantContent}>
        <Text className={styles.agentName}>Thinking</Text>
        <Box className={styles.loaderWrapper}>
          <Loader />
        </Box>
      </div>
    </Box>
  );
};

export default LoadingIndicator;
