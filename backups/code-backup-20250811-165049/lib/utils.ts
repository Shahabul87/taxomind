import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { BillCategory } from "@prisma/client"
import { 
  Home, 
  Wifi, 
  Clipboard, 
  Building2, 
  Wallet, 
  CreditCard, 
  BookOpen, 
  Lightbulb, 
  ShieldCheck, 
  LucideIcon
} from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const cleanHtml = (html: string | null) => {
  if (!html) return "";
  
  // Remove HTML tags
  let clean = html.replace(/<[^>]*>/g, ' ');
  
  // Replace special characters
  clean = clean.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&apos;/g, "'");
  
  // Remove extra spaces
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean;
};

export const getCategoryIcon = (category: BillCategory): LucideIcon => {
  const icons: Record<BillCategory, LucideIcon> = {
    UTILITY: Lightbulb,
    INTERNET: Wifi,
    INSURANCE: ShieldCheck,
    RENT: Home,
    MORTGAGE: Building2,
    SUBSCRIPTION: Clipboard,
    TAX: Wallet,
    CREDIT_CARD: CreditCard,
    OTHER: BookOpen
  };

  return icons[category] || BookOpen;
};
