import { HeaderBar } from '@/components/HeaderBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { usePrivyAuth } from '@/contexts/auth/PrivyAuthProvider';
import { useGlobalUI } from '@/contexts/GlobalSearchProvider';
import { Alert, AlertIcon, Box, Flex, Spinner, Text } from '@chakra-ui/react';
import axios from 'axios';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import styles from './index.module.css';

// Dynamically import MetricsDashboard with SSR disabled
const MetricsDashboard = dynamic(
  () =>
    import('@/components/Metrics/Dashboard').then(
      (mod) => mod.MetricsDashboard
    ),
  { ssr: false }
);

const MetricsPage: NextPage = () => {
  const { isSidebarOpen, setSidebarOpen } = useGlobalUI();
  const router = useRouter();
  const { userEmail, userWallet, isAuthenticated } = usePrivyAuth();
  const { address } = useAccount();
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated && !address) {
        setIsWhitelisted(false);
        setIsLoading(false);
        return;
      }

      try {
        const email = userEmail || null;
        const walletID = userWallet || address || null;

        // Check whitelist
        const whitelistResponse = await axios.get(
          '/api/metrics/whitelist-check',
          {
            params: { email, walletID },
            headers: {
              'x-user-email': email || '',
              'x-wallet-address': walletID || '',
            },
          }
        );

        if (!whitelistResponse.data.isWhitelisted) {
          setIsWhitelisted(false);
          setIsLoading(false);
          return;
        }

        setIsWhitelisted(true);

        // Fetch metrics data
        const metricsResponse = await axios.get('/api/metrics', {
          params: { email, walletID },
          headers: {
            'x-user-email': email || '',
            'x-wallet-address': walletID || '',
          },
        });

        setMetricsData(metricsResponse.data);
      } catch (err: any) {
        console.error('Error loading metrics:', err);
        if (err.response?.status === 403) {
          setIsWhitelisted(false);
        } else {
          setError(err.response?.data?.error || 'Failed to load metrics');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, userEmail, userWallet, address]);

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <HeaderBar />
        <Flex
          className={styles.contentWrapper}
          justify="center"
          align="center"
          minH="100vh"
        >
          <Spinner size="xl" color="green.400" />
        </Flex>
      </Box>
    );
  }

  if (isWhitelisted === false) {
    return (
      <Box className={styles.container}>
        <HeaderBar />
        <Flex
          className={styles.contentWrapper}
          justify="center"
          align="center"
          minH="100vh"
        >
          <Alert status="error" maxW="600px">
            <AlertIcon />
            <Text>
              Access denied. You are not whitelisted for metrics access.
            </Text>
          </Alert>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={styles.container}>
        <HeaderBar />
        <Flex
          className={styles.contentWrapper}
          justify="center"
          align="center"
          minH="100vh"
        >
          <Alert status="error" maxW="600px">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        </Flex>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <HeaderBar />
      <Flex className={styles.contentWrapper}>
        <Box className={styles.sidebarWrapper} zIndex="1337">
          <LeftSidebar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setSidebarOpen}
          />
        </Box>

        <Box
          className={styles.chatWrapper}
          style={{
            marginLeft: isSidebarOpen ? '360px' : 0,
          }}
        >
          {metricsData && <MetricsDashboard data={metricsData} />}
        </Box>
      </Flex>
    </Box>
  );
};

export default MetricsPage;
