'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Trash2, Music, ChevronDown, ChevronRight, Sparkles,
  SortAsc, SortDesc, Edit2, Search, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import PieceEditPanel from './PieceEditPanel';

interface Piece {
  id: string;
  title: string;
  composer: string;
  workNumber?: string | null;
  status: string;
  difficulty?: string | null;
  genre?: string | null;
  totalPages: number;
  learnedPages: number;
  assignedBy?: string | null;
  parentId?: string | null;
  children?: Piece[];
  updatedAt?: string;
  createdAt?: string;
  _count?: {
    sessions: number;
    children?: number;
  };
}

interface PieceListProps {
  pieces: Piece[];
}

type SortKey = 'title' | 'composer' | 'progress' | 'status' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const STATUS_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  Active: { label: '进行中', color: 'text-amber-400 bg-amber-400/10', order: 0 },
  NotStarted: { label: '待学习', color: 'text-zinc-400 bg-zinc-400/10', order: 1 },
  OnHold: { label: '已暂停', color: 'text-slate-400 bg-slate-400/10', order: 2 },
  Completed: { label: '已掌握', color: 'text-emerald-400 bg-emerald-400/10', order: 3 },
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'status', label: '状态' },
  { key: 'title', label: '曲名' },
  { key: 'composer', label: '作曲家' },
  { key: 'progress', label: '进度' },
  { key: 'updatedAt', label: '更新时间' },
];

// 庆祝粒子效果
function Confetti({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 160,
    y: -Math.random() * 120 - 40,
    rotation: Math.random() * 360,
    scale: 0.4 + Math.random() * 0.4,
    delay: Math.random() * 0.4,
    color: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-1/2 animate-confetti"
          style={{
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--r': `${p.rotation}deg`,
            '--s': p.scale,
            '--d': `${p.delay}s`,
            width: 6,
            height: 6,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '1px',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function PieceRow({
  piece,
  onDelete,
  onEdit,
  deletingId,
  expandedIds,
  onToggleExpand,
  isChild = false,
  depth = 0,
}: {
  piece: Piece;
  onDelete: (id: string, title: string) => void;
  onEdit: (id: string) => void;
  deletingId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  isChild?: boolean;
  depth?: number;
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const hasChildren = piece.children && piece.children.length > 0;
  const isExpanded = expandedIds.has(piece.id);

  let displayTotalPages = piece.totalPages;
  let displayLearnedPages = piece.learnedPages;

  if (hasChildren) {
    const childrenTotalPages = piece.children!.reduce((sum, c) => sum + c.totalPages, 0);
    const childrenLearnedPages = piece.children!.reduce((sum, c) => sum + c.learnedPages, 0);
    // 如果父曲目设置了总页数，使用父曲目的；否则使用子曲目之和
    displayTotalPages = piece.totalPages > 0 ? piece.totalPages : childrenTotalPages;
    displayLearnedPages = childrenLearnedPages;
  }

  const status = STATUS_CONFIG[piece.status] || STATUS_CONFIG.NotStarted;
  const progress = displayTotalPages > 0
    ? Math.min(100, Math.round((displayLearnedPages / displayTotalPages) * 100))
    : 0;
  // 只有当状态为 Completed 或者已学页数 >= 总页数时才算完成
  const isCompleted = piece.status === 'Completed' || (displayTotalPages > 0 && displayLearnedPages >= displayTotalPages);

  const handleCelebrate = useCallback(() => {
    if (isCompleted) setShowConfetti(true);
  }, [isCompleted]);

  return (
    <>
      <div
        className={`
          group relative flex items-center gap-3 px-4 py-3 transition-all duration-200 border-b border-white/[0.03]
          ${isCompleted ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}
        `}
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

        {/* 展开按钮 */}
        <div className="w-5 shrink-0">
          {hasChildren && (
            <button
              onClick={() => onToggleExpand(piece.id)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              )}
            </button>
          )}
        </div>

        {/* 进度 */}
        <div
          className={`shrink-0 w-14 text-center ${isCompleted ? 'cursor-pointer' : ''}`}
          onClick={handleCelebrate}
        >
          {displayTotalPages > 0 ? (
            <span className={`text-sm font-semibold ${isCompleted ? 'text-emerald-400' : progress > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
              {progress}%
            </span>
          ) : (
            <span className="text-sm text-zinc-700">-</span>
          )}
        </div>

        {/* 标题 */}
        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${isCompleted ? 'text-emerald-300' : 'text-zinc-100'}`}
            title={piece.title}
          >
            {isCompleted && <Sparkles className="inline h-3.5 w-3.5 mr-1.5 text-emerald-400" />}
            {piece.title}
          </span>
          {hasChildren && (
            <span className="shrink-0 text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
              {piece.children!.length}
            </span>
          )}
        </div>

        {/* 作曲家 */}
        <div className="w-40 shrink-0 hidden sm:block">
          <span className="text-sm text-zinc-400 truncate block">{piece.composer}</span>
        </div>

        {/* 作品号 */}
        <div className="w-24 shrink-0 hidden md:block">
          <span className="text-sm text-zinc-500 truncate block">{piece.workNumber || '-'}</span>
        </div>

        {/* 页数 */}
        <div className="w-20 shrink-0 text-right hidden lg:block">
          {displayTotalPages > 0 ? (
            <span className="text-sm text-zinc-500">
              {displayLearnedPages}/{displayTotalPages}
            </span>
          ) : (
            <span className="text-sm text-zinc-700">-</span>
          )}
        </div>

        {/* 时期 */}
        <div className="w-20 shrink-0 hidden xl:block">
          <span className="text-sm text-zinc-500 truncate block">{piece.genre || '-'}</span>
        </div>

        {/* 难度 */}
        <div className="w-20 shrink-0 hidden xl:block">
          <span className="text-sm text-zinc-500 truncate block">{piece.difficulty || '-'}</span>
        </div>

        {/* 布置人 */}
        <div className="w-24 shrink-0 hidden 2xl:block">
          {piece.assignedBy ? (
            <span className="px-2 py-0.5 rounded text-xs bg-violet-500/10 text-violet-400 truncate block max-w-[90px]">
              {piece.assignedBy}
            </span>
          ) : (
            <span className="text-sm text-zinc-700">-</span>
          )}
        </div>

        {/* 状态 */}
        <div className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
          {status.label}
        </div>

        {/* 操作 */}
        <div className="shrink-0 w-20 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(piece.id)}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(piece.id, piece.title)}
            disabled={deletingId === piece.id}
            className="h-8 w-8 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 子曲目 */}
      {hasChildren && isExpanded && (
        <>
          {piece.children!.map((child) => (
            <PieceRow
              key={child.id}
              piece={child}
              onDelete={onDelete}
              onEdit={onEdit}
              deletingId={deletingId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              isChild
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </>
  );
}

export default function PieceList({ pieces }: PieceListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const topLevelPieces = pieces.filter((p) => !p.parentId);

  // 搜索过滤
  const filteredPieces = topLevelPieces.filter((piece) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesPiece =
      piece.title.toLowerCase().includes(query) ||
      piece.composer.toLowerCase().includes(query) ||
      piece.workNumber?.toLowerCase().includes(query) ||
      piece.assignedBy?.toLowerCase().includes(query);
    const matchesChildren = piece.children?.some(
      (child) =>
        child.title.toLowerCase().includes(query) ||
        child.composer.toLowerCase().includes(query)
    );
    return matchesPiece || matchesChildren;
  });

  // 排序
  const sortedPieces = [...filteredPieces].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'title':
        comparison = a.title.localeCompare(b.title, 'zh-CN');
        break;
      case 'composer':
        comparison = a.composer.localeCompare(b.composer, 'zh-CN');
        break;
      case 'progress':
        const progressA = a.totalPages > 0 ? a.learnedPages / a.totalPages : 0;
        const progressB = b.totalPages > 0 ? b.learnedPages / b.totalPages : 0;
        comparison = progressA - progressB;
        break;
      case 'status':
        const orderA = STATUS_CONFIG[a.status]?.order ?? 99;
        const orderB = STATUS_CONFIG[b.status]?.order ?? 99;
        comparison = orderA - orderB;
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除「${title}」吗？`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/pieces/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    router.refresh();
  };

  if (topLevelPieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-3">
          <Music className="h-7 w-7 text-zinc-600" />
        </div>
        <p className="text-zinc-400">还没有添加曲目</p>
        <p className="text-sm text-zinc-600 mt-1">添加你的第一首曲目开始学习吧</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-white/5 overflow-hidden">
        {/* 搜索和排序栏 */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border-b border-white/5">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索曲目、作曲家..."
              className="pl-9 pr-8 h-9 bg-white/5 border-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
              >
                <X className="h-3 w-3 text-zinc-500" />
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* 排序 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">排序</span>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleSort(option.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortKey === option.key
                    ? 'bg-white/10 text-zinc-200'
                    : 'hover:bg-white/5 text-zinc-500'
                }`}
              >
                {option.label}
                {sortKey === option.key && (
                  sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 表头 */}
        <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-500 bg-white/[0.01] border-b border-white/5">
          <div className="w-5" />
          <div className="w-14 text-center">进度</div>
          <div className="flex-1 min-w-[200px]">曲目</div>
          <div className="w-40 hidden sm:block">作曲家</div>
          <div className="w-24 hidden md:block">作品号</div>
          <div className="w-20 text-right hidden lg:block">页数</div>
          <div className="w-20 hidden xl:block">时期</div>
          <div className="w-20 hidden xl:block">难度</div>
          <div className="w-24 hidden 2xl:block">布置人</div>
          <div className="w-16 text-center">状态</div>
          <div className="w-20" />
        </div>

        {/* 列表 */}
        <div>
          {sortedPieces.length === 0 && searchQuery ? (
            <div className="py-12 text-center text-zinc-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>没有找到匹配「{searchQuery}」的曲目</p>
            </div>
          ) : (
            sortedPieces.map((piece) => (
              <PieceRow
                key={piece.id}
                piece={piece}
                onDelete={handleDelete}
                onEdit={setEditingId}
                deletingId={deletingId}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
              />
            ))
          )}
        </div>
      </div>

      {/* 编辑面板 */}
      {editingId && (
        <PieceEditPanel
          pieceId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
