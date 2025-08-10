import { NextResponse } from "next/server";
import axios from "axios";
import { load } from 'cheerio';
import { logger } from '@/lib/logger';

// Direct function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Standard YouTube URL
  let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) return match[1];
  
  // Short youtu.be URL
  match = url.match(/youtu\.be\/([^"&?\/\s]{11})/);
  if (match && match[1]) return match[1];
  
  // URL with v= parameter
  match = url.match(/[?&]v=([^"&?\/\s]{11})/);
  if (match && match[1]) return match[1];
  
  return null;
}

// Add memory-safe axios configuration
const axiosConfig = {
  timeout: 10000, // 10 second timeout
  maxContentLength: 5 * 1024 * 1024, // 5MB max response size
  maxBodyLength: 5 * 1024 * 1024, // 5MB max request size
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  },
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Extract video details based on the platform
    const videoData = await extractVideoMetadata(url);

    return NextResponse.json(videoData);
  } catch (error) {
    logger.error('Error fetching video metadata:', error);
    
    // Return a fallback response instead of failing completely
    const fallbackData = {
      title: 'Video',
      description: '',
      thumbnail: '',
      platform: 'unknown',
      embedUrl: '',
      author: '',
      duration: '',
      error: 'Failed to fetch metadata',
      is_fallback: true
    };
    
    return NextResponse.json(fallbackData, { status: 200 });
  }
}

async function extractVideoMetadata(url: string) {
  // Base metadata object
  let metadata = {
    title: '',
    description: '',
    thumbnail: '',
    platform: 'unknown',
    embedUrl: '',
    author: '',
    duration: '',
  };

  try {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const youtubeMatch = url.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      metadata.platform = 'youtube';
      metadata.embedUrl = `https://www.youtube.com/embed/${videoId}`;
      metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      try {
        // Fetch page content to get title and description with memory limits
        const response = await axios.get(url, axiosConfig);
        
        // Limit response data size before processing
        const responseData = response.data.toString().slice(0, 1024 * 1024); // Limit to 1MB
        const $ = load(responseData);
        
        metadata.title = $('meta[property="og:title"]').attr('content') || 
                        $('title').text() || 
                        `YouTube Video (${videoId})`;
        
        metadata.description = $('meta[property="og:description"]').attr('content') || 
                              $('meta[name="description"]').attr('content') || 
                              '';
        
        metadata.author = $('meta[name="author"]').attr('content') || 
                         $('span[itemprop="author"] link[itemprop="name"]').attr('content') || 
                         '';
        
        // Clean up strings and limit their length
        metadata.title = metadata.title.slice(0, 200);
        metadata.description = metadata.description.slice(0, 500);
        metadata.author = metadata.author.slice(0, 100);
        
      } catch (error) {
        logger.error('Error fetching YouTube page content:', error);
        metadata.title = `YouTube Video (${videoId})`;
      }
      
      return metadata;
    }

    // Vimeo URL patterns
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/i;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch && vimeoMatch[2]) {
      const videoId = vimeoMatch[2];
      metadata.platform = 'vimeo';
      metadata.embedUrl = `https://player.vimeo.com/video/${videoId}`;
      
      try {
        // Use Vimeo oEmbed API to get metadata with timeout
        const oembedResponse = await axios.get(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
          { ...axiosConfig, timeout: 5000 }
        );
        const data = oembedResponse.data;
        
        metadata.title = (data.title || `Vimeo Video (${videoId})`).slice(0, 200);
        metadata.description = (data.description || '').slice(0, 500);
        metadata.thumbnail = data.thumbnail_url || '';
        metadata.author = (data.author_name || '').slice(0, 100);
        metadata.duration = data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : '';
      } catch (error) {
        logger.error('Error fetching Vimeo oEmbed data:', error);
        metadata.title = `Vimeo Video (${videoId})`;
        
        // Simplified fallback without heavy page scraping
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          metadata.title = `Video from ${domain}`;
          metadata.platform = domain;
        } catch {
          metadata.title = 'Vimeo Video';
        }
      }
      
      return metadata;
    }

    // Generic video URL - simplified scraping with strict limits
    try {
      const response = await axios.get(url, {
        ...axiosConfig,
        timeout: 5000, // Shorter timeout for generic URLs
      });
      
      // Strictly limit response data
      const responseData = response.data.toString().slice(0, 512 * 1024); // Limit to 512KB
      const $ = load(responseData);
      
      metadata.title = ($('meta[property="og:title"]').attr('content') || $('title').text() || 'Video').slice(0, 200);
      metadata.description = ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').slice(0, 500);
      metadata.thumbnail = $('meta[property="og:image"]').attr('content') || '';
      metadata.author = ($('meta[name="author"]').attr('content') || '').slice(0, 100);
      metadata.platform = new URL(url).hostname.replace('www.', '');
    } catch (error) {
      logger.error('Error fetching generic video page:', error);
      const domain = new URL(url).hostname.replace('www.', '');
      metadata.title = `Video from ${domain}`;
      metadata.platform = domain;
    }
    
    return metadata;
    
  } catch (error) {
    logger.error('Error in extractVideoMetadata:', error);
    
    // Return minimal fallback data
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return {
        title: `Video from ${domain}`,
        description: '',
        thumbnail: '',
        platform: domain,
        embedUrl: '',
        author: '',
        duration: '',
        error: 'Metadata extraction failed',
        is_fallback: true
      };
    } catch {
      return {
        title: 'Video',
        description: '',
        thumbnail: '',
        platform: 'unknown',
        embedUrl: '',
        author: '',
        duration: '',
        error: 'Metadata extraction failed',
        is_fallback: true
      };
    }
  }
} 