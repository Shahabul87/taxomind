'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
  CreditCard,
  Shield,
  Lock,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface CheckoutPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseId, setCourseId] = useState<string>('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!courseId) return;

    const createCheckoutSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 150);

        const response = await fetch(`/api/courses/${courseId}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearInterval(progressInterval);
        setProgress(100);

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please sign in to enroll in this course.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
            return;
          }

          if (response.status === 400) {
            setError('You are already enrolled in this course.');
            setTimeout(() => {
              router.push(`/courses/${courseId}`);
            }, 2000);
            return;
          }

          if (response.status === 404) {
            setError('Course not found or is not available.');
            setTimeout(() => {
              router.push('/courses');
            }, 2000);
            return;
          }

          throw new Error(data.message || 'Failed to create checkout session');
        }

        if (data.url) {
          // Redirect to Stripe checkout
          setTimeout(() => {
            window.location.href = data.url;
          }, 500);
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (err) {
        console.error('[CHECKOUT_ERROR]', err);
        setError(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.'
        );
        setIsLoading(false);
        setProgress(0);
      }
    };

    createCheckoutSession();
  }, [courseId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-2" />
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Error Icon */}
                <div className="relative">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-red-400/20 rounded-full animate-ping mx-auto" />
                </div>

                {/* Error Message */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Payment Error
                  </h2>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    {error}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 max-w-md mx-auto">
                  <Link href={`/courses/${courseId}`} className="flex-1">
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                      size="lg"
                    >
                      Return to Course
                    </Button>
                  </Link>
                  <Link href="/courses" className="flex-1">
                    <Button
                      className="w-full border-2 border-gray-300"
                      variant="outline"
                      size="lg"
                    >
                      Browse Courses
                    </Button>
                  </Link>
                </div>

                {/* Support Link */}
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Need help?{' '}
                    <Link href="/support" className="text-purple-600 hover:text-purple-700 font-medium">
                      Contact Support
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="bg-gray-200 h-1.5">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-8">
              {/* Animated Logo/Icon */}
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 w-28 h-28 bg-purple-400/20 rounded-full animate-ping mx-auto" />
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Secure Checkout
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Redirecting you to our secure payment processor...
                </p>
              </div>

              {/* Loading Steps */}
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Verifying enrollment</p>
                    <p className="text-sm text-gray-500">Confirmed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Creating secure session</p>
                    <p className="text-sm text-gray-500">In progress...</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left opacity-60">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Redirecting to payment</p>
                    <p className="text-sm text-gray-500">Waiting...</p>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-8 h-8 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-900">Bank-Level Security</p>
                    <p className="text-xs text-gray-500">256-bit SSL encryption</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Award className="w-8 h-8 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">Money-Back Guarantee</p>
                    <p className="text-xs text-gray-500">30-day refund policy</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 text-green-600" />
                    <p className="text-sm font-semibold text-gray-900">Instant Access</p>
                    <p className="text-xs text-gray-500">Start learning immediately</p>
                  </div>
                </div>
              </div>

              {/* Powered by Stripe */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secured by</span>
                <span className="font-bold text-purple-600">Stripe</span>
              </div>

              {/* Payment Methods */}
              <div className="pt-4">
                <p className="text-xs text-gray-400 mb-3">Accepted payment methods</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                    Visa
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                    Mastercard
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                    AmEx
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
                    Discover
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Join over <span className="font-bold text-purple-600">10,000+ students</span> already learning with us
          </p>
        </div>
      </div>
    </div>
  );
}
