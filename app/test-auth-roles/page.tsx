import { currentUser, currentRole } from "@/lib/auth";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TestAuthRoles() {
  const session = await auth();
  const user = await currentUser();
  const role = await currentRole();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">🔐 Authentication & Role Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Info */}
        <div className="bg-slate-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <div className="space-y-2">
            <p><strong>Logged In:</strong> {session ? "✅ Yes" : "❌ No"}</p>
            <p><strong>User ID:</strong> {session?.user?.id || "Not found"}</p>
            <p><strong>Email:</strong> {session?.user?.email || "Not found"}</p>
            <p><strong>Name:</strong> {session?.user?.name || "Not found"}</p>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-blue-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Role Information</h2>
          <div className="space-y-2">
            <p><strong>Current Role:</strong> 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                role === 'ADMIN' ? 'bg-red-200 text-red-800' :
                role === 'USER' ? 'bg-blue-200 text-blue-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {role || "UNKNOWN"}
              </span>
            </p>
            <p><strong>Is Admin:</strong> {role === 'ADMIN' ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Is User:</strong> {role === 'USER' ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Expected Dashboard:</strong> {role === 'ADMIN' ? "/dashboard/admin" : "/dashboard/user"}</p>
            <p><strong>Expected Analytics:</strong> {role === 'ADMIN' ? "/analytics/admin" : "/analytics/user"}</p>
          </div>
        </div>

        {/* Access Permissions */}
        <div className="bg-green-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Access Permissions</h2>
          <div className="space-y-2">
            <p><strong>Can Create Courses:</strong> {(role === 'ADMIN' || role === 'TEACHER') ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Can Manage Users:</strong> {role === 'ADMIN' ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Can Enroll in Courses:</strong> {(role === 'STUDENT' || role === 'TEACHER') ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Can View Analytics:</strong> {role === 'ADMIN' ? "✅ Yes" : "❌ No"}</p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Session Object:</strong></p>
            <pre className="bg-white p-2 rounded text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Role-based Navigation */}
      <div className="bg-purple-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Role-based Navigation</h2>
        <div className="flex flex-wrap gap-3">
          {role === 'ADMIN' && (
            <>
              <a href="/dashboard/admin" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Admin Dashboard
              </a>
              <a href="/analytics/admin" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Admin Analytics
              </a>
            </>
          )}
          
          {(role === 'USER' || role === 'ADMIN') && (
            <>
              <a href="/dashboard/user" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                User Dashboard
              </a>
              <a href="/analytics/user" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                User Analytics
              </a>
              <a href="/my-courses" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                My Courses
              </a>
              <a href="/teacher/courses" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Manage Courses
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}