"use client";

import { motion } from "framer-motion";
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
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      met: /[!@#$%^&*]/.test(password),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  // Calculate strength
  const getStrength = () => {
    if (metCount === 0) return { label: "Very Weak", color: "bg-red-500", percent: 0 };
    if (metCount === 1) return { label: "Weak", color: "bg-red-500", percent: 20 };
    if (metCount === 2) return { label: "Fair", color: "bg-orange-500", percent: 40 };
    if (metCount === 3) return { label: "Good", color: "bg-yellow-500", percent: 60 };
    if (metCount === 4) return { label: "Strong", color: "bg-blue-500", percent: 80 };
    return { label: "Very Strong", color: "bg-green-500", percent: 100 };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 space-y-3"
    >
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">
            Password Strength:
          </span>
          <span className={`font-semibold ${
            strength.percent >= 80 ? 'text-green-600 dark:text-green-400' :
            strength.percent >= 60 ? 'text-blue-600 dark:text-blue-400' :
            strength.percent >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength.percent}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${strength.color} rounded-full`}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {criteria.map((criterion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-2"
          >
            <div className="flex-shrink-0 mt-0.5">
              {criterion.met ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-4 h-4 text-gray-400 dark:text-gray-600" />
              )}
            </div>
            <span className={`text-sm ${
              criterion.met
                ? 'text-green-700 dark:text-green-400 font-medium'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              {criterion.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
