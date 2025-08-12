import React from "react";
import { VStack, FormControl, FormLabel, Button } from "@chakra-ui/react";
import styles from "./index.module.css";

interface RestoreWalletFormProps {
  walletFile: File | null;
  onFileChange: (file: File) => void;
  onSubmit: () => void;
}

export const RestoreWalletForm: React.FC<RestoreWalletFormProps> = ({
  walletFile,
  onFileChange,
  onSubmit,
}) => (
  <VStack spacing={4} className={styles.restoreWalletForm}>
    <FormControl>
      <FormLabel className={styles.formLabel}>Upload Wallet File</FormLabel>
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
              onFileChange(e.target.files[0]);
            }
          }}
        />
      </Button>
    </FormControl>
    <Button className={styles.submitButton} onClick={onSubmit}>
      Restore Wallet
    </Button>
  </VStack>
);
