import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement content governance workflows when models are ready
export const GET = withAuth(async (request: NextRequest) => {
  return Response.json({ error: "Content governance workflows not yet implemented" }, { status: 501 });
});

export const POST = withAuth(async (request: NextRequest) => {
  return Response.json({ error: "Content governance workflows not yet implemented" }, { status: 501 });
});