"use client";

import { useSafeToast } from "@/hooks/use-safe-toast";
import { Button } from "@/components/ui/button";

export function ToastExample() {
  const toast = useSafeToast();
  
  const showSuccessToast = () => {
    toast.success("Operation completed successfully!");
  };
  
  const showErrorToast = () => {
    toast.error("Something went wrong!");
  };
  
  const showInfoToast = () => {
    toast.info("Here's some information for you.");
  };
  
  const showCustomToast = () => {
    toast.custom("Custom toast message", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => console.log("Undo clicked"),
      },
    });
  };
  
  return (
    <div className="flex flex-col space-y-2 p-4">
      <h2 className="text-xl font-bold mb-4">Toast Example</h2>
      <Button onClick={showSuccessToast} variant="default">
        Show Success Toast
      </Button>
      <Button onClick={showErrorToast} variant="destructive">
        Show Error Toast
      </Button>
      <Button onClick={showInfoToast} variant="outline">
        Show Info Toast
      </Button>
      <Button onClick={showCustomToast} variant="secondary">
        Show Custom Toast
      </Button>
    </div>
  );
} 