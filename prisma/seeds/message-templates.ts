// import { db } from "@/lib/db";

// TODO: MessageTemplate model needs to be added to Prisma schema
// Currently disabled until the model is implemented

export async function seedMessageTemplates() {
  console.log("⚠️  Message templates seeding skipped - MessageTemplate model not yet implemented");
  return;

  /* Original implementation - commented out until MessageTemplate model exists
  const defaultTemplates = [
    {
      title: "Question about Course Material",
      content: "Hi {{instructor_name}},\n\nI have a question about {{topic}} in {{course_name}}.\n\n{{question}}\n\nThank you for your help!\n\nBest regards",
      category: "QUESTION",
      variables: ["instructor_name", "topic", "course_name", "question"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Assignment Help Request",
      content: "Hello {{instructor_name}},\n\nI'm working on {{assignment_name}} and need some guidance on {{specific_issue}}.\n\nCould you please help me understand {{question}}?\n\nThank you!",
      category: "ASSIGNMENT",
      variables: ["instructor_name", "assignment_name", "specific_issue", "question"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Technical Issue Report",
      content: "Hi {{instructor_name}},\n\nI'm experiencing a technical issue with {{feature_name}}.\n\nIssue description: {{issue_description}}\n\nSteps I've tried: {{steps_tried}}\n\nPlease advise.\n\nThanks",
      category: "TECHNICAL_ISSUE",
      variables: ["instructor_name", "feature_name", "issue_description", "steps_tried"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Course Feedback",
      content: "Hello {{instructor_name}},\n\nI wanted to share some feedback about {{course_name}}.\n\n{{feedback}}\n\nThank you for the great course!",
      category: "FEEDBACK",
      variables: ["instructor_name", "course_name", "feedback"],
      isDefault: true,
      userId: null,
    },
    {
      title: "General Inquiry",
      content: "Hi {{instructor_name}},\n\nI have a question about {{topic}}.\n\n{{message}}\n\nThank you!",
      category: "GENERAL",
      variables: ["instructor_name", "topic", "message"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Clarification Request",
      content: "Hello {{instructor_name}},\n\nCould you please clarify {{topic}} from {{lecture_name}}?\n\nSpecifically, I'm confused about: {{confusion}}\n\nThank you for your time!",
      category: "QUESTION",
      variables: ["instructor_name", "topic", "lecture_name", "confusion"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Extension Request",
      content: "Hi {{instructor_name}},\n\nI would like to request an extension for {{assignment_name}} due to {{reason}}.\n\nCurrent deadline: {{deadline}}\nRequested extension: {{extension_date}}\n\nThank you for considering my request.",
      category: "ASSIGNMENT",
      variables: ["instructor_name", "assignment_name", "reason", "deadline", "extension_date"],
      isDefault: true,
      userId: null,
    },
    {
      title: "Thank You Note",
      content: "Dear {{instructor_name}},\n\nI wanted to thank you for {{specific_help}}. Your explanation of {{topic}} really helped me understand the concept.\n\nI appreciate your support!\n\nBest regards",
      category: "FEEDBACK",
      variables: ["instructor_name", "specific_help", "topic"],
      isDefault: true,
      userId: null,
    },
  ];

  console.log("Seeding default message templates...");

  for (const template of defaultTemplates) {
    // Check if template already exists
    const existing = await db.messageTemplate.findFirst({
      where: {
        title: template.title,
        isDefault: true,
      },
    });

    if (!existing) {
      await db.messageTemplate.create({
        data: template,
      });
      console.log(`✓ Created template: ${template.title}`);
    } else {
      console.log(`⊘ Template already exists: ${template.title}`);
    }
  }

  console.log("Message templates seeding completed!");
  */
}
