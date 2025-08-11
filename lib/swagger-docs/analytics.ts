/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get platform analytics
 *     description: Retrieve comprehensive analytics data (requires ADMIN role)
 *     tags: [Analytics]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Time frame for analytics data
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter analytics by specific course
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue in USD
 *                     totalSales:
 *                       type: integer
 *                       description: Total number of course sales
 *                     totalCourses:
 *                       type: integer
 *                       description: Total number of courses
 *                     totalStudents:
 *                       type: integer
 *                       description: Total number of students
 *                     activeStudents:
 *                       type: integer
 *                       description: Students active in the timeframe
 *                 courseMetrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       Enrollment:
 *                         type: integer
 *                       completions:
 *                         type: integer
 *                       averageRating:
 *                         type: number
 *                       revenue:
 *                         type: number
 *                       engagementScore:
 *                         type: number
 *                 userEngagement:
 *                   type: object
 *                   properties:
 *                     dailyActiveUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                     averageSessionDuration:
 *                       type: number
 *                       description: Average session duration in minutes
 *                     totalVideoWatchTime:
 *                       type: number
 *                       description: Total video watch time in hours
 *                 performance:
 *                   type: object
 *                   properties:
 *                     avgPageLoadTime:
 *                       type: number
 *                       description: Average page load time in milliseconds
 *                     errorRate:
 *                       type: number
 *                       description: Error rate percentage
 *                     uptime:
 *                       type: number
 *                       description: System uptime percentage
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/analytics/students:
 *   get:
 *     summary: Get student analytics
 *     description: Retrieve analytics specific to student engagement and performance
 *     tags: [Analytics]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 7d
 *         description: Time frame for analytics data
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course
 *     responses:
 *       200:
 *         description: Student analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStudents:
 *                   type: integer
 *                   description: Total number of students
 *                 activeStudents:
 *                   type: integer
 *                   description: Students active in timeframe
 *                 newStudents:
 *                   type: integer
 *                   description: New student registrations
 *                 atRiskStudents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       riskScore:
 *                         type: number
 *                         description: Risk score (0-100)
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                       courseProgress:
 *                         type: number
 *                 learningPatterns:
 *                   type: object
 *                   properties:
 *                     peakLearningHours:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Hours when most learning activity occurs
 *                     averageSessionLength:
 *                       type: number
 *                       description: Average learning session in minutes
 *                     contentPreferences:
 *                       type: object
 *                       properties:
 *                         video:
 *                           type: number
 *                         text:
 *                           type: number
 *                         interactive:
 *                           type: number
 *                       description: Preference percentages
 *                 progressMetrics:
 *                   type: object
 *                   properties:
 *                     averageCompletionRate:
 *                       type: number
 *                       description: Average course completion rate
 *                     averageTimeToComplete:
 *                       type: number
 *                       description: Average time to complete courses in days
 *                     strugglingTopics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                           struggleCount:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/analytics/web-vitals:
 *   post:
 *     summary: Submit web vitals data
 *     description: Submit Core Web Vitals performance metrics
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebVital'
 *     responses:
 *       200:
 *         description: Web vitals data recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   get:
 *     summary: Get web vitals analytics
 *     description: Retrieve Core Web Vitals performance metrics and analytics
 *     tags: [Performance]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time frame for metrics
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [CLS, FID, FCP, LCP, TTFB]
 *         description: Filter by specific metric
 *     responses:
 *       200:
 *         description: Web vitals analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeframe:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 metrics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       average:
 *                         type: number
 *                       min:
 *                         type: number
 *                       max:
 *                         type: number
 *                       p50:
 *                         type: number
 *                       p75:
 *                         type: number
 *                       p90:
 *                         type: number
 *                       p95:
 *                         type: number
 *                       ratings:
 *                         type: object
 *                         properties:
 *                           good:
 *                             type: integer
 *                           needs-improvement:
 *                             type: integer
 *                           poor:
 *                             type: integer
 *                 total:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */