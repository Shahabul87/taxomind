import { Subscription } from "@prisma/client";

// Extended subscription type with additional fields
export interface EnhancedSubscription extends Subscription {
  logoUrl?: string;
  notificationEnabled?: boolean;
  notificationDays?: number[];
  isRenewing?: boolean;
  paymentMethod?: {
    type: "credit" | "debit" | "paypal" | "other";
    lastFour?: string;
    nickname?: string;
    icon?: string;
  };
  billingCycle?: "monthly" | "quarterly" | "yearly" | "custom";
  nextPaymentDate?: Date;
}

// Notification settings type
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  days: number[]; // Days before renewal to notify (e.g., [1, 7] = 1 day and 7 days before)
}

// Payment tracking statistics
export interface SubscriptionStats {
  totalMonthly: number;
  totalYearly: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  upcomingPayments: Array<{
    id: string;
    name: string;
    amount: number;
    dueDate: Date;
    daysLeft: number;
  }>;
}

// Subscription category options
export const SUBSCRIPTION_CATEGORIES = [
  "Streaming",
  "Music",
  "Gaming",
  "Productivity",
  "Cloud Storage",
  "News",
  "Learning",
  "Fitness",
  "Food Delivery",
  "Finance",
  "Other"
] as const;

// Subscription platform options with logos
export const SUBSCRIPTION_PLATFORMS = {
  "Netflix": {
    logo: "/logos/netflix.svg",
    color: "#E50914",
    category: "Streaming"
  },
  "Disney+": {
    logo: "/logos/disney-plus.svg",
    color: "#0063e5",
    category: "Streaming"
  },
  "Spotify": {
    logo: "/logos/spotify.svg",
    color: "#1DB954",
    category: "Music"
  },
  "YouTube Premium": {
    logo: "/logos/youtube.svg",
    color: "#FF0000",
    category: "Streaming"
  },
  "Amazon Prime": {
    logo: "/logos/amazon-prime.svg",
    color: "#00A8E1",
    category: "Streaming"
  },
  "Apple TV+": {
    logo: "/logos/apple-tv.svg",
    color: "#000000",
    category: "Streaming"
  },
  "HBO Max": {
    logo: "/logos/hbo-max.svg",
    color: "#5822b4",
    category: "Streaming"
  },
  "Hulu": {
    logo: "/logos/hulu.svg",
    color: "#1ce783",
    category: "Streaming"
  },
  "Apple Music": {
    logo: "/logos/apple-music.svg",
    color: "#fa243c",
    category: "Music"
  },
  "Xbox Game Pass": {
    logo: "/logos/xbox.svg",
    color: "#107C10",
    category: "Gaming"
  },
  "PlayStation Plus": {
    logo: "/logos/playstation.svg",
    color: "#003791",
    category: "Gaming"
  },
  "Adobe Creative Cloud": {
    logo: "/logos/adobe.svg",
    color: "#FF0000",
    category: "Productivity"
  },
  "Microsoft 365": {
    logo: "/logos/microsoft-365.svg",
    color: "#0078D4",
    category: "Productivity"
  },
  "Google One": {
    logo: "/logos/google-one.svg",
    color: "#4285F4",
    category: "Cloud Storage"
  },
  "Dropbox": {
    logo: "/logos/dropbox.svg",
    color: "#0061FF",
    category: "Cloud Storage"
  },
  "Other": {
    logo: "/logos/other.svg",
    color: "#666666",
    category: "Other"
  }
} as const; 