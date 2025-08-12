// CDPWallets.tsx
import React, { useState, useEffect } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  Box,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useWallets, NETWORKS } from "./useWallets";
import { WalletItem } from "./WalletItem";
import { CreateWalletForm } from "./CreateWalletForm";
import { RestoreWalletForm } from "./RestoreWalletForm";
import { DeleteWalletDialog } from "./DeleteWalletDialog";
import { trackEvent } from "@/services/analytics";
import styles from "./index.module.css";

export const CDPWallets: React.FC = () => {
  // Form state
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [walletFile, setWalletFile] = useState<File | null>(null);
  const [walletToDelete, setWalletToDelete] = useState("");
  const [confirmWalletId, setConfirmWalletId] = useState("");

  // Dialog management
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isMenuOpen,
    onClose: closeMenu,
    onOpen: openMenu,
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Wallet operations
  const {
    wallets,
    activeWallet,
    fetchWallets,
    handleCopyAddress,
    handleSetActiveWallet,
    handleCreateWallet,
    handleRestoreWallet,
    handleDownloadWallet,
    handleDeleteWallet,
  } = useWallets();

  // Initial fetch
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Form submission handlers
  const onCreateWallet = async () => {
    try {
      await handleCreateWallet(newWalletName, selectedNetwork);
      onClose();
      setNewWalletName("");
    } catch (error) {
      console.error("Failed to create wallet:", error);
    }
  };

  const onRestoreWallet = async () => {
    if (!walletFile) return;
    try {
      await handleRestoreWallet(walletFile);
      onClose();
      setWalletFile(null);
    } catch (error) {
      console.error("Failed to restore wallet:", error);
    }
  };

  const onDeleteWallet = async () => {
    try {
      await handleDeleteWallet(walletToDelete, confirmWalletId);
      onDeleteClose();
      setConfirmWalletId("");
      setWalletToDelete("");
    } catch (error) {
      console.error("Failed to delete wallet:", error);
    }
  };

  return (
    <>
      <Menu isOpen={isMenuOpen} onClose={closeMenu} onOpen={openMenu}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          className={styles.menuButton}
        >
          CDP Wallets
        </MenuButton>
        <MenuList className={styles.menuList}>
          <Box className={styles.createButtonWrapper}>
            <Button
              className={styles.createButton}
              onClick={() => {
                closeMenu();
                onOpen();
              }}
            >
              Create New Wallet
            </Button>
          </Box>
          <Divider className={styles.divider} />
          {wallets.length > 0 ? (
            wallets.map((wallet) => (
              <WalletItem
                key={wallet.wallet_id}
                wallet={wallet}
                isActive={activeWallet === wallet.wallet_id}
                onCopy={handleCopyAddress}
                onSetActive={handleSetActiveWallet}
                onDownload={handleDownloadWallet}
                onDelete={(id) => {
                  setWalletToDelete(id);
                  onDeleteOpen();
                }}
              />
            ))
          ) : (
            <Box className={styles.emptyState}>
              <Text>No wallets created yet</Text>
            </Box>
          )}
        </MenuList>
      </Menu>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent className={styles.modalContent}>
          <ModalHeader className={styles.modalHeader}>
            CDP Wallet Management
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className={styles.modalBody}>
            <Tabs isFitted variant="enclosed" className={styles.tabs}>
              <TabList className={styles.tabList}>
                <Tab className={styles.tab}>Create New</Tab>
                <Tab className={styles.tab}>Restore Existing</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <CreateWalletForm
                    walletName={newWalletName}
                    selectedNetwork={selectedNetwork}
                    networks={NETWORKS}
                    onWalletNameChange={setNewWalletName}
                    onNetworkChange={setSelectedNetwork}
                    onSubmit={onCreateWallet}
                  />
                </TabPanel>
                <TabPanel>
                  <RestoreWalletForm
                    walletFile={walletFile}
                    onFileChange={setWalletFile}
                    onSubmit={onRestoreWallet}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <DeleteWalletDialog
        isOpen={isDeleteOpen}
        walletId={walletToDelete}
        confirmText={confirmWalletId}
        onConfirmChange={setConfirmWalletId}
        onClose={() => {
          onDeleteClose();
          setConfirmWalletId("");
          setWalletToDelete("");
        }}
        onConfirm={onDeleteWallet}
        cancelRef={cancelRef}
      />
    </>
  );
};
