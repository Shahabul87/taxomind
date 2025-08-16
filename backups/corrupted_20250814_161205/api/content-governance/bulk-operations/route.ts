import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement bulk operations when models are ready
export const GET = withAuth(async (request: NextRequest) => {
  return Response.json({ error: "Bulk operations system not yet implemented" }, { status: 501 });
});

export const POST = withAuth(async (request: NextRequest) => {
  return Response.json({ error: "Bulk operations system not yet implemented" }, { status: 501 });
});