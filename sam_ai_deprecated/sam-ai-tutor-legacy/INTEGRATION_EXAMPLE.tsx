/**
 * FLOATING SAM - Integration Example
 *
 * This file demonstrates how to integrate the redesigned Floating SAM
 * into your course creation pages.
 *
 * File: sam-ai-tutor/INTEGRATION_EXAMPLE.tsx
 * Date: January 2025
 */

'use client';

import { useState } from 'react';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';

/**
 * Example 1: Basic Course Creation Page with Floating SAM
 *
 * This is the simplest integration - just wrap your page in CourseCreationProvider
 * and add the FloatingSAM component.
 */
export function BasicCourseCreationExample() {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    learningObjectives: [''],
  });

  return (
    <CourseCreationProvider initialCourseData={courseData}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create Your Course</h1>

          {/* Course Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">

            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title
              </label>
              <SAMAwareInput
                fieldName="course-title"
                fieldType="title"
                value={courseData.title}
                onChange={(value) => setCourseData({ ...courseData, title: value })}
                placeholder="Enter an engaging course title..."
                showBloomsIndicator={true}
              />
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Description
              </label>
              <SAMAwareInput
                fieldName="course-description"
                fieldType="description"
                value={courseData.description}
                onChange={(value) => setCourseData({ ...courseData, description: value })}
                placeholder="Describe what students will learn..."
                multiline
                rows={4}
                showBloomsIndicator={true}
              />
            </div>

            {/* Learning Objectives */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives
              </label>
              {courseData.learningObjectives.map((objective, index) => (
                <div key={index} className="mb-3">
                  <SAMAwareInput
                    fieldName={`learning-objective-${index + 1}`}
                    fieldType="objective"
                    value={objective}
                    onChange={(value) => {
                      const newObjectives = [...courseData.learningObjectives];
                      newObjectives[index] = value;
                      setCourseData({ ...courseData, learningObjectives: newObjectives });
                    }}
                    placeholder={`Learning objective ${index + 1}...`}
                    showBloomsIndicator={true}
                  />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Create Course
            </button>
          </div>
        </div>

        {/* Floating SAM - Always available */}
        <FloatingSAM />
      </div>
    </CourseCreationProvider>
  );
}

/**
 * Example 2: Course Creation with Side Panel
 *
 * This example includes both the Contextual Panel (sidebar) and Floating SAM.
 * Users get the best of both worlds - persistent sidebar + draggable assistant.
 */
export function CourseCreationWithSidePanelExample() {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    objectives: [''],
  });

  return (
    <CourseCreationProvider initialCourseData={courseData}>
      <div className="flex h-screen bg-gray-50">

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create Your Course</h1>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title
                </label>
                <SAMAwareInput
                  fieldName="course-title"
                  fieldType="title"
                  value={courseData.title}
                  onChange={(value) => setCourseData({ ...courseData, title: value })}
                  placeholder="Enter course title..."
                  showBloomsIndicator={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <SAMAwareInput
                  fieldName="course-description"
                  fieldType="description"
                  value={courseData.description}
                  onChange={(value) => setCourseData({ ...courseData, description: value })}
                  placeholder="Describe your course..."
                  multiline
                  rows={4}
                  showBloomsIndicator={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SAM Contextual Panel (Sidebar) */}
        <SAMContextualPanel />

        {/* Floating SAM (Additional help) */}
        <FloatingSAM />
      </div>
    </CourseCreationProvider>
  );
}

/**
 * Example 3: Programmatic Control of Floating SAM
 *
 * This example shows how to control Floating SAM programmatically
 * using the useFloatingSAM hook.
 */
export function ProgrammaticControlExample() {
  const [courseData, setCourseData] = useState({
    title: '',
  });

  return (
    <CourseCreationProvider initialCourseData={courseData}>
      <CourseFormWithControls courseData={courseData} setCourseData={setCourseData} />
      <FloatingSAM />
    </CourseCreationProvider>
  );
}

// Child component that uses the hook
function CourseFormWithControls({
  courseData,
  setCourseData
}: {
  courseData: { title: string };
  setCourseData: (data: { title: string }) => void;
}) {
  // Import the hook inside a component wrapped by CourseCreationProvider
  const { useFloatingSAM } = require('@/sam-ai-tutor/components/course-creation/floating-sam');
  const { isOpen, open, close, toggle } = useFloatingSAM();

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">

        {/* Control Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={open}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open SAM
          </button>
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close SAM
          </button>
          <button
            onClick={toggle}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Toggle SAM
          </button>
          <span className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm">
            Status: {isOpen ? '✅ Open' : '❌ Closed'}
          </span>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <SAMAwareInput
            fieldName="course-title"
            fieldType="title"
            value={courseData.title}
            onChange={(value) => setCourseData({ ...courseData, title: value })}
            placeholder="Enter course title..."
            showBloomsIndicator={true}
          />

          <p className="mt-4 text-sm text-gray-600">
            💡 Tip: Click the buttons above to control SAM, or focus on the input field
            to see SAM&apos;s contextual suggestions!
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Multi-Step Form with Floating SAM
 *
 * This example shows how Floating SAM works in a wizard-style
 * multi-step course creation flow.
 */
export function MultiStepFormExample() {
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    objectives: [''],
  });

  return (
    <CourseCreationProvider initialCourseData={courseData}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">Step 1: Basic Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <SAMAwareInput
                    fieldName="course-title"
                    fieldType="title"
                    value={courseData.title}
                    onChange={(value) => setCourseData({ ...courseData, title: value })}
                    placeholder="Enter course title..."
                    showBloomsIndicator={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={courseData.category}
                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Programming, Business, Design..."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">Step 2: Course Description</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <SAMAwareInput
                    fieldName="course-description"
                    fieldType="description"
                    value={courseData.description}
                    onChange={(value) => setCourseData({ ...courseData, description: value })}
                    placeholder="Describe what students will learn..."
                    multiline
                    rows={6}
                    showBloomsIndicator={true}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">Step 3: Learning Objectives</h2>

                {courseData.objectives.map((objective, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objective {index + 1}
                    </label>
                    <SAMAwareInput
                      fieldName={`objective-${index + 1}`}
                      fieldType="objective"
                      value={objective}
                      onChange={(value) => {
                        const newObjectives = [...courseData.objectives];
                        newObjectives[index] = value;
                        setCourseData({ ...courseData, objectives: newObjectives });
                      }}
                      placeholder="What will students be able to do..."
                      showBloomsIndicator={true}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(Math.min(3, step + 1))}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {step === 3 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Floating SAM - Available throughout all steps */}
        <FloatingSAM />
      </div>
    </CourseCreationProvider>
  );
}

/**
 * HOW TO USE THESE EXAMPLES:
 *
 * 1. Copy the example you want to use
 * 2. Paste it into your course creation page
 * 3. Adjust the courseData state to match your needs
 * 4. Customize the form fields as needed
 * 5. That's it! Floating SAM will work automatically
 *
 * FEATURES YOU GET:
 *
 * ✅ Drag-and-drop positioning (defaults to bottom-right)
 * ✅ Three interaction modes (Quick, Chat, Analyze)
 * ✅ Real-time Bloom's taxonomy detection
 * ✅ Context-aware suggestions
 * ✅ Quick action buttons
 * ✅ Visual analytics
 * ✅ Minimize/maximize functionality
 *
 * NOTES:
 *
 * - FloatingSAM must be inside CourseCreationProvider
 * - SAMAwareInput components automatically update SAM's context
 * - User can drag SAM anywhere on the screen
 * - SAM remembers its position during the session
 * - All three modes work independently
 */
