export default function SimplePage() {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '48px' }}>Red Heading - Inline Styles Work!</h1>
      <div className="bg-blue-500 text-white p-4 rounded m-4">
        If this has a blue background, Tailwind CSS is working!
      </div>
      <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Green Button
      </button>
    </div>
  );
}