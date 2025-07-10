export default function SimpleTestPage() {
  return (
    <div className="bg-blue-600 p-8 rounded-lg">
      <h1 className="text-2xl font-bold text-white mb-4">Simple CSS Test</h1>
      <p className="text-blue-100">If you see blue background and white text, CSS is working!</p>
      <div className="mt-4 bg-green-500 p-4 rounded">
        <p className="text-white">This should be green</p>
      </div>
    </div>
  );
}