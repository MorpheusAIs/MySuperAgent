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
    failures?: {
      stats: {
        totalFailures: number;
        failuresByType: Array<{ type: string; count: number }>;
        failuresByTheme: Array<{ theme: string; count: number }>;
        topFailureReasons: Array<{ reason: string; count: number }>;
      };
      recentFailures: Array<{
        id: number;
        user_prompt: string;
        failure_type?: string;
        failure_summary?: string;
        request_theme?: string;
        created_at: Date;
      }>;
      requestThemes: Array<{ theme: string; count: number }>;
      tagDistribution: Array<{ tag: string; count: number }>;
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
  const { jobs, users, mcp, agents, failures } = data;

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

        {/* Failure Metrics */}
        {failures && (
          <>
            <Divider borderColor="rgba(255, 255, 255, 0.1)" />
            <Box>
              <Heading size="lg" color="white" mb={4}>
                Failure Analysis
              </Heading>
              <SimpleGrid
                columns={{ base: 1, md: 2, lg: 4 }}
                spacing={4}
                mb={6}
              >
                <Stat
                  bg="rgba(255, 255, 255, 0.05)"
                  p={4}
                  borderRadius="lg"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                >
                  <StatLabel color="gray.400">Total Failures</StatLabel>
                  <StatNumber color="red.400">
                    {failures.stats.totalFailures.toLocaleString()}
                  </StatNumber>
                </Stat>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
                {/* Failures by Type */}
                <Box
                  bg="rgba(255, 255, 255, 0.05)"
                  p={6}
                  borderRadius="lg"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                >
                  <Heading size="md" color="white" mb={4}>
                    Failures by Type
                  </Heading>
                  <TableContainer>
                    <Table variant="simple" colorScheme="whiteAlpha">
                      <Thead>
                        <Tr>
                          <Th color="gray.300">Failure Type</Th>
                          <Th color="gray.300" isNumeric>
                            Count
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {failures.stats.failuresByType.length > 0 ? (
                          failures.stats.failuresByType.map((item) => (
                            <Tr key={item.type}>
                              <Td color="white">{item.type}</Td>
                              <Td color="white" isNumeric>
                                {item.count.toLocaleString()}
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={2} color="gray.500" textAlign="center">
                              No failure data available
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Request Themes */}
                <Box
                  bg="rgba(255, 255, 255, 0.05)"
                  p={6}
                  borderRadius="lg"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                >
                  <Heading size="md" color="white" mb={4}>
                    Request Themes (What People Are Asking)
                  </Heading>
                  <TableContainer>
                    <Table variant="simple" colorScheme="whiteAlpha">
                      <Thead>
                        <Tr>
                          <Th color="gray.300">Theme</Th>
                          <Th color="gray.300" isNumeric>
                            Count
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {failures.requestThemes.length > 0 ? (
                          failures.requestThemes.slice(0, 10).map((item) => (
                            <Tr key={item.theme}>
                              <Td color="white">{item.theme}</Td>
                              <Td color="white" isNumeric>
                                {item.count.toLocaleString()}
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr>
                            <Td colSpan={2} color="gray.500" textAlign="center">
                              No theme data available
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              </SimpleGrid>

              {/* What Platform Can't Do */}
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                p={6}
                borderRadius="lg"
                border="1px solid rgba(255, 255, 255, 0.1)"
                mb={6}
              >
                <Heading size="md" color="white" mb={4}>
                  What Platform Cannot Accomplish
                </Heading>
                <TableContainer>
                  <Table variant="simple" colorScheme="whiteAlpha">
                    <Thead>
                      <Tr>
                        <Th color="gray.300">User Request</Th>
                        <Th color="gray.300">Failure Type</Th>
                        <Th color="gray.300">Summary</Th>
                        <Th color="gray.300">Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {failures.recentFailures.length > 0 ? (
                        failures.recentFailures.slice(0, 10).map((failure) => (
                          <Tr key={failure.id}>
                            <Td color="white" maxW="200px">
                              <Text
                                noOfLines={2}
                                fontSize="sm"
                                title={failure.user_prompt}
                              >
                                {failure.user_prompt.substring(0, 100)}
                                {failure.user_prompt.length > 100 ? '...' : ''}
                              </Text>
                            </Td>
                            <Td color="white">
                              {failure.failure_type || 'Unknown'}
                            </Td>
                            <Td color="white" maxW="300px">
                              <Text
                                noOfLines={2}
                                fontSize="sm"
                                title={failure.failure_summary}
                              >
                                {failure.failure_summary
                                  ? failure.failure_summary.substring(0, 150)
                                  : 'N/A'}
                                {failure.failure_summary &&
                                failure.failure_summary.length > 150
                                  ? '...'
                                  : ''}
                              </Text>
                            </Td>
                            <Td color="gray.400" fontSize="sm">
                              {new Date(
                                failure.created_at
                              ).toLocaleDateString()}
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={4} color="gray.500" textAlign="center">
                            No failure data available
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Tag Distribution */}
              {failures.tagDistribution.length > 0 && (
                <Box
                  bg="rgba(255, 255, 255, 0.05)"
                  p={6}
                  borderRadius="lg"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  mb={6}
                >
                  <Heading size="md" color="white" mb={4}>
                    Request Tags Distribution
                  </Heading>
                  <TableContainer>
                    <Table variant="simple" colorScheme="whiteAlpha">
                      <Thead>
                        <Tr>
                          <Th color="gray.300">Tag</Th>
                          <Th color="gray.300" isNumeric>
                            Count
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {failures.tagDistribution.slice(0, 15).map((item) => (
                          <Tr key={item.tag}>
                            <Td color="white">{item.tag}</Td>
                            <Td color="white" isNumeric>
                              {item.count.toLocaleString()}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </>
        )}

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
