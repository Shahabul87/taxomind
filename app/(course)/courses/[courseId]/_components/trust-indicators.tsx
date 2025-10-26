"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Award,
  Lock,
  CheckCircle,
  TrendingUp,
  Users,
  Star,
  DollarSign,
  RefreshCw,
  Zap
} from 'lucide-react';

interface TrustIndicatorsProps {
  successRate?: number;
  moneyBackDays?: number;
  totalStudents?: number;
  rating?: number;
  isVerifiedInstructor?: boolean;
}

export const TrustIndicators = ({
  successRate = 94,
  moneyBackDays = 30,
  totalStudents = 0,
  rating = 0,
  isVerifiedInstructor = true
}: TrustIndicatorsProps): JSX.Element => {
  const trustItems = [
    {
      icon: Shield,
      label: "Secure checkout",
      sublabel: "SSL protected",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/40"
    },
    {
      icon: RefreshCw,
      label: `${moneyBackDays}-day guarantee`,
      sublabel: "Money‑back",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/40"
    },
    {
      icon: TrendingUp,
      label: `${successRate}% satisfaction`,
      sublabel: "Student‑rated",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/40"
    },
    {
      icon: Award,
      label: "Certificate included",
      sublabel: "Verified completion",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-400/40"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main Trust Badges */}
      <div className="grid grid-cols-2 gap-3">
        {trustItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`flex items-start gap-2 p-3 rounded-lg ${item.bgColor} border ${item.borderColor} backdrop-blur-md`}
          >
            <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-white text-sm font-medium leading-tight">{item.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{item.sublabel}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Instructor Verification Badge */}
      {isVerifiedInstructor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 rounded-lg backdrop-blur-md"
        >
          <div className="relative">
            <CheckCircle className="w-6 h-6 text-indigo-400" />
            <motion.div
              className="absolute inset-0 w-6 h-6"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            >
              <CheckCircle className="w-6 h-6 text-indigo-400" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Verified instructor</p>
            <p className="text-white/70 text-xs">Industry expert</p>
          </div>
        </motion.div>
      )}

      {/* Social Proof Stats */}
      {(totalStudents > 0 || rating > 0) && (
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
          {totalStudents > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-white text-sm font-semibold">{totalStudents.toLocaleString()}+</p>
                <p className="text-white/60 text-xs">Happy Students</p>
              </div>
            </div>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-white text-sm font-semibold">{rating.toFixed(1)}/5.0</p>
                <p className="text-white/60 text-xs">Average Rating</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security & Payment Methods */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Lock className="w-3.5 h-3.5" />
          <span>Stripe‑secured checkout</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Payment method icons */}
          <div className="flex -space-x-1">
            {["Visa", "Mastercard", "Amex", "PayPal"].map((method, i) => (
              <div
                key={i}
                className="w-8 h-5 bg-white/10 border border-white/20 rounded flex items-center justify-center text-[8px] text-white/50 font-mono"
              >
                {method.slice(0, 2)}
              </div>
            ))}
          </div>
          <span className="text-xs text-white/60">Major cards accepted</span>
        </div>
      </div>

      {/* Urgency Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 p-2.5 bg-orange-500/20 border border-orange-400/40 rounded-lg backdrop-blur-md"
      >
        <Zap className="w-4 h-4 text-orange-400" />
        <p className="text-orange-100 text-xs font-medium">Limited‑time offer — price may rise soon</p>
      </motion.div>
    </div>
  );
};

// Compact version for mobile
export const TrustIndicatorsCompact = (): JSX.Element => {
  return (
    <div className="flex items-center justify-around p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-green-400" />
        <span className="text-xs text-white/80">Secured</span>
      </div>
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-white/80">30-Day</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Award className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-white/80">Certificate</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle className="w-4 h-4 text-purple-400" />
        <span className="text-xs text-white/80">Verified</span>
      </div>
    </div>
  );
};
