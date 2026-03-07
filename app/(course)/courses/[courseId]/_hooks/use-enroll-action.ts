'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseEnrollActionParams {
  courseId: string;
  price: number | null;
  isFree?: boolean;
  userId?: string;
}

interface UseEnrollActionReturn {
  handleEnroll: () => Promise<void>;
  isLoading: boolean;
}

export function useEnrollAction({
  courseId,
  price,
  isFree: isFreeOverride,
  userId,
}: UseEnrollActionParams): UseEnrollActionReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const handleEnroll = useCallback(async () => {
    if (isLoadingRef.current) return;

    if (!userId) {
      toast.error('Please sign in to enroll');
      router.push('/auth/login');
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    const free = isFreeOverride === true || (price ?? 0) === 0;

    if (free) {
      try {
        toast.loading('Enrolling you in the course...');
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          toast.dismiss();
          toast.success('Successfully enrolled! Redirecting to course...');
          setTimeout(() => {
            router.push(`/courses/${courseId}/learn`);
            router.refresh();
          }, 1500);
        } else {
          toast.dismiss();
          toast.error(data.error?.message || 'Failed to enroll');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[ENROLL_ERROR]', error);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    } else {
      try {
        toast.loading('Redirecting to checkout...');
        const response = await fetch(`/api/courses/${courseId}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        const checkoutUrl = result.data?.url || result.url;

        if (response.ok && checkoutUrl) {
          toast.dismiss();
          window.location.href = checkoutUrl;
        } else {
          toast.dismiss();
          toast.error(result.error?.message || 'Failed to create checkout session. Please try again.');
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[CHECKOUT_ERROR]', error);
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [courseId, price, isFreeOverride, userId, router]);

  return { handleEnroll, isLoading };
}
