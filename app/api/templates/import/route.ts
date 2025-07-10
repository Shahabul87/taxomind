import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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
        const existingTemplate = await db.contentTemplate.findFirst({
          where: {
            name,
            authorId: user.id,
            contentType
          }
        });

        if (existingTemplate) {
          if (overwrite) {
            await db.contentTemplate.update({
              where: { id: existingTemplate.id },
              data: {
                description,
                category,
                templateData: JSON.stringify(data),
                tags,
                isOfficial: user.role === UserRole.ADMIN
              }
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          await db.contentTemplate.create({
            data: {
              name,
              description,
              contentType,
              category,
              templateData: JSON.stringify(data),
              tags,
              authorId: user.id,
              isPublic: false,
              isOfficial: user.role === UserRole.ADMIN
            }
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(`Template "${templateData.name || 'unnamed'}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      message: "Import completed",
      results
    });

  } catch (error) {
    console.error("Template import error:", error);
    return NextResponse.json(
      { error: "Failed to import templates" },
      { status: 500 }
    );
  }
}