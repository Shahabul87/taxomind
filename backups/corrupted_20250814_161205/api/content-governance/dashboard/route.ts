import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement content governance dashboard when models are ready
export const GET = withAuth(async (request: NextRequest) => {
  return Response.json({ error: "Content governance dashboard not yet implemented" }, { status: 501 });
});