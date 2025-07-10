// Pure CSS test - no imports that could trigger Prisma
export default function PureCSSTest() {
  return (
    <html>
      <head>
        <link rel="stylesheet" href="/_next/static/css/app/layout.css" />
      </head>
      <body>
        <div style={{ padding: '20px' }}>
          <h1 style={{ color: 'red', fontSize: '48px' }}>
            ✅ If this is RED, inline styles work!
          </h1>
          
          <div className="bg-blue-500 text-white p-6 rounded-lg mt-4">
            ✅ If this has a BLUE background, Tailwind CSS is working!
          </div>
          
          <button className="mt-4 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105">
            ✅ Hover me - I should be GREEN
          </button>
          
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-purple-500 text-white p-4 rounded">Purple Box</div>
            <div className="bg-yellow-500 text-black p-4 rounded">Yellow Box</div>
          </div>
          
          <p className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
            If you see styled content above, CSS is working perfectly! 🎉
          </p>
        </div>
      </body>
    </html>
  );
}