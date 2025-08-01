# Social Media Platform Integration Setup

This guide explains how to set up OAuth credentials for each supported social media platform.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id  
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Google (YouTube)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# TikTok
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Facebook
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Discord
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Twitch
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Next Auth (required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## Platform Setup Instructions

### Twitter/X
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use existing
3. Navigate to App Settings > Keys and Tokens
4. Copy Client ID and Client Secret
5. Set redirect URI: `${NEXTAUTH_URL}/api/auth/twitter/callback`
6. Required scopes: `tweet.read users.read follows.read like.read offline.access`

### Instagram
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add Instagram Basic Display product
4. Navigate to Instagram Basic Display > Basic Display
5. Copy Instagram App ID and Instagram App Secret
6. Set redirect URI: `${NEXTAUTH_URL}/api/auth/instagram/callback`
7. Required scopes: `user_profile,user_media`

### LinkedIn
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Navigate to Auth tab
4. Copy Client ID and Client Secret
5. Set redirect URI: `${NEXTAUTH_URL}/api/auth/linkedin/callback`
6. Required scopes: `r_liteprofile r_emailaddress w_member_social`

### YouTube (Google)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Set redirect URI: `${NEXTAUTH_URL}/api/auth/youtube/callback`
6. Required scopes: `https://www.googleapis.com/auth/youtube.readonly`

### TikTok
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Navigate to Manage Apps > Your App
4. Copy Client Key and Client Secret
5. Set redirect URI: `${NEXTAUTH_URL}/api/auth/tiktok/callback`
6. Required scopes: `user.info.basic,video.list`

### Facebook
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Navigate to Facebook Login > Settings
5. Copy App ID and App Secret
6. Set redirect URI: `${NEXTAUTH_URL}/api/auth/facebook/callback`
7. Required scopes: `pages_show_list,pages_read_engagement`

### GitHub
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App" or use existing
3. Set Application name and Homepage URL
4. Set Authorization callback URL: `${NEXTAUTH_URL}/api/auth/github/callback`
5. Copy Client ID and generate Client Secret
6. Required scopes: `user:email,read:user,repo`

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create "New Application"
3. Navigate to OAuth2 section
4. Copy Client ID and Client Secret
5. Add redirect URI: `${NEXTAUTH_URL}/api/auth/discord/callback`
6. Required scopes: `identify guilds`

### Twitch
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create new application
3. Set OAuth Redirect URLs: `${NEXTAUTH_URL}/api/auth/twitch/callback`
4. Copy Client ID and generate Client Secret
5. Required scopes: `user:read:email channel:read:subscriptions`

## Database Schema Requirements

Make sure your database has these tables (use Prisma migrations):

```prisma
model SocialAccount {
  id               String    @id @default(cuid())
  userId           String
  platform         String    // TWITTER, INSTAGRAM, etc.
  platformUserId   String
  username         String?
  displayName      String?
  profileImageUrl  String?
  accessToken      String
  refreshToken     String?
  expiresAt        DateTime?
  followerCount    Int       @default(0)
  metadata         Json?
  lastSyncAt       DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  analytics        SocialAnalytics[]
  
  @@unique([userId, platform])
  @@map("social_accounts")
}

model SocialAnalytics {
  id              String       @id @default(cuid())
  socialAccountId String
  analyticsType   String       // FOLLOWER_COUNT, ENGAGEMENT_RATE, etc.
  value           Float
  recordedAt      DateTime
  metadata        Json?
  createdAt       DateTime     @default(now())
  
  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)
  
  @@map("social_analytics")
}
```

## Testing the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/profile`
3. Click "Connect Platform" 
4. Select a platform you've configured
5. Complete the OAuth flow
6. Check if the platform appears in your dashboard

## Troubleshooting

### Common Issues:

1. **"Platform not configured" error**
   - Ensure environment variables are set correctly
   - Restart your development server

2. **"Redirect URI mismatch" error**
   - Check that callback URLs match exactly in platform settings
   - Ensure NEXTAUTH_URL is set correctly

3. **"Invalid scope" error**
   - Verify the required scopes are enabled in platform settings
   - Some platforms require manual approval for certain scopes

4. **Token refresh failures**
   - Ensure refresh tokens are being stored
   - Check platform-specific refresh token requirements

### Rate Limits:

Each platform has different rate limits:
- Twitter: 300 requests per 15 minutes
- Instagram: 200 requests per hour
- GitHub: 5000 requests per hour
- LinkedIn: Varies by endpoint

Implement proper caching and backoff strategies for production use.

## Security Considerations

1. Never expose client secrets in frontend code
2. Store tokens securely in your database
3. Implement proper token refresh logic
4. Use HTTPS in production
5. Validate state parameters in OAuth callbacks
6. Implement proper error handling and logging

## Next Steps

After setting up the platforms:

1. Test the OAuth flow for each platform
2. Verify data syncing is working
3. Implement error handling for failed syncs
4. Add monitoring for token expiration
5. Consider implementing webhooks for real-time updates
6. Add rate limiting and caching for API calls 