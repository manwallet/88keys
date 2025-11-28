'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Loader2,
  X,
  Check,
  AlertCircle,
  ListPlus,
  Trash2,
} from 'lucide-react';

interface ParsedPiece {
  title: string;
  composer: string;
  workNumber: string;
  genre: string;
  difficulty: string;
  assignedBy: string;
  status: 'pending' | 'loading' | 'ready' | 'error' | 'added';
  error?: string;
}

interface BatchAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchAddDialog({ isOpen, onClose }: BatchAddDialogProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [assignedBy, setAssignedBy] = useState('');
  const [pieces, setPieces] = useState<ParsedPiece[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!input.trim()) return;

    // 按行分割，过滤空行
    const lines = input
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    // 初始化曲目列表
    const initialPieces: ParsedPiece[] = lines.map((line) => ({
      title: line,
      composer: '',
      workNumber: '',
      genre: '',
      difficulty: '',
      assignedBy: assignedBy,
      status: 'pending',
    }));

    setPieces(initialPieces);
    setIsProcessing(true);

    // 逐个调用 AI 填充
    for (let i = 0; i < initialPieces.length; i++) {
      setPieces((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'loading' } : p))
      );

      try {
        const response = await fetch('/api/ai/fill-piece', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: initialPieces[i].title }),
        });

        if (response.ok) {
          const data = await response.json();
          setPieces((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    title: data.title || p.title,
                    composer: data.composer || '',
                    workNumber: data.workNumber || '',
                    genre: data.genre || '',
                    difficulty: data.difficulty || '',
                    status: 'ready',
                  }
                : p
            )
          );
        } else {
          const err = await response.json();
          setPieces((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', error: err.error || 'AI 识别失败' }
                : p
            )
          );
        }
      } catch {
        setPieces((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'error', error: '请求失败' } : p
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleRemove = (index: number) => {
    setPieces((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddAll = async () => {
    const readyPieces = pieces.filter((p) => p.status === 'ready');
    if (readyPieces.length === 0) return;

    setIsAdding(true);

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (piece.status !== 'ready') continue;

      try {
        const response = await fetch('/api/pieces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: piece.title,
            composer: piece.composer,
            workNumber: piece.workNumber,
            genre: piece.genre,
            difficulty: piece.difficulty,
            assignedBy: piece.assignedBy || assignedBy,
            status: 'NotStarted',
          }),
        });

        if (response.ok) {
          setPieces((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'added' } : p))
          );
        } else {
          setPieces((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: 'error', error: '添加失败' } : p
            )
          );
        }
      } catch {
        setPieces((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'error', error: '添加失败' } : p
          )
        );
      }
    }

    setIsAdding(false);
    router.refresh();
  };

  const handleClose = () => {
    setInput('');
    setPieces([]);
    setAssignedBy('');
    onClose();
  };

  const readyCount = pieces.filter((p) => p.status === 'ready').length;
  const addedCount = pieces.filter((p) => p.status === 'added').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            批量添加曲目
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {pieces.length === 0 ? (
            <>
              <div className="space-y-2">
                <Label>输入曲目列表（每行一首）</Label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`月光奏鸣曲
悲怆奏鸣曲
幻想即兴曲
土耳其进行曲
...`}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>布置人（可选，将应用到所有曲目）</Label>
                <Input
                  value={assignedBy}
                  onChange={(e) => setAssignedBy(e.target.value)}
                  placeholder="例如：王老师"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  共 {pieces.length} 首曲目，{readyCount} 首已识别
                  {addedCount > 0 && `，${addedCount} 首已添加`}
                </span>
                {isProcessing && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI 识别中...
                  </span>
                )}
              </div>

              <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
                {pieces.map((piece, idx) => (
                  <div
                    key={idx}
                    className={`p-3 flex items-start gap-3 ${
                      piece.status === 'added' ? 'bg-green-500/10' : ''
                    }`}
                  >
                    {/* 状态图标 */}
                    <div className="pt-0.5">
                      {piece.status === 'loading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {piece.status === 'pending' && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted" />
                      )}
                      {piece.status === 'ready' && (
                        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {piece.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {piece.status === 'added' && (
                        <div className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* 曲目信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{piece.title}</div>
                      {piece.status === 'ready' && (
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <div>{piece.composer || '未知作曲家'}</div>
                          <div className="flex gap-2 flex-wrap">
                            {piece.workNumber && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                {piece.workNumber}
                              </span>
                            )}
                            {piece.genre && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                {piece.genre}
                              </span>
                            )}
                            {piece.difficulty && (
                              <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                {piece.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {piece.status === 'error' && (
                        <div className="text-sm text-red-500 mt-1">
                          {piece.error}
                        </div>
                      )}
                      {piece.status === 'added' && (
                        <div className="text-sm text-green-400 mt-1">
                          已添加到曲库
                        </div>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    {piece.status !== 'added' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          {pieces.length === 0 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleParse}
                disabled={!input.trim() || isProcessing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI 识别
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPieces([]);
                }}
                disabled={isProcessing || isAdding}
              >
                重新输入
              </Button>
              <Button
                onClick={handleAddAll}
                disabled={readyCount === 0 || isProcessing || isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    添加 {readyCount} 首曲目
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
