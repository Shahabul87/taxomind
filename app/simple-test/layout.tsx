import '../globals.css'

export default function SimpleTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </body>
    </html>
  )
}