'use client';

import { useMemo } from 'react';
import { BarChart3, Clock, BookMarked, Star, TrendingUp } from 'lucide-react';

interface Piece {
  id: string;
  title: string;
  composer: string;
  status: string;
  totalPages: number;
  learnedPages: number;
  difficulty?: string | null;
  genre?: string | null;
  parentId?: string | null;
  children?: Piece[];
}

interface QuickStatsProps {
  pieces: Piece[];
}

export default function QuickStats({ pieces }: QuickStatsProps) {
  const stats = useMemo(() => {
    // 只统计顶层曲目
    const topLevel = pieces.filter((p) => !p.parentId);

    // 作曲家统计
    const composerCount: Record<string, number> = {};
    topLevel.forEach((piece) => {
      const composer = piece.composer || '未知';
      composerCount[composer] = (composerCount[composer] || 0) + 1;
    });
    const topComposers = Object.entries(composerCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 时期统计
    const genreCount: Record<string, number> = {};
    topLevel.forEach((piece) => {
      if (piece.genre) {
        genreCount[piece.genre] = (genreCount[piece.genre] || 0) + 1;
      }
    });
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 难度分布
    const difficultyCount: Record<string, number> = {};
    topLevel.forEach((piece) => {
      if (piece.difficulty) {
        difficultyCount[piece.difficulty] = (difficultyCount[piece.difficulty] || 0) + 1;
      }
    });

    // 总页数统计
    let totalPages = 0;
    let learnedPages = 0;
    topLevel.forEach((piece) => {
      if (piece.children && piece.children.length > 0) {
        const parentTotal = piece.totalPages;
        const childrenTotal = piece.children.reduce((sum, c) => sum + c.totalPages, 0);
        const childrenLearned = piece.children.reduce((sum, c) => sum + c.learnedPages, 0);
        totalPages += parentTotal > 0 ? parentTotal : childrenTotal;
        learnedPages += childrenLearned;
      } else {
        totalPages += piece.totalPages;
        learnedPages += piece.learnedPages;
      }
    });

    // 状态统计（包括子曲目）
    const statusCount = {
      Active: 0,
      NotStarted: 0,
      OnHold: 0,
      Completed: 0,
    };
    topLevel.forEach((piece) => {
      if (piece.children && piece.children.length > 0) {
        // 如果有子曲目，统计子曲目的状态
        piece.children.forEach((child) => {
          const status = child.status as keyof typeof statusCount;
          if (statusCount[status] !== undefined) {
            statusCount[status]++;
          }
        });
      } else {
        // 没有子曲目，统计自身状态
        const status = piece.status as keyof typeof statusCount;
        if (statusCount[status] !== undefined) {
          statusCount[status]++;
        }
      }
    });

    return {
      topComposers,
      topGenres,
      difficultyCount,
      totalPages,
      learnedPages,
      statusCount,
      totalPieces: topLevel.length,
    };
  }, [pieces]);

  const overallProgress = stats.totalPages > 0
    ? Math.round((stats.learnedPages / stats.totalPages) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* 总体进度 */}
      <div className="rounded-xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="font-medium text-zinc-100">学习进度</h3>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-zinc-400">总进度</span>
            <span className={overallProgress >= 50 ? 'text-emerald-400' : 'text-amber-400'}>
              {stats.learnedPages}/{stats.totalPages} 页
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${overallProgress >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
          <p className="text-right text-xs text-zinc-500 mt-1">{overallProgress}%</p>
        </div>

        {/* 状态分布 */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-lg font-bold text-amber-400">{stats.statusCount.Active}</p>
            <p className="text-xs text-zinc-500">学习中</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-lg font-bold text-zinc-400">{stats.statusCount.NotStarted}</p>
            <p className="text-xs text-zinc-500">待学习</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-lg font-bold text-slate-400">{stats.statusCount.OnHold}</p>
            <p className="text-xs text-zinc-500">已暂停</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03]">
            <p className="text-lg font-bold text-emerald-400">{stats.statusCount.Completed}</p>
            <p className="text-xs text-zinc-500">已掌握</p>
          </div>
        </div>
      </div>

      {/* 作曲家排行 */}
      {stats.topComposers.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-medium text-zinc-300">作曲家分布</h3>
          </div>
          <div className="space-y-2">
            {stats.topComposers.map(([composer, count], i) => (
              <div key={composer} className="flex items-center gap-2">
                <span className="w-5 text-xs text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-sm text-zinc-300 truncate">{composer}</span>
                <span className="text-xs text-zinc-500">{count}首</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时期分布 */}
      {stats.topGenres.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-zinc-300">时期分布</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topGenres.map(([genre, count]) => (
              <span
                key={genre}
                className="px-2.5 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20"
              >
                {genre} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 难度分布 */}
      {Object.keys(stats.difficultyCount).length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-medium text-zinc-300">难度分布</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.difficultyCount).map(([difficulty, count]) => (
              <span
                key={difficulty}
                className="px-2.5 py-1 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20"
              >
                {difficulty} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
