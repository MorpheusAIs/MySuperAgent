import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
} from "@chakra-ui/react";
import styles from "./index.module.css";
interface CreateWalletFormProps {
  walletName: string;
  selectedNetwork: string;
  networks: string[];
  onWalletNameChange: (value: string) => void;
  onNetworkChange: (value: string) => void;
  onSubmit: () => void;
}

export const CreateWalletForm: React.FC<CreateWalletFormProps> = ({
  walletName,
  selectedNetwork,
  networks,
  onWalletNameChange,
  onNetworkChange,
  onSubmit,
}) => (
  <VStack spacing={4} className={styles.createWalletForm}>
    <FormControl>
      <FormLabel className={styles.formLabel}>Wallet Name</FormLabel>
      <Input
        className={styles.input}
        placeholder="Enter wallet name"
        value={walletName}
        onChange={(e) => onWalletNameChange(e.target.value)}
      />
    </FormControl>
    <FormControl>
      <FormLabel className={styles.formLabel}>Network</FormLabel>
      <Select
        className={styles.select}
        value={selectedNetwork}
        onChange={(e) => onNetworkChange(e.target.value)}
      >
        {networks.map((network) => (
          <option key={network} value={network}>
            {network}
          </option>
        ))}
      </Select>
    </FormControl>
    <Button className={styles.submitButton} onClick={onSubmit}>
      Create Wallet
    </Button>
  </VStack>
);
