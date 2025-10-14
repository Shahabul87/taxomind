"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const criteria = [
    {
      label: "At least 12 characters",
      met: password.length >= 12,
    },
    {
      label: "Contains uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  const getStrength = () => {
    if (metCount === 0) return { label: "Very Weak", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", percent: 0 };
    if (metCount === 1) return { label: "Weak", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", percent: 20 };
    if (metCount === 2) return { label: "Fair", color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400", percent: 40 };
    if (metCount === 3) return { label: "Good", color: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400", percent: 60 };
    if (metCount === 4) return { label: "Strong", color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", percent: 80 };
    return { label: "Very Strong", color: "bg-green-500", textColor: "text-green-600 dark:text-green-400", percent: 100 };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3 mt-3"
      >
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Strength
            </span>
            <span className={`text-sm font-semibold ${strength.textColor}`}>
              {strength.label}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strength.percent}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full ${strength.color} rounded-full`}
            />
          </div>
        </div>

        {/* Criteria Checklist */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Password must contain:
          </p>
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  criterion.met
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  {criterion.met ? (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  ) : (
                    <X className="w-3 h-3 text-white" strokeWidth={2} />
                  )}
                </div>
                <span className={`text-sm ${
                  criterion.met
                    ? 'text-green-700 dark:text-green-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {criterion.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
