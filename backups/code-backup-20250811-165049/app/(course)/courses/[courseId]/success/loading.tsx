import { Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Loading Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Processing Your Enrollment...
          </h1>
          <p className="text-xl text-gray-600">
            Please wait while we set up your course access
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Confirmed</h3>
                  <p className="text-gray-600 text-sm">Your payment has been successfully processed</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Setting Up Course Access</h3>
                  <p className="text-gray-600 text-sm">Activating your enrollment and course materials</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Sending Welcome Email</h3>
                  <p className="text-gray-500 text-sm">You&apos;ll receive a confirmation email shortly</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-gray-600">
          <p className="mb-2">This usually takes just a few seconds...</p>
          <p className="text-sm">If this page doesn&apos;t redirect automatically, please refresh.</p>
        </div>
      </div>
    </div>
  );
} 