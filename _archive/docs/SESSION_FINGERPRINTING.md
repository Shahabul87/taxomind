# Session Fingerprinting for Hijack Detection

This implementation provides comprehensive session fingerprinting to detect potential session hijacking attempts in the Taxomind LMS platform. The system captures device characteristics and monitors for changes that might indicate unauthorized access.

## 🔒 Security Features

- **Device Fingerprinting**: Captures user agent, headers, screen resolution, timezone, and platform info
- **Fuzzy Matching**: Uses similarity scoring to avoid false positives from minor browser updates
- **Risk Assessment**: Classifies threats as LOW, MEDIUM, HIGH, or CRITICAL
- **Trusted Devices**: Allow users to explicitly trust devices for enhanced security
- **Security Alerts**: Real-time notifications for suspicious activities
- **Session Management**: Automatic session termination for critical threats

## 📁 File Structure

```
lib/security/
├── session-fingerprint.ts      # Core fingerprinting logic
├── session-manager.ts          # Session management and validation
├── client-fingerprint.ts       # Client-side data collection
└── session-security-provider.tsx # React provider for automatic monitoring

components/security/
├── trusted-devices-manager.tsx # Device management UI
├── security-alerts.tsx         # Security alerts dashboard
└── session-security-provider.tsx # Provider component

app/api/auth/
├── fingerprint/route.ts        # Fingerprint submission endpoint
├── trust-device/route.ts       # Device trust management
└── trusted-devices/            # Device CRUD operations

app/api/security/
└── alerts/                     # Security alerts API

hooks/
└── use-session-fingerprint.ts  # React hook for fingerprinting
```

## 🚀 Quick Setup

### 1. Database Migration

The system uses the existing `AuthSession` model with additional fields. Run Prisma migration:

```bash
npx prisma generate
npx prisma db push
```

### 2. Add Provider to App Layout

Add the session security provider to your app layout:

```tsx
// app/layout.tsx
import { SessionSecurityProvider } from '@/components/security/session-security-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <SessionSecurityProvider
            showNotifications={true}
            autoMonitor={true}
            checkInterval={5 * 60 * 1000} // 5 minutes
          >
            {children}
            {/* Optional: Add security indicator */}
            <SessionSecurityIndicator showDetails={true} />
            <SecurityBanner />
          </SessionSecurityProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 3. Add Security Settings Page

Create a security settings page for users:

```tsx
// app/settings/security/page.tsx
import TrustedDevicesManager from '@/components/security/trusted-devices-manager';
import SecurityAlerts from '@/components/security/security-alerts';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-8">
      <h1>Security Settings</h1>
      <TrustedDevicesManager />
      <SecurityAlerts />
    </div>
  );
}
```

## 🔧 Configuration Options

### Fingerprint Configuration

Adjust sensitivity and matching criteria:

```typescript
// lib/security/session-fingerprint.ts
const customConfig: FingerprintConfig = {
  minimumSimilarity: 0.7,        // Higher = stricter matching
  weights: {
    userAgent: 0.25,             // Component importance weights
    acceptHeaders: 0.15,
    language: 0.1,
    encoding: 0.1,
    platform: 0.15,
    timezone: 0.1,
    screenResolution: 0.15,
  },
  deviceTrustDays: 30,           // Trust duration
  maxTrustedDevices: 10,         // Max devices per user
};
```

### Security Provider Options

```tsx
<SessionSecurityProvider
  showNotifications={true}        // Show security notifications
  autoMonitor={true}             // Enable automatic monitoring
  checkInterval={5 * 60 * 1000}  // Check every 5 minutes
>
```

## 📊 Usage Examples

### Manual Fingerprint Collection

```typescript
import { useSessionFingerprint } from '@/hooks/use-session-fingerprint';

function SecurityComponent() {
  const {
    fingerprint,
    isLoading,
    deviceTrusted,
    riskLevel,
    securityScore,
    needsAttention,
    refresh
  } = useSessionFingerprint({
    autoCollect: true,
    autoSubmit: true,
    showNotifications: true,
    monitorSecurity: true,
  });

  return (
    <div>
      <p>Security Score: {securityScore}/100</p>
      <p>Risk Level: {riskLevel}</p>
      {needsAttention && (
        <div className="alert alert-warning">
          Security attention required!
        </div>
      )}
    </div>
  );
}
```

### Client-Side Fingerprint Collection

```typescript
import { 
  collectClientFingerprint, 
  submitFingerprint 
} from '@/lib/security/client-fingerprint';

async function collectAndSubmit() {
  // Collect device characteristics
  const fingerprint = await collectClientFingerprint();
  
  // Submit to server for validation
  const result = await submitFingerprint(fingerprint);
  
  if (result.success) {
    console.log('Device trusted:', result.trusted);
    console.log('Risk level:', result.riskLevel);
  }
}
```

### Server-Side Validation

```typescript
import { SessionManager } from '@/lib/security/session-manager';

// Validate session on server
const validation = await SessionManager.validateSessionFingerprint(
  sessionToken,
  userId
);

if (validation.shouldForceReauth) {
  // Force user to re-authenticate
  await signOut();
}

if (validation.shouldAlert) {
  // Log security event or notify admins
  console.warn('Security changes detected:', validation.changes);
}
```

## 🛡️ Security Features

### Automatic Session Protection

The system automatically:
1. Collects device fingerprint on login
2. Validates fingerprint on each request
3. Detects changes in device characteristics
4. Scores similarity using weighted comparison
5. Triggers alerts for suspicious changes
6. Terminates sessions for critical threats

### Risk Levels

- **LOW**: Normal operation, trusted device
- **MEDIUM**: Minor changes detected, monitor closely
- **HIGH**: Significant changes, potential security concern
- **CRITICAL**: Major discrepancies, likely hijack attempt

### Device Trust Management

Users can:
- View all trusted devices
- Trust new devices explicitly
- Revoke trust for lost/stolen devices
- See device activity history
- Manage device names and settings

## 📈 Security Events

The system logs various security events:

```typescript
// Events automatically logged
- SESSION_CREATED         // New session established
- FINGERPRINT_MISMATCH    // Device changes detected
- SESSION_TERMINATED      // Session ended due to security
- DEVICE_TRUSTED         // User trusted a device
- DEVICE_TRUST_REVOKED   // Trust removed from device
```

### Viewing Security Events

```typescript
// Get security alerts for user
const alerts = await fetch('/api/security/alerts');

// Mark alert as resolved
await fetch(`/api/security/alerts/${alertId}`, {
  method: 'PATCH',
  body: JSON.stringify({ 
    status: 'RESOLVED',
    resolution: 'False alarm - legitimate device change'
  })
});
```

## 🔍 Monitoring and Analytics

### Security Metrics

Track security health across your application:

```typescript
const securityMetrics = {
  totalSessions: 1000,
  trustedDevices: 850,
  securityAlerts: 15,
  criticalThreats: 2,
  averageSecurityScore: 92
};
```

### Admin Dashboard Integration

```tsx
// For admin users - see system-wide security
function AdminSecurityDashboard() {
  return (
    <div>
      <SecurityAlerts />          {/* All alerts */}
      <SystemSecurityMetrics />   {/* System health */}
      <ThreatAnalysis />         {/* Threat patterns */}
    </div>
  );
}
```

## ⚡ Performance Considerations

- **Client Collection**: ~50ms to collect fingerprint
- **Server Validation**: ~5ms for similarity calculation
- **Storage Overhead**: ~2KB per session for fingerprint data
- **Network Impact**: ~1KB additional data per login

## 🐛 Troubleshooting

### Common Issues

1. **False Positives**: Browser updates triggering alerts
   - Solution: Adjust `minimumSimilarity` threshold
   - Lower weight for `userAgent` component

2. **Performance Impact**: Fingerprinting slowing down login
   - Solution: Implement async fingerprint collection
   - Use background monitoring instead of blocking validation

3. **User Experience**: Too many security alerts
   - Solution: Increase tolerance for minor changes
   - Implement smart learning based on user patterns

### Debug Mode

Enable debug logging:

```typescript
// Set in development
localStorage.setItem('fingerprint_debug', 'true');

// Check logs in browser console
console.log('Fingerprint collected:', fingerprint);
console.log('Similarity score:', analysis.similarity);
```

## 🔒 Security Best Practices

1. **Don't be too strict**: Allow for legitimate device changes
2. **User education**: Explain why devices need to be trusted
3. **Graceful degradation**: Don't break UX for security failures
4. **Monitor patterns**: Look for systematic attacks vs. isolated incidents
5. **Regular cleanup**: Remove old sessions and expired trust

## 📝 API Documentation

### POST /api/auth/fingerprint
Submit device fingerprint for validation.

### POST /api/auth/trust-device
Trust the current device for the user.

### GET /api/auth/trusted-devices
Get list of user's trusted devices.

### DELETE /api/auth/trusted-devices/[deviceId]
Revoke trust for a specific device.

### GET /api/security/alerts
Get security alerts for the user.

### PATCH /api/security/alerts/[alertId]
Update security alert status.

## 📊 Example Implementation

Check the provided React components for complete examples:
- `TrustedDevicesManager` - Full device management UI
- `SecurityAlerts` - Security events dashboard  
- `SessionSecurityProvider` - Automatic monitoring setup

## 🤝 Contributing

When extending this system:
1. Maintain backwards compatibility
2. Add comprehensive tests
3. Update documentation
4. Consider privacy implications
5. Test across different browsers/devices

---

**Note**: This fingerprinting system is designed to enhance security while maintaining user experience. It should be part of a comprehensive security strategy including proper authentication, encryption, and monitoring.