import { Course, User } from "@prisma/client";

export interface CourseEnrollmentEmailData {
  user: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    description?: string;
    price?: number;
    thumbnail?: string;
  };
  enrollmentDate: Date;
  courseUrl: string;
  dashboardUrl: string;
}

export const generateEnrollmentConfirmationEmail = (data: CourseEnrollmentEmailData) => {
  const { user, course, enrollmentDate, courseUrl, dashboardUrl } = data;
  
  const subject = `Welcome to ${course.title}! 🎉`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Enrollment Confirmation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .course-info {
          background: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .course-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 10px 0;
        }
        .course-details {
          color: #666;
          margin: 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 10px 20px 0;
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
        }
        .secondary-button {
          display: inline-block;
          background: #ffffff;
          color: #667eea !important;
          text-decoration: none;
          padding: 15px 30px;
          border: 2px solid #667eea;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 10px 20px 0;
        }
        .tips {
          background: #f0f7ff;
          border: 1px solid #e0f0ff;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .tips h3 {
          color: #1e40af;
          margin-top: 0;
          font-size: 18px;
        }
        .tips ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        .tips li {
          margin-bottom: 8px;
          color: #4b5563;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .enrollment-badge {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
          margin: 10px 0;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 30px 20px;
          }
          .cta-button, .secondary-button {
            display: block;
            text-align: center;
            margin: 10px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🎉 Welcome to Your Course!</h1>
          <p>You're all set to start learning</p>
          <div class="enrollment-badge">✅ Enrollment Confirmed</div>
        </div>

        <!-- Content -->
        <div class="content">
          <p>Hi ${user.name},</p>
          
          <p>Congratulations! You've successfully enrolled in your new course. We're excited to have you on this learning journey.</p>

          <!-- Course Info -->
          <div class="course-info">
            <h2 class="course-title">${course.title}</h2>
            <p class="course-details">
              <strong>Enrolled on:</strong> ${enrollmentDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}<br>
              ${course.price && course.price > 0 ? `<strong>Investment:</strong> $${course.price}` : '<strong>Type:</strong> Free Course'}
            </p>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${courseUrl}" class="cta-button">🚀 Start Learning Now</a>
            <a href="${dashboardUrl}" class="secondary-button">📊 View Dashboard</a>
          </div>

          <!-- Learning Tips -->
          <div class="tips">
            <h3>💡 Tips for Success</h3>
            <ul>
              <li><strong>Set a Schedule:</strong> Dedicate regular time for learning to build momentum</li>
              <li><strong>Take Notes:</strong> Active note-taking helps with retention and understanding</li>
              <li><strong>Practice Regularly:</strong> Apply what you learn through exercises and projects</li>
              <li><strong>Stay Consistent:</strong> Small, consistent efforts lead to big results</li>
              <li><strong>Ask Questions:</strong> Don't hesitate to reach out if you need help</li>
            </ul>
          </div>

          <p>Ready to dive in? Your course is waiting for you!</p>
          
          <p>Happy learning!<br>
          <strong>The Learning Team</strong></p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Need help? <a href="mailto:support@yourapp.com" style="color: #667eea;">Contact Support</a></p>
          <p>© 2024 Your Learning Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to ${course.title}!

    Hi ${user.name},

    Congratulations! You've successfully enrolled in your new course.

    course: ${course.title}
    Enrolled on: ${enrollmentDate.toLocaleDateString()}
    ${course.price && course.price > 0 ? `Investment: $${course.price}` : 'Type: Free Course'}

    Start learning: ${courseUrl}
    View dashboard: ${dashboardUrl}

    Tips for Success:
    - Set a regular learning schedule
    - Take notes while learning
    - Practice what you learn
    - Stay consistent with your studies
    - Ask questions when you need help

    Happy learning!
    The Learning Team
  `;

  return { subject, html, text };
};

export const generateWelcomeEmail = (userName: string, coursesUrl: string) => {
  const subject = "Welcome to Your Learning Journey! 🌟";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; }
        .content { padding: 30px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Welcome to Your Learning Journey!</h1>
          <p>We're excited to have you aboard</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome to our learning platform! You're now part of a community of learners who are committed to growing their skills and knowledge.</p>
          <p>Ready to explore our courses?</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${coursesUrl}" class="cta-button">Explore Courses</a>
          </div>
          <p>Happy learning!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Your Learning Journey!

    Hi ${userName},

    Welcome to our learning platform! You're now part of a community of learners.

    Explore courses: ${coursesUrl}

    Happy learning!
  `;

  return { subject, html, text };
}; 