"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // TODO: Replace with actual newsletter API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus("success");
      setMessage("Thanks for subscribing!");
      setEmail("");
      
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="py-12 px-4 md:px-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Stay Updated
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
          Get the latest articles and insights delivered directly to your inbox. 
          No spam, unsubscribe at any time.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {status === "loading" ? (
              "Subscribing..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          By subscribing, you agree to our Privacy Policy and consent to receive updates.
        </p>
      </div>
    </div>
  );
}
