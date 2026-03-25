import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { score, puzzleId, timeTaken, date } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const puzzleDate = date ? date + "T00:00:00.000Z" : new Date().toISOString().split("T")[0] + "T00:00:00.000Z";

  const dailyScore = await prisma.dailyScore.upsert({
    where: {
      userId_date: {
        userId: user.id,
        date: puzzleDate,
      },
    },
    update: { score, timeTaken },
    create: {
      userId: user.id,
      puzzleId,
      score,
      timeTaken,
      date: puzzleDate,
    },
  });

  // Update user total points and streak if it's today's puzzle
  if (puzzleDate === new Date().toISOString().split("T")[0] + "T00:00:00.000Z") {
    const lastPlayed = user.lastPlayed ? new Date(user.lastPlayed).toISOString().split("T")[0] : null;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newStreak = user.streakCount;
    if (lastPlayed === yesterdayStr) {
      newStreak += 1;
    } else if (lastPlayed !== todayStr) {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: score },
        streakCount: newStreak,
        lastPlayed: new Date(),
      }
    });
  } else {
    // Just update points for older puzzles
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: score },
      }
    });
  }

  return NextResponse.json(dailyScore);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "today";
  const today = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
  
  if (type === "all") {
    const topUsers = await prisma.user.findMany({
      orderBy: { totalPoints: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        totalPoints: true,
        streakCount: true,
      }
    });
    // Format to match the structure expected by the frontend
    return NextResponse.json(topUsers.map(u => ({
      user: u,
      score: u.totalPoints,
      timeTaken: 0, // Not applicable for all-time
    })));
  }

  const topScores = await prisma.dailyScore.findMany({
    where: { date: today },
    orderBy: [
      { score: "desc" },
      { timeTaken: "asc" },
    ],
    take: 100,
    include: {
      user: {
        select: { 
          name: true, 
          image: true, 
          email: true,
          totalPoints: true,
          streakCount: true
        },
      },
    },
  });

  return NextResponse.json(topScores);
}
