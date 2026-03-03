import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { randomUUID } from 'crypto';

export async function POST(req: Request, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const resource = await db.groupResource.create({
      data: {
        id: randomUUID(),
        title: values.title,
        description: values.description,
        type: values.type,
        url: values.url,
        groupId: params.groupId,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const resources = await db.groupResource.findMany({
      where: {
        groupId: params.groupId,
      },
      include: {
        User: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    return NextResponse.json(resources);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 