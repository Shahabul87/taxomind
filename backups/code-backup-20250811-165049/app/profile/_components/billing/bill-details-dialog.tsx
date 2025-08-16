"use client";

import { useState, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Edit, 
  ReceiptText, 
  RefreshCcw, 
  Save, 
  Tag, 
  Trash, 
  Globe,
  Smartphone,
  Home
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BillCategory, BillStatus } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { getCategoryIcon } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import toast for notifications
import { toast } from "sonner";
import { TimeAgo } from "@/app/components/ui/time-ago";

interface Bill {
  id: string;
  title: string;
  description?: string;
  website?: string;
  category: BillCategory;
  amount: number;
  currency: string;
  dueDate: Date;
  status: BillStatus;
  recurringType?: string;
  recurringDate?: Date;
  notificationDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
  paymentMethod?: string;
  // For recurring bills
  frequency?: "MONTHLY" | "WEEKLY" | "YEARLY" | "QUARTERLY" | "BIWEEKLY";
  billingDay?: number;
  nextBillingDate?: Date;
  lastBillingDate?: Date;
  autoRenew?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface BillDetailsDialogProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

export function BillDetailsDialog({ 
  bill, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onMarkAsPaid
}: BillDetailsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: bill?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status badge color
  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Handle delete with confirmation - use useCallback to avoid recreation during render
  const handleDelete = useCallback(async () => {
    if (!bill) return;
    
    // Confirmation via toast
    toast("Are you sure you want to delete this bill?", {
      action: {
        label: "Delete",
        onClick: async () => {
          setIsDeleting(true);
          try {
            onDelete(bill.id);
            toast.success("Bill deleted successfully");
            onOpenChange(false); // Close dialog
          } catch (error) {
            toast.error("Failed to delete bill");
          } finally {
            setIsDeleting(false);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => { /* Do nothing */ },
      },
    });
  }, [bill, onDelete, onOpenChange]);

  // Handle mark as paid
  const handleMarkAsPaid = useCallback(async () => {
    if (!bill || bill.status === "PAID") return;
    
    setIsMarking(true);
    try {
      onMarkAsPaid(bill.id);
      toast.success("Bill marked as paid");
    } catch (error) {
      toast.error("Failed to mark bill as paid");
    } finally {
      setIsMarking(false);
    }
  }, [bill, onMarkAsPaid]);

  // Frequency display mapping
  const frequencyLabels: Record<string, string> = {
    "MONTHLY": "Monthly",
    "WEEKLY": "Weekly",
    "YEARLY": "Yearly",
    "QUARTERLY": "Quarterly",
    "BIWEEKLY": "Bi-weekly"
  };

  const statusLabels: Record<BillStatus, string> = {
    "PAID": "Paid",
    "UPCOMING": "Upcoming",
    "OVERDUE": "Overdue"
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "credit card":
        return <CreditCard className="h-4 w-4" />;
      case "bank transfer":
        return <Globe className="h-4 w-4" />;
      case "mobile payment":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold line-clamp-1">{bill.title}</DialogTitle>
            <div className="flex space-x-2">
              <Badge className={getStatusColor(bill.status)}>
                {statusLabels[bill.status]}
              </Badge>
            </div>
          </div>
          <DialogDescription className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="font-normal">
              {getCategoryIcon(bill.category as string)}
              <span className="ml-1">{bill.category}</span>
            </Badge>
            {bill.frequency && (
              <Badge variant="outline" className="font-normal bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                <RefreshCcw className="mr-1 h-3 w-3" />
                {frequencyLabels[bill.frequency]}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-2">
          <div className="space-y-6">
            {/* Amount Section */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(bill.amount)}
                </div>
                <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  <DollarSign className="inline h-3 w-3 mr-1" />
                  {bill.currency || "USD"}
                </div>
              </CardContent>
            </Card>

            {/* Dates Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {format(new Date(bill.dueDate), 'PPP')}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {bill.status !== "PAID" && (
                      <>
                        <Clock className="inline h-3 w-3 mr-1" />
                        <TimeAgo date={bill.dueDate} />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {bill.frequency && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Billing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {bill.nextBillingDate ? format(new Date(bill.nextBillingDate), 'PPP') : "Not set"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      <RefreshCcw className="inline h-3 w-3 mr-1" />
                      {bill.billingDay ? `Day ${bill.billingDay} of each ${bill.frequency.toLowerCase()}` : "Not specified"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Description */}
            {bill.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {bill.description}
                </p>
                <Separator />
              </div>
            )}

            {/* Website */}
            {bill.website && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</h3>
                <a 
                  href={bill.website.startsWith('http') ? bill.website : `https://${bill.website}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {bill.website}
                </a>
                <Separator />
              </div>
            )}

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {bill.paymentMethod && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                    <div className="flex items-center text-sm">
                      {getPaymentMethodIcon(bill.paymentMethod)}
                      <span className="ml-1">{bill.paymentMethod}</span>
                    </div>
                  </div>
                )}

                {bill.autoRenew !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Auto Renewal</p>
                    <div className="text-sm">
                      {bill.autoRenew ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
            </div>

            {/* Notes */}
            {bill.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {bill.notes}
                </p>
                <Separator />
              </div>
            )}

            {/* Creation and Update Info */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div>
                <p>Created</p>
                <p>{format(new Date(bill.createdAt), 'PPP')}</p>
              </div>
              {bill.updatedAt && (
                <div>
                  <p>Last Updated</p>
                  <p>{format(new Date(bill.updatedAt), 'PPP')}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <div className="flex gap-2 w-full justify-between sm:justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete this bill</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {bill.status !== "PAID" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAsPaid}
                disabled={isMarking}
              >
                <Save className="h-4 w-4 mr-1" />
                {isMarking ? "Processing..." : "Mark as Paid"}
              </Button>
            )}

            <Button 
              size="sm"
              onClick={() => onEdit(bill)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Bill
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 