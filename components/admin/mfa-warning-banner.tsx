"use client";

import { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MFAStatus {
  daysUntilEnforcement: number;
  warningPeriodActive: boolean;
  enforcementLevel: string;
}

export const MFAWarningBanner = () => {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admin/mfa-status');
        if (res.ok) {
          const data = await res.json();
          if (data.warningPeriodActive) {
            setStatus(data);
          }
        }
      } catch (error) {
        console.error('[MFA Warning] Error fetching status:', error);
      }
    };

    fetchStatus();
  }, []);

  if (!status || dismissed || status.daysUntilEnforcement === 0) {
    return null;
  }

  const urgency = status.daysUntilEnforcement <= 1 ? 'critical' :
                  status.daysUntilEnforcement <= 3 ? 'high' : 'medium';

  const bgColor = urgency === 'critical' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                  urgency === 'high' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' :
                  'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';

  const textColor = urgency === 'critical' ? 'text-red-900 dark:text-red-100' :
                    urgency === 'high' ? 'text-amber-900 dark:text-amber-100' :
                    'text-blue-900 dark:text-blue-100';

  return (
    <div className={`relative ${bgColor} border rounded-lg p-4 mb-6`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss warning"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <Shield className={`h-5 w-5 mt-0.5 ${textColor}`} />
        <div className="flex-1 pr-6">
          <h3 className={`font-semibold ${textColor}`}>
            {urgency === 'critical' && '🚨 Action Required: MFA Setup Due Tomorrow'}
            {urgency === 'high' && '⚠️ Important: MFA Setup Required Soon'}
            {urgency === 'medium' && '🔒 Reminder: MFA Setup Recommended'}
          </h3>
          <p className={`mt-1 text-sm ${textColor}`}>
            Multi-factor authentication is required for admin accounts.
            You have <strong>{status.daysUntilEnforcement} day{status.daysUntilEnforcement !== 1 ? 's' : ''}</strong> remaining
            to set up MFA before your admin access is restricted.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/admin/settings">
              <Button size="sm" variant={urgency === 'critical' ? 'destructive' : 'default'}>
                Set Up MFA Now
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button size="sm" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
