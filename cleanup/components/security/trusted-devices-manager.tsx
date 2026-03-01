'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  Tablet, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Edit3,
  Calendar,
  Activity
} from 'lucide-react';
import { 
  getTrustedDevices, 
  requestDeviceTrust, 
  revokeTrustedDevice,
  collectClientFingerprint,
  submitFingerprint
} from '@/lib/security/client-fingerprint';

interface TrustedDevice {
  id: string;
  deviceId: string;
  name: string;
  lastActivity: string;
  trustEstablishedAt: string;
  riskLevel: string;
  current: boolean;
}

interface DeviceIconProps {
  deviceName: string;
  className?: string;
}

const DeviceIcon: React.FC<DeviceIconProps> = ({ deviceName, className = "h-5 w-5" }) => {
  const name = deviceName.toLowerCase();
  
  if (name.includes('mobile') || name.includes('android') || name.includes('iphone')) {
    return <Smartphone className={className} />;
  } else if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className={className} />;
  } else {
    return <Monitor className={className} />;
  }
};

const TrustedDevicesManager: React.FC = () => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<{
    deviceId?: string;
    trusted: boolean;
    riskLevel?: string;
  }>({ trusted: false });
  const [trustDialogOpen, setTrustDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<TrustedDevice | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [customDeviceName, setCustomDeviceName] = useState('');

  const loadDevices = React.useCallback(async () => {
    try {
      const result = await getTrustedDevices();
      if (result.success && result.devices) {
        // Ensure the devices match the TrustedDevice interface
        const devicesWithDefaults: TrustedDevice[] = result.devices.map((device: any) => ({
          id: device.id,
          deviceId: device.deviceId || device.id, // Use id as fallback for deviceId
          name: device.name,
          lastActivity: device.lastActivity,
          trustEstablishedAt: device.trustEstablishedAt,
          riskLevel: device.riskLevel || 'LOW', // Default to LOW if not provided
          current: device.current || false
        }));
        setDevices(devicesWithDefaults);
      }
    } catch (error) {
      console.error('Failed to load trusted devices:', error);
      toast.error('Failed to load trusted devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkCurrentDevice = React.useCallback(async () => {
    try {
      // Collect current device fingerprint
      const fingerprint = await collectClientFingerprint();
      const result = await submitFingerprint(fingerprint);
      
      if (result.success) {
        setCurrentDeviceInfo({
          deviceId: result.deviceId,
          trusted: result.trusted || false,
          riskLevel: result.riskLevel,
        });
        
        // Set default device name
        if (result.deviceId && !result.trusted) {
          const deviceInfo = extractDeviceInfo(fingerprint);
          setNewDeviceName(`${deviceInfo.browser} on ${deviceInfo.os} (${deviceInfo.device})`);
        }
      }
    } catch (error) {
      console.error('Failed to check current device:', error);
    }
  }, []);

  // Load trusted devices and current device info
  useEffect(() => {
    loadDevices();
    checkCurrentDevice();
  }, [loadDevices, checkCurrentDevice]);

  const handleTrustCurrentDevice = async () => {
    try {
      const result = await requestDeviceTrust(customDeviceName || newDeviceName);
      
      if (result.success) {
        toast.success('Device trusted successfully');
        setTrustDialogOpen(false);
        setCustomDeviceName('');
        await Promise.all([loadDevices(), checkCurrentDevice()]);
      } else {
        toast.error(result.message || 'Failed to trust device');
      }
    } catch (error) {
      console.error('Failed to trust device:', error);
      toast.error('Failed to trust device');
    }
  };

  const handleRevokeDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to remove trust for "${deviceName}"? You will need to re-establish trust if you use this device again.`)) {
      return;
    }

    try {
      const result = await revokeTrustedDevice(deviceId);
      
      if (result.success) {
        toast.success('Device trust revoked successfully');
        await Promise.all([loadDevices(), checkCurrentDevice()]);
      } else {
        toast.error(result.message || 'Failed to revoke device trust');
      }
    } catch (error) {
      console.error('Failed to revoke device trust:', error);
      toast.error('Failed to revoke device trust');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel?.toUpperCase()) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  const extractDeviceInfo = (fingerprint: any) => {
    return {
      browser: 'Browser',
      os: fingerprint?.platform || 'Unknown OS',
      device: 'Device'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trusted Devices
          </CardTitle>
          <CardDescription>
            Loading your trusted devices...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Device Status
          </CardTitle>
          <CardDescription>
            Security status of the device you&apos;re currently using
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentDeviceInfo.trusted ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">
                  {currentDeviceInfo.trusted ? 'Trusted Device' : 'Untrusted Device'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentDeviceInfo.trusted 
                    ? 'This device is recognized and trusted'
                    : 'Consider adding this device to your trusted devices list'
                  }
                </p>
              </div>
              {currentDeviceInfo.riskLevel && (
                <Badge variant={getRiskBadgeVariant(currentDeviceInfo.riskLevel)}>
                  {currentDeviceInfo.riskLevel}
                </Badge>
              )}
            </div>
            
            {!currentDeviceInfo.trusted && (
              <Dialog open={trustDialogOpen} onOpenChange={setTrustDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Trust This Device
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trust Current Device</DialogTitle>
                    <DialogDescription>
                      Add this device to your trusted devices list. Trusted devices have enhanced security and won&apos;t trigger security alerts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="device-name">Device Name</Label>
                      <Input
                        id="device-name"
                        value={customDeviceName}
                        onChange={(e) => setCustomDeviceName(e.target.value)}
                        placeholder={newDeviceName}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Give this device a recognizable name
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTrustDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleTrustCurrentDevice}>
                      Trust Device
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trusted Devices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trusted Devices ({devices.length})
          </CardTitle>
          <CardDescription>
            Manage devices that are trusted for your account. Trusted devices provide enhanced security and user experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trusted devices found</p>
              <p className="text-sm">Trust your current device to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DeviceIcon deviceName={device.name} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{device.name}</p>
                        {device.current && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                        <Badge variant={getRiskBadgeVariant(device.riskLevel)}>
                          {device.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Trusted {formatDate(device.trustEstablishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Last active {formatDate(device.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDevice(device);
                        setCustomDeviceName(device.name);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeDevice(device.deviceId, device.name)}
                      disabled={device.current}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update the name of this trusted device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-device-name">Device Name</Label>
              <Input
                id="edit-device-name"
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Implement device name update
              setEditDialogOpen(false);
              toast.info('Device name update feature coming soon');
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrustedDevicesManager;