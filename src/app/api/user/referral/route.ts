import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        referrals: {
          select: {
            id: true,
            name: true,
            image: true,
            streakCount: true
          }
        },
        _count: {
          select: { referrals: true }
        }
      }
    });
    
    return NextResponse.json({ 
      count: user?._count.referrals || 0, 
      pointsEarned: (user?._count.referrals || 0) * 50,
      referrals: user?.referrals || []
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { referredBy } = await req.json();
    if (!referredBy) {
      return NextResponse.json({ error: "Missing referredBy" }, { status: 400 });
    }

    // Check if user already has a referrer
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, referralCode: true, referrerId: true },
    });

    if (currentUser?.referrerId) {
      return NextResponse.json({ message: "Referrer already set" }, { status: 400 });
    }

    if (currentUser?.referralCode === referredBy || currentUser?.id === referredBy) {
      return NextResponse.json({ message: "Cannot refer self" }, { status: 400 });
    }

    // Find referrer by ID or referralCode
    const referrer = await prisma.user.findFirst({
      where: {
        OR: [
          { id: referredBy },
          { referralCode: referredBy }
        ]
      }
    });

    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    // Update both users in a transaction
    await prisma.$transaction([
      // Set referrer for current user
      prisma.user.update({
        where: { id: session.user.id },
        data: { 
          referrerId: referrer.id,
          totalPoints: { increment: 25 } // Welcome bonus
        }
      }),
      // Award points to referrer
      prisma.user.update({
        where: { id: referrer.id },
        data: {
          totalPoints: { increment: 50 } // Referral bonus
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral attribution error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
