import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      updateType,
      data 
    } = await request.json();

    if (!courseId || !updateType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        userId: user.id
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    let updateResult = null;

    switch (updateType) {
      case 'chapters':
        updateResult = await handleChapterSync(courseId, data, user.id);
        break;
      case 'learning_objectives':
        updateResult = await handleLearningObjectivesSync(courseId, data, user.id);
        break;
      case 'course_description':
        updateResult = await handleCourseDescriptionSync(courseId, data, user.id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      updateType,
      result: updateResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return safeErrorResponse(error, 500, 'SAM_FORM_SYNCHRONIZATION');
  }
}

async function handleChapterSync(courseId: string, chaptersData: any[], userId: string) {
  const results = [];
  
  for (const chapterData of chaptersData) {
    try {
      // Get the next position
      const lastChapter = await db.chapter.findFirst({
        where: { courseId },
        orderBy: { position: 'desc' }
      });
      
      const position = (lastChapter?.position || 0) + 1;
      
      // Create the chapter
      const chapter = await db.chapter.create({
        data: {
          title: chapterData.title,
          description: chapterData.description,
          courseId,
          position,
          isPublished: false
        }
      });
      
      // Create sections if provided
      if (chapterData.sections && chapterData.sections.length > 0) {
        const sectionResults = [];
        
        for (let i = 0; i < chapterData.sections.length; i++) {
          const sectionData = chapterData.sections[i];
          
          const section = await db.section.create({
            data: {
              title: sectionData.title,
              chapterId: chapter.id,
              position: i + 1,
              isPublished: false
            }
          });
          
          sectionResults.push(section);
        }
        
        results.push({
          chapter,
          sections: sectionResults
        });
      } else {
        results.push({ chapter, sections: [] });
      }
      
    } catch (error) {
      logger.error(`Error creating chapter "${chapterData.title}":`, error);
      results.push({
        error: `Failed to create chapter: ${chapterData.title}`,
      });
    }
  }
  
  return results;
}

async function handleLearningObjectivesSync(courseId: string, objectives: string[], userId: string) {
  try {
    const updatedCourse = await db.course.update({
      where: {
        id: courseId,
        userId
      },
      data: {
        whatYouWillLearn: objectives
      }
    });
    
    return {
      success: true,
      objectivesCount: objectives.length,
      updatedCourse: {
        id: updatedCourse.id,
        whatYouWillLearn: updatedCourse.whatYouWillLearn
      }
    };
  } catch (error) {
    logger.error('Error updating learning objectives:', error);
    throw error;
  }
}

async function handleCourseDescriptionSync(courseId: string, description: string, userId: string) {
  try {
    const updatedCourse = await db.course.update({
      where: {
        id: courseId,
        userId
      },
      data: {
        description
      }
    });
    
    return {
      success: true,
      updatedCourse: {
        id: updatedCourse.id,
        description: updatedCourse.description
      }
    };
  } catch (error) {
    logger.error('Error updating course description:', error);
    throw error;
  }
}