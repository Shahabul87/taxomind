import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole, AITemplateType } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { templates, overwrite = false } = body;

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        { error: "Templates must be an array" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const templateData of templates) {
      try {
        const { name, description, contentType, category, templateData: data, tags = [] } = templateData;

        if (!name || !data) {
          results.errors.push(`Template "${name || 'unnamed'}" missing required fields`);
          continue;
        }

        // Check if template already exists
        const existingTemplate = await db.aIContentTemplate.findFirst({
          where: {
            name
          }
        });

        if (existingTemplate) {
          if (overwrite) {
            await db.aIContentTemplate.update({
              where: { id: existingTemplate.id },
              data: {
                description,
                promptTemplate: JSON.stringify(data),
                updatedAt: new Date()
              }
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          await db.aIContentTemplate.create({
            data: {
              id: crypto.randomUUID(),
              name,
              description,
              templateType: AITemplateType.COURSE_OUTLINE,
              promptTemplate: JSON.stringify(data),
              updatedAt: new Date()
            }
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(`Template "${templateData.name || 'unnamed'}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: "Import completed",
      results
    });

  } catch (error: any) {
    logger.error("Template import error:", error);
    return NextResponse.json(
      { error: "Failed to import templates" },
      { status: 500 }
    );
  }
}