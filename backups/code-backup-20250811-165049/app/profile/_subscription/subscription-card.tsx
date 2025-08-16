"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format, isBefore, differenceInDays } from "date-fns";
import { 
  Calendar, 
  CreditCard, 
  Bell, 
  BellOff, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { EnhancedSubscription } from "./types";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface SubscriptionCardProps {
  subscription: EnhancedSubscription;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleNotification?: (id: string, enabled: boolean) => void;
}

export const SubscriptionCard = ({
  subscription,
  onEdit,
  onDelete,
  onToggleNotification
}: SubscriptionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(subscription.notificationEnabled || false);

  const isExpired = subscription.endOfSubscription 
    ? isBefore(new Date(subscription.endOfSubscription), new Date())
    : false;

  const daysUntilRenewal = subscription.endOfSubscription 
    ? differenceInDays(new Date(subscription.endOfSubscription), new Date())
    : null;
  
  const renewalStatus = isExpired 
    ? "expired"
    : daysUntilRenewal !== null && daysUntilRenewal <= 3 
      ? "soon" 
      : "active";

  const statusColors = {
    expired: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    soon: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(subscription.amount);

  const handleNotificationToggle = () => {
    setNotificationEnabled(!notificationEnabled);
    if (onToggleNotification) {
      onToggleNotification(subscription.id, !notificationEnabled);
    }
  };

  // Extract last 4 digits of card if it follows pattern
  const cardLastFour = subscription.cardUsed.match(/\d{4}$/)?.[0] || "";

  // Default logos paths based on common platforms
  const defaultLogos: Record<string, string> = {
    "Netflix": "/logos/netflix.svg",
    "Spotify": "/logos/spotify.svg",
    "Disney+": "/logos/disney-plus.svg",
    "Amazon Prime": "/logos/amazon-prime.svg",
    "YouTube Premium": "/logos/youtube-premium.svg",
    "Apple": "/logos/apple.svg",
    "HBO Max": "/logos/hbo-max.svg",
  };

  // Fallback logo as data URL - simple placeholder instead of trying to load a file
  const fallbackLogoUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNyZWRpdC1jYXJkIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHg9IjIiIHk9IjUiIHJ4PSIyIi8+PHBhdGggZD0iTTIgMTBoMjAiLz48L3N2Zz4=";

  const logoPath = subscription.logoUrl || defaultLogos[subscription.platform] || fallbackLogoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white dark:bg-gray-800/90 shadow-sm",
        "border border-gray-200/80 dark:border-gray-700/80 rounded-xl overflow-hidden",
        "transition-all duration-200",
        expanded ? "mb-6" : "mb-3"
      )}
    >
      {/* Card Header */}
      <div 
        className={cn(
          "flex items-center p-4 cursor-pointer",
          "hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-10 w-10 relative mr-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Image 
            src={logoPath} 
            alt={subscription.platform} 
            width={40} 
            height={40} 
            className="object-contain"
            onError={(e) => {
              // Use the fallback data URL directly instead of trying to load another file
              (e.target as HTMLImageElement).src = fallbackLogoUrl;
            }}
          />
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">{subscription.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subscription.platform}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-gray-900 dark:text-white font-medium">{formattedAmount}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "ml-2 text-xs font-normal", 
                statusColors[renewalStatus]
              )}
            >
              {renewalStatus === "expired" 
                ? "Expired" 
                : renewalStatus === "soon" 
                  ? `${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''} left` 
                  : "Active"}
            </Badge>
          </div>
          
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </motion.div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Started: </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {format(new Date(subscription.dateOfSubscription), "MMM d, yyyy")}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Renews: </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {format(new Date(subscription.endOfSubscription), "MMM d, yyyy")}
                  </span>
                </div>
                
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">Card: </span>
                  <span className="ml-1 text-gray-900 dark:text-white">
                    {cardLastFour ? `•••• ${cardLastFour}` : subscription.cardUsed}
                  </span>
                </div>
                
                {subscription.category && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Category: </span>
                    <Badge variant="secondary" className="ml-1">
                      {subscription.category}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  {notificationEnabled ? (
                    <Bell className="h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                  ) : (
                    <BellOff className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    Payment reminders
                  </span>
                </div>
                <Switch
                  checked={notificationEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <a 
                  href={subscription.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Visit website
                </a>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(subscription.id);
                          }}
                        >
                          <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit subscription</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(subscription.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete subscription</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}; 