// ElfaMentionsMessage.types.ts

interface AccountData {
  profileBannerUrl?: string | null;
  profileImageUrl?: string | null;
  description?: string | null;
  userSince?: string;
  location?: string | null;
  name?: string;
}

interface Account {
  id?: number;
  username?: string;
  data?: AccountData;
  followerCount?: number;
  followingCount?: number;
  isVerified?: boolean;
}

interface Mention {
  id?: number;
  type?: string;
  content?: string;
  originalUrl?: string | null;
  data?: string | null;
  likeCount?: number;
  quoteCount?: number;
  replyCount?: number;
  repostCount?: number;
  viewCount?: number;
  mentionedAt?: string;
  bookmarkCount?: number;
  account?: Account;
}

interface MentionsMetadata {
  success?: boolean;
  data?: Mention[];
}

interface ElfaMentionsMessageProps {
  metadata?: MentionsMetadata;
}

export type {
  ElfaMentionsMessageProps,
  Mention,
  Account,
  AccountData,
  MentionsMetadata,
};
