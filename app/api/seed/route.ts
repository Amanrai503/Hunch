import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/sample-data/seeder";

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with sample user, curated games, and SteamSpy tags.",
    });
  } catch (err) {
    console.error("Seeding error:", err);
    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}

