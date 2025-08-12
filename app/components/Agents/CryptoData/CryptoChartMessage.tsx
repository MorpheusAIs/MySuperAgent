import React, { useState } from "react";
import { Box, IconButton, Collapse, Text } from "@chakra-ui/react";
import { BarChart2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const TradingViewWidget = React.lazy(() => import("./TradingViewWidget"));

const CryptoChartMessage = ({
  content,
  metadata,
}: {
  content: any;
  metadata: any;
}) => {
  const [show, setShow] = useState(true);

  return (
    <Box width="100%" mb={4}>
      <Box display="inline-flex" alignItems="center" gap={2}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {metadata?.coinId && (
          <IconButton
            onClick={() => setShow(!show)}
            variant="ghost"
            size="sm"
            color="gray.400"
            _hover={{ color: "blue.400" }}
            aria-label="Toggle chart"
            icon={<BarChart2 size={16} />}
          />
        )}
      </Box>

      <Collapse in={show} animateOpacity>
        <Box bg="gray.900" borderRadius="lg" p={4} mt={2}>
          <Box height="400px" width="100%">
            <React.Suspense fallback={<Text>Loading chart...</Text>}>
              {metadata?.coinId && (
                <TradingViewWidget symbol={metadata.coinId.toUpperCase()} />
              )}
            </React.Suspense>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CryptoChartMessage;
