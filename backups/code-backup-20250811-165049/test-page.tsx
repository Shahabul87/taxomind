import React from "react";

const TestPage = async (props: {params: Promise<{courseId: string}>}) => {
  const params = await props.params;

  return (
    <div className="min-h-screen">
      <h1>Test</h1>
    </div>
  );
}

export default TestPage;