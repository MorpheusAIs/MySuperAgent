import { useMetricsWhitelist } from '@/hooks/useMetricsWhitelist';
import { Flex, Text } from '@chakra-ui/react';
import { BarChart3 } from 'lucide-react';
import { useRouter } from 'next/router';
import React from 'react';
import styles from './Button.module.css';

export const MetricsButton: React.FC = () => {
  const router = useRouter();
  const { isWhitelisted, isLoading } = useMetricsWhitelist();

  const handleClick = () => {
    if (isWhitelisted) {
      router.push('/metrics');
    }
  };

  if (isLoading || !isWhitelisted) {
    return null;
  }

  return (
    <Flex
      as="button"
      align="center"
      gap={3}
      width="100%"
      onClick={handleClick}
      pl={1}
      className={styles.metricsButton}
      _hover={{ opacity: 0.8 }}
      cursor="pointer"
    >
      <BarChart3 className={styles.icon} size={20} />
      <Text fontSize="14px" color="white">
        Metrics
      </Text>
    </Flex>
  );
};
