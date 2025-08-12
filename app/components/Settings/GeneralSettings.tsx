import { useState } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Button,
} from "@chakra-ui/react";
import styles from "./GeneralSettings.module.css";

interface GeneralSettingsProps {
  onSave: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    aiPersonality: "",
    bio: "",
  });

  const handleSave = () => {
    console.log("Saving general settings:", settings);
    onSave();
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel className={styles.label}>
          Give your AI a personality
        </FormLabel>
        <Textarea
          value={settings.aiPersonality}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, aiPersonality: e.target.value }))
          }
          placeholder="Describe how you want your AI assistant to behave"
          rows={4}
          className={styles.textarea}
        />
      </FormControl>

      <FormControl>
        <FormLabel className={styles.label}>Tell us about yourself</FormLabel>
        <Textarea
          value={settings.bio}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, bio: e.target.value }))
          }
          placeholder="Share a bit about yourself"
          rows={4}
          className={styles.textarea}
        />
      </FormControl>

      <Button onClick={handleSave} className={styles.saveButton}>
        Save Settings
      </Button>
    </VStack>
  );
};
