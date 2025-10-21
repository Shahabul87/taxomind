'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import MathRenderer from '@/components/MathRenderer';

interface MathLatexInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MathLatexInput = ({ value, onChange, disabled }: MathLatexInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter LaTeX equation (e.g., x = \frac{-b \pm \sqrt{b^2-4ac}}{2a})"
          className="font-mono min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use LaTeX syntax. Example: x^2 + y^2 = r^2
        </p>
      </div>

      {localValue && localValue.trim() && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-medium mb-2">Live Preview:</p>
          <div className="bg-background rounded p-4 flex items-center justify-center min-h-[80px]">
            <MathRenderer
              equation={localValue}
              mode="block"
              size="medium"
              theme="auto"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
