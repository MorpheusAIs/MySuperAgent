import { AgentsButton } from '@/components/Agents/Button';
import { CdpWalletsButton } from '@/components/CdpWallets/Button';
import { StyledTooltip } from '@/components/Common/StyledTooltip';
import { DashboardButton } from '@/components/Dashboard/Button';
import { ModelSelectionButton } from '@/components/ModelSelection';
import { PrivyLoginButton } from '@/components/PrivyLoginButton';
import { ReferralsButton } from '@/components/Referrals/Button';
import { SettingsButton } from '@/components/Settings';
import { TeamsButton } from '@/components/Teams/Button';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { Box, Divider, Flex, Text, Tooltip } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  IconBrandDiscord,
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

const LetterIcon = ({ letter }: { letter: string }) => (
  <Box
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    width="20px"
    height="20px"
    borderRadius="4px"
    bg="rgba(255, 255, 255, 0.1)"
    color="white"
    fontSize="12px"
    fontWeight="bold"
  >
    {letter}
  </Box>
);

const ExternalLinkMenuItem = ({
  icon: Icon,
  letter,
  title,
  href,
}: {
  icon?: React.ElementType;
  letter?: string;
  title: string;
  href: string;
}) => (
  <div
    className={styles.externalMenuItem}
    onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
  >
    <Flex align="center" gap={3}>
      {letter ? (
        <LetterIcon letter={letter} />
      ) : (
        Icon && <Icon size={20} />
      )}
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
  const { isAuthenticated } = usePrivyAuth();

  // For wallet connection support alongside Privy, we can still check account but don't require it
  const WalletConnectWrapper = ({ children }: { children: (account: any) => React.ReactNode }) => {
    return (
      <ConnectButton.Custom>
        {({ account }) => children(account)}
      </ConnectButton.Custom>
    );
  };

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
          <WalletConnectWrapper>
            {(account) => {
              // Use Privy authentication OR wallet connection for access
              const hasAccess = isAuthenticated || !!account;
              
              return (
              <div className={styles.mainContent}>
                <MenuSection title="General">
                  <Tooltip
                    isDisabled={hasAccess}
                    label="Sign in to access dashboard features."
                    placement="right"
                  >
                    <div className={styles.menuItem}>
                      <Box
                        pointerEvents={hasAccess ? 'auto' : 'none'}
                        opacity={hasAccess ? 1 : 0.5}
                      >
                        <DashboardButton />
                      </Box>
                    </div>
                  </Tooltip>
                  <Tooltip
                    isDisabled={hasAccess}
                    label="Sign in to access referral system and earn bonus jobs."
                    placement="right"
                  >
                    <div className={styles.menuItem}>
                      <Box
                        pointerEvents={hasAccess ? 'auto' : 'none'}
                        opacity={hasAccess ? 1 : 0.5}
                      >
                        <ReferralsButton />
                      </Box>
                    </div>
                  </Tooltip>
                </MenuSection>

                <Divider my={0.5} borderColor="whiteAlpha.200" />

                <MenuSection title="Preferences">
                  <Tooltip
                    isDisabled={hasAccess}
                    label="Sign in to access personalized settings, scheduling preferences, and configurations."
                    placement="right"
                  >
                    <div className={styles.menuItem}>
                      <Box
                        pointerEvents={hasAccess ? 'auto' : 'none'}
                        opacity={hasAccess ? 1 : 0.5}
                      >
                        <SettingsButton />
                      </Box>
                    </div>
                  </Tooltip>
                  <Box className={styles.modelSelection}>
                    <ModelSelectionButton />
                  </Box>
                </MenuSection>

                <Divider my={0.5} borderColor="whiteAlpha.200" />

                <MenuSection title="Advanced">
                  <Tooltip
                    isDisabled={hasAccess}
                    label="Sign in to access advanced features like workflows, API integrations, device sync, and CDP wallets."
                    placement="right"
                  >
                    <div>
                      <Box
                        pointerEvents={hasAccess ? 'auto' : 'none'}
                        opacity={hasAccess ? 1 : 0.5}
                        pl={1}
                      >
                        <div className={styles.menuItem}>
                          <AgentsButton />
                        </div>
                        <div className={styles.menuItem}>
                          <TeamsButton />
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
                    letter="T"
                    title="Follow us on Twitter"
                    href="https://twitter.com/MorpheusAIs"
                  />
                  <ExternalLinkMenuItem
                    letter="G"
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
              );
            }}
          </WalletConnectWrapper>

          <div className={styles.footer}>
            <Box p={4}>
              <Box 
                bg="rgba(255, 255, 255, 0.02)" 
                borderRadius="12px" 
                border="1px solid rgba(255, 255, 255, 0.08)"
                p={3}
              >
                <PrivyLoginButton variant="sidebar" size="sm" />
              </Box>
            </Box>
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
