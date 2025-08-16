"use client";

import { ProfileLink } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ProfileLinkList } from "./profileLinkList";
import { ProfileLinkForm } from "./profile-link-form";
import { PlusCircle, X, Link2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";

type ProfileLinksContentProps = {
  userId: string;
  profileLinks: ProfileLink[];
};

export const ProfileLinksContent = ({ userId, profileLinks }: ProfileLinksContentProps) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [links, setLinks] = useState<ProfileLink[]>(profileLinks);
  const router = useRouter();

  const toggleCreating = () => {
    setIsCreating((current) => !current);
  };

  // Debounced reorder function to avoid excessive API calls
  const debouncedReorder = useCallback(
    async (updateData: { id: string; position: number }[]) => {
      const debouncedFn = debounce(async () => {
        try {
          await axios.put(`/api/users/${userId}/profile-links/reorder`, { list: updateData });
          // No need for a toast on successful reordering as it's a common operation
          router.refresh();
        } catch (error: any) {
          toast.error("Failed to save new order");
        } finally {
          setIsUpdating(false);
        }
      }, 600); // 600ms debounce delay - balance between responsiveness and reducing API calls
      debouncedFn();
    },
    [userId, router]
  );

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    // Check if we need to reorder at all
    if (updateData.length === 0) return;
    
    // Set updating state immediately for UI feedback
    // Only show loading state if the user is waiting more than 400ms
    // This prevents flickering loading state for quick operations
    const loadingTimer = setTimeout(() => {
      setIsUpdating(true);
    }, 400);
    
    // Optimistically update local state first
    const updatedLinks = [...links];
    
    // Update only the specific links that changed positions
    updateData.forEach(item => {
      const linkIndex = updatedLinks.findIndex(link => link.id === item.id);
      if (linkIndex !== -1) {
        updatedLinks[linkIndex] = { ...updatedLinks[linkIndex], position: item.position };
      }
    });
    
    // Sort the updated links
    updatedLinks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    
    // Update state with optimistic changes
    setLinks(updatedLinks);
    
    // Send update to server with debouncing
    debouncedReorder(updateData);
    
    // Clear the loading timer if operation completes quickly
    return () => clearTimeout(loadingTimer);
  };

  const onEdit = (id: string) => {
    router.push(`/profile/links/${id}`);
  };

  const onDelete = async (id: string) => {
    try {
      await axios.delete(`/api/users/${userId}/profile-links/${id}`);
      setLinks(links.filter(link => link.id !== id));
      toast.success("Profile link deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Decorative elements */}
      <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-purple-500/10 rounded-full filter blur-[120px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/10 rounded-full filter blur-[120px] opacity-70 pointer-events-none"></div>
      
      <div className="mb-12 relative">
        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="relative z-10 overflow-hidden bg-slate-900/80 backdrop-blur-xl rounded-full p-1 inline-flex shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10">
            <button
              onClick={() => setActiveTab("edit")}
              className={cn(
                "relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                activeTab === "edit"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Edit Links
              {activeTab === "edit" && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full -z-10"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300", 
                activeTab === "preview"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Preview
              {activeTab === "preview" && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full -z-10"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </button>
          </div>
        </div>

        {activeTab === "edit" ? (
          <div className="relative">
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ProfileLinkForm userId={userId} />
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            >
              {/* Card glass effect */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm pointer-events-none"></div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-purple-500/10 rounded-full filter blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 rounded-full filter blur-3xl opacity-50"></div>
              
              <div className="relative p-6 sm:p-8">
                {isUpdating && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute -inset-4 rounded-full border-t-2 border-purple-500 animate-spin"></div>
                      <div className="absolute -inset-4 rounded-full border-t-2 border-pink-500 animate-spin delay-150"></div>
                      <div className="w-16 h-16 bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Sparkles className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex items-center">
                    <div className="relative mr-4">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-70 blur"></div>
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Social Network Links
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Connect and share your digital presence
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={toggleCreating} 
                    variant="ghost" 
                    className="group relative overflow-hidden rounded-xl px-4 py-2 h-10 sm:h-12 bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white transition-all duration-300"
                  >
                    {isCreating ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Add new link</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Content */}
                <div className={cn("text-sm", !links.length && !isCreating && "text-slate-400 italic")}>
                  {!links.length && !isCreating ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 px-4"
                    >
                      <div className="relative mb-6">
                        <div className="absolute -inset-6 rounded-full opacity-50 blur-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>
                        <div className="relative w-20 h-20 rounded-full bg-slate-800/90 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                          <Link2 className="h-8 w-8 text-purple-300" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No Links Yet</h3>
                      <p className="text-slate-400 max-w-sm text-center mb-6">
                        Add links to your social profiles and websites to build your network and showcase your online presence.
                      </p>
                      <Button
                        onClick={toggleCreating}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 rounded-xl h-12 px-6 font-medium"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Your First Link
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      {links.length > 0 && (
                        <>
                          <ProfileLinkList
                            items={links}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReorder={onReorder}
                          />
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 text-center"
                          >
                            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                              <span className="text-xs text-slate-400">Drag and drop to reorder your profile links</span>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <ProfileLinksPreview profileLinks={links} />
        )}
      </div>
    </div>
  );
};

const ProfileLinksPreview = ({ profileLinks }: { profileLinks: ProfileLink[] }) => {
  if (!profileLinks.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center px-8 py-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
      >
        <div className="relative mb-6 mx-auto w-fit">
          <div className="absolute -inset-6 rounded-full opacity-50 blur-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>
          <div className="relative w-20 h-20 rounded-full bg-slate-800/90 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <Link2 className="h-8 w-8 text-purple-300" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Social Links Yet</h3>
        <p className="text-slate-400 max-w-md mx-auto text-base mb-6">
          Your social links preview will appear here once you&apos;ve added them.
        </p>
        <Button
          onClick={() => {}}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full px-6 py-2 transition-all flex items-center gap-2"
        >
          <span>Switch to Edit Mode</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  // Platform-specific styling and icons
  const getPlatformStyle = (platform: string) => {
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes("twitter") || platformLower.includes("x")) {
      return {
        gradientStart: "from-blue-400",
        gradientEnd: "to-blue-600",
        iconPath: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z",
      };
    } else if (platformLower.includes("facebook")) {
      return {
        gradientStart: "from-blue-600",
        gradientEnd: "to-blue-800",
        iconPath: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
      };
    } else if (platformLower.includes("instagram")) {
      return {
        gradientStart: "from-pink-500",
        gradientEnd: "to-yellow-500",
        iconPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
      };
    } else if (platformLower.includes("linkedin")) {
      return {
        gradientStart: "from-blue-500",
        gradientEnd: "to-blue-700",
        iconPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
      };
    } else {
      return {
        gradientStart: "from-purple-600",
        gradientEnd: "to-pink-600",
        iconPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 1 0-1.41-1.41z",
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-sm mx-auto"
    >
      {/* Phone frame */}
      <div className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-[40px] border-8 border-slate-800 bg-slate-800 shadow-2xl">
        {/* Status bar */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-10">
          <div className="flex justify-between items-center px-6 h-full text-[8px] text-white/80">
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20.75C16.83 20.75 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 16.83 7.17 20.75 12 20.75Z" fill="currentColor"/>
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.29 16.29L20 20.01M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg width="14" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V8Z" fill="currentColor"/>
                <path d="M12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16Z" fill="currentColor"/>
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <div className="h-6 w-40 bg-slate-900 rounded-b-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative bg-black pt-8 pb-6 h-[520px] overflow-hidden">
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 to-black/60 backdrop-blur-sm pointer-events-none z-0"></div>
          
          {/* Background gradient animation */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-purple-600/30 via-pink-600/30 to-blue-600/30 blur-3xl transform-gpu animate-pulse"></div>
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-br from-blue-600/30 via-indigo-600/30 to-violet-600/30 blur-3xl transform-gpu animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Profile section */}
          <div className="relative z-10 px-5 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 p-1 mb-4">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">U</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Username</h3>
              <p className="text-xs text-slate-400 mb-4">@username</p>
              <div className="text-[10px] bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-white">
                All Social Links
              </div>
            </div>
          </div>
          
          {/* Social links */}
          <div className="relative z-10 px-5 space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {profileLinks
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((link) => {
                const { gradientStart, gradientEnd, iconPath } = getPlatformStyle(link.platform);
                
                return (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 transition-all duration-300"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${gradientStart} ${gradientEnd} flex items-center justify-center`}>
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                      >
                        <path d={iconPath} />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">{link.platform}</span>
                  </motion.a>
                );
              })}
          </div>
          
          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
      </div>
      
      {/* Frame shadow */}
      <div className="relative z-0 h-4 w-40 bg-black/20 blur-md rounded-full mx-auto -mt-2"></div>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">Preview of your social links display</p>
      </div>
    </motion.div>
  );
};

export default ProfileLinksContent;
