import { connectMongoDB } from "@/lib/mongodb_log";
import Log from "@/models/log";
import { NextResponse } from "next/server";

// GET: Fetch recent logs from database
export async function GET(request) {
  try {
    // Get dataSource parameter from URL query
    const { searchParams } = new URL(request.url);
    const dataSource = searchParams.get('dataSource') || 'coldspray';

    // Connect to MongoDB
    await connectMongoDB();

    // Map data source to collection field name
    let query = {};
    // For now, we only have cold_spray data in the logs collection
    // In the future, you could add filtering based on dataSource
    // or query different collections
    
    // Fetch logs sorted by newest first
    const logs = await Log.find(query)
      .sort({ Time: -1 })
      .lean();

    return NextResponse.json({ logs, dataSource }, { status: 200 });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { message: "Error fetching logs" },
      { status: 500 }
    );
  }
}
