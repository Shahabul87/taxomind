export default function BasicTest() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .test-red { color: red; font-size: 48px; }
        .test-box { background: green; color: white; padding: 20px; margin: 20px 0; }
      `}} />
      <div>
        <h1 className="test-red">If this is red, CSS works</h1>
        <div className="test-box">If this is a green box, CSS works</div>
        <h2 className="text-4xl text-blue-500 font-bold">If this is large and blue, Tailwind works</h2>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Tailwind Button Test
        </button>
      </div>
    </>
  );
}