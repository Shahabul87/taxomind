import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || undefined;

  if (!url) {

    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Handle Medium URLs
    if (url.includes("medium.com") || url.includes("towardsdatascience.com")) {
      return await handleMediumUrl(url);
    }
    
    // Handle Substack URLs
    if (url.includes("substack.com")) {
      return await handleSubstackUrl(url);
    }
    
    // For other article platforms, try to fetch the page content
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
                               $('h1').first().text() ||
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

    // Extract featured image
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[property="og:image:url"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content');
    
    // If no image found yet, try to find a large image on the page
    if (!image) {
      $('img').each((i, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt')?.toLowerCase() || '';
        const className = $(element).attr('class')?.toLowerCase() || '';
        const width = $(element).attr('width');
        const height = $(element).attr('height');
        
        // Skip small icons
        if (src && width && height && parseInt(width) > 200 && parseInt(height) > 100) {
          image = src;
          return false; // break the loop
        }
        
        // Look for images that might be article header images
        if (src && (
            alt.includes('header') || alt.includes('featured') || 
            className.includes('header') || className.includes('featured') ||
            className.includes('article')
        )) {
          image = src;
          return false; // break the loop
        }
      });
      
      // If still no image, grab the first large image
      if (!image) {
        $('img').each((i, element) => {
          const src = $(element).attr('src');
          const width = $(element).attr('width');
          const height = $(element).attr('height');
          
          if (src && width && height && parseInt(width) > 300 && parseInt(height) > 200) {
            image = src;
            return false; // break the loop
          }
        });
      }
    }
    
    // Handle relative URLs for image
    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url);
      image = new URL(image, `${baseUrl.protocol}//${baseUrl.host}`).href;
    }

    // Extract description
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content');
                    
    // Extract author information
    let author = $('meta[property="article:author"]').attr('content') || 
                $('meta[name="author"]').attr('content');
    
    // If no author found, look for common author patterns
    if (!author) {
      // Common patterns for author information
      const authorSelectors = [
        'a[rel="author"]',
        '.author',
        '.byline',
        '[itemprop="author"]',
        '.post-author',
        '.article-author'
      ];
      
      for (const selector of authorSelectors) {
        const authorElement = $(selector).first();
        if (authorElement.length) {
          author = authorElement.text().trim();
          break;
        }
      }
    }
    
    // Clean up author name if found
    if (author) {
      author = author.replace(/^by\s+/i, '').trim();
    }

    // Try to extract publication/publisher name
    let publisher = $('meta[property="og:site_name"]').attr('content') ||
                    $('.publication').first().text().trim() ||
                    null;

    // Try to extract keywords/tags
    let keywords = $('meta[name="keywords"]').attr('content') ||
                   $('meta[property="article:tag"]').attr('content');

    // Auto-detect platform from URL
    const platform = detectPlatform(url);

    // Determine read time if available
    let readTime = null;
    const readTimeSelectors = [
      '.read-time',
      '.readTime',
      '[itemprop="timeRequired"]',
      '.post-read-time',
      '.article-read-time'
    ];
    
    for (const selector of readTimeSelectors) {
      const readTimeElement = $(selector).first();
      if (readTimeElement.length) {
        readTime = readTimeElement.text().trim();
        break;
      }
    }

    // Extract published date if available
    const publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                          $('time[itemprop="datePublished"]').attr('content') ||
                          $('meta[name="date"]').attr('content');

    return NextResponse.json({
      title,
      favicon: faviconUrl,
      image,
      description,
      author,
      publisher,
      platform,
      keywords,
      readTime,
      publishedDate,
      success: true
    });
    
  } catch (error: any) {
    logger.error("Error in fetch-article-metadata API:", error);
    
    // Fallback - create a title from the URL
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      const lastPathSegment = pathSegments[pathSegments.length - 1] || '';
      
      // Create a reasonable title from the URL
      const guessedTitle = `Article from ${domain}${lastPathSegment ? ` - ${lastPathSegment.replace(/-/g, ' ')}` : ''}`;
      
      // Default to domain favicon
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      
      // Auto-detect platform from URL
      const platform = detectPlatform(url);

      return NextResponse.json({
        title: guessedTitle,
        favicon: faviconUrl,
        image: null,
        platform,
        success: true,
        is_fallback: true
      });
    } catch (fallbackError) {
      logger.error("Fallback error:", fallbackError);
      
      return NextResponse.json({
        title: "Article",
        favicon: null,
        image: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 200 }); // Return 200 even for errors to handle gracefully on client
    }
  }
}

async function handleMediumUrl(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract Medium-specific metadata
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim();
    
    // Medium has a specific way of storing article data in JSON format
    let author = null;
    let image = null;
    let readTime = null;
    let publishedDate = null;
    
    // Try to find the script tag with article data
    const scriptData = $('script').filter(function() {
      return $(this).text().includes('"@type":"Article"') || $(this).text().includes('"@type":"BlogPosting"');
    }).first().text();
    
    if (scriptData) {
      try {
        // Extract JSON data
        const jsonMatch = scriptData.match(/\{.*\}/gm);
        if (jsonMatch) {
          const articleData = JSON.parse(jsonMatch[0]);
          
          // Get author information
          if (articleData.author) {
            author = articleData.author.name;
          }
          
          // Get image information
          if (articleData.image) {
            image = articleData.image.url;
          }
          
          // Get published date
          if (articleData.datePublished) {
            publishedDate = articleData.datePublished;
          }
        }
      } catch (e) {
        logger.error("Error parsing Medium JSON data:", e);
      }
    }
    
    // If we couldn't get the author from JSON, try alternative methods
    if (!author) {
      author = $('meta[name="author"]').attr('content') || 
              $('a[rel="author"]').first().text().trim();
    }
    
    // If we couldn't get the image from JSON, try alternative methods
    if (!image) {
      image = $('meta[property="og:image"]').attr('content') || 
             $('img[alt="Header image"]').attr('src');
    }
    
    // Try to get the read time
    const readTimeText = $('span').filter(function() {
      return $(this).text().includes('min read');
    }).first().text();
    
    if (readTimeText) {
      readTime = readTimeText.trim();
    }
    
    // Get publication name if available
    const publication = $('meta[property="og:site_name"]').attr('content') || 'Medium';
    
    return NextResponse.json({
      title,
      favicon: "https://medium.com/favicon.ico",
      image,
      author,
      platform: "Medium",
      publisher: publication,
      readTime,
      publishedDate,
      success: true
    });
  } catch (error: any) {
    logger.error("Error fetching Medium metadata:", error);
    return fallbackResponse(url, "Medium");
  }
}

async function handleSubstackUrl(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract Substack-specific metadata
    let title = $('meta[property="og:title"]').attr('content') || 
                $('h1.post-title').first().text().trim();
    
    // Extract author information
    let author = $('meta[name="author"]').attr('content') || 
                $('a.author-name').first().text().trim();
    
    // Extract featured image
    let image = $('meta[property="og:image"]').attr('content') || 
               $('img.post-feature-image').attr('src');
    
    // Get publication name
    const publication = $('meta[property="og:site_name"]').attr('content') ||
                        $('.publication-name').text().trim() ||
                        url.split('//')[1].split('.')[0];
    
    // Extract subtitle/description
    let description = $('meta[property="og:description"]').attr('content') ||
                      $('.post-subtitle').first().text().trim();
    
    // Try to get the publication date
    let publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                        $('.post-date').first().text().trim();
    
    return NextResponse.json({
      title,
      favicon: `https://substackcdn.com/image/fetch/w_96,c_limit,f_auto,q_auto:good,fl_progressive:steep/${url.split('//')[1].split('/')[0]}/favicon.png`,
      image,
      author,
      platform: "Substack",
      publisher: publication,
      description,
      publishedDate,
      success: true
    });
  } catch (error: any) {
    logger.error("Error fetching Substack metadata:", error);
    return fallbackResponse(url, "Substack");
  }
}

function fallbackResponse(url: string, platform: string) {
  // Create a basic response when the specific platform handlers fail
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);
  const lastPathSegment = pathSegments[pathSegments.length - 1] || '';
  
  // Try to make a more informative title from the URL segments
  let title = `${platform} Article - ${lastPathSegment.replace(/-/g, ' ')}`;
  
  return NextResponse.json({
    title,
    favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
    image: null,
    platform,
    success: true,
    is_fallback: true
  });
}

function detectPlatform(url: string): string {
  if (url.includes('medium.com') || url.includes('towardsdatascience.com')) return 'Medium';
  if (url.includes('substack.com')) return 'Substack';
  if (url.includes('dev.to')) return 'DEV Community';
  if (url.includes('hashnode.com')) return 'Hashnode';
  if (url.includes('hackernoon.com')) return 'Hackernoon';
  if (url.includes('freecodecamp.org')) return 'freeCodeCamp';
  if (url.includes('smashingmagazine.com')) return 'Smashing Magazine';
  if (url.includes('css-tricks.com')) return 'CSS-Tricks';
  if (url.includes('moz.com')) return 'Moz';
  if (url.includes('sejournal.com')) return 'Search Engine Journal';
  if (url.includes('sitepoint.com')) return 'SitePoint';
  if (url.includes('alistapart.com')) return 'A List Apart';
  if (url.includes('uxdesign.cc')) return 'UX Collective';
  if (url.includes('nngroup.com')) return 'Nielsen Norman Group';
  if (url.includes('techcrunch.com')) return 'TechCrunch';
  if (url.includes('wired.com')) return 'WIRED';
  if (url.includes('mashable.com')) return 'Mashable';
  if (url.includes('theverge.com')) return 'The Verge';
  if (url.includes('engadget.com')) return 'Engadget';
  if (url.includes('zdnet.com')) return 'ZDNet';
  if (url.includes('cnet.com')) return 'CNET';
  if (url.includes('gizmodo.com')) return 'Gizmodo';
  if (url.includes('venturebeat.com')) return 'VentureBeat';
  if (url.includes('makeuseof.com')) return 'MakeUseOf';
  if (url.includes('fstoppers.com')) return 'Fstoppers';
  if (url.includes('petapixel.com')) return 'PetaPixel';
  if (url.includes('500px.com')) return '500px';
  if (url.includes('digitaltrends.com')) return 'Digital Trends';
  if (url.includes('techradar.com')) return 'TechRadar';
  if (url.includes('fastcompany.com')) return 'Fast Company';
  if (url.includes('entrepreneur.com')) return 'Entrepreneur';
  
  // Extract domain name as fallback platform
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Other';
  }
} 