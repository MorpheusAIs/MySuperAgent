import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import {
  ChakraProvider,
  defineStyleConfig,
  extendTheme,
} from "@chakra-ui/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { arbitrum, base, mainnet, optimism, polygon, bsc } from "wagmi/chains";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  AvatarComponent,
} from "@rainbow-me/rainbowkit";
import "./../styles/globals.css";

const config = getDefaultConfig({
  appName: "RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    bsc,
    // ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});

const ButtonStyles = defineStyleConfig({
  variants: {
    greenCustom: {
      fontFamily: "Inter",
      fontSize: "16px",
      background: "#59F886",
      borderRadius: "24px",
      color: "#000",
      "&:hover": {
        background: "#59F886",
        color: "#000",
        transform: "scale(1.05)",
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        border: "1px solid #59F886",
      },
    },
  },
});

const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  colors: {
    header: "#000",
    "pop-up-bg": "#1C201D",
  },
  components: {
    Button: ButtonStyles,
  },
  Text: {
    baseStyle: {
      fontFamily: "Inter",
      fontSize: "16px",
      color: "var(--dark-text-90, rgba(255, 255, 255, 0.90))",
    },
  },
});

// Function to generate a color from an address
const generateColorFromAddress = (address: string): string => {
  if (!address) return "#000000";

  // Take the last 6 characters of the address for the color
  const colorCode = address.slice(-6);
  // Add opacity to ensure the color isn't too bright
  return `#${colorCode}cc`;
};

// Add this function to your codebase (e.g., in a utils file or directly in _app.tsx)
function setVhProperty() {
  // Get the viewport height and multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  // Set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// Call the function when the page loads
if (typeof window !== "undefined") {
  // Set the initial value on page load
  setVhProperty();

  // Update the value on resize
  window.addEventListener("resize", () => {
    setVhProperty();
  });

  // Update on orientation change specifically for mobile
  window.addEventListener("orientationchange", () => {
    setVhProperty();
  });
}

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  const color = generateColorFromAddress(address);

  if (ensImage) {
    return (
      <img
        src={ensImage}
        width={size}
        height={size}
        style={{ borderRadius: 999 }}
        alt={`${address} avatar`}
      />
    );
  }

  // If no ENS image, show the first 2 characters of the address
  const displayText = address ? address.slice(2, 4).toUpperCase() : "";

  return (
    <div
      style={{
        backgroundColor: color,
        borderRadius: 999,
        height: size,
        width: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size > 30 ? "14px" : "10px",
        fontFamily: "monospace",
        fontWeight: "bold",
      }}
    >
      {displayText}
    </div>
  );
};

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider
          avatar={CustomAvatar}
          theme={darkTheme({
            accentColor: "#111613",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <ChakraProvider theme={theme}>
            <Component {...pageProps} />
            <Analytics />
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
