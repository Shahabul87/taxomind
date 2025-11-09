"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  WifiOff,
  Wifi,
  Download,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  CloudOff,
  Cloud,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceWorkerManagerProps {
  enableNotifications?: boolean;
  showOfflineIndicator?: boolean;
  autoUpdate?: boolean;
}

export function ServiceWorkerManager({
  enableNotifications = true,
  showOfflineIndicator = true,
  autoUpdate = true,
}: ServiceWorkerManagerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [offlineReady, setOfflineReady] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }

    // Check online status
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online!");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Some features may be limited.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      setIsInstalling(true);

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      setSwRegistration(registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast.info('A new version is available!', {
                duration: Infinity,
                action: {
                  label: 'Update',
                  onClick: () => updateServiceWorker(),
                },
              });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          toast.success(event.data.message);
        }
      });

      // Check if service worker is already installed
      if (registration.active) {
        setOfflineReady(true);
        calculateCacheSize();
      }

      console.log('Service Worker registered successfully');
      setIsInstalling(false);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setIsInstalling(false);
    }
  };

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      // Tell service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Listen for controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, [swRegistration]);

  // Calculate cache size
  const calculateCacheSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      setCacheSize(usage);
    }
  };

  // Clear cache
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setCacheSize(0);
      toast.success('Cache cleared successfully');

      // Re-register service worker
      if (swRegistration) {
        await swRegistration.unregister();
        await registerServiceWorker();
      }
    }
  };

  // Cache specific URLs
  const cacheUrls = (urls: string[]) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        payload: urls,
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled');
        // Subscribe to push notifications
        subscribeToPushNotifications();
      } else {
        toast.error('Notification permission denied');
      }
    }
  };

  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (swRegistration) {
      try {
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });

        toast.success('Push notifications enabled');
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Offline indicator component
  const OfflineIndicator = () => {
    if (!showOfflineIndicator || isOnline) return null;

    return (
      <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2">
        <Card className="w-64 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Offline Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              You can still access cached content
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Update notification component
  const UpdateNotification = () => {
    if (!updateAvailable) return null;

    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Update Available
            </CardTitle>
            <CardDescription>
              A new version of the app is available
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={updateServiceWorker} size="sm" className="w-full">
              Update Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <>
      <OfflineIndicator />
      <UpdateNotification />

      {/* Service Worker Status Card (for settings page) */}
      <Card className="hidden" id="service-worker-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className={cn("h-5 w-5", isOnline ? "text-green-500" : "text-orange-500")} />
            Offline Support
          </CardTitle>
          <CardDescription>
            Manage offline capabilities and cached content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Label>Status</Label>
            <Badge variant={offlineReady ? "success" : "secondary"}>
              {offlineReady ? "Ready" : isInstalling ? "Installing..." : "Not Installed"}
            </Badge>
          </div>

          {/* Connection */}
          <div className="flex items-center justify-between">
            <Label>Connection</Label>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Cache Size */}
          <div className="flex items-center justify-between">
            <Label>Cache Size</Label>
            <span className="text-sm text-muted-foreground">
              {formatBytes(cacheSize)}
            </span>
          </div>

          {/* Auto Update */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-update">Auto Update</Label>
            <Switch
              id="auto-update"
              checked={autoUpdate}
              disabled
            />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Push Notifications</Label>
            <Switch
              id="notifications"
              checked={enableNotifications}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestNotificationPermission();
                }
              }}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          {updateAvailable && (
            <Button
              size="sm"
              onClick={updateServiceWorker}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}

// Hook for using service worker features
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        setIsOfflineReady(true);
      });
    }
  }, []);

  const cacheContent = useCallback((urls: string[]) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        payload: urls,
      });
    }
  }, []);

  const clearCache = useCallback(async () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
  }, []);

  return {
    registration,
    isOfflineReady,
    cacheContent,
    clearCache,
  };
}