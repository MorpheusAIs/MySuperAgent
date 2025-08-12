import React, { FC } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import {
  Button,
  HStack,
  Text,
  Box,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon, CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import styles from "./CustomConnectButton.module.css";

export const CustomConnectButton: FC = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const toast = useToast();

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Address copied",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: err.toString(),
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "bottom",
        });
      }
    );
  };

  // Helper function to open explorer
  const openExplorer = (address: string, chainId: number) => {
    let explorerUrl = "";

    // Map chainId to explorer URL (add more chains as needed)
    switch (chainId) {
      case 1: // Ethereum Mainnet
        explorerUrl = `https://etherscan.io/address/${address}`;
        break;
      case 137: // Polygon
        explorerUrl = `https://polygonscan.com/address/${address}`;
        break;
      case 56: // BSC
        explorerUrl = `https://bscscan.com/address/${address}`;
        break;
      case 42161: // Arbitrum
        explorerUrl = `https://arbiscan.io/address/${address}`;
        break;
      case 10: // Optimism
        explorerUrl = `https://optimistic.etherscan.io/address/${address}`;
        break;
      default:
        // Fallback to Etherscan
        explorerUrl = `https://etherscan.io/address/${address}`;
    }

    window.open(explorerUrl, "_blank");
  };

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              className: styles.connectButtonHidden,
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className={styles.connectButton}
                    size={isMobile ? "sm" : "md"}
                  >
                    Connect Wallet
                  </Button>
                );
              }

              return (
                <HStack spacing={2}>
                  <Button
                    onClick={openChainModal}
                    className={styles.networkButton}
                    size={isMobile ? "sm" : "md"}
                    rightIcon={<ChevronDownIcon />}
                  >
                    {chain.hasIcon ? (
                      <Box className={styles.chainIconWrapper}>
                        {chain.iconUrl && (
                          <Box className={styles.chainIcon}>
                            <Avatar
                              size="xs"
                              src={chain.iconUrl}
                              name={chain.name}
                              className={styles.chainAvatar}
                            />
                          </Box>
                        )}
                      </Box>
                    ) : null}
                    <Text className={styles.chainName}>{chain.name}</Text>
                  </Button>

                  <Menu>
                    <MenuButton
                      as={Button}
                      className={styles.accountButton}
                      size={isMobile ? "sm" : "md"}
                      rightIcon={<ChevronDownIcon />}
                    >
                      <Text className={styles.accountText}>
                        {account.displayName}
                      </Text>
                    </MenuButton>
                    <MenuList className={styles.menuList}>
                      <MenuItem
                        className={styles.menuItem}
                        onClick={() =>
                          account.address && copyToClipboard(account.address)
                        }
                      >
                        <HStack spacing={2}>
                          <CopyIcon />
                          <Text>Copy Wallet Address</Text>
                        </HStack>
                      </MenuItem>
                      <MenuDivider className={styles.menuDivider} />
                      <MenuItem
                        className={styles.menuItem}
                        onClick={() =>
                          account.address &&
                          chain.id &&
                          openExplorer(account.address, chain.id)
                        }
                      >
                        <HStack spacing={2}>
                          <ExternalLinkIcon />
                          <Text>View on Explorer</Text>
                        </HStack>
                      </MenuItem>
                      <MenuDivider className={styles.menuDivider} />
                      <MenuItem
                        className={styles.menuItem}
                        onClick={openAccountModal}
                      >
                        <Text>Disconnect</Text>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
};
