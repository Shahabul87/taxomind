export default function SimpleCSSTest() {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '48px' }}>Inline Style Test</h1>
      <h2 className="text-4xl font-bold text-blue-500">Tailwind Test</h2>
      <div className="bg-green-500 p-4 rounded">
        <p className="text-white">If this box is green with white text, Tailwind is working!</p>
      </div>
      <div style={{ backgroundColor: 'purple', color: 'white', padding: '1rem', marginTop: '1rem' }}>
        Manual CSS Test
      </div>
      <div className="mt-8">
        <h3 className="text-2xl mb-4">Debug Info:</h3>
        <ul>
          <li>Red text above = inline styles work</li>
          <li>Green box = Tailwind works</li>
          <li>Purple box = inline styles work</li>
        </ul>
      </div>
    </div>
  );
}