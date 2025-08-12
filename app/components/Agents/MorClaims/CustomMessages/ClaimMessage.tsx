import React, { FC } from "react";
import { ClaimForm } from "./ClaimForm";
import { ClaimMessagePayload } from "@/services/types";

type ClaimMessageProps = {
  isActive: boolean;
  fromMessage: ClaimMessagePayload;
  onSubmitClaim: (claimTx: any) => void;
};

export const ClaimMessage: FC<ClaimMessageProps> = ({
  isActive,
  fromMessage,
  onSubmitClaim,
}) => {
  console.log("ClaimMessage received fromMessage:", fromMessage);
  if (!fromMessage) {
    return <div>Error: Claim message data is not available.</div>;
  }

  return (
    <ClaimForm
      isActive={isActive}
      fromMessage={fromMessage}
      onSubmitClaim={onSubmitClaim}
    />
  );
};
