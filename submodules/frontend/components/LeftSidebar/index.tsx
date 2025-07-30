import React, { FC, useState } from "react";
import {
  Box,
  Select,
  Text,
  VStack,
  Divider,
  Tooltip,
  Flex,
} from "@chakra-ui/react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconBrandDiscord,
  IconBrandTwitter,
  IconBrandGithub,
  IconQuestionMark,
  IconWorld,
} from "@tabler/icons-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Workflows } from "@/components/Workflows";
import { ApiCredentialsButton } from "@/components/Credentials/Button";
import { CDPWalletsButton } from "@/components/CDPWallets/Button";
import { SettingsButton } from "@/components/Settings";
import { SyncButton } from "@/components/Sync/Button";
import { StyledTooltip } from "../Common/StyledTooltip";
import styles from "./index.module.css";

export type LeftSidebarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: (open: boolean) => void;
};

const MenuSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box mb={2}>
    <Text
      color="gray.400"
      fontSize="sm"
      px={3}
      py={2}
      textTransform="uppercase"
    >
      {title}
    </Text>
    {children}
  </Box>
);

const ExternalLinkMenuItem = ({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
}) => (
  <div
    className={styles.externalMenuItem}
    onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
  >
    <Flex align="center" gap={3}>
      {Icon && <Icon size={20} />}
      <Text>{title}</Text>
    </Flex>
  </div>
);

export const LeftSidebar: FC<LeftSidebarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [selectedModel, setSelectedModel] = useState("llama3.2:3b");
  const ToggleIcon = isSidebarOpen ? IconChevronLeft : IconChevronRight;

  const modelOptions = [{ value: "llama3.3:70b", label: "Llama 3.3 (70B)" }];

  return (
    <div
      className={`${styles.sidebarContainer} ${
        !isSidebarOpen ? styles.collapsed : ""
      }`}
    >
      <div className={styles.sidebar}>
        <div className={styles.container}>
          <ConnectButton.Custom>
            {({ account }) => (
              <div className={styles.mainContent}>
                <MenuSection title="Basic">
                  <Tooltip
                    isDisabled={!!account}
                    label="Connect your wallet to access personalized settings and configurations. These settings are unique to each wallet address and help customize your experience."
                    placement="right"
                  >
                    <div className={styles.menuItem}>
                      <Box
                        pointerEvents={account ? "auto" : "none"}
                        opacity={account ? 1 : 0.5}
                      >
                        <SettingsButton />
                      </Box>
                    </div>
                  </Tooltip>
                </MenuSection>

                <Divider my={1} borderColor="whiteAlpha.200" />

                <MenuSection title="Advanced">
                  <Tooltip
                    isDisabled={!!account}
                    label="A wallet connection is required to access advanced features like workflows, API integrations, device sync, and CDP wallets."
                    placement="right"
                  >
                    <div>
                      <Box
                        pointerEvents={account ? "auto" : "none"}
                        opacity={account ? 1 : 0.5}
                        pl={1}
                      >
                        <StyledTooltip
                          label="Scheduled workflows that handle automated trades, swaps, and more are coming soon. Use cases include automated DCA strategies, signal-driven quant trading, and more"
                          placement="right"
                        >
                          <div className={styles.menuItem}>
                            <Workflows />
                          </div>
                        </StyledTooltip>
                        <div className={styles.menuItem}>
                          <ApiCredentialsButton />
                        </div>
                        <div className={styles.menuItem}>
                          <SyncButton />
                        </div>
                        <StyledTooltip
                          label="Coinbase Developer Platform's managed wallets integration coming soon. This will enable secure key management and automated CDP interactions such as trading, borrowing, and more."
                          placement="right"
                        >
                          <div className={styles.menuItem}>
                            <CDPWalletsButton />
                          </div>
                        </StyledTooltip>
                      </Box>
                    </div>
                  </Tooltip>
                </MenuSection>

                <Divider my={1} borderColor="whiteAlpha.200" />

                <MenuSection title="About">
                  <ExternalLinkMenuItem
                    icon={IconBrandDiscord}
                    title="Join our Discord community!"
                    href="https://discord.gg/Dc26EFb6JK"
                  />
                  <ExternalLinkMenuItem
                    icon={IconBrandTwitter}
                    title="Follow us on Twitter"
                    href="https://twitter.com/MorpheusAIs"
                  />
                  <ExternalLinkMenuItem
                    icon={IconBrandGithub}
                    title="Become a contributor"
                    href="https://github.com/MorpheusAIs/Docs"
                  />
                  <ExternalLinkMenuItem
                    icon={IconWorld}
                    title="Learn about Morpheus"
                    href="https://mor.org/"
                  />
                  <ExternalLinkMenuItem
                    icon={IconQuestionMark}
                    title="Help Center & FAQs"
                    href="https://morpheusai.gitbook.io/morpheus/faqs"
                  />
                </MenuSection>
              </div>
            )}
          </ConnectButton.Custom>

          <div className={styles.footer}>
            <VStack spacing={4} align="stretch" width="100%">
              <Box width="100%">
                <Box className={styles.modelSelection}>
                  <Text className={styles.modelLabel}>Model:</Text>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={styles.modelSelect}
                  >
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>
                <div className={styles.creditsContainer}>
                  <Text className={styles.creditsLabel}>Morpheus Credits Balance</Text>
                  <Text className={styles.creditsAmount}>1,250 MOR</Text>
                </div>
              </Box>
            </VStack>

            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                    className={styles.connectButtonWrapper}
                  >
                    <div
                      className={styles.profileContainer}
                      onClick={connected ? openAccountModal : openConnectModal}
                    >
                      <div className={styles.accountInfo}>
                        {connected
                          ? "Active session logged in as " + account.displayName
                          : "Connect Wallet to Enable Full Functionality"}
                      </div>
                    </div>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>

      <button
        className={styles.toggleButton}
        onClick={() => onToggleSidebar(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <ToggleIcon size={20} />
      </button>
    </div>
  );
};
