import React from "react";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Input,
  Text,
} from "@chakra-ui/react";
import styles from "./index.module.css";
interface DeleteWalletDialogProps {
  isOpen: boolean;
  walletId: string;
  confirmText: string;
  onConfirmChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  cancelRef: React.RefObject<HTMLButtonElement>;
}

export const DeleteWalletDialog: React.FC<DeleteWalletDialogProps> = ({
  isOpen,
  walletId,
  confirmText,
  onConfirmChange,
  onClose,
  onConfirm,
  cancelRef,
}) => (
  <AlertDialog
    isOpen={isOpen}
    leastDestructiveRef={cancelRef}
    onClose={onClose}
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
              {walletId}
            </Text>
          </Text>
          <Input
            value={confirmText}
            onChange={(e) => onConfirmChange(e.target.value)}
            placeholder="Enter wallet ID to confirm"
            className={styles.deleteConfirmInput}
          />
        </AlertDialogBody>
        <AlertDialogFooter className={styles.deleteDialogFooter}>
          <Button
            ref={cancelRef}
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} className={styles.confirmDeleteButton}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogOverlay>
  </AlertDialog>
);
