"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  Key,
  Plus,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Hash,
  Globe,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// Platform icons - you might want to use actual platform icons or a library like react-icons
const PlatformIcons = {
  twitter: "𝕏",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  tiktok: "🎵",
  facebook: "👥",
  pinterest: "📌",
  snapchat: "👻",
  reddit: "🔴",
  discord: "🎮",
  twitch: "🎮",
  github: "🐙",
  medium: "📝",
  behance: "🎨",
  dribbble: "🏀"
};

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'social' | 'professional' | 'creative' | 'gaming' | 'content';
  color: string;
  isPopular?: boolean;
  isComingSoon?: boolean;
  supportsOAuth?: boolean;
  placeholder?: string;
}

interface ConnectPlatformModalProps {
  children: React.ReactNode;
  userId?: string;
  onProfileLinksUpdated?: (links: any[]) => void;
}

interface EditableMetadata extends ProfileMetadata {
  displayNameInput?: string;
  bioInput?: string;
  followerCountInput?: string;
  followingCountInput?: string;
  postsCountInput?: string;
  locationInput?: string;
  websiteInput?: string;
  joinDateInput?: string;
}

interface ProfileMetadata {
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  location?: string;
  website?: string;
  joinDate?: string;
  error?: string;
}

interface MetadataSelection {
  displayName: boolean;
  bio: boolean;
  profileImage: boolean;
  followerCount: boolean;
  followingCount: boolean;
  postsCount: boolean;
  isVerified: boolean;
  location: boolean;
  website: boolean;
  joinDate: boolean;
}

const platforms: Platform[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: PlatformIcons.twitter,
    description: 'Connect your Twitter account for analytics and posting',
    category: 'social',
    color: 'from-blue-400 to-blue-600',
    isPopular: true,
    supportsOAuth: true,
    placeholder: 'https://twitter.com/username'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: PlatformIcons.instagram,
    description: 'Share photos and manage your Instagram presence',
    category: 'social',
    color: 'from-pink-400 to-purple-600',
    isPopular: true,
    supportsOAuth: true,
    placeholder: 'https://instagram.com/username'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: PlatformIcons.linkedin,
    description: 'Professional networking and content sharing',
    category: 'professional',
    color: 'from-blue-600 to-blue-800',
    isPopular: true,
    supportsOAuth: true,
    placeholder: 'https://linkedin.com/in/username'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: PlatformIcons.youtube,
    description: 'Video content creation and analytics',
    category: 'content',
    color: 'from-red-500 to-red-700',
    isPopular: true,
    supportsOAuth: true,
    placeholder: 'https://youtube.com/@channel'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: PlatformIcons.tiktok,
    description: 'Short-form video content and trends',
    category: 'social',
    color: 'from-black to-gray-800',
    isPopular: true,
    supportsOAuth: false,
    placeholder: 'https://tiktok.com/@username'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: PlatformIcons.facebook,
    description: 'Social networking and page management',
    category: 'social',
    color: 'from-blue-500 to-blue-700',
    supportsOAuth: true,
    placeholder: 'https://facebook.com/username'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: PlatformIcons.github,
    description: 'Code repositories and developer profile',
    category: 'professional',
    color: 'from-gray-700 to-gray-900',
    supportsOAuth: true,
    placeholder: 'https://github.com/username'
  },
  // Add more platforms...
];

export function ConnectPlatformModal({ children, userId, onProfileLinksUpdated }: ConnectPlatformModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New states for metadata flow
  const [currentStep, setCurrentStep] = useState<'select' | 'fetch' | 'review'>('select');
  const [fetchedMetadata, setFetchedMetadata] = useState<EditableMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [metadataSelection, setMetadataSelection] = useState<MetadataSelection>({
    displayName: true,
    bio: true,
    profileImage: true,
    followerCount: true,
    followingCount: true,
    postsCount: true,
    isVerified: true,
    location: true,
    website: true,
    joinDate: true,
  });

  const categories = [
    { id: 'all', name: 'All Platforms', count: platforms.length },
    { id: 'social', name: 'Social Media', count: platforms.filter(p => p.category === 'social').length },
    { id: 'professional', name: 'Professional', count: platforms.filter(p => p.category === 'professional').length },
    { id: 'content', name: 'Content', count: platforms.filter(p => p.category === 'content').length },
    { id: 'creative', name: 'Creative', count: platforms.filter(p => p.category === 'creative').length },
    { id: 'gaming', name: 'Gaming', count: platforms.filter(p => p.category === 'gaming').length }
  ];

  const filteredPlatforms = selectedCategory === 'all' 
    ? platforms 
    : platforms.filter(platform => platform.category === selectedCategory);

  const handleOAuthConnect = async (platform: Platform) => {
    if (platform.isComingSoon) return;
    
    setConnectingPlatform(platform.id);
    
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/auth/${platform.id}/connect`;
    } catch (error) {
      console.error('Error connecting platform:', error);
      setConnectingPlatform(null);
    }
  };

  const handleFetchMetadata = async () => {
    if (!selectedPlatform || !profileUrl.trim() || !userId) {
      toast.error('Missing required information');
      return;
    }

    setIsFetchingMetadata(true);
    setCurrentStep('fetch');

    try {
      console.log('Fetching metadata for:', profileUrl);
      
      // First, save the profile link
      const saveResponse = await axios.post('/api/profile/links', {
        userId,
        links: [{
          id: `temp-${Date.now()}`,
          platform: selectedPlatform.name,
          url: profileUrl.trim(),
          userId
        }]
      });

      if (saveResponse.status !== 200) {
        throw new Error('Failed to save profile link');
      }

      // Then fetch metadata
      const metadataResponse = await axios.post('/api/social/profile-metadata', {
        profileLinks: [{
          id: saveResponse.data[0].id,
          platform: selectedPlatform.name,
          url: profileUrl.trim()
        }]
      });

      if (metadataResponse.status === 200 && metadataResponse.data.results?.[0]) {
        const metadata = metadataResponse.data.results[0];
        
        if (metadata.error) {
          toast.error(`Failed to fetch metadata: ${metadata.error}`);
          setFetchedMetadata({ 
            platform: selectedPlatform.name,
            username: profileUrl.split('/').pop() || 'Unknown',
            error: metadata.error 
          });
        } else {
          setFetchedMetadata(metadata);
          toast.success('Demo profile created for portfolio display!');
        }
        
        setCurrentStep('review');
      } else {
        throw new Error('Invalid metadata response');
      }

    } catch (error) {
      console.error('Error fetching metadata:', error);
      
      // Enhanced error handling with better user feedback
      let errorMessage = 'Failed to fetch profile metadata';
      if (error.response?.status === 404) {
        errorMessage = 'Profile not found or URL is incorrect';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network connection issue. Using fallback data for demo purposes';
      }
      
      toast.error(errorMessage);
      
      // Create demo metadata for portfolio display  
      const fallbackUsername = profileUrl.split('/').pop()?.replace(/[@#]/g, '') || 'Unknown';
      const fallbackMetadata = {
        platform: selectedPlatform.name.toLowerCase(),
        username: fallbackUsername,
        displayName: `${fallbackUsername} (Portfolio Demo)`,
        bio: `Demo profile for portfolio showcase - Real data blocked by platform restrictions`,
        profileImage: `https://ui-avatars.com/api/?name=${fallbackUsername}&background=${selectedPlatform.color.replace('#', '')}&color=fff&size=200`,
        followerCount: Math.floor(Math.random() * 10000) + 100,
        followingCount: Math.floor(Math.random() * 1000) + 50,
        postsCount: Math.floor(Math.random() * 500) + 20,
        isVerified: false,
        location: 'Demo Location',
        website: profileUrl,
        joinDate: '2023',
        error: 'Demo data: Real extraction blocked by platform restrictions'
      };
      
      setFetchedMetadata(fallbackMetadata);
      setCurrentStep('review');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleSaveSelection = async () => {
    if (!fetchedMetadata || !userId || !selectedPlatform) return;

    setIsSubmitting(true);
    try {
      // Update the profile link with metadata and user selections
      const response = await axios.post('/api/profile/links', {
        userId,
        links: [{
          id: `temp-${Date.now()}`,
          platform: selectedPlatform.name,
          url: profileUrl.trim(),
          userId
        }],
        metadata: [fetchedMetadata],
        metadataSelection: [metadataSelection]
      });

      if (response.status === 200) {
        onProfileLinksUpdated?.(response.data);
        toast.success(`${selectedPlatform.name} profile added with your selected data!`);
        resetModal();
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Failed to save your preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSelectedPlatform(null);
    setProfileUrl('');
    setCurrentStep('select');
    setFetchedMetadata(null);
    setIsFetchingMetadata(false);
    setMetadataSelection({
      displayName: true,
      bio: true,
      profileImage: true,
      followerCount: true,
      followingCount: true,
      postsCount: true,
      isVerified: true,
      location: true,
      website: true,
      joinDate: true,
    });
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Connect Social Platforms
          </DialogTitle>
          <p className="text-sm text-slate-400 mt-2">
            Note: Due to platform restrictions, we&apos;ll create demo profiles for portfolio display. 
            Real data requires official API access or manual input.
          </p>
        </DialogHeader>

        <Tabs defaultValue="profile-links" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger 
              value="oauth" 
              className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Key className="w-4 h-4" />
              Full Access (OAuth)
            </TabsTrigger>
            <TabsTrigger 
              value="profile-links" 
              className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <LinkIcon className="w-4 h-4" />
              Profile Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-slate-300 text-sm">
                OAuth integration coming soon. Full access requires official API partnerships with platforms.
              </p>
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-300 text-xs">
                  ⚠️ Real-time data extraction is limited by platform restrictions and requires authentication
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className="p-4 rounded-xl border bg-slate-800 border-slate-600 hover:border-slate-500 transition-all duration-200 hover:scale-105"
                >
                  <div className="text-center space-y-3">
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl`}>
                      {platform.icon}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-white">{platform.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{platform.description}</p>
                    </div>

                    <Button
                      onClick={() => platform.supportsOAuth ? handleOAuthConnect(platform) : toast.info(`${platform.name} OAuth coming soon! Use Profile Links tab instead.`)}
                      disabled={connectingPlatform === platform.id || platform.isComingSoon}
                      className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 text-white border-0`}
                    >
                      {connectingPlatform === platform.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : platform.supportsOAuth ? (
                        <Key className="w-4 h-4 mr-2" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      {connectingPlatform === platform.id
                        ? 'Connecting...'
                        : platform.isComingSoon
                        ? 'Coming Soon'
                        : platform.supportsOAuth
                        ? 'Connect with OAuth'
                        : 'OAuth Not Available'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile-links" className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-slate-300 text-sm">
                Add your social media profile links for metadata extraction and display
              </p>
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-xs">
                  💡 Demo profiles will be created for portfolio display. Real data extraction is blocked by platform restrictions.
                </p>
              </div>
            </div>

            {/* Step 1: Platform Selection */}
            {currentStep === 'select' && (
              <>
                {selectedPlatform ? (
                  <div className="max-w-md mx-auto space-y-4 p-6 bg-slate-800 rounded-lg">
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${selectedPlatform.color} flex items-center justify-center text-3xl mb-3`}>
                        {selectedPlatform.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-white">{selectedPlatform.name}</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-url" className="text-white">Profile URL</Label>
                      <Input
                        id="profile-url"
                        type="url"
                        placeholder={selectedPlatform.placeholder}
                        value={profileUrl}
                        onChange={(e) => setProfileUrl(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && profileUrl.trim()) {
                            handleFetchMetadata();
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          setSelectedPlatform(null);
                          setProfileUrl('');
                        }}
                        variant="outline" 
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleFetchMetadata}
                        disabled={!profileUrl.trim() || !userId}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Fetch Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform)}
                        className="p-4 rounded-xl border bg-slate-800 border-slate-600 hover:border-slate-500 transition-all duration-200 hover:scale-105 cursor-pointer"
                      >
                        <div className="text-center space-y-3">
                          <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl`}>
                            {platform.icon}
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-white">{platform.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">Add profile link</p>
                          </div>

                          <Button
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                            variant="outline"
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Select Platform
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Fetching Data */}
            {currentStep === 'fetch' && (
              <div className="max-w-md mx-auto text-center space-y-6 p-8">
                <div className="animate-spin w-16 h-16 mx-auto">
                  <Sparkles className="w-16 h-16 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Fetching Your Profile Data</h3>
                  <p className="text-slate-400">
                    We&apos;re extracting metadata from your {selectedPlatform?.name} profile...
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-300">{profileUrl}</p>
                </div>
              </div>
            )}

            {/* Step 3: Review and Select Data */}
            {currentStep === 'review' && fetchedMetadata && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Review Your Profile Data</h3>
                  <p className="text-slate-400">
                    Choose which information you&apos;d like to display on your profile
                  </p>
                </div>

                {fetchedMetadata.error ? (
                  <Card className="bg-red-900/20 border-red-700">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Unable to Fetch Data</h3>
                      <p className="text-red-300 text-sm mb-4">{fetchedMetadata.error}</p>
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={() => setCurrentStep('select')}
                          variant="outline"
                          className="border-red-600 text-red-300"
                        >
                          Try Different URL
                        </Button>
                        <Button 
                          onClick={() => {
                            // Save basic profile link without metadata
                            handleSaveSelection();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Save Link Anyway
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Preview */}
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Profile Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          {fetchedMetadata.profileImage && (
                            <Image 
                              src={fetchedMetadata.profileImage} 
                              alt={fetchedMetadata.displayName}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-semibold text-white">
                                {fetchedMetadata.displayName || fetchedMetadata.username}
                              </h4>
                              {fetchedMetadata.isVerified && (
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                              )}
                            </div>
                            <p className="text-slate-400">@{fetchedMetadata.username}</p>
                          </div>
                        </div>

                        {fetchedMetadata.bio && (
                          <p className="text-slate-300 text-sm">{fetchedMetadata.bio}</p>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-white">
                              {formatNumber(fetchedMetadata.followerCount)}
                            </p>
                            <p className="text-xs text-slate-400">Followers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-white">
                              {formatNumber(fetchedMetadata.followingCount)}
                            </p>
                            <p className="text-xs text-slate-400">Following</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-white">
                              {formatNumber(fetchedMetadata.postsCount)}
                            </p>
                            <p className="text-xs text-slate-400">Posts</p>
                          </div>
                        </div>

                        {(fetchedMetadata.location || fetchedMetadata.website || fetchedMetadata.joinDate) && (
                          <div className="space-y-2 pt-4 border-t border-slate-700">
                            {fetchedMetadata.location && (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="w-4 h-4" />
                                {fetchedMetadata.location}
                              </div>
                            )}
                            {fetchedMetadata.website && (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Globe className="w-4 h-4" />
                                {fetchedMetadata.website}
                              </div>
                            )}
                            {fetchedMetadata.joinDate && (
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Calendar className="w-4 h-4" />
                                Joined {fetchedMetadata.joinDate}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Data Selection */}
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Choose What to Display
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Select which information you want to show on your profile
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { key: 'displayName', label: 'Display Name', icon: User, value: fetchedMetadata.displayName },
                          { key: 'bio', label: 'Bio/Description', icon: Hash, value: fetchedMetadata.bio },
                          { key: 'profileImage', label: 'Profile Picture', icon: User, value: fetchedMetadata.profileImage },
                          { key: 'followerCount', label: 'Follower Count', icon: Users, value: fetchedMetadata.followerCount },
                          { key: 'followingCount', label: 'Following Count', icon: Users, value: fetchedMetadata.followingCount },
                          { key: 'postsCount', label: 'Posts Count', icon: Hash, value: fetchedMetadata.postsCount },
                          { key: 'isVerified', label: 'Verification Badge', icon: CheckCircle, value: fetchedMetadata.isVerified },
                          { key: 'location', label: 'Location', icon: MapPin, value: fetchedMetadata.location },
                          { key: 'website', label: 'Website', icon: Globe, value: fetchedMetadata.website },
                          { key: 'joinDate', label: 'Join Date', icon: Calendar, value: fetchedMetadata.joinDate },
                        ].map((item) => (
                          <div 
                            key={item.key}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              item.value 
                                ? 'bg-slate-700 border-slate-600' 
                                : 'bg-slate-800 border-slate-700 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-white text-sm">{item.label}</p>
                                {item.value && (
                                  <p className="text-slate-400 text-xs truncate max-w-[200px]">
                                    {typeof item.value === 'boolean' 
                                      ? (item.value ? 'Yes' : 'No')
                                      : typeof item.value === 'number'
                                      ? formatNumber(item.value)
                                      : item.value
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              checked={metadataSelection[item.key as keyof MetadataSelection]}
                              onCheckedChange={(checked) => {
                                setMetadataSelection(prev => ({
                                  ...prev,
                                  [item.key]: !!checked
                                }));
                              }}
                              disabled={!item.value}
                              className="border-slate-600"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!fetchedMetadata.error && (
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => setCurrentStep('select')}
                      variant="outline" 
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Back to Edit
                    </Button>
                    <Button 
                      onClick={handleSaveSelection}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'Saving...' : 'Save to Profile'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 