import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ratelimit } from "@/lib/ratelimit";
import { z } from "zod";

const batchUpdateSchema = z.object({
  updates: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      points: z.number().min(0),
      puzzleId: z.string(),
      timeTaken: z.number().min(0),
    })
  ).max(10), // Limit batch size for security
});

export async function POST(req: Request) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success: limitSuccess } = await ratelimit.limit(ip);
  if (!limitSuccess && process.env.UPSTASH_REDIS_REST_URL) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { updates } = batchUpdateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Batch upsert daily scores
    const results = await Promise.all(
      updates.map((update) => 
        prisma.dailyScore.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: new Date(update.date).toISOString().split("T")[0] + "T00:00:00.000Z",
            },
          },
          update: { 
            score: update.points, 
            timeTaken: update.timeTaken 
          },
          create: {
            userId: user.id,
            puzzleId: update.puzzleId,
            score: update.points,
            timeTaken: update.timeTaken,
            date: new Date(update.date).toISOString().split("T")[0] + "T00:00:00.000Z",
          },
        })
      )
    );

    // Update user total points
    const totalNewPoints = updates.reduce((acc, u) => acc + u.points, 0);
    
    // Streak calculation
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastPlayedStr = user.lastPlayed ? new Date(user.lastPlayed).toISOString().split("T")[0] : null;
    
    const includesToday = updates.some(u => u.date === todayStr);
    const includesYesterday = updates.some(u => u.date === yesterdayStr);

    let newStreak = user.streakCount;
    if (includesToday) {
      if (lastPlayedStr === yesterdayStr || includesYesterday) {
        newStreak += 1;
      } else if (lastPlayedStr !== todayStr) {
        newStreak = 1;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: totalNewPoints },
        ...(includesToday ? {
          streakCount: newStreak,
          lastPlayed: new Date(),
        } : {})
      }
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
