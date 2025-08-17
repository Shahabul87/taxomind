Working Login Credentials

  Admin Accounts

  Admin 1:
    Email: admin@example.com
    Password: Admin123!@#
    Role: ADMIN
    Dashboard: /dashboard/admin

  Admin 2:
    Email: testadmin@example.com
    Password: Admin123!@#
    Role: ADMIN
    Dashboard: /dashboard/admin

  System Admin:
    Email: system@taxomind.com
    Password: Admin123!@#
    Role: ADMIN
    Dashboard: /dashboard/admin

  User Account

  Test User:
    Email: testuser@example.com
    Password: User123!@#
    Role: USER
    Dashboard: /dashboard (with context switching)

  🚀 How to Test

  1. Start the development server:
  npm run dev

  2. Open browser to login page:
  http://localhost:3000/auth/login

  3. Login with any of these credentials:
    - Admin: admin@example.com / Admin123!@#
    - User: testuser@example.com / User123!@#

  What Happens After Login

  For Admins:

  - Redirected to /dashboard/admin
  - See admin-specific dashboard with:
    - User management
    - System settings
    - Analytics & reports
    - Platform statistics

  For Users:

  - Redirected to /dashboard
  - See unified dashboard with:
    - Context switching (Student/Teacher/Affiliate)
    - Capability request options
    - Role-specific content

  Authentication System Summary

  ✅ Server actions properly configured with "use server"
  ✅ Crypto functions work in both server and client environments✅ Password verification supports both
  bcrypt and noble/hashes
  ✅ Role-based routing with clean ADMIN/USER separation
  ✅ Capability system for context switching

  The authentication system is now fully functional and ready for use!