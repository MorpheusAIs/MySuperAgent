import React, { FC, useState, useEffect } from "react";
import {
  Textarea,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Text,
  Box,
} from "@chakra-ui/react";
import { FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { postTweet, regenerateTweet } from "@/components/Agents/Tweet/hooks";
import { getHttpClient } from "@/services/constants";
import styles from "./TweetMessage.module.css";

type TweetProps = {
  initialContent: string;
};

const MAX_TWEET_LENGTH = 280;

export const Tweet: FC<TweetProps> = ({ initialContent }) => {
  const [tweetContent, setTweetContent] = useState(initialContent);
  const [isTweeting, setIsTweeting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [charactersLeft, setCharactersLeft] = useState(
    MAX_TWEET_LENGTH - initialContent.length
  );
  useEffect(() => {
    if (tweetContent !== null && tweetContent !== undefined) {
      setCharactersLeft(MAX_TWEET_LENGTH - tweetContent.length);
    } else {
      setCharactersLeft(MAX_TWEET_LENGTH);
    }
  }, [tweetContent]);

  const handleTweet = async () => {
    setIsTweeting(true);
    const backendClient = getHttpClient();

    try {
      await postTweet(backendClient, tweetContent);
      setIsSuccess(true);
      setFeedbackMessage("Tweet sent successfully!");
    } catch (error) {
      console.error("Error sending tweet:", error);
      setIsSuccess(false);
      setFeedbackMessage("Failed to send tweet. Please try again.");
    } finally {
      setIsTweeting(false);
      onOpen();
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const backendClient = getHttpClient();

    try {
      const newTweet = await regenerateTweet(backendClient);
      setTweetContent(newTweet);
    } catch (error) {
      console.error("Error regenerating tweet:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Flex direction="column" align="center">
        <Textarea
          value={tweetContent}
          onChange={(e) => setTweetContent(e.target.value)}
          className={styles.textarea}
          maxLength={MAX_TWEET_LENGTH}
        />
        <Flex
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          mt={1}
          mb={2}
        >
          <Box>
            <Text
              fontSize="sm"
              className={styles.charactersLeft}
              color={charactersLeft < 0 ? "red.500" : "gray.500"}
            >
              {charactersLeft} characters left
            </Text>
          </Box>
          <Flex alignItems="center">
            {/* TODO: Fix Tweet regeneration */}
            {/* <Button
              leftIcon={<FaSync />}
              onClick={handleRegenerate}
              isLoading={isRegenerating}
              aria-label="Try again"
              size="sm"
              className={styles.regenerateButton}
            >
              <Text fontSize="sm" ml={2}>
                Try again
              </Text>
            </Button> */}
            <Button
              leftIcon={<FaPaperPlane />}
              onClick={handleTweet}
              isLoading={isTweeting}
              loadingText="Tweeting..."
              colorScheme="twitter"
              size="sm"
              className={styles.tweetButton}
              isDisabled={
                charactersLeft < 0 || !tweetContent || tweetContent.length === 0
              }
            >
              Post on X
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isSuccess ? "Success" : "Error"}</ModalHeader>
          <ModalBody>
            <Flex align="center">
              {isSuccess ? (
                <FaCheckCircle color="green" size={24} />
              ) : (
                <FaTimesCircle color="red" size={24} />
              )}
              <Text ml={3}>{feedbackMessage}</Text>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme={isSuccess ? "green" : "red"}
              mr={3}
              onClick={onClose}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
