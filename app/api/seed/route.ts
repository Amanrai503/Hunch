import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/sample-data/seeder";

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with sample user, curated games, and SteamSpy tags.",
    });
  } catch (err: unknown) {
    console.error("Seeding error:", err);
    const pgError = (err as { cause?: { message?: string } })?.cause;
    return NextResponse.json(
      {
        success: false,
        error: String(err),
        details: pgError?.message || (err as Error)?.message || String(err),
      },
      { status: 500 }
    );
  }
}

