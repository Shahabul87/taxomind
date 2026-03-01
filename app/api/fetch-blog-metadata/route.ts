import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosRequestConfig } from "axios";
import { load } from "cheerio";
import { logger } from '@/lib/logger';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { validateFetchUrl } from '@/lib/utils/url-validator';

// Browser-like headers to avoid 403 blocks
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// Memory-safe axios configuration
const createAxiosConfig = (url: string): AxiosRequestConfig => ({
  timeout: 15000, // 15 second timeout
  maxContentLength: 5 * 1024 * 1024, // 5MB max response size
  maxBodyLength: 5 * 1024 * 1024, // 5MB max request size
  headers: {
    ...browserHeaders,
    'Referer': new URL(url).origin,
  },
  // Follow redirects
  maxRedirects: 5,
  // Validate status - accept all 2xx and 3xx
  validateStatus: (status: number) => status >= 200 && status < 400,
});

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = await withRateLimit(req, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    // Early return for empty or missing URL
    if (!url || url.trim() === "") {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL format and block SSRF
    const urlError = validateFetchUrl(url);
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 });
    }

    // Extract blog metadata with proper error handling
    const blogData = await extractBlogMetadata(url);

    return NextResponse.json(blogData);
  } catch (error) {
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

// Try to fetch metadata using Microlink API as fallback
async function fetchViaMetadataService(url: string): Promise<{
  title: string;
  description: string;
  thumbnail: string;
  siteName: string;
  author: string;
} | null> {
  try {
    // Use microlink.io - a reliable metadata extraction API
    const response = await axios.get(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`,
      { timeout: 15000 }
    );

    if (response.data?.status === 'success' && response.data?.data) {
      const data = response.data.data;
      return {
        title: data.title || '',
        description: data.description || '',
        thumbnail: data.image?.url || data.logo?.url || '',
        siteName: data.publisher || new URL(url).hostname.replace('www.', ''),
        author: data.author || '',
      };
    }
  } catch (error) {
    logger.info('Microlink API fallback failed:', error);
  }
  return null;
}

async function extractBlogMetadata(url: string) {
  try {
    // Fetch the HTML content with browser-like headers
    const config = createAxiosConfig(url);
    let response;

    try {
      response = await axios.get(url, config);
    } catch (firstError) {
      // Try metadata service as fallback for sites that block direct requests
      logger.info('Direct fetch failed, trying metadata service...');
      const serviceData = await fetchViaMetadataService(url);

      if (serviceData && serviceData.title) {
        // Return data from metadata service
        const domain = new URL(url).hostname.replace('www.', '');
        return {
          title: serviceData.title,
          description: serviceData.description,
          siteName: serviceData.siteName || domain,
          author: serviceData.author,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          thumbnail: serviceData.thumbnail,
          url,
        };
      }

      // If metadata service also fails, try with alternative headers
      const altConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      };
      response = await axios.get(url, altConfig);
    }

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

  } catch (error) {
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