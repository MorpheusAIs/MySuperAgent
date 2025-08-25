import { AgentsButton } from '@/components/Agents/Button';
import { CdpWalletsButton } from '@/components/CdpWallets/Button';
import { StyledTooltip } from '@/components/Common/StyledTooltip';
import { ApiCredentialsButton } from '@/components/Credentials/Button';
import { DashboardButton } from '@/components/Dashboard/Button';
import { SettingsButton } from '@/components/Settings';
import { SyncButton } from '@/components/Sync/Button';
import { TeamsButton } from '@/components/Teams/Button';
import { ToolsButton } from '@/components/Tools/Button';
import { SchedulingPreferencesButton } from '@/components/UserPreferences/Button';
import { Box, Divider, Flex, Text, Tooltip } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  IconBrandDiscord,
  IconBrandGithub,
  IconBrandTwitter,
  IconChevronLeft,
  IconChevronRight,
  IconQuestionMark,
  IconWorld,
} from '@tabler/icons-react';
import React, { FC } from 'react';
import styles from './index.module.css';

export type LeftSidebarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: (open: boolean) => void;
  isHeaderVisible?: boolean;
};

const MenuSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box mb={1}>
    <Text
      color="gray.400"
      fontSize="xs"
      px={3}
      py={1}
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
    onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
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
  isHeaderVisible = true,
}) => {
  const ToggleIcon = isSidebarOpen ? IconChevronLeft : IconChevronRight;

  return (
    <div
      className={`${styles.sidebarContainer} ${
        !isSidebarOpen ? styles.collapsed : ''
      }`}
    >
      <div className={styles.sidebar}>
        <div
          className={styles.container}
          style={{
            paddingTop: isHeaderVisible ? '70px' : '16px',
            transition: 'padding-top 0.3s ease',
          }}
        >
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
                        pointerEvents={account ? 'auto' : 'none'}
                        opacity={account ? 1 : 0.5}
                      >
                        <SettingsButton />
                      </Box>
                    </div>
                  </Tooltip>
                  <Tooltip
                    isDisabled={!!account}
                    label="Configure your default scheduling preferences and job automation settings. Requires wallet connection for personalized settings."
                    placement="right"
                  >
                    <div className={styles.menuItem}>
                      <Box
                        pointerEvents={account ? 'auto' : 'none'}
                        opacity={account ? 1 : 0.5}
                      >
                        <SchedulingPreferencesButton />
                      </Box>
                    </div>
                  </Tooltip>
                </MenuSection>

                <Divider my={0.5} borderColor="whiteAlpha.200" />

                <MenuSection title="Advanced">
                  <Tooltip
                    isDisabled={!!account}
                    label="A wallet connection is required to access advanced features like workflows, API integrations, device sync, and CDP wallets."
                    placement="right"
                  >
                    <div>
                      <Box
                        pointerEvents={account ? 'auto' : 'none'}
                        opacity={account ? 1 : 0.5}
                        pl={1}
                      >
                        <div className={styles.menuItem}>
                          <DashboardButton />
                        </div>
                        <div className={styles.menuItem}>
                          <ToolsButton />
                        </div>
                        <div className={styles.menuItem}>
                          <AgentsButton />
                        </div>
                        <div className={styles.menuItem}>
                          <TeamsButton />
                        </div>
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
                            <CdpWalletsButton />
                          </div>
                        </StyledTooltip>
                      </Box>
                    </div>
                  </Tooltip>
                </MenuSection>

                <Divider my={0.5} borderColor="whiteAlpha.200" />

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
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
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
                          ? 'Active session logged in as ' + account.displayName
                          : 'Connect Wallet to Enable Full Functionality'}
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
        style={{
          top: isHeaderVisible ? '72px' : '16px',
          transition: 'top 0.3s ease',
        }}
        onClick={() => onToggleSidebar(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <ToggleIcon size={20} />
      </button>
    </div>
  );
};
