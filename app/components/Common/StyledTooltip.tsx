import React, { useEffect, useState } from "react";
import { Tooltip, forwardRef, Box, useBreakpointValue } from "@chakra-ui/react";

export const StyledTooltip = forwardRef((props, ref) => {
  const { children, label, placement = "top", ...rest } = props;

  // Use Chakra UI's useBreakpointValue to determine mobile status
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Use state to store the effective placement
  const [effectivePlacement, setEffectivePlacement] = useState(placement);

  // Update placement based on mobile status
  useEffect(() => {
    if (isMobile) {
      // On mobile, only allow "top" or "bottom" placements
      if (placement === "left" || placement === "right") {
        // Default to "top" if horizontal placement was requested
        setEffectivePlacement("top");
      } else {
        // Keep "top", "bottom" or any other vertical variants
        setEffectivePlacement(placement);
      }
    } else {
      // On desktop, use the original placement
      setEffectivePlacement(placement);
    }
  }, [isMobile, placement]);

  // Custom tooltip content to match the popover styling
  const customLabel = (
    <Box
      bg="#080808"
      borderColor="rgba(255, 255, 255, 0.1)"
      borderWidth="1px"
      borderRadius="8px"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
      color="white"
      fontSize="14px"
      p={4}
      maxWidth="380px"
    >
      {label}
    </Box>
  );

  return (
    <Tooltip
      ref={ref}
      label={customLabel}
      placement={effectivePlacement}
      hasArrow
      arrowSize={8}
      arrowShadowColor="rgba(255, 255, 255, 0.1)"
      bg="#080808"
      gutter={8}
      {...rest}
    >
      {children}
    </Tooltip>
  );
});

StyledTooltip.displayName = "StyledTooltip";
