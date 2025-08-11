import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {

    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Handle Spotify URLs
    if (url.includes("spotify.com")) {
      return await handleSpotifyUrl(url);
    }
    
    // Handle SoundCloud URLs
    if (url.includes("soundcloud.com")) {
      return await handleSoundCloudUrl(url);
    }
    
    // Handle Apple Music URLs
    if (url.includes("music.apple.com")) {
      return await handleAppleMusicUrl(url);
    }
    
    // For other audio platforms, try to fetch the page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000
    });

    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract metadata - try multiple approaches to get the most accurate title
    let title: string | null = $('meta[property="og:title"]').attr('content') || 
                               $('meta[name="twitter:title"]').attr('content') || 
                               $('meta[property="music:song"]').attr('content') ||
                               $('title').text() ||
                               null;
    
    // Clean up the title
    title = title ? title.trim() : null;
    
    // Extract favicon
    const favicon = $('link[rel="icon"]').attr('href') || 
                    $('link[rel="shortcut icon"]').attr('href') || 
                    $('link[rel="apple-touch-icon"]').attr('href');
    
    // Handle relative URLs for favicon
    let faviconUrl = null;
    if (favicon) {
      if (favicon.startsWith('http')) {
        faviconUrl = favicon;
      } else {
        const baseUrl = new URL(url);
        faviconUrl = new URL(favicon, `${baseUrl.protocol}//${baseUrl.host}`).href;
      }
    } else {
      // Default to domain favicon
      const domain = new URL(url).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }

    // Extract album artwork - try multiple methods
    let artwork = $('meta[property="og:image"]').attr('content') || 
                  $('meta[property="og:image:url"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('meta[property="music:album:image"]').attr('content');
    
    // If no image found yet, try to find a large image on the page that might be album art
    if (!artwork) {
      $('img').each((i, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt')?.toLowerCase() || '';
        const className = $(element).attr('class')?.toLowerCase() || '';
        
        // Look for images that might be album artwork
        if (src && (
            alt.includes('album') || alt.includes('cover') || alt.includes('artwork') ||
            className.includes('album') || className.includes('cover') || className.includes('artwork')
        )) {
          artwork = src;
          return false; // break the loop
        }
      });
    }
    
    // Handle relative URLs for artwork
    if (artwork && !artwork.startsWith('http')) {
      const baseUrl = new URL(url);
      artwork = new URL(artwork, `${baseUrl.protocol}//${baseUrl.host}`).href;
    }

    // Extract audio type/platform if available
    const audioType = $('meta[property="og:audio:type"]').attr('content') ||
                      $('meta[property="og:type"]').attr('content');
                    
    // Extract author/artist - try multiple approaches
    let artist = $('meta[property="og:audio:artist"]').attr('content') || 
                $('meta[property="music:musician"]').attr('content') ||
                $('meta[name="music:musician"]').attr('content') ||
                $('meta[property="music:creator"]').attr('content') ||
                $('meta[name="author"]').attr('content') ||
                $('meta[property="article:author"]').attr('content');
    
    // If artist not found, see if we can extract it from the title (common format: "Artist - Song")
    if (!artist && title && title.includes(' - ')) {
      artist = title.split(' - ')[0].trim();
      // If we extracted artist from title, update title to be just the song name
      title = title.split(' - ')[1].trim();
    }

    // Auto-detect platform from URL
    const platform = detectPlatform(url);

    // Extract album name if available
    const album = $('meta[property="music:album"]').attr('content') ||
                  $('meta[property="og:audio:album"]').attr('content');

    return NextResponse.json({
      title,
      favicon: faviconUrl,
      artwork,
      artist,
      album,
      platform,
      audioType,
      success: true
    });
    
  } catch (error) {
    logger.error("Error in fetch-audio-metadata API:", error);
    
    // Fallback - create a title from the URL
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const lastPathSegment = pathSegments[pathSegments.length - 1] || '';
      
      // Create a reasonable title from the URL
      const guessedTitle = `Audio from ${domain}${lastPathSegment ? ` - ${lastPathSegment.replace(/-/g, ' ')}` : ''}`;
      
      // Default to domain favicon
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      
      // Auto-detect platform from URL
      const platform = detectPlatform(url);

      return NextResponse.json({
        title: guessedTitle,
        favicon: faviconUrl,
        artwork: null,
        platform,
        success: true,
        is_fallback: true
      });
    } catch (fallbackError) {
      logger.error("Fallback error:", fallbackError);
      
      return NextResponse.json({
        title: "Audio",
        favicon: null,
        artwork: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 200 }); // Return 200 even for errors to handle gracefully on client
    }
  }
}

async function handleSpotifyUrl(url: string) {
  // Extract Spotify ID from URL
  const trackRegex = /track\/([a-zA-Z0-9]+)/;
  const albumRegex = /album\/([a-zA-Z0-9]+)/;
  const playlistRegex = /playlist\/([a-zA-Z0-9]+)/;
  
  const trackMatch = url.match(trackRegex);
  const albumMatch = url.match(albumRegex);
  const playlistMatch = url.match(playlistRegex);
  
  const itemId = trackMatch?.[1] || albumMatch?.[1] || playlistMatch?.[1];
  const itemType = trackMatch ? 'track' : (albumMatch ? 'album' : (playlistMatch ? 'playlist' : null));
  
  if (!itemId || !itemType) {
    return fallbackResponse(url, "Spotify");
  }
  
  try {
    // Use the oEmbed API for Spotify
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await axios.get(oembedUrl, { timeout: 3000 });
    
    if (response.data) {
      // Spotify titles are typically formatted as "Song Name - Artist" or "Artist - Song Name"
      let title = response.data.title || `Spotify ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
      let artist = null;
      
      // Try to extract artist from title
      if (title && title.includes(' - ')) {
        const parts = title.split(' - ');
        
        // Try to determine which part is the artist and which is the title
        // If we're dealing with a track, typically it's "Song - Artist", but sometimes it's flipped
        if (itemType === 'track') {
          // For tracks, try to determine based on common patterns
          if (parts[0].includes('by')) {
            // Format like "Title by Artist"
            title = parts[0].split(' by ')[0].trim();
            artist = parts[0].split(' by ')[1].trim();
          } else {
            // Standard format, first part is the title, second is artist
            title = parts[0].trim();
            artist = parts[1].trim();
          }
        } else {
          // For albums and playlists, format is usually "Title - Artist"
          title = parts[0].trim();
          artist = parts[1].trim();
        }
      }
      
      // Get a high-quality artwork image
      let artwork = response.data.thumbnail_url;
      if (artwork) {
        // Replace the default size with a larger one
        artwork = artwork.replace('/cover/300/', '/cover/640/');
      }
      
      return NextResponse.json({
        title,
        favicon: "https://open.spotify.com/favicon.ico",
        artwork,
        platform: "Spotify",
        artist,
        itemType,
        success: true
      });
    }
  } catch (error) {
    logger.error("Error fetching Spotify metadata:", error);
  }
  
  return fallbackResponse(url, "Spotify");
}

async function handleSoundCloudUrl(url: string) {
  try {
    // Use the oEmbed API for SoundCloud
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 3000 });
    
    if (response.data) {
      let title = response.data.title || "SoundCloud Track";
      let artist = response.data.author_name || null;
      
      // For SoundCloud, title often includes the artist name at the end "Song Name by Artist Name"
      if (title.includes(' by ') && !artist) {
        const parts = title.split(' by ');
        title = parts[0].trim();
        artist = parts[1].trim();
      }
      
      // Try to get a better quality artwork
      let artwork = response.data.thumbnail_url;
      if (artwork) {
        // Replace with larger image if available
        artwork = artwork.replace('-large.jpg', '-t500x500.jpg');
      }
      
      return NextResponse.json({
        title,
        favicon: "https://soundcloud.com/favicon.ico",
        artwork,
        platform: "SoundCloud",
        artist,
        success: true
      });
    }
  } catch (error) {
    logger.error("Error fetching SoundCloud metadata:", error);
  }
  
  return fallbackResponse(url, "SoundCloud");
}

async function handleAppleMusicUrl(url: string) {
  try {
    // For Apple Music, we'll need to parse the HTML to get metadata
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract metadata from Apple Music page
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') || 
                  $('title').text().replace('- Apple Music', '').trim();
                  
    let artist = $('meta[property="music:musician"]').attr('content') ||
                $('meta[name="music:musician"]').attr('content');
    
    // Apple Music sometimes includes the artist in the page schema data
    try {
      const schemaScript = $('script[type="application/ld+json"]').html();
      if (schemaScript) {
        const schema = JSON.parse(schemaScript);
        if (schema.byArtist && schema.byArtist.name) {
          artist = schema.byArtist.name;
        }
      }
    } catch (e) {
      logger.error("Error parsing Apple Music schema data:", e);
    }
    
    // Get high-quality artwork
    let artwork = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content');
                  
    // Apple Music artwork can be improved by modifying the URL
    if (artwork) {
      // Replace with higher quality image by removing size constraints
      artwork = artwork.replace(/\/\d+x\d+/, '/999x999');
    }
    
    return NextResponse.json({
      title,
      favicon: "https://music.apple.com/favicon.ico",
      artwork,
      platform: "Apple Music",
      artist,
      success: true
    });
  } catch (error) {
    logger.error("Error fetching Apple Music metadata:", error);
    return fallbackResponse(url, "Apple Music");
  }
}

function fallbackResponse(url: string, platform: string) {
  // Create a basic response when the specific platform handlers fail
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  const lastPathSegment = pathSegments[pathSegments.length - 1] || '';
  
  // Try to make a more informative title from the URL segments
  let title = `${platform} - ${lastPathSegment.replace(/-/g, ' ')}`;
  
  // For Spotify, we can get a bit more specific
  if (platform === 'Spotify') {
    if (url.includes('/track/')) {
      title = `Spotify Track - ${lastPathSegment.replace(/-/g, ' ')}`;
    } else if (url.includes('/album/')) {
      title = `Spotify Album - ${lastPathSegment.replace(/-/g, ' ')}`;
    } else if (url.includes('/playlist/')) {
      title = `Spotify Playlist - ${lastPathSegment.replace(/-/g, ' ')}`;
    }
  }
  
  return NextResponse.json({
    title,
    favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
    artwork: null,
    platform,
    success: true,
    is_fallback: true
  });
}

function detectPlatform(url: string): string {
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('apple.com/music')) return 'Apple Music';
  if (url.includes('music.youtube.com')) return 'YouTube Music';
  if (url.includes('youtu.be') || url.includes('youtube.com')) return 'YouTube';
  if (url.includes('bandcamp.com')) return 'Bandcamp';
  if (url.includes('audiomack.com')) return 'Audiomack';
  if (url.includes('mixcloud.com')) return 'Mixcloud';
  if (url.includes('anchor.fm')) return 'Anchor';
  if (url.includes('podbean.com')) return 'Podbean';
  if (url.includes('spreaker.com')) return 'Spreaker';
  if (url.includes('buzzsprout.com')) return 'Buzzsprout';
  if (url.includes('transistor.fm')) return 'Transistor';
  if (url.includes('simplecast.com')) return 'Simplecast';
  if (url.includes('libsyn.com')) return 'Libsyn';
  if (url.includes('captivate.fm')) return 'Captivate';
  if (url.includes('megaphone.fm')) return 'Megaphone';
  if (url.includes('deezer.com')) return 'Deezer';
  if (url.includes('tidal.com')) return 'Tidal';
  if (url.includes('amazon.com/music') || url.includes('music.amazon')) return 'Amazon Music';
  if (url.includes('pandora.com')) return 'Pandora';
  
  // Extract domain name as fallback platform
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Other';
  }
} 