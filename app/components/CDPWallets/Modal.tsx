import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  useToast,
  Input,
  Select,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { Copy, Download, Star, Trash2 } from "lucide-react";
import styles from "./CDPWallets.module.css";

const NETWORKS = [
  "base-mainnet",
  "base-sepolia",
  "base-goerli",
  "ethereum-mainnet",
  "ethereum-goerli",
  "ethereum-sepolia",
];

interface CDPWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Wallet {
  wallet_id: string;
  network_id: string;
  address: string;
}

export const CDPWalletsModal: React.FC<CDPWalletsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [walletFile, setWalletFile] = useState<File | null>(null);
  const [walletToDelete, setWalletToDelete] = useState("");
  const [confirmWalletId, setConfirmWalletId] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const fetchWallets = useCallback(async () => {
    try {
      const [walletsResponse, activeWalletResponse] = await Promise.all([
        fetch("/api/wallets/list"),
        fetch("/api/wallets/active"),
      ]);

      const walletsData = await walletsResponse.json();
      const activeData = await activeWalletResponse.json();

      setWallets(walletsData.wallets || []);
      setActiveWallet(activeData.active_wallet_id);
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWallets();
    }
  }, [isOpen, fetchWallets]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      status: "success",
      duration: 2000,
      position: "top-right",
    });
  };

  const handleSetActiveWallet = async (walletId: string) => {
    try {
      const response = await fetch("/api/wallets/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_id: walletId }),
      });

      if (response.ok) {
        setActiveWallet(walletId);
        toast({
          title: "Active wallet set",
          status: "success",
          duration: 2000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error setting active wallet:", error);
    }
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      toast({
        title: "Please enter a wallet name",
        status: "warning",
        duration: 2000,
        position: "top-right",
      });
      return;
    }

    try {
      const response = await fetch("/api/wallets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_id: newWalletName,
          network_id: selectedNetwork,
          set_active: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet created",
          status: "success",
          duration: 2000,
          position: "top-right",
        });
        setNewWalletName("");
        fetchWallets();
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
    }
  };

  const handleRestoreWallet = async () => {
    if (!walletFile) {
      toast({
        title: "Please select a wallet file",
        status: "warning",
        duration: 2000,
        position: "top-right",
      });
      return;
    }

    try {
      const fileContent = await walletFile.text();
      const walletData = JSON.parse(fileContent);

      const response = await fetch("/api/wallets/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_id: walletData.wallet_id,
          wallet_data: walletData,
          set_active: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Wallet restored",
          status: "success",
          duration: 2000,
          position: "top-right",
        });
        setWalletFile(null);
        fetchWallets();
      }
    } catch (error) {
      console.error("Error restoring wallet:", error);
    }
  };

  const handleDownloadWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/export/${walletId}`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${walletId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Wallet exported",
          status: "success",
          duration: 2000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error exporting wallet:", error);
    }
  };

  const handleDeleteWallet = async () => {
    if (confirmWalletId !== walletToDelete) {
      toast({
        title: "Wallet ID doesn't match",
        status: "error",
        duration: 2000,
        position: "top-right",
      });
      return;
    }

    try {
      const response = await fetch(`/api/wallets/${walletToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Wallet deleted",
          status: "success",
          duration: 2000,
          position: "top-right",
        });
        setIsDeleteOpen(false);
        setConfirmWalletId("");
        setWalletToDelete("");
        fetchWallets();
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} motionPreset="none">
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent
          position="fixed"
          left="16px"
          top="70px"
          margin={0}
          width="344px"
          maxHeight="calc(100vh - 86px)"
          bg="#080808"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
        >
          <ModalHeader
            borderBottom="1px solid rgba(255, 255, 255, 0.1)"
            padding="16px"
            color="white"
            fontSize="16px"
            fontWeight="500"
          >
            CDP Wallet Management
          </ModalHeader>

          <ModalCloseButton
            color="white"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          />

          <ModalBody padding="16px">
            <Tabs>
              <TabList mb={4} gap={2} borderBottom="none">
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Wallets
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Create
                </Tab>
                <Tab
                  color="white"
                  bg="transparent"
                  _selected={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                  }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.05)",
                  }}
                  borderRadius="6px"
                  fontSize="14px"
                >
                  Restore
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0}>
                  <VStack spacing={3} align="stretch">
                    {wallets.map((wallet) => (
                      <Box key={wallet.wallet_id} className={styles.walletItem}>
                        <VStack align="start" spacing={1}>
                          <Text className={styles.walletName}>
                            {wallet.wallet_id}
                          </Text>
                          <Text className={styles.networkId}>
                            {wallet.network_id}
                          </Text>
                          <Text className={styles.address}>
                            {wallet.address}
                          </Text>
                        </VStack>
                        <HStack className={styles.actions}>
                          <Button
                            onClick={() => handleCopyAddress(wallet.address)}
                            className={`${styles.actionButton} ${styles.copyButton}`}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            onClick={() =>
                              handleSetActiveWallet(wallet.wallet_id)
                            }
                            className={`${styles.actionButton} ${
                              styles.starButton
                            } ${
                              activeWallet === wallet.wallet_id
                                ? styles.active
                                : ""
                            }`}
                          >
                            <Star size={16} />
                          </Button>
                          <Button
                            onClick={() =>
                              handleDownloadWallet(wallet.wallet_id)
                            }
                            className={`${styles.actionButton} ${styles.downloadButton}`}
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            onClick={() => {
                              setWalletToDelete(wallet.wallet_id);
                              setIsDeleteOpen(true);
                            }}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                    {wallets.length === 0 && (
                      <Text className={styles.emptyState}>
                        No wallets created yet
                      </Text>
                    )}
                  </VStack>
                </TabPanel>
                <TabPanel p={0}>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel className={styles.label}>
                        Wallet Name
                      </FormLabel>
                      <Input
                        value={newWalletName}
                        onChange={(e) => setNewWalletName(e.target.value)}
                        placeholder="Enter wallet name"
                        className={styles.input}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel className={styles.label}>Network</FormLabel>
                      <Select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                        className={styles.select}
                      >
                        {NETWORKS.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      onClick={handleCreateWallet}
                      className={styles.submitButton}
                    >
                      Create Wallet
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel p={0}>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel className={styles.label}>
                        Upload Wallet File
                      </FormLabel>
                      <Button
                        as="label"
                        htmlFor="file-upload"
                        className={styles.fileUploadButton}
                      >
                        {walletFile ? walletFile.name : "Choose wallet file"}
                        <input
                          id="file-upload"
                          type="file"
                          accept=".json"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files) {
                              setWalletFile(e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                    </FormControl>
                    <Button
                      onClick={handleRestoreWallet}
                      className={styles.submitButton}
                    >
                      Restore Wallet
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteOpen(false);
          setConfirmWalletId("");
          setWalletToDelete("");
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent className={styles.deleteDialog}>
            <AlertDialogHeader className={styles.deleteDialogHeader}>
              Delete Wallet
            </AlertDialogHeader>

            <AlertDialogBody className={styles.deleteDialogBody}>
              <Text className={styles.deleteConfirmText}>
                To confirm deletion, please type the wallet ID:{" "}
                <Text as="span" fontWeight="bold">
                  {walletToDelete}
                </Text>
              </Text>
              <Input
                value={confirmWalletId}
                onChange={(e) => setConfirmWalletId(e.target.value)}
                placeholder="Enter wallet ID to confirm"
                className={styles.deleteConfirmInput}
              />
            </AlertDialogBody>

            <AlertDialogFooter className={styles.deleteDialogFooter}>
              <Button
                ref={cancelRef}
                onClick={() => setIsDeleteOpen(false)}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteWallet}
                className={styles.confirmDeleteButton}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
