// OneInchSwapMessage.jsx
import React, { useState } from "react";
import { ArrowLeftRight, Info } from "lucide-react";
import { useAccount } from "wagmi";
import { useSwapTransaction, SwapTx } from "../hooks";
import styles from "./SwapMessage.module.css";
import { OneInchSwapMessageProps } from "./SwapMessage.types";
import { StyledTooltip } from "@/components/Common/StyledTooltip";

const OneInchSwapMessage: React.FC<OneInchSwapMessageProps> = ({
  content,
  metadata = {
    src: "ETH",
    dst: "USDC",
    src_amount: 0,
    dst_amount: 0,
    src_address: "0x0000000000000000000000000000000000000000",
    dst_address: "0x0000000000000000000000000000000000000000",
  },
}) => {
  const { address } = useAccount();
  const { handleSwap, handleCancel, isLoading } = useSwapTransaction();
  const [slippage, setSlippage] = useState(0.1);
  const [showForm, setShowForm] = useState(true);

  // Extract values from metadata
  const src = metadata.src || "ETH";
  const dst = metadata.dst || "USDC";
  const srcAmount = metadata.src_amount || 0;
  const dstAmount = metadata.dst_amount || 0;
  const srcAddress =
    metadata.src_address || "0x0000000000000000000000000000000000000000";
  const dstAddress =
    metadata.dst_address || "0x0000000000000000000000000000000000000000";

  return (
    <div className={styles.container}>
      <div className={styles.contentRow}>
        <p className={styles.messageContent}>{content}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className={styles.toggleButton}
          aria-label="Configure 1inch swap"
        >
          <ArrowLeftRight size={16} />
        </button>
      </div>

      {showForm && (
        <div className={styles.swapCard}>
          <div className={styles.swapPanel}>
            <div className={styles.swapGrid}>
              <div className={styles.swapColumn}>
                <div className={styles.swapSection}>
                  <span className={styles.sectionTitle}>You Pay</span>
                  <div className={styles.tokenAmount}>
                    <span className={styles.amountValue}>{srcAmount}</span>
                    <span className={styles.tokenSymbol}>{src}</span>
                  </div>
                </div>
              </div>

              <div className={styles.swapColumn}>
                <div className={styles.swapSection}>
                  <span className={styles.sectionTitle}>You Receive</span>
                  <div className={styles.tokenAmount}>
                    <span className={styles.amountValue}>
                      {dstAmount.toFixed(4)}
                    </span>
                    <span className={styles.tokenSymbol}>{dst}</span>
                  </div>
                </div>
              </div>

              <div className={styles.swapColumn}>
                <div className={styles.swapSection}>
                  <div className={styles.slippageHeader}>
                    <span className={styles.sectionTitle}>Slippage</span>
                    <button
                      className={styles.infoButton}
                      aria-label="Slippage information"
                    >
                      <Info size={14} />
                    </button>
                  </div>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(Number(e.target.value))}
                      className={styles.slippageInput}
                    />
                    <div className={styles.inputAddon}>%</div>
                  </div>
                  <div className={styles.poweredBy}>Using 1inch</div>
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  handleCancel(0);
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
              <StyledTooltip
                label="Missing configurations necessary to perform this swap. Something might be wrong with your wallet connection"
                placement="top"
              >
                <button
                  disabled
                  className={styles.swapButton}
                  onClick={() => {
                    const swapTransaction: SwapTx = {
                      dstAmount: dstAmount.toString(),
                      tx: {
                        data: "0x",
                        from: address || "",
                        gas: 0,
                        gasPrice: "0",
                        to: dstAddress,
                        value: srcAmount.toString(),
                      },
                    };
                    handleSwap(swapTransaction);
                  }}
                >
                  {isLoading ? "Processing..." : "Swap"}
                </button>
              </StyledTooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OneInchSwapMessage;
