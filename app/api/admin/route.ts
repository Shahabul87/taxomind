import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  try {
    if (!await isAdmin()) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Admin only logic here
    return NextResponse.json({ message: "Admin access granted" });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}