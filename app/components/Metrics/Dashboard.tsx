import {
  Box,
  Container,
  Divider,
  Heading,
  SimpleGrid,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

interface MetricsDashboardProps {
  data: {
    jobs: {
      dailyCounts: Array<{ date: string; count: number }>;
      statusDistribution: Array<{ status: string; count: number }>;
      total: number;
      today: number;
      growthRate: number;
      last7DaysTotal: number;
      previous7DaysTotal: number;
    };
    users: {
      unique: number;
    };
    mcp: {
      serverUsage: Array<{ server_name: string; usage_count: number }>;
      toolUsage: Array<{ tool_name: string; usage_count: number }>;
      serverAdoption: Array<{
        server_name: string;
        user_count: number;
        tool_count: number;
      }>;
      totalServers: number;
      totalTools: number;
      usageLast30Days: number;
    };
    agents: {
      usage: Array<{ agent_name: string; usage_count: number }>;
    };
    vercel?: {
      pageViews?: {
        total: number;
        last24Hours: number;
        last7Days: number;
        last30Days: number;
      };
      uniqueVisitors?: {
        total: number;
        last24Hours: number;
        last7Days: number;
        last30Days: number;
      };
      topPages?: Array<{ path: string; views: number }>;
      referrers?: Array<{ referrer: string; views: number }>;
      countries?: Array<{ country: string; views: number }>;
      devices?: Array<{ device: string; views: number }>;
      browsers?: Array<{ browser: string; views: number }>;
      note?: string;
    } | null;
    timestamp: string;
  };
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  const { jobs, users, mcp, agents } = data;

  // Prepare data for tables
  const topMCPTools = (mcp.toolUsage || []).slice(0, 10);
  const topAgents = (agents.usage || []).slice(0, 10);
  const statusData = jobs.statusDistribution || [];

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color="white" mb={2}>
            Metrics Dashboard
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </Text>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Stat
            bg="rgba(255, 255, 255, 0.05)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <StatLabel color="gray.400">Total Jobs</StatLabel>
            <StatNumber color="white">{jobs.total.toLocaleString()}</StatNumber>
            <StatHelpText color="gray.500">
              <StatArrow type="increase" />
              {jobs.today} today
            </StatHelpText>
          </Stat>

          <Stat
            bg="rgba(255, 255, 255, 0.05)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <StatLabel color="gray.400">Unique Users</StatLabel>
            <StatNumber color="white">
              {users.unique.toLocaleString()}
            </StatNumber>
          </Stat>

          <Stat
            bg="rgba(255, 255, 255, 0.05)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <StatLabel color="gray.400">Job Growth Rate</StatLabel>
            <StatNumber color="white">
              {jobs.growthRate > 0 ? '+' : ''}
              {jobs.growthRate.toFixed(1)}%
            </StatNumber>
            <StatHelpText color="gray.500">
              Last 7 days vs previous 7 days
            </StatHelpText>
          </Stat>

          <Stat
            bg="rgba(255, 255, 255, 0.05)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <StatLabel color="gray.400">MCP Servers</StatLabel>
            <StatNumber color="white">{mcp.totalServers}</StatNumber>
            <StatHelpText color="gray.500">
              {mcp.totalTools} total tools
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Divider borderColor="rgba(255, 255, 255, 0.1)" />

        {/* Job Status Distribution Table */}
        <Box
          bg="rgba(255, 255, 255, 0.05)"
          p={6}
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <Heading size="md" color="white" mb={4}>
            Job Status Distribution
          </Heading>
          <TableContainer>
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th color="gray.300">Status</Th>
                  <Th color="gray.300" isNumeric>
                    Count
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {statusData.length > 0 ? (
                  statusData.map((item) => (
                    <Tr key={item.status}>
                      <Td color="white">{item.status}</Td>
                      <Td color="white" isNumeric>
                        {item.count.toLocaleString()}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={2} color="gray.500" textAlign="center">
                      No status data available
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Top MCP Tools Table */}
          <Box
            bg="rgba(255, 255, 255, 0.05)"
            p={6}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Heading size="md" color="white" mb={4}>
              Top MCP Tools by Usage
            </Heading>
            <TableContainer>
              <Table variant="simple" colorScheme="whiteAlpha">
                <Thead>
                  <Tr>
                    <Th color="gray.300">Tool Name</Th>
                    <Th color="gray.300" isNumeric>
                      Usage Count
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topMCPTools.length > 0 ? (
                    topMCPTools.map((tool) => (
                      <Tr key={tool.tool_name}>
                        <Td color="white">{tool.tool_name}</Td>
                        <Td color="white" isNumeric>
                          {tool.usage_count.toLocaleString()}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={2} color="gray.500" textAlign="center">
                        No MCP tool usage data
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Top Agents Table */}
          <Box
            bg="rgba(255, 255, 255, 0.05)"
            p={6}
            borderRadius="lg"
            border="1px solid rgba(255, 255, 255, 0.1)"
          >
            <Heading size="md" color="white" mb={4}>
              Top Agents by Usage
            </Heading>
            <TableContainer>
              <Table variant="simple" colorScheme="whiteAlpha">
                <Thead>
                  <Tr>
                    <Th color="gray.300">Agent Name</Th>
                    <Th color="gray.300" isNumeric>
                      Usage Count
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {topAgents.length > 0 ? (
                    topAgents.map((agent) => (
                      <Tr key={agent.agent_name}>
                        <Td color="white">{agent.agent_name}</Td>
                        <Td color="white" isNumeric>
                          {agent.usage_count.toLocaleString()}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={2} color="gray.500" textAlign="center">
                        No agent usage data
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </SimpleGrid>

        {/* MCP Server Adoption Table */}
        <Box
          bg="rgba(255, 255, 255, 0.05)"
          p={6}
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <Heading size="md" color="white" mb={4}>
            MCP Server Adoption
          </Heading>
          <TableContainer>
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th color="gray.300">Server Name</Th>
                  <Th color="gray.300" isNumeric>
                    Users
                  </Th>
                  <Th color="gray.300" isNumeric>
                    Tools
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {mcp.serverAdoption.length > 0 ? (
                  mcp.serverAdoption.map((server) => (
                    <Tr key={server.server_name}>
                      <Td color="white">{server.server_name}</Td>
                      <Td color="white" isNumeric>
                        {server.user_count.toLocaleString()}
                      </Td>
                      <Td color="white" isNumeric>
                        {server.tool_count.toLocaleString()}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={3} color="gray.500" textAlign="center">
                      No MCP server adoption data
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Vercel Metrics */}
        <Divider borderColor="rgba(255, 255, 255, 0.1)" />
        <Box
          bg="rgba(255, 255, 255, 0.05)"
          p={6}
          borderRadius="lg"
          border="1px solid rgba(255, 255, 255, 0.1)"
        >
          <Heading size="md" color="white" mb={4}>
            Vercel Analytics
          </Heading>
          <Box p={4} bg="rgba(255, 255, 255, 0.03)" borderRadius="md">
            <Text color="gray.400" fontSize="sm">
              Work in progress, should be coming soon.
            </Text>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
};
