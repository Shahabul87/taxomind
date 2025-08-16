import { NextResponse } from "next/server";
import axios from "axios";
import { load } from "cheerio";
import { logger } from '@/lib/logger';

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
    const url = searchParams.get("url") || undefined;

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Extract blog metadata with proper error handling
    const blogData = await extractBlogMetadata(url);

    return NextResponse.json(blogData);
  } catch (error: any) {
    logger.error('Error fetching blog metadata:', error);
    
    // Return a fallback response instead of failing completely
    const fallbackData = {
      title: 'Blog Article',
      description: '',
      siteName: 'Blog',
      author: '',
      favicon: '',
      thumbnail: '',
      url: '',
      error: 'Failed to fetch metadata',
      is_fallback: true
    };
    
    return NextResponse.json(fallbackData, { status: 200 });
  }
}

async function extractBlogMetadata(url: string) {
  try {
    // Fetch the HTML content with memory and timeout limits
    const response = await axios.get(url, axiosConfig);

    // Limit response data size before processing
    const responseData = response.data.toString().slice(0, 1024 * 1024); // Limit to 1MB
    const $ = load(responseData);

    // Get metadata with length limits
    let title = $('meta[property="og:title"]').attr('content') || 
                $('meta[name="twitter:title"]').attr('content') || 
                $('title').text() || '';

    let description = $('meta[property="og:description"]').attr('content') || 
                     $('meta[name="twitter:description"]').attr('content') || 
                     $('meta[name="description"]').attr('content') || '';

    let siteName = $('meta[property="og:site_name"]').attr('content') || 
                  new URL(url).hostname.replace('www.', '');

    let author = $('meta[property="article:author"]').attr('content') || 
                $('meta[name="author"]').attr('content') || '';
                
    // If author is a URL, try to extract the name safely
    if (author && author.startsWith('http')) {
      try {
        author = author.split('/').filter(Boolean).pop() || author;
      } catch {
        author = ''; // Reset if extraction fails
      }
    }

    // Extract favicon with fallback
    let favicon = $('link[rel="icon"]').attr('href') || 
                 $('link[rel="shortcut icon"]').attr('href') || 
                 $('link[rel="apple-touch-icon"]').attr('href') ||
                 '';

    // Resolve relative favicon URLs to absolute safely
    let faviconUrl = '';
    try {
      if (favicon) {
        faviconUrl = favicon.startsWith('http') 
          ? favicon 
          : new URL(favicon, url).href;
      } else {
        // Default favicon fallback
        faviconUrl = `https://${new URL(url).hostname}/favicon.ico`;
      }
    } catch {
      // If URL construction fails, use a generic favicon service
      try {
        const domain = new URL(url).hostname;
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch {
        faviconUrl = '';
      }
    }

    // Get image URL (thumbnail) with fallback
    let thumbnail = $('meta[property="og:image"]').attr('content') || 
                   $('meta[name="twitter:image"]').attr('content') || 
                   $('meta[property="og:image:url"]').attr('content') ||
                   '';

    // Resolve relative image URLs to absolute safely
    if (thumbnail && !thumbnail.startsWith('http')) {
      try {
        thumbnail = new URL(thumbnail, url).href;
      } catch {
        thumbnail = ''; // Reset if URL construction fails
      }
    }

    // Clean up and limit string lengths
    title = title.slice(0, 200).trim();
    description = description.slice(0, 500).trim();
    siteName = siteName.slice(0, 100).trim();
    author = author.slice(0, 100).trim();

    return {
      title: title || `Article from ${new URL(url).hostname.replace('www.', '')}`,
      description,
      siteName,
      author,
      favicon: faviconUrl,
      thumbnail,
      url
    };

  } catch (error: any) {
    logger.error('Error in extractBlogMetadata:', error);
    
    // Return minimal fallback data
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return {
        title: `Article from ${domain}`,
        description: '',
        siteName: domain,
        author: '',
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        thumbnail: '',
        url,
        error: 'Metadata extraction failed',
        is_fallback: true
      };
    } catch {
      return {
        title: 'Blog Article',
        description: '',
        siteName: 'Blog',
        author: '',
        favicon: '',
        thumbnail: '',
        url: '',
        error: 'Metadata extraction failed',
        is_fallback: true
      };
    }
  }
} 