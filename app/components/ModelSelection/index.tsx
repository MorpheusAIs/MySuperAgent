import { Box, Flex, Select, Text } from '@chakra-ui/react';
import { Cpu } from 'lucide-react';
import React, { useState } from 'react';
import styles from './index.module.css';

export const ModelSelectionButton: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('llama3.3:70b');
  const modelOptions = [{ value: 'llama3.3:70b', label: 'Llama 3.3 70B (Web Enabled)' }];

  return (
    <Box p={3} className={styles.container}>
      <Flex direction="column" gap={2}>
        <Flex align="center" gap={2} mb={1}>
          <Cpu size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text fontSize="12px" color="rgba(255, 255, 255, 0.7)" textTransform="uppercase">
            Model
          </Text>
        </Flex>
        <Select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          size="sm"
          bg="#27292c"
          color="white"
          borderColor="rgba(255, 255, 255, 0.1)"
          _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
          _focus={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            boxShadow: 'none',
          }}
          borderRadius="6px"
          fontSize="13px"
          height="32px"
          fontWeight="400"
        >
          {modelOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              style={{ background: '#27292c', color: 'white' }}
            >
              {option.label}
            </option>
          ))}
        </Select>
      </Flex>
    </Box>
  );
};