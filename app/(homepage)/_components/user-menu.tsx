"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Bell, 
  HelpCircle,
  Bookmark,
  Award,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Users,
  X
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import Image from "next/image";

interface UserMenuProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close modal when ESC is pressed
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const menuSections = [
    {
      title: "Navigation",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", link: dashboardLink },
        { icon: User, label: "My Profile", link: "/settings" },
        { icon: Bookmark, label: "My Courses", link: "/my-courses" },
        { icon: MessageCircle, label: "My Posts", link: "/my-posts" },
        { icon: Users, label: "Study Groups", link: "/groups" },
      ]
    },
    {
      title: "Account & Settings",
      items: [
        { icon: Settings, label: "Account Settings", link: "/settings" },
        { icon: Bell, label: "Notifications", link: "/settings#notifications" },
        { icon: CreditCard, label: "Billing & Plans", link: "/settings#billing" },
      ]
    },
    {
      title: "Support & Help",
      items: [
        { icon: HelpCircle, label: "Help Center", link: "/help" },
        { icon: MessageCircle, label: "Contact Support", link: "/support" },
      ]
    }
  ];

  const getAvatarFallback = (name?: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Handle menu item click - closes modal
  const handleMenuItemClick = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative hidden md:block" ref={menuRef}>
      {/* User Avatar Container */}
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center group"
          aria-label="User menu"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/50 hover:border-purple-400 group-hover:scale-105 transition-all duration-200 shadow-md hover:shadow-purple-500/25">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {getAvatarFallback(user?.name)}
              </div>
            )}
            
            {/* Status indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm"></div>
          </div>
        </button>
        
        {/* HOVER TOOLTIP - Simple design showing name/email */}
        <AnimatePresence>
          {isHovered && !isModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed right-4 top-16 w-64 z-[99999] pointer-events-none"
            >
              <div className="p-3 rounded-lg bg-slate-800 backdrop-blur-md border border-slate-600 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/60 flex-shrink-0">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user?.name || "User"}</p>
                    <p className="text-slate-300 text-xs truncate">{user?.email || "No email"}</p>
                  </div>
                </div>
                {/* Small arrow pointer */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-600 transform rotate-45"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CLICK MODAL - Full featured menu with different design */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-16 w-80 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-600/50 shadow-2xl overflow-hidden z-[99999]"
            >
              {/* Modal Header with User Info */}
              <div className="relative p-5 bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-800 border-b border-gray-600">
                {/* Close button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-3 right-3 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-200" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400/70 shadow-lg flex-shrink-0">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {getAvatarFallback(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg truncate">{user?.name || "User"}</h3>
                    <p className="text-gray-200 text-sm truncate">{user?.email || ""}</p>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-purple-500/50 text-purple-100 border border-purple-400/50">
                        {user?.role === "ADMIN" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <Award className="w-3 h-3 mr-1" />
                            Member
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Sections */}
              <div className="max-h-[400px] overflow-y-auto py-2 bg-gray-900/95 backdrop-blur-sm">
                {menuSections.map((section, sectionIndex) => (
                  <div key={section.title} className={sectionIndex !== 0 ? "mt-1 pt-3 border-t border-gray-700" : ""}>
                    <p className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">
                      {section.title}
                    </p>
                    
                    {section.items.map((item) => (
                      <Link key={item.label} href={item.link} onClick={handleMenuItemClick}>
                        <motion.div
                          whileHover={{ x: 4, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center px-4 py-3 text-gray-200 hover:text-white transition-colors cursor-pointer group mx-2 rounded-lg"
                        >
                          <div className="w-9 h-9 mr-3 rounded-lg bg-gray-700 flex items-center justify-center group-hover:bg-indigo-600/60 transition-colors">
                            <item.icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                          </div>
                          <span className="font-medium text-sm">{item.label}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>

              {/* Logout Section */}
              <div className="p-2 border-t border-gray-600 bg-gray-800">
                <LogoutButton className="w-full" onClick={handleMenuItemClick}>
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: "rgba(239, 68, 68, 0.15)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-4 py-3 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer mx-2"
                  >
                    <div className="w-9 h-9 mr-3 rounded-lg bg-red-900/50 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">Sign Out</span>
                  </motion.div>
                </LogoutButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};