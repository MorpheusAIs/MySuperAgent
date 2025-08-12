import { useCallback, useState } from "react";
import { useAccount, useChainId, useSendTransaction } from "wagmi";
// import { sendClaimStatus, sendSwapStatus } from "@/services/apiHooks";
// import { getHttpClient } from "@/services/constants";
// import { SwapTxPayloadType, ClaimTransactionPayload } from "@/services/types";
// import { SWAP_STATUS, CLAIM_STATUS } from "@/services/constants";

export const useChat = (onBackendError: () => void) => {
  const [txHash, setTxHash] = useState<string>("");
  const [approveTxHash, setApproveTxHash] = useState<string>("");
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  const { address } = useAccount();
  const chainId = useChainId();
  const { sendTransaction } = useSendTransaction();

  // const handleSwapStatus = useCallback(
  //   async (status: string, hash: string, isApprove: number) => {
  //     try {
  //       const response = await sendSwapStatus(
  //         getHttpClient(),
  //         chainId,
  //         address?.toLowerCase() || "0x",
  //         status,
  //         hash,
  //         isApprove
  //       );
  //       if (isApprove) {
  //         setApproveTxHash("");
  //       } else {
  //         setTxHash("");
  //       }
  //       setShowSpinner(false);
  //       return response;
  //     } catch (error) {
  //       console.log(`Error sending status: ${error}`);
  //       onBackendError();
  //       setShowSpinner(false);
  //       throw error;
  //     }
  //   },
  //   [chainId, address, onBackendError]
  // );

  // const handleClaimStatus = useCallback(
  //   async (status: string, hash: string) => {
  //     try {
  //       const response = await sendClaimStatus(
  //         getHttpClient(),
  //         chainId,
  //         address?.toLowerCase() || "0x",
  //         status,
  //         hash
  //       );
  //       setTxHash("");
  //       setShowSpinner(false);
  //       return response;
  //     } catch (error) {
  //       console.log(`Error sending claim status: ${error}`);
  //       onBackendError();
  //       setShowSpinner(false);
  //       throw error;
  //     }
  //   },
  //   [chainId, address, onBackendError]
  // );

  // const handleSwapSubmit = useCallback(
  //   (swapTx: SwapTxPayloadType) => {
  //     setTxHash("");
  //     sendTransaction(
  //       {
  //         account: address,
  //         data: (swapTx?.tx.data || "0x") as `0x${string}`,
  //         to: (swapTx?.tx.to || "0x") as `0x${string}`,
  //         value: BigInt(swapTx?.tx.value || "0"),
  //       },
  //       {
  //         onSuccess: (hash) => {
  //           setTxHash(hash);
  //           handleSwapStatus(SWAP_STATUS.INIT, hash, 0);
  //         },
  //         onError: (error) => {
  //           console.log(`Error sending transaction: ${error}`);
  //           handleSwapStatus(SWAP_STATUS.FAIL, "", 0);
  //         },
  //       }
  //     );
  //   },
  //   [address, handleSwapStatus, sendTransaction]
  // );

  // const handleClaimSubmit = useCallback(
  //   (claimTx: ClaimTransactionPayload) => {
  //     setTxHash("");
  //     sendTransaction(
  //       {
  //         account: address,
  //         data: claimTx.data as `0x${string}`,
  //         to: claimTx.to as `0x${string}`,
  //         value: BigInt(claimTx.value),
  //         chainId: parseInt(claimTx.chainId),
  //       },
  //       {
  //         onSuccess: (hash) => {
  //           setTxHash(hash);
  //           handleClaimStatus(CLAIM_STATUS.INIT, hash);
  //         },
  //         onError: (error) => {
  //           console.log(`Error sending transaction: ${error}`);
  //           handleClaimStatus(CLAIM_STATUS.FAIL, "");
  //         },
  //       }
  //     );
  //   },
  //   [address, handleClaimStatus, sendTransaction]
  // );

  return {
    txHash,
    approveTxHash,
    showSpinner,
    setShowSpinner,
    // handleSwapStatus,
    // handleClaimStatus,
    // handleSwapSubmit,
    // handleClaimSubmit,
  };
};
