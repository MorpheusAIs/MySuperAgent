interface Link {
  label?: string;
  type?: string;
  url: string;
}

interface Token {
  url?: string;
  tokenAddress: string;
  icon?: string;
  description?: string;
  links?: Link[];
}

interface MetadataProps {
  chain_id?: string;
  tokens?: Token[];
}

interface TopTokensMessageProps {
  metadata: any;
}

export type { Link, Token, MetadataProps, TopTokensMessageProps };
