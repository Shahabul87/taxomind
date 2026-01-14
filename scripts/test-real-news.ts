#!/usr/bin/env ts-node

/**
 * Test script for real AI news fetching and ranking
 * Uses the @sam-ai/external-knowledge package for news ranking
 */

import { samRealNewsFetcher } from '../lib/sam/utils/sam-real-news-fetcher';
import { getNewsRankingEngine, type RankerNewsArticle } from '@sam-ai/external-knowledge';

async function testRealNews() {
  console.log('Testing Real AI News Fetcher...\n');

  try {
    const newsRankingEngine = getNewsRankingEngine();

    // Test 1: Search for specific AI news
    console.log('1. Searching for "GPT OpenAI" news...');
    const searchResults = await samRealNewsFetcher.fetchByQuery('GPT OpenAI latest news');
    console.log(`Found ${searchResults.length} articles`);

    if (searchResults.length > 0) {
      console.log('\nTop 3 search results:');
      searchResults.slice(0, 3).forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   Source: ${article.source}`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log(`   URL: ${article.url}`);
      });
    }

    // Test 2: Fetch all news
    console.log('\n\n2. Fetching all AI news from RSS feeds...');
    const allNews = await samRealNewsFetcher.fetchNews();
    console.log(`Total articles fetched: ${allNews.length}`);

    // Test 3: Convert and rank the news
    console.log('\n3. Ranking the news...');
    const rankerArticles: RankerNewsArticle[] = allNews.map(article => ({
      articleId: article.id,
      title: article.title,
      summary: article.description,
      articleUrl: article.url,
      category: 'industry' as const,
      tags: article.category ? [article.category] : [],
      source: {
        name: article.source,
        url: article.url,
      },
      publishDate: new Date(article.publishedAt),
      impactLevel: 'medium' as const,
    }));

    const rankedNews = await newsRankingEngine.rankNews(rankerArticles);

    console.log('\nTop 5 ranked articles:');
    rankedNews.slice(0, 5).forEach((article, i) => {
      console.log(`\n${i + 1}. ${article.title}`);
      console.log(`   Score: ${article.rankingScore}`);
      console.log(`   Status: ${article.trendingStatus}`);
      console.log(`   Badges: ${article.qualityBadges?.join(', ') || 'None'}`);
      console.log(`   Source: ${article.source.name}`);
      console.log(`   URL: ${article.articleUrl}`);
    });

    // Test 4: Get trending news
    console.log('\n\n4. Getting trending news...');
    const trendingNews = await newsRankingEngine.getTrendingNews(rankerArticles, 5);
    console.log(`Found ${trendingNews.length} trending articles`);

    trendingNews.forEach((article, i) => {
      console.log(`\n${i + 1}. ${article.title}`);
      console.log(`   Status: ${article.trendingStatus}`);
      console.log(`   Published: ${article.publishDate}`);
    });

  } catch (error) {
    console.error('Error testing real news:', error);
  }
}

// Run the test
testRealNews().then(() => {
  console.log('\n\nTest completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
