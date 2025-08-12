import React, { FC } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import styles from "./ImageDisplayMessage.module.css";

type ImageDisplayProps = {
  imageMetadata: {
    service?: string;
    image?: string;
    success?: boolean;
  };
};

export const ImageDisplay: FC<ImageDisplayProps> = ({ imageMetadata }) => {
  if (!imageMetadata.success || !imageMetadata.image) {
    return (
      <Flex className={styles.loadingContainer}>
        <Text>Failed to generate image</Text>
      </Flex>
    );
  }

  return (
    <Box className={styles.imageContainer}>
      <Image
        src={`data:image/png;base64,${imageMetadata.image}`}
        alt="Generated image"
        className={styles.generatedImage}
      />
      <Text className={styles.serviceTag}>
        Generated with {imageMetadata.service}
      </Text>
    </Box>
  );
};
