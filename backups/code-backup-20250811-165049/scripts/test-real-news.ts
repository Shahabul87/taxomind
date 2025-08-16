#!/usr/bin/env ts-node

import { samRealNewsFetcher } from '../lib/sam-real-news-fetcher';
import { samNewsRankingEngine } from '../lib/sam-news-ranking-engine';

async function testRealNews() {
  console.log('Testing Real AI News Fetcher...\n');
  
  try {
    // Test 1: Search for specific AI news
    console.log('1. Searching for "GPT OpenAI" news...');
    const searchResults = await samRealNewsFetcher.searchAINews('GPT OpenAI latest news');
    console.log(`Found ${searchResults.length} articles`);
    
    if (searchResults.length > 0) {
      console.log('\nTop 3 search results:');
      searchResults.slice(0, 3).forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   Source: ${article.source.name}`);
        console.log(`   Published: ${article.publishDate}`);
        console.log(`   URL: ${article.articleUrl}`);
      });
    }
    
    // Test 2: Fetch all news
    console.log('\n\n2. Fetching all AI news from RSS feeds...');
    const allNews = await samRealNewsFetcher.fetchAllNews();
    console.log(`Total articles fetched: ${allNews.length}`);
    
    // Test 3: Rank the news
    console.log('\n3. Ranking the news...');
    const rankedNews = await samNewsRankingEngine.rankNews(allNews);
    
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
    const trendingNews = await samNewsRankingEngine.getTrendingNews(allNews, 5);
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