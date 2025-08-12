import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Text,
  Flex,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import {
  IconDotsVertical,
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
import styles from "./ProfileMenu.module.css";
import { StyledTooltip } from "../Common/StyledTooltip";

const MenuSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box mb={4}>
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
  <MenuItem
    className={styles.externalMenuItem}
    onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
  >
    <Flex align="center" gap={3}>
      {Icon && <Icon size={20} />}
      <Text>{title}</Text>
    </Flex>
  </MenuItem>
);

export const ProfileMenu = () => {
  return (
    <Menu>
      <MenuButton as={Box} className={styles.profileButton} width="100%">
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
                <div className={styles.profileContainer}>
                  <div
                    className={styles.accountInfo}
                    onClick={connected ? openAccountModal : openConnectModal}
                  >
                    {connected
                      ? "Active session logged in as " + account.displayName
                      : "Connect Wallet to Enable Full Functionality"}
                  </div>
                  <IconDotsVertical size={16} className={styles.menuIcon} />
                </div>
              </div>
            );
          }}
        </ConnectButton.Custom>
      </MenuButton>

      <MenuList className={styles.profileMenu}>
        <MenuSection title="Basic">
          <ConnectButton.Custom>
            {({ account }) => (
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
            )}
          </ConnectButton.Custom>
        </MenuSection>

        <Divider my={2} borderColor="whiteAlpha.200" />

        <MenuSection title="Advanced">
          <ConnectButton.Custom>
            {({ account }) => (
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
            )}
          </ConnectButton.Custom>
        </MenuSection>

        <Divider my={2} borderColor="whiteAlpha.200" />

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
      </MenuList>
    </Menu>
  );
};
