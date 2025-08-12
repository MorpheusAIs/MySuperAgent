// RugcheckReportMessage.types.ts

interface Risk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: "danger" | "warn" | "info";
}

interface Report {
  tokenProgram: string;
  tokenType: string;
  risks: Risk[];
  score: number;
}

interface RugcheckMetadata {
  report: Report;
  mint_address: string;
  token_name: string;
  identifier: string;
}

interface RugcheckReportMessageProps {
  metadata: RugcheckMetadata;
}

export type { RugcheckReportMessageProps, Risk, Report, RugcheckMetadata };
