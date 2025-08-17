import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

// Update a specific learning objective 
export async function PATCH(
  req: Request, 
  props: { params: Promise<{ courseId: string; objectiveId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { value } = await req.json();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      select: {
        whatYouWillLearn: true,
        userId: true,
      }
    });
    
    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    // Find the index of the objective from its ID
    // Note: In our form, objectiveId is formatted as "objective-{index}"
    const objectiveIdParts = params.objectiveId.split('-');
    const objectiveIndex = parseInt(objectiveIdParts[objectiveIdParts.length - 1]);
    
    if (isNaN(objectiveIndex) || objectiveIndex < 0 || !course.whatYouWillLearn || objectiveIndex >= course.whatYouWillLearn.length) {
      return new NextResponse("Objective not found", { status: 404 });
    }
    
    // Update the objective at the specified index
    const updatedObjectives = [...course.whatYouWillLearn];
    updatedObjectives[objectiveIndex] = value;
    
    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      data: {
        whatYouWillLearn: updatedObjectives,
      },
    });
    
    return NextResponse.json(updatedCourse);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a specific learning objective
export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; objectiveId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      select: {
        whatYouWillLearn: true,
        userId: true,
      }
    });
    
    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    // Find the index of the objective from its ID
    // Note: In our form, objectiveId is formatted as "objective-{index}"
    const objectiveIdParts = params.objectiveId.split('-');
    const objectiveIndex = parseInt(objectiveIdParts[objectiveIdParts.length - 1]);
    
    if (isNaN(objectiveIndex) || objectiveIndex < 0 || !course.whatYouWillLearn || objectiveIndex >= course.whatYouWillLearn.length) {
      return new NextResponse("Objective not found", { status: 404 });
    }
    
    // Remove the objective at the specified index
    const updatedObjectives = [...course.whatYouWillLearn];
    updatedObjectives.splice(objectiveIndex, 1);
    
    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      data: {
        whatYouWillLearn: updatedObjectives,
      },
    });
    
    return NextResponse.json(updatedCourse);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 