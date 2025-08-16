// Job Market Worker - Handles job market data updates and analysis

const { db } = require('../lib/db');
const { redis } = require('../lib/redis');
const { JobMarketService } = require('../lib/job-market-mapping/job-market-service');

class JobMarketWorker {
  constructor() {
    this.jobMarketService = new JobMarketService();
    this.isRunning = false;
    this.updateInterval = 6 * 60 * 60 * 1000; // 6 hours
    this.lastUpdate = null;
  }

  async initialize() {
    console.log('💼 Starting Job Market Worker...');
    
    try {
      // Initialize job market service
      await this.jobMarketService.initialize();
      
      // Setup update scheduling
      await this.setupUpdateScheduling();
      
      // Setup health monitoring
      await this.setupHealthMonitoring();
      
      this.isRunning = true;
      console.log('✅ Job Market Worker initialized successfully');
      
      // Start update loop
      this.startUpdateLoop();
      
    } catch (error) {
      console.error('❌ Job Market Worker initialization failed:', error);
      process.exit(1);
    }
  }

  async setupUpdateScheduling() {
    // Listen for manual update requests
    await redis.subscribe('job_market:update_request');
    await redis.subscribe('job_market:student_mapping_request');

    redis.on('message', async (channel, message) => {
      try {
        const request = JSON.parse(message);
        console.log(`📥 Received request from ${channel}:`, request.type);
        
        await this.handleUpdateRequest(request, channel);
      } catch (error) {
        console.error('Error processing update request:', error);
      }
    });
  }

  async handleUpdateRequest(request, channel) {
    switch (request.type) {
      case 'full_market_update':
        await this.performFullMarketUpdate();
        break;
        
      case 'industry_update':
        await this.updateIndustryData(request.industries);
        break;
        
      case 'salary_update':
        await this.updateSalaryData(request.regions);
        break;
        
      case 'skill_demand_update':
        await this.updateSkillDemandData();
        break;
        
      case 'student_mapping_refresh':
        await this.refreshStudentMapping(request.studentId);
        break;
        
      default:
        console.warn(`Unknown request type: ${request.type}`);
    }
  }

  async startUpdateLoop() {
    console.log('🔄 Starting job market update loop...');
    
    // Initial update if needed
    const lastUpdateTime = await redis.get('job_market:last_update');
    if (!lastUpdateTime || Date.now() - parseInt(lastUpdateTime) > this.updateInterval) {
      await this.performFullMarketUpdate();
    }
    
    // Schedule regular updates
    setInterval(async () => {
      try {
        await this.performScheduledUpdate();
      } catch (error) {
        console.error('Error in scheduled update:', error);
      }
    }, this.updateInterval);
  }

  async performScheduledUpdate() {
    console.log('⏰ Performing scheduled job market update...');
    
    const updateTasks = [
      this.updateJobPostings(),
      this.updateSalaryTrends(),
      this.updateSkillDemands(),
      this.updateIndustryTrends(),
      this.refreshActiveStudentMappings()
    ];
    
    const results = await Promise.allSettled(updateTasks);
    
    // Log results
    results.forEach((result, index) => {
      const taskNames = ['Job Postings', 'Salary Trends', 'Skill Demands', 'Industry Trends', 'Student Mappings'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${taskNames[index]} update completed`);
      } else {
        console.error(`❌ ${taskNames[index]} update failed:`, result.reason);
      }
    });
    
    // Update last update timestamp
    await redis.set('job_market:last_update', Date.now().toString());
    this.lastUpdate = new Date();
  }

  async performFullMarketUpdate() {
    console.log('🔄 Performing full market data update...');
    
    try {
      // Update all market data sources
      await this.updateJobPostings();
      await this.updateSalaryTrends();
      await this.updateSkillDemands();
      await this.updateIndustryTrends();
      await this.updateCompanyData();
      await this.updateLocationData();
      
      // Refresh all student mappings
      await this.refreshAllStudentMappings();
      
      console.log('✅ Full market update completed');
      
      // Notify completion
      await redis.publish('job_market:update_completed', JSON.stringify({
        type: 'full_update',
        timestamp: new Date(),
        success: true
      }));
      
    } catch (error) {
      console.error('❌ Full market update failed:', error);
      
      // Notify failure
      await redis.publish('job_market:update_failed', JSON.stringify({
        type: 'full_update',
        timestamp: new Date(),
        error: error.message
      }));
    }
  }

  async updateJobPostings() {
    console.log('📋 Updating job postings...');
    
    // Fetch from multiple job boards
    const sources = [
      { name: 'LinkedIn', fetcher: this.fetchLinkedInJobs },
      { name: 'Indeed', fetcher: this.fetchIndeedJobs },
      { name: 'Glassdoor', fetcher: this.fetchGlassdoorJobs }
    ];
    
    let totalJobs = 0;
    
    for (const source of sources) {
      try {
        const jobs = await source.fetcher.call(this);
        await this.storeJobPostings(jobs, source.name);
        totalJobs += jobs.length;
        console.log(`  ✅ ${source.name}: ${jobs.length} jobs`);
      } catch (error) {
        console.error(`  ❌ ${source.name} failed:`, error.message);
      }
    }
    
    // Update cache
    await redis.setex('job_market:stats:total_jobs', 3600, totalJobs.toString());
    
    return { totalJobs };
  }

  async fetchLinkedInJobs() {
    // Simulate LinkedIn API call
    console.log('  🔍 Fetching from LinkedIn...');
    
    // In production, this would make actual API calls
    return this.generateMockJobs('LinkedIn', 150);
  }

  async fetchIndeedJobs() {
    // Simulate Indeed API call
    console.log('  🔍 Fetching from Indeed...');
    
    return this.generateMockJobs('Indeed', 200);
  }

  async fetchGlassdoorJobs() {
    // Simulate Glassdoor API call
    console.log('  🔍 Fetching from Glassdoor...');
    
    return this.generateMockJobs('Glassdoor', 100);
  }

  generateMockJobs(source, count) {
    const jobs = [];
    const titles = [
      'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
      'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'
    ];
    const companies = [
      'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Spotify'
    ];
    const locations = [
      'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'
    ];
    
    for (let i = 0; i < count; i++) {
      jobs.push({
        id: `${source.toLowerCase()}_${Date.now()}_${i}`,
        title: titles[Math.floor(Math.random() * titles.length)],
        company: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        salary: {
          min: 80000 + Math.floor(Math.random() * 100000),
          max: 120000 + Math.floor(Math.random() * 150000)
        },
        description: 'Lorem ipsum job description...',
        skills: this.generateRandomSkills(),
        postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        source: source
      });
    }
    
    return jobs;
  }

  generateRandomSkills() {
    const allSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS',
      'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'GraphQL', 'REST APIs'
    ];
    
    const skillCount = 3 + Math.floor(Math.random() * 5);
    return allSkills
      .sort(() => 0.5 - Math.random())
      .slice(0, skillCount);
  }

  async storeJobPostings(jobs, source) {
    // Store jobs in database
    const dbJobs = jobs.map(job => ({
      externalId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryMin: job.salary.min,
      salaryMax: job.salary.max,
      description: job.description,
      skills: JSON.stringify(job.skills),
      postedDate: job.postedDate,
      source: source,
      fetchedAt: new Date()
    }));
    
    // Upsert jobs
    for (const job of dbJobs) {
      await db.jobPosting.upsert({
        where: { externalId: job.externalId },
        update: job,
        create: job
      });
    }
  }

  async updateSalaryTrends() {
    console.log('💰 Updating salary trends...');
    
    // Analyze salary data from job postings
    const salaryData = await db.jobPosting.groupBy({
      by: ['title', 'location'],
      _avg: {
        salaryMin: true,
        salaryMax: true
      },
      _count: true
    });
    
    // Calculate trends
    const trends = salaryData.map(data => ({
      role: data.title,
      location: data.location,
      averageMin: Math.round(data._avg.salaryMin || 0),
      averageMax: Math.round(data._avg.salaryMax || 0),
      jobCount: data._count,
      updatedAt: new Date()
    }));
    
    // Store in cache
    await redis.setex(
      'job_market:salary_trends',
      3600,
      JSON.stringify(trends)
    );
    
    return { trendsUpdated: trends.length };
  }

  async updateSkillDemands() {
    console.log('🎯 Updating skill demands...');
    
    // Analyze skill frequency in job postings
    const jobs = await db.jobPosting.findMany({
      where: {
        fetchedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        skills: true,
        salaryMin: true,
        salaryMax: true
      }
    });
    
    const skillCounts = {};
    const skillSalaries = {};
    
    jobs.forEach(job => {
      try {
        const skills = JSON.parse(job.skills || '[]');
        const avgSalary = (job.salaryMin + job.salaryMax) / 2;
        
        skills.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          if (!skillSalaries[skill]) skillSalaries[skill] = [];
          skillSalaries[skill].push(avgSalary);
        });
      } catch (error) {
        // Skip invalid skill data
      }
    });
    
    // Calculate demand metrics
    const skillDemands = Object.keys(skillCounts).map(skill => ({
      skill,
      demand: skillCounts[skill],
      averageSalary: skillSalaries[skill].reduce((a, b) => a + b, 0) / skillSalaries[skill].length,
      demandScore: Math.min(100, (skillCounts[skill] / jobs.length) * 1000),
      updatedAt: new Date()
    }));
    
    // Sort by demand
    skillDemands.sort((a, b) => b.demand - a.demand);
    
    // Store in cache
    await redis.setex(
      'job_market:skill_demands',
      3600,
      JSON.stringify(skillDemands)
    );
    
    return { skillsAnalyzed: skillDemands.length };
  }

  async updateIndustryTrends() {
    console.log('🏭 Updating industry trends...');
    
    // Analyze industry data
    const industryData = await db.jobPosting.groupBy({
      by: ['company'],
      _count: true,
      _avg: {
        salaryMin: true,
        salaryMax: true
      }
    });
    
    // Group by industry (simplified mapping)
    const industryMap = {
      'Google': 'Technology',
      'Microsoft': 'Technology',
      'Apple': 'Technology',
      'Amazon': 'E-commerce',
      'Meta': 'Social Media',
      'Tesla': 'Automotive',
      'Netflix': 'Entertainment',
      'Spotify': 'Entertainment'
    };
    
    const industryTrends = {};
    
    industryData.forEach(data => {
      const industry = industryMap[data.company] || 'Other';
      if (!industryTrends[industry]) {
        industryTrends[industry] = {
          jobCount: 0,
          totalSalaryMin: 0,
          totalSalaryMax: 0,
          companies: new Set()
        };
      }
      
      industryTrends[industry].jobCount += data._count;
      industryTrends[industry].totalSalaryMin += data._avg.salaryMin || 0;
      industryTrends[industry].totalSalaryMax += data._avg.salaryMax || 0;
      industryTrends[industry].companies.add(data.company);
    });
    
    // Calculate final metrics
    const trends = Object.keys(industryTrends).map(industry => ({
      industry,
      jobCount: industryTrends[industry].jobCount,
      averageSalaryMin: Math.round(industryTrends[industry].totalSalaryMin / industryTrends[industry].companies.size),
      averageSalaryMax: Math.round(industryTrends[industry].totalSalaryMax / industryTrends[industry].companies.size),
      companies: industryTrends[industry].companies.size,
      growthRate: Math.random() * 20 - 5, // Mock growth rate
      updatedAt: new Date()
    }));
    
    // Store in cache
    await redis.setex(
      'job_market:industry_trends',
      3600,
      JSON.stringify(trends)
    );
    
    return { industriesAnalyzed: trends.length };
  }

  async updateCompanyData() {
    console.log('🏢 Updating company data...');
    
    // Get unique companies from job postings
    const companies = await db.jobPosting.findMany({
      select: { company: true },
      distinct: ['company']
    });
    
    // Mock company data updates
    const companyData = companies.map(({ company }) => ({
      name: company,
      size: Math.floor(Math.random() * 50000) + 1000,
      rating: 3.5 + Math.random() * 1.5,
      benefits: ['Health Insurance', 'Retirement Plan', 'Paid Time Off'],
      culture: 'Innovation-focused',
      updatedAt: new Date()
    }));
    
    // Store in cache
    await redis.setex(
      'job_market:company_data',
      3600,
      JSON.stringify(companyData)
    );
    
    return { companiesUpdated: companyData.length };
  }

  async updateLocationData() {
    console.log('📍 Updating location data...');
    
    // Get unique locations from job postings
    const locations = await db.jobPosting.findMany({
      select: { location: true },
      distinct: ['location']
    });
    
    // Mock location data
    const locationData = locations.map(({ location }) => ({
      location,
      costOfLiving: 80 + Math.random() * 40, // Index 80-120
      averageRent: 1500 + Math.random() * 2000,
      techJobsCount: Math.floor(Math.random() * 5000) + 500,
      qualityOfLife: 3.5 + Math.random() * 1.5,
      updatedAt: new Date()
    }));
    
    // Store in cache
    await redis.setex(
      'job_market:location_data',
      3600,
      JSON.stringify(locationData)
    );
    
    return { locationsUpdated: locationData.length };
  }

  async refreshAllStudentMappings() {
    console.log('👥 Refreshing all student mappings...');
    
    // Get all active students
    const students = await db.user.findMany({
      where: {
        role: { name: 'STUDENT' },
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
        }
      },
      select: { id: true }
    });
    
    console.log(`  📊 Found ${students.length} active students`);
    
    // Refresh mappings in batches
    const batchSize = 10;
    let refreshed = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      const promises = batch.map(student => 
        this.refreshStudentMapping(student.id).catch(error => {
          console.error(`  ❌ Failed to refresh mapping for student ${student.id}:`, error.message);
        })
      );
      
      await Promise.allSettled(promises);
      refreshed += batch.length;
      
      console.log(`  ✅ Refreshed ${refreshed}/${students.length} student mappings`);
    }
    
    return { studentsRefreshed: refreshed };
  }

  async refreshStudentMapping(studentId) {
    try {
      // Generate fresh mapping
      const mapping = await this.jobMarketService.generateStudentJobMarketMapping(
        studentId,
        { forceRefresh: true }
      );
      
      // Cache the mapping
      await redis.setex(
        `job_market:mapping:${studentId}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(mapping)
      );
      
      return mapping;
    } catch (error) {
      console.error(`Failed to refresh mapping for student ${studentId}:`, error);
      throw error;
    }
  }

  async refreshActiveStudentMappings() {
    console.log('🔄 Refreshing active student mappings...');
    
    // Get students who have been active recently
    const activeStudents = await db.user.findMany({
      where: {
        role: { name: 'STUDENT' },
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
        }
      },
      select: { id: true },
      take: 50 // Limit to most recent 50 active students
    });
    
    const promises = activeStudents.map(student => 
      this.refreshStudentMapping(student.id).catch(error => {
        console.error(`Failed to refresh mapping for student ${student.id}:`, error);
      })
    );
    
    await Promise.allSettled(promises);
    
    return { studentsRefreshed: activeStudents.length };
  }

  async setupHealthMonitoring() {
    this.healthStatus = {
      status: 'healthy',
      uptime: 0,
      lastUpdate: null,
      updateInterval: this.updateInterval,
      jobsUpdated: 0,
      studentsRefreshed: 0,
      lastHeartbeat: new Date()
    };

    // Update health status every 60 seconds
    setInterval(() => {
      this.healthStatus.uptime = process.uptime();
      this.healthStatus.lastUpdate = this.lastUpdate;
      this.healthStatus.lastHeartbeat = new Date();
      
      // Store in Redis
      redis.setex('job_market:worker:health', 120, JSON.stringify(this.healthStatus));
    }, 60000);
  }

  async shutdown() {
    console.log('🛑 Shutting down Job Market Worker...');
    this.isRunning = false;
    console.log('✅ Job Market Worker shutdown complete');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (worker) {
    await worker.shutdown();
  }
  process.exit(0);
});

// Start worker
const worker = new JobMarketWorker();
worker.initialize().catch(error => {
  console.error('Failed to start Job Market Worker:', error);
  process.exit(1);
});