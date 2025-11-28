'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lightbulb, Music, Target, Flame, Sparkles, RefreshCw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Piece {
  id: string;
  title: string;
  composer: string;
  status: string;
  totalPages: number;
  learnedPages: number;
  difficulty?: string | null;
  updatedAt?: string;
  parentId?: string | null;
  children?: Piece[];
}

interface DailyPracticeProps {
  pieces: Piece[];
}

interface AiSuggestion {
  suggestion: string | null;
  focusPiece: { id: string; title: string; composer: string } | null;
  reviewPieces: { id: string; title: string; composer: string }[];
  error?: string;
  cached?: boolean;
}

// 获取今天是星期几
function getDayOfWeek(): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[new Date().getDay()];
}

// 获取今天的日期
function getDateString(): string {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日`;
}

// 基于日期生成一个固定的随机数种子
function getDailySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// 使用种子生成伪随机数
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// 练习建议语录（AI 不可用时的备选）
const PRACTICE_TIPS = [
  '慢练是最快的捷径',
  '注意手腕放松，让手指自然下落',
  '今天试着分手练习，确保每个声部都清晰',
  '专注于音乐表达，而不只是音符',
  '记得热身，从音阶和琶音开始',
  '遇到困难的段落，分小节慢慢攻克',
  '试着闭眼弹奏熟悉的段落，感受音乐',
  '注意踏板的使用，不要过度依赖',
  '今天可以录下自己的演奏，回听找问题',
  '保持节拍稳定，可以用节拍器辅助',
  '注意力度变化，让音乐有呼吸感',
  '练习前先读谱，在脑海中预演',
];

// localStorage key
const AI_CACHE_KEY = '88keys_ai_suggestion';
const AI_DATE_KEY = '88keys_ai_date';

export default function DailyPractice({ pieces }: DailyPracticeProps) {
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAiSupport, setHasAiSupport] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // 本地备选内容
  const fallback = useMemo(() => {
    const random = seededRandom(getDailySeed());

    const activePieces: Piece[] = [];
    const inProgressPieces: Piece[] = [];

    pieces.forEach((piece) => {
      if (piece.parentId) return;

      if (piece.children && piece.children.length > 0) {
        piece.children.forEach((child) => {
          if (child.status === 'Active') {
            activePieces.push(child);
          }
          if (child.totalPages > 0 && child.learnedPages > 0 && child.learnedPages < child.totalPages) {
            inProgressPieces.push(child);
          }
        });
      } else {
        if (piece.status === 'Active') {
          activePieces.push(piece);
        }
        if (piece.totalPages > 0 && piece.learnedPages > 0 && piece.learnedPages < piece.totalPages) {
          inProgressPieces.push(piece);
        }
      }
    });

    let focusPiece: Piece | null = null;
    if (activePieces.length > 0) {
      const index = Math.floor(random() * activePieces.length);
      focusPiece = activePieces[index];
    }

    const reviewPieces: Piece[] = [];
    const candidates = inProgressPieces.filter((p) => p.id !== focusPiece?.id);
    const reviewCount = Math.min(3, candidates.length);
    for (let i = 0; i < reviewCount; i++) {
      const index = Math.floor(random() * candidates.length);
      reviewPieces.push(candidates.splice(index, 1)[0]);
    }

    const tipIndex = Math.floor(random() * PRACTICE_TIPS.length);
    const tip = PRACTICE_TIPS[tipIndex];

    return { focusPiece, reviewPieces, tip };
  }, [pieces]);

  // 检查并加载 AI 建议
  useEffect(() => {
    const cachedDate = localStorage.getItem(AI_DATE_KEY);
    const cachedSuggestion = localStorage.getItem(AI_CACHE_KEY);

    // 如果是今天的缓存，直接使用
    if (cachedDate === today && cachedSuggestion) {
      try {
        const parsed = JSON.parse(cachedSuggestion);
        setAiSuggestion(parsed);
        setHasAiSupport(!!parsed.suggestion);
        return;
      } catch {
        // 解析失败，重新获取
      }
    }

    // 第一次访问或新的一天，获取 AI 建议
    fetchAiSuggestion();
  }, [today]);

  const fetchAiSuggestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-suggestion');
      const data: AiSuggestion = await res.json();

      setAiSuggestion(data);
      setHasAiSupport(!!data.suggestion);

      // 缓存到 localStorage
      localStorage.setItem(AI_DATE_KEY, today);
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch AI suggestion:', error);
      setHasAiSupport(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // 清除缓存并重新获取
    localStorage.removeItem(AI_DATE_KEY);
    localStorage.removeItem(AI_CACHE_KEY);
    fetchAiSuggestion();
  };

  const dayOfWeek = getDayOfWeek();
  const dateString = getDateString();

  // 使用 AI 建议或备选
  const displayFocusPiece = aiSuggestion?.focusPiece || (fallback.focusPiece ? {
    id: fallback.focusPiece.id,
    title: fallback.focusPiece.title,
    composer: fallback.focusPiece.composer
  } : null);

  const displayReviewPieces = aiSuggestion?.reviewPieces?.length
    ? aiSuggestion.reviewPieces
    : fallback.reviewPieces.map(p => ({ id: p.id, title: p.title, composer: p.composer }));

  // 获取完整的曲目信息用于显示进度
  const focusPieceData = pieces.find(p => p.id === displayFocusPiece?.id) ||
    pieces.flatMap(p => p.children || []).find(c => c.id === displayFocusPiece?.id);

  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-100 flex items-center gap-1.5">
              今日练习建议
              {hasAiSupport && <Bot className="h-4 w-4 text-violet-400" />}
            </h3>
            <p className="text-xs text-zinc-500">{dateString} 星期{dayOfWeek}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
            title="刷新 AI 建议"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
        </div>
      </div>

      {/* AI 建议内容 */}
      {hasAiSupport && aiSuggestion?.suggestion ? (
        <div className="mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs text-violet-400">AI 建议</span>
          </div>
          <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
            {aiSuggestion.suggestion.split('\n').filter(Boolean).map((line, i) => {
              // 去除 markdown 符号
              let text = line
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/^#+\s*/, '')
                .trim();

              // 处理标题行（如 "今日重点：xxx"）
              if (text.includes('：') && text.indexOf('：') < 15) {
                const [title, ...rest] = text.split('：');
                return (
                  <div key={i}>
                    <span className="text-violet-300 font-medium">{title}：</span>
                    <span>{rest.join('：')}</span>
                  </div>
                );
              }
              // 处理编号列表（如 "①xxx"）
              if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) {
                return (
                  <div key={i} className="pl-2 text-zinc-400">
                    {text}
                  </div>
                );
              }
              return <p key={i}>{text}</p>;
            })}
          </div>
        </div>
      ) : (
        /* 备选每日一句 */
        <div className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-sm text-zinc-300 italic">"{fallback.tip}"</p>
        </div>
      )}

      {/* 今日重点 */}
      {displayFocusPiece && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-zinc-400">今日重点</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="font-medium text-amber-200">{displayFocusPiece.title}</p>
            <p className="text-xs text-amber-400/70 mt-0.5">{displayFocusPiece.composer}</p>
            {focusPieceData && focusPieceData.totalPages > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-amber-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (focusPieceData.learnedPages / focusPieceData.totalPages) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-amber-400">
                  {focusPieceData.learnedPages}/{focusPieceData.totalPages}页
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 复习曲目 */}
      {displayReviewPieces.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Music className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">复习曲目</span>
          </div>
          <div className="space-y-1.5">
            {displayReviewPieces.map((piece) => {
              const pieceData = pieces.find(p => p.id === piece.id) ||
                pieces.flatMap(p => p.children || []).find(c => c.id === piece.id);
              return (
                <div key={piece.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-300 truncate">{piece.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{piece.composer}</p>
                  </div>
                  {pieceData && pieceData.totalPages > 0 && (
                    <span className="text-xs text-zinc-500 ml-2">
                      {Math.round((pieceData.learnedPages / pieceData.totalPages) * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-2">
          <p className="text-xs text-zinc-500">正在获取 AI 建议...</p>
        </div>
      )}

      {/* 没有活跃曲目时的提示 */}
      {!displayFocusPiece && displayReviewPieces.length === 0 && !loading && (
        <div className="text-center py-4 text-zinc-500">
          <p className="text-sm">还没有正在学习的曲目</p>
          <p className="text-xs mt-1">添加一些曲目开始你的练习之旅吧</p>
        </div>
      )}
    </div>
  );
}
