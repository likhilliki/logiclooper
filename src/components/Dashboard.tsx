"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch, loadState } from "@/lib/store";
import { getDailyPuzzle, Puzzle } from "@/lib/puzzles/engine";
import StreakHeatmap from "./StreakHeatmap";
import { getAllProgress } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Calendar, Users, Award, LayoutDashboard, Settings, User, Lock } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import axios from "axios";
import { clearSyncQueue } from "@/lib/store";

import { useSearchParams } from "next/navigation";

const PuzzleBoard = dynamic(() => import("./PuzzleBoard"), {
  loading: () => (
    <div className="w-full aspect-square bg-white border-2 border-dashed border-light-blue rounded-2xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  ),
  ssr: false,
});

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const challengeDate = searchParams.get("date");
  const referralFromUrl = searchParams.get("ref");
  const { data: session, status } = useSession();

  // Capture referral from URL
  useEffect(() => {
    if (referralFromUrl) {
      localStorage.setItem("referred_by", referralFromUrl);
    }
  }, [referralFromUrl]);

  // Attribute referral after sign in
  useEffect(() => {
    const attributeReferral = async () => {
      const referredBy = localStorage.getItem("referred_by");
      if (status === "authenticated" && referredBy && session?.user?.id) {
        try {
          await axios.post("/api/user/referral", { referredBy });
          localStorage.removeItem("referred_by"); // Remove after successful attribution
        } catch (e) {
          console.error("Failed to attribute referral", e);
        }
      }
    };
    attributeReferral();
  }, [status, session]);

  const { streak, totalPoints, syncQueue } = useAppSelector((state) => state.game);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"play" | "stats" | "social">("play");
  const [showProfile, setShowProfile] = useState(false);
  const [referralStats, setReferralStats] = useState({ count: 0, pointsEarned: 0, referrals: [] as any[] });

  // Guest Teaser State
  const [showTeaser, setShowTeaser] = useState<"stats" | "social" | null>(null);

  // Reset tab to play if guest
  useEffect(() => {
    if (status === "unauthenticated") {
      setActiveTab("play");
    }
  }, [status]);

  const [lbFilter, setLbFilter] = useState<"today" | "all">("today");

  const fetchLeaderboard = useCallback(async () => {
    try {
      const lbRes = await axios.get(`/api/scores?type=${lbFilter}`);
      setLeaderboard(lbRes.data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  }, [lbFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const fetchReferralStats = useCallback(async () => {
    if (status === "authenticated") {
      try {
        const res = await axios.get("/api/user/referral");
        setReferralStats(res.data);
      } catch (e) {
        console.error("Failed to fetch referral stats", e);
      }
    }
  }, [status]);

  // Listen for refresh events from other components
  useEffect(() => {
    const handleRefresh = () => {
      fetchLeaderboard();
      fetchReferralStats();
    };
    window.addEventListener("refresh-dashboard", handleRefresh);
    return () => window.removeEventListener("refresh-dashboard", handleRefresh);
  }, [fetchLeaderboard, fetchReferralStats]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const getBadges = (points: number, streak: number) => {
    const badges = [];
    if (points >= 100) badges.push({ name: "Novice", icon: "🌱", desc: "Earned 100 points" });
    if (points >= 500) badges.push({ name: "Logic Pro", icon: "🧠", desc: "Earned 500 points" });
    if (points >= 1000) badges.push({ name: "Grandmaster", icon: "👑", desc: "Earned 1000 points" });
    if (streak >= 3) badges.push({ name: "On Fire", icon: "🔥", desc: "3 day streak" });
    if (streak >= 7) badges.push({ name: "Unstoppable", icon: "⚡", desc: "7 day streak" });
    return badges;
  };

  const badges = getBadges(totalPoints, streak);

  // Batch sync logic - sync when queue reaches 5 items or when user signs in
  useEffect(() => {
    const syncBatch = async () => {
      if (status === "authenticated" && syncQueue.length >= 5) {
        try {
          await axios.post("/api/scores/batch", { updates: syncQueue });
          dispatch(clearSyncQueue());
          fetchLeaderboard(); // Refresh leaderboard after sync
        } catch (e) {
          console.error("Batch sync failed", e);
        }
      }
    };
    syncBatch();
  }, [syncQueue, status, dispatch, fetchLeaderboard]);

  const handleManualSync = async () => {
    if (status !== "authenticated" || syncQueue.length === 0) return;
    try {
      await axios.post("/api/scores/batch", { updates: syncQueue });
      dispatch(clearSyncQueue());
      fetchLeaderboard();
      alert("Progress synced to leaderboard!");
    } catch (e) {
      console.error("Manual sync failed", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      const progress = await getAllProgress();
      const solvedMap: Record<string, boolean> = {};
      const hintsMap: Record<string, number> = {};
      
      progress.forEach((p) => {
        solvedMap[p.id] = p.solved;
        hintsMap[p.id] = p.hintsUsed || 0;
      });

      const today = challengeDate || new Date().toISOString().split("T")[0];
      const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split("T")[0];
      
      let currentStreak = 0;
      if (solvedMap[today]) {
        // If solved today, calculate streak from today backwards
        let checkDate = today;
        while (solvedMap[checkDate]) {
          currentStreak++;
          checkDate = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split("T")[0];
        }
      } else if (solvedMap[yesterday]) {
        // If not solved today but solved yesterday, streak is still active
        let checkDate = yesterday;
        while (solvedMap[checkDate]) {
          currentStreak++;
          checkDate = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split("T")[0];
        }
      }

      // Merge server-side stats if authenticated
      const finalStreak = (status === "authenticated" && session?.user?.streakCount) 
        ? Math.max(currentStreak, session.user.streakCount) 
        : currentStreak;
        
      const localPoints = progress.reduce((acc, p) => acc + p.score, 0);
      const finalPoints = (status === "authenticated" && session?.user?.totalPoints)
        ? Math.max(localPoints, session.user.totalPoints)
        : localPoints;

      dispatch(loadState({
        streak: finalStreak,
        totalPoints: finalPoints,
        lastPlayed: progress.length > 0 ? progress[progress.length - 1].id : null,
        solvedPuzzles: solvedMap,
        hintsUsed: hintsMap,
      }));

      const puzzle = getDailyPuzzle(today);
      setCurrentPuzzle(puzzle);
      
      fetchLeaderboard();
      setLoading(false);
    };

    init();
  }, [dispatch, status, session, fetchLeaderboard]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-background">
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center"
      >
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-8">
      {/* Top Header - Sticky on Mobile */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-light-blue px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <span className="text-white font-black text-xl">L</span>
            </motion.div>
            <h1 className="text-xl font-black text-deep tracking-tighter">LOOPER</h1>
            
            {/* Desktop Navigation */}
            {session && (
              <nav className="hidden md:flex items-center gap-1 ml-8">
                <button 
                  onClick={() => setActiveTab("play")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "play" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-foreground/40 hover:text-deep hover:bg-light-blue/20"}`}
                >
                  Play
                </button>
                <button 
                  onClick={() => setActiveTab("stats")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "stats" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-foreground/40 hover:text-deep hover:bg-light-blue/20"}`}
                >
                  Stats
                </button>
                <button 
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "social" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-foreground/40 hover:text-deep hover:bg-light-blue/20"}`}
                >
                  Social
                </button>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-light-blue shadow-sm">
              <Flame className="text-accent fill-accent" size={16} />
              <span className="font-black text-sm">{streak}</span>
            </div>
            {status === "loading" ? (
              <div className="w-9 h-9 rounded-xl bg-light-blue animate-pulse" />
            ) : session ? (
              <button 
                onClick={() => setShowProfile(true)} 
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/10 transition-transform active:scale-90"
              >
                <img src={session.user?.image || ""} alt="User" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button 
                onClick={() => setShowProfile(true)}
                className="p-2 bg-deep text-white rounded-xl transition-transform active:scale-90"
              >
                <User size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-deep/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-light-blue overflow-hidden"
            >
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary/10 p-1 mb-4 relative">
                  {session ? (
                    <img src={session.user?.image || ""} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-light-blue/20 rounded-full flex items-center justify-center text-deep/20">
                      <User size={40} />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full border-4 border-white flex items-center justify-center">
                    <Award size={14} className="text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-deep leading-tight">
                  {session ? session.user?.name : "Guest Explorer"}
                </h3>
                <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mb-8">
                  {session ? "Premium Member" : "Local Play Only"}
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="bg-background p-4 rounded-2xl border border-light-blue/50">
                    <div className="text-xl font-black text-primary">{streak}</div>
                    <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Current Streak</div>
                  </div>
                  <div className="bg-background p-4 rounded-2xl border border-light-blue/50">
                    <div className="text-xl font-black text-primary">{totalPoints}</div>
                    <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Total Points</div>
                  </div>
                </div>

                <div className="w-full space-y-3">
                  {session ? (
                    <>
                      <button
                        onClick={() => {
                          const url = window.location.origin;
                          const referId = session?.user?.referralCode || session?.user?.id || "guest";
                          const today = new Date().toISOString().split("T")[0];
                          const inviteLink = `${url}?ref=${referId}&date=${today}`;
                          navigator.clipboard.writeText(`Hey! Beat my time on today's Logic Looper challenge: ${inviteLink}`);
                          alert("Referral link copied to clipboard!");
                        }}
                        className="w-full py-4 bg-secondary/10 text-secondary rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-2 hover:bg-secondary/20 transition-all"
                      >
                        <Users size={18} />
                        Refer Friends
                      </button>
                      <button
                        onClick={() => { signOut(); setShowProfile(false); }}
                        className="w-full py-4 bg-accent/10 text-accent rounded-2xl font-black uppercase tracking-tight hover:bg-accent/20 transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={status === "loading"}
                      onClick={async () => { 
                        try {
                          console.log("Attempting sign in with google...");
                          // NextAuth's default behavior is to redirect, but we'll try to catch immediate errors
                          await signIn("google", { 
                            callbackUrl: window.location.origin,
                            redirect: true 
                          });
                        } catch (error) {
                          console.error("Sign in error:", error);
                          alert("Failed to start sign in. Check console for details.");
                        }
                        setShowProfile(false); 
                      }}
                      className={`w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all ${status === "loading" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {status === "loading" ? "Checking Session..." : "Sign In with Google"}
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowProfile(false)}
                  className="mt-4 text-xs font-bold text-foreground/30 hover:text-deep transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          {activeTab === "play" && (
            <motion.div
              key="play"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-deep leading-none">
                  {session ? `Hey, ${session.user?.name?.split(" ")[0]}!` : "Welcome!"}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-foreground/40 font-bold uppercase text-[10px] tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  {session && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-light-blue" />
                      <span className="text-primary font-black uppercase text-[10px] tracking-widest">
                        Rank: {badges.length > 0 ? badges[badges.length - 1].name : "Novice"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {currentPuzzle && <PuzzleBoard puzzle={currentPuzzle} />}
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pt-4"
            >
              <section className="bg-white p-6 rounded-3xl border border-light-blue shadow-xl shadow-primary/5">
                <h3 className="text-lg font-black text-deep mb-4 uppercase tracking-tight flex items-center gap-2">
                  <Flame className="text-accent" size={20} />
                  Activity Loop
                </h3>
                <StreakHeatmap />
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-light-blue shadow-sm">
                  <Trophy className="text-secondary mb-2" size={24} />
                  <div className="text-2xl font-black text-deep leading-none">{totalPoints}</div>
                  <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Total Points</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-light-blue shadow-sm">
                  <Award className="text-primary mb-2" size={24} />
                  <div className="text-2xl font-black text-deep leading-none">
                    {badges.length > 0 ? badges[badges.length - 1].name : "Novice"}
                  </div>
                  <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Current Rank</div>
                </div>
              </div>

              {/* Badges Section */}
              <section className="bg-white p-6 rounded-3xl border border-light-blue shadow-sm">
                <h3 className="text-sm font-black text-deep mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Award size={16} className="text-primary" />
                  Your Badges
                </h3>
                <div className="flex flex-wrap gap-4">
                  {badges.length > 0 ? (
                    badges.map((badge, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 group relative">
                        <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-light-blue/50 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          {badge.icon}
                        </div>
                        <span className="text-[10px] font-bold text-deep/60">{badge.name}</span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {badge.desc}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-foreground/30 font-bold italic">Solve puzzles to earn badges!</div>
                  )}
                </div>
              </section>

              <button 
                onClick={() => {
                  const url = window.location.origin;
                  const text = `I'm on a ${streak} day streak on Logic Looper! 🧠🔥 Can you keep up? ${url}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Logic Looper Streak', text, url });
                  } else {
                    navigator.clipboard.writeText(text);
                    alert("Streak share link copied!");
                  }
                }}
                className="w-full py-4 bg-deep text-white rounded-2xl font-black uppercase tracking-tight shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Flame size={18} />
                Share My Streak
              </button>
            </motion.div>
          )}

          {activeTab === "social" && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pt-4"
            >
              {/* Referral Card */}
              <section className="bg-gradient-to-br from-primary to-secondary p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Users size={120} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2 leading-tight">Spread the Logic</h3>
                  <p className="text-white/80 text-sm font-bold mb-6 max-w-[200px]">
                    Invite friends and earn bonus points for every new player!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                      <div className="text-xl font-black">{referralStats.count}</div>
                      <div className="text-[10px] font-bold uppercase opacity-60">Friends Joined</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                      <div className="text-xl font-black">+{referralStats.pointsEarned}</div>
                      <div className="text-[10px] font-bold uppercase opacity-60">Points Earned</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const url = window.location.origin;
                      const referId = session?.user?.referralCode || session?.user?.id || "guest";
                      const today = new Date().toISOString().split("T")[0];
                      const inviteLink = `${url}?ref=${referId}&date=${today}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: 'Logic Looper Challenge',
                          text: `I'm on a ${streak} day streak! Can you beat my score on today's puzzle?`,
                          url: inviteLink,
                        }).catch(() => {
                          navigator.clipboard.writeText(`Hey! Beat my time on today's Logic Looper challenge: ${inviteLink}`);
                          alert("Link copied to clipboard!");
                        });
                      } else {
                        navigator.clipboard.writeText(`Hey! Beat my time on today's Logic Looper challenge: ${inviteLink}`);
                        alert("Unique challenge link copied to clipboard!");
                      }
                    }}
                    className="w-full py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-tight shadow-lg transition-transform active:scale-95"
                  >
                    Share Invite Link
                  </button>
                </div>
              </section>

              {/* Referrals List */}
              {referralStats.referrals.length > 0 && (
                <section className="bg-white p-6 rounded-[2rem] border border-light-blue shadow-sm">
                  <h3 className="text-xs font-black text-deep mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    Friends Recruited
                  </h3>
                  <div className="flex -space-x-3 overflow-hidden">
                    {referralStats.referrals.map((friend: any) => (
                      <div key={friend.id} className="relative group">
                        <img 
                          src={friend.image} 
                          alt={friend.name} 
                          className="inline-block h-10 w-10 rounded-full ring-4 ring-white object-cover"
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-deep text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {friend.name} • {friend.streakCount}d
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Leaderboard Section */}
              <section className="bg-white rounded-[2rem] border border-light-blue shadow-xl shadow-primary/5 overflow-hidden">
                <div className="p-6 border-b border-light-blue flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-deep uppercase tracking-tight flex items-center gap-2">
                      <Trophy size={20} className="text-secondary" />
                      Global Ranking
                    </h3>
                    {syncQueue.length > 0 && status === "authenticated" && (
                      <button 
                        onClick={handleManualSync}
                        className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors border border-primary/20"
                      >
                        Sync ({syncQueue.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="flex bg-background p-1 rounded-xl border border-light-blue">
                    <button 
                      onClick={() => setLbFilter("today")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${lbFilter === "today" ? 'bg-white text-primary shadow-sm' : 'text-foreground/40'}`}
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => setLbFilter("all")}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${lbFilter === "all" ? 'bg-white text-primary shadow-sm' : 'text-foreground/40'}`}
                    >
                      All Time
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-light-blue">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 transition-colors ${entry.user.email === session?.user?.email ? 'bg-primary/5' : 'hover:bg-light-blue/10'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-8 text-center font-black ${i === 0 ? 'text-yellow-500 text-2xl' : i === 1 ? 'text-slate-400 text-xl' : i === 2 ? 'text-amber-600 text-lg' : 'text-foreground/20'}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                          </span>
                          <div className="relative">
                            <img src={entry.user.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                            {i < 3 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Award size={10} className={i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-600"} />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-deep">{entry.user.name}</span>
                            <div className="flex items-center gap-1">
                              <Flame size={10} className="text-accent fill-accent" />
                              <span className="text-[10px] font-bold text-foreground/40">{entry.user.streakCount || 0}d streak</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-primary text-sm">
                            {lbFilter === "today" ? entry.score : entry.user.totalPoints}
                          </div>
                          <div className="text-[10px] text-foreground/40 font-bold uppercase">
                            {lbFilter === "today" ? `${entry.timeTaken}s` : 'Total Pts'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="text-foreground/30 font-bold italic text-sm mb-4">
                        Be the first to solve today's challenge!
                      </div>
                      {!session && (
                        <button 
                          onClick={() => setShowProfile(true)}
                          className="text-xs font-black uppercase text-primary border-2 border-primary/20 px-6 py-2 rounded-xl hover:bg-primary/5 transition-colors"
                        >
                          Sign in to Join
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-light-blue flex justify-around items-center p-2 pb-6 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab("play")}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === "play" ? "text-primary scale-110" : "text-foreground/40"}`}
        >
          <LayoutDashboard size={24} fill={activeTab === "play" ? "currentColor" : "none"} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Play</span>
        </button>
        <button 
          onClick={() => {
            if (status === "unauthenticated") setShowTeaser("stats");
            else setActiveTab("stats");
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === "stats" ? "text-primary scale-110" : "text-foreground/40"}`}
        >
          <div className="relative">
            <Settings size={24} fill={activeTab === "stats" ? "currentColor" : "none"} />
            {status === "unauthenticated" && <Lock size={10} className="absolute -top-1 -right-1 text-foreground/40" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Stats</span>
        </button>
        <button 
          onClick={() => {
            if (status === "unauthenticated") setShowTeaser("social");
            else setActiveTab("social");
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === "social" ? "text-primary scale-110" : "text-foreground/40"}`}
        >
          <div className="relative">
            <Users size={24} fill={activeTab === "social" ? "currentColor" : "none"} />
            {status === "unauthenticated" && <Lock size={10} className="absolute -top-1 -right-1 text-foreground/40" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Social</span>
        </button>
      </nav>

      {/* Guest Teaser Modal */}
      <AnimatePresence>
        {showTeaser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-deep/60 backdrop-blur-sm"
            onClick={() => setShowTeaser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-black text-deep mb-2">Locked Feature</h3>
              <p className="text-foreground/60 text-sm mb-8">
                {showTeaser === "stats" 
                  ? "Sign in to track your streaks, view your heatmap, and unlock performance analytics!" 
                  : "Sign in to compete on the global leaderboard and invite friends to earn bonus points!"}
              </p>
              <button
                onClick={() => { setShowTeaser(null); setShowProfile(true); }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 mb-4"
              >
                Sign In to Unlock
              </button>
              <button
                onClick={() => setShowTeaser(null)}
                className="w-full py-2 text-foreground/40 font-bold uppercase text-[10px] tracking-widest"
              >
                Maybe Later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
