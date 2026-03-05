import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
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

        if (!name || !contentType || !data) {
          results.errors.push(`Template "${name || 'unnamed'}" missing required fields`);
          continue;
        }

        // Check if template already exists
        const existingTemplate = await db.aIContentTemplate.findFirst({
          where: {
            name,
            creatorId: user.id,
            templateType: contentType
          }
        });

        if (existingTemplate) {
          if (overwrite) {
            await db.aIContentTemplate.update({
              where: { id: existingTemplate.id },
              data: {
                description,
                category,
                parameters: JSON.stringify(data),
                // tags: No tags field in schema
                // isOfficial: user.role === UserRole.ADMIN // Field not in schema
              }
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          await db.aIContentTemplate.create({
            data: {
              id: `template_${Date.now()}_${user.id}`,
              name,
              description,
              templateType: contentType,
              category,
              parameters: JSON.stringify(data),
              promptTemplate: JSON.stringify(data), // Required field
              creatorId: user.id,
              isPublic: false,
              updatedAt: new Date(),
            }
          });
          results.created++;
        }
      } catch (error) {
        logger.error('[TEMPLATE_IMPORT] Failed to import template', {
          templateName: templateData.name || 'unnamed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.errors.push(`Template "${templateData.name || 'unnamed'}": Import failed`);
      }
    }

    return NextResponse.json({
      message: "Import completed",
      results
    });

  } catch (error) {
    logger.error("Template import error:", error);
    return NextResponse.json(
      { error: "Failed to import templates" },
      { status: 500 }
    );
  }
}