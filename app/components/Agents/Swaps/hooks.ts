import { useState, useCallback } from "react";
import { useAccount, useChainId, useSendTransaction } from "wagmi";
import { sendSwapStatus } from "@/services/apiHooks";
import { getHttpClient, SWAP_STATUS } from "@/services/constants";
import { trackEvent, trackError } from "@/services/analytics";

export type SwapTx = {
  dstAmount: string;
  tx: {
    data: string;
    from: string;
    gas: number;
    gasPrice: string;
    to: string;
    value: string;
  };
};

export const useSwapTransaction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { address } = useAccount();
  const chainId = useChainId();
  const { sendTransaction } = useSendTransaction();

  const handleSwap = useCallback(
    async (swapTx: SwapTx) => {
      if (!address) {
        console.error("Wallet not connected");
        return;
      }

      setIsLoading(true);
      setTxHash("");
      
      // Track swap initiated
      trackEvent('swap.initiated', {
        wallet: address.substring(0, 6) + '...' + address.slice(-4),
        chain: chainId.toString(),
        value: swapTx.tx.value,
        dstAmount: swapTx.dstAmount,
      });

      try {
        // Safely handle the value conversion to BigInt
        let valueInWei: bigint;

        try {
          // Check if the value is already in Wei format
          if (swapTx.tx.value.includes("e")) {
            // Handle scientific notation
            const valueNumber = Number(swapTx.tx.value);
            valueInWei = BigInt(Math.floor(valueNumber * 1e18));
          } else if (Number(swapTx.tx.value) < 1) {
            // Small values need to be converted to Wei
            valueInWei = BigInt(Math.floor(Number(swapTx.tx.value) * 1e18));
          } else {
            // Try to parse the value directly
            valueInWei = BigInt(swapTx.tx.value);
          }
        } catch (e) {
          console.error("Error converting value to BigInt:", e);
          // Fallback to 0 if conversion fails
          valueInWei = BigInt(0);
        }

        // Make sure tx.to is a valid address
        const toAddress =
          swapTx.tx.to && swapTx.tx.to !== "0x"
            ? (swapTx.tx.to as `0x${string}`)
            : ("0x0000000000000000000000000000000000000000" as `0x${string}`);

        // Make sure tx.data is a valid hex string
        const txData =
          swapTx.tx.data && swapTx.tx.data !== ""
            ? (swapTx.tx.data as `0x${string}`)
            : ("0x" as `0x${string}`);

        sendTransaction(
          {
            account: address,
            data: txData,
            to: toAddress,
            value: valueInWei,
          },
          {
            onSuccess: async (hash) => {
              setTxHash(hash);
              
              // Track swap completed
              trackEvent('swap.completed', {
                wallet: address.substring(0, 6) + '...' + address.slice(-4),
                chain: chainId.toString(),
                txHash: hash,
                value: swapTx.tx.value,
                dstAmount: swapTx.dstAmount,
              });
              
              try {
                await sendSwapStatus(
                  getHttpClient(),
                  chainId,
                  address.toLowerCase(),
                  SWAP_STATUS.INIT,
                  hash,
                  0
                );
              } catch (error) {
                console.error("Error sending swap status:", error);
              }
            },
            onError: async (error) => {
              console.error(`Error sending transaction: ${error}`);
              
              // Track swap error
              trackError('swap.failed', error as Error, {
                wallet: address.substring(0, 6) + '...' + address.slice(-4),
                chain: chainId.toString(),
                value: swapTx.tx.value,
              });
              
              try {
                await sendSwapStatus(
                  getHttpClient(),
                  chainId,
                  address.toLowerCase(),
                  SWAP_STATUS.FAIL,
                  "",
                  0
                );
              } catch (statusError) {
                console.error("Error sending failure status:", statusError);
              }
              setIsLoading(false);
            },
            onSettled: () => setIsLoading(false),
          }
        );
      } catch (error) {
        setIsLoading(false);
        console.error("Swap failed:", error);
        
        // Track general swap error
        trackError('swap.failed', error as Error, {
          wallet: address.substring(0, 6) + '...' + address.slice(-4),
          chain: chainId.toString(),
        });
      }
    },
    [address, chainId, sendTransaction]
  );

  const handleCancel = useCallback(
    async (fromAction: number) => {
      if (!address) return;

      try {
        await sendSwapStatus(
          getHttpClient(),
          chainId,
          address.toLowerCase(),
          SWAP_STATUS.CANCELLED,
          "",
          fromAction
        );
        
        // Track swap cancelled
        trackEvent('swap.cancelled', {
          wallet: address.substring(0, 6) + '...' + address.slice(-4),
          chain: chainId.toString(),
          fromAction,
        });
      } catch (error) {
        console.error(`Failed to cancel swap: ${error}`);
        
        // Track cancellation error
        trackError('swap.cancel_failed', error as Error, {
          wallet: address.substring(0, 6) + '...' + address.slice(-4),
          chain: chainId.toString(),
        });
      }
    },
    [address, chainId]
  );

  return {
    handleSwap,
    handleCancel,
    isLoading,
    txHash,
  };
};

export default useSwapTransaction;
