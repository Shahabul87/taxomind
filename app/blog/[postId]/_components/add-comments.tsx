"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Post } from "@prisma/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MessageCircle, Smile, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

interface PostCommentProps {
  initialData: Post;
  postId: string;
  onCommentAdded?: () => void;
}

const formSchema = z.object({
  comments: z.string().min(1, {
    message: "Comment is required",
  }),
});

const emojiOptions = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  // Secondary emojis
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🎉", label: "Party" },
  { emoji: "💯", label: "Perfect" },
  { emoji: "🤔", label: "Thinking" },
  { emoji: "😍", label: "Heart Eyes" },
];

export const PostComment = ({
  initialData,
  postId,
  onCommentAdded
}: PostCommentProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/posts/${postId}/comments`, values);
      toast.success("Comment added successfully");
      form.reset();
      router.refresh();
      onCommentAdded?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      toast.error(errorMessage);
    }
  };

  const handleReactionSelect = (emoji: string) => {
    const currentComment = form.getValues("comments");
    form.setValue("comments", `${currentComment}${emoji}`);
  };

  const handleClose = () => {
    onCommentAdded?.();
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-4 sm:p-6">
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isSubmitting}
                      placeholder="Write your comment here..."
                      className="resize-none min-h-[150px] bg-[#FAF6F1] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#C65D3B]/50 focus:ring-1 focus:ring-[#C65D3B]/30 rounded-xl transition-all duration-300 font-[family-name:var(--font-body)] placeholder:text-slate-400"
                    />
                  </FormControl>
                  <FormMessage className="text-[#C65D3B]" />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className={cn(
            "flex justify-between items-center",
            "border-t border-slate-200 dark:border-slate-700",
            "pt-4 pb-4 px-4 sm:px-6",
            "bg-gradient-to-b from-transparent to-[#FAF6F1]/50",
            "dark:to-slate-900/50"
          )}>
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-9 w-9 hover:bg-[#C65D3B]/10 text-slate-600 dark:text-slate-400 hover:text-[#C65D3B]"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white font-[family-name:var(--font-ui)]">
                    <p>Add emoji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {showEmojiPicker && (
                <Card className="absolute bottom-full left-0 mb-2 p-4 w-[360px] bg-white dark:bg-slate-800 backdrop-blur-sm shadow-xl border border-slate-200 dark:border-slate-700 z-50 rounded-xl">
                  <div className="grid grid-cols-6 gap-1.5">
                    {emojiOptions.slice(0, 6).map(({ emoji, label }) => (
                      <Button
                        key={emoji}
                        type="button"
                        variant="ghost"
                        className="relative group h-12 w-12 p-0 hover:bg-[#C65D3B]/10 rounded-xl overflow-hidden"
                        onClick={() => {
                          handleReactionSelect(emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          <span className="text-2xl transform group-hover:scale-0 group-hover:-translate-y-10 transition-transform duration-200">
                            {emoji}
                          </span>
                          <span className="absolute text-3xl transform scale-0 translate-y-10 group-hover:scale-125 group-hover:translate-y-0 transition-all duration-200 group-hover:animate-bounce">
                            {emoji}
                          </span>
                        </div>
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-200">
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-white whitespace-nowrap font-[family-name:var(--font-ui)]">
                            {label}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#C65D3B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </Button>
                    ))}
                  </div>

                  <Separator className="my-3 bg-slate-200 dark:bg-slate-700" />

                  <div className="grid grid-cols-6 gap-1.5">
                    {emojiOptions.slice(6).map(({ emoji, label }) => (
                      <Button
                        key={emoji}
                        type="button"
                        variant="ghost"
                        className="relative group h-12 w-12 p-0 hover:bg-[#87A878]/10 rounded-xl overflow-hidden"
                        onClick={() => {
                          handleReactionSelect(emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        <div className="relative w-full h-full flex items-center justify-center">
                          <span className="text-2xl transform group-hover:scale-0 group-hover:-translate-y-10 transition-transform duration-200">
                            {emoji}
                          </span>
                          <span className="absolute text-3xl transform scale-0 translate-y-10 group-hover:scale-125 group-hover:translate-y-0 transition-all duration-200 group-hover:animate-bounce">
                            {emoji}
                          </span>
                        </div>
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-200">
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800 text-white whitespace-nowrap font-[family-name:var(--font-ui)]">
                            {label}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#87A878]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className={cn(
                  "h-10 px-5 font-medium font-[family-name:var(--font-ui)]",
                  "bg-white dark:bg-slate-800",
                  "border-slate-200 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-200",
                  "hover:bg-slate-50 dark:hover:bg-slate-700",
                  "hover:text-slate-900 dark:hover:text-white",
                  "hover:border-slate-300 dark:hover:border-slate-600",
                  "transition-all duration-300",
                  "rounded-xl",
                  "shadow-sm hover:shadow-md",
                  "active:scale-95"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </span>
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={cn(
                  "h-10 px-6 font-medium font-[family-name:var(--font-ui)]",
                  "bg-[#C65D3B]",
                  "text-white",
                  "hover:bg-[#A84D32]",
                  "disabled:bg-slate-300",
                  "disabled:dark:bg-slate-700",
                  "disabled:text-slate-500 dark:disabled:text-slate-400",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  "transition-all duration-300",
                  "rounded-xl",
                  "shadow-lg hover:shadow-xl",
                  "shadow-[#C65D3B]/20 hover:shadow-[#C65D3B]/30",
                  "active:scale-95",
                  "disabled:hover:shadow-none disabled:active:scale-100"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Post Comment
                    </>
                  )}
                </span>
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
