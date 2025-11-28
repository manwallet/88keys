'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  X,
  Loader2,
  Sparkles,
  Check,
  ChevronRight,
  Trash2,
  Plus,
  FolderTree,
} from 'lucide-react';

interface Piece {
  id: string;
  title: string;
  composer: string;
  workNumber?: string | null;
}

interface ChildSuggestion {
  title: string;
  sortOrder: number;
  difficulty?: string;
  notes?: string;
}

interface ReorganizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pieces: Piece[];
}

export default function ReorganizeDialog({
  isOpen,
  onClose,
  pieces,
}: ReorganizeDialogProps) {
  const router = useRouter();
  const [selectedPieces, setSelectedPieces] = useState<string[]>([]);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

  // 当前曲目的建议
  const [suggestion, setSuggestion] = useState<{
    shouldSplit: boolean;
    reason: string;
    parentTitle: string;
    children: ChildSuggestion[];
  } | null>(null);

  // 可编辑的子曲目列表
  const [editableChildren, setEditableChildren] = useState<ChildSuggestion[]>(
    []
  );
  const [parentTitle, setParentTitle] = useState('');

  const [results, setResults] = useState<
    { pieceId: string; title: string; success: boolean; childrenCount?: number }[]
  >([]);

  if (!isOpen) return null;

  const currentPiece =
    selectedPieces.length > 0
      ? pieces.find((p) => p.id === selectedPieces[currentPieceIndex])
      : null;

  const handleSelectPiece = (pieceId: string) => {
    setSelectedPieces((prev) =>
      prev.includes(pieceId)
        ? prev.filter((id) => id !== pieceId)
        : [...prev, pieceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPieces.length === pieces.length) {
      setSelectedPieces([]);
    } else {
      setSelectedPieces(pieces.map((p) => p.id));
    }
  };

  const handleStartReorganize = () => {
    if (selectedPieces.length === 0) return;
    setCurrentPieceIndex(0);
    setSuggestion(null);
    setResults([]);
    analyzeCurrentPiece(selectedPieces[0]);
  };

  const analyzeCurrentPiece = async (pieceId: string) => {
    setIsAnalyzing(true);
    setSuggestion(null);

    try {
      const response = await fetch('/api/ai/reorganize-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieceId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '分析失败');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
      setEditableChildren(data.suggestion.children || []);
      setParentTitle(data.suggestion.parentTitle || data.piece.title);
    } catch (error) {
      console.error('Analyze error:', error);
      setSuggestion({
        shouldSplit: false,
        reason: '分析失败，请重试',
        parentTitle: '',
        children: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySplit = async () => {
    if (!currentPiece || editableChildren.length === 0) return;

    setIsSplitting(true);

    try {
      const response = await fetch(`/api/pieces/${currentPiece.id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentTitle,
          children: editableChildren,
        }),
      });

      if (!response.ok) {
        throw new Error('拆分失败');
      }

      setResults((prev) => [
        ...prev,
        {
          pieceId: currentPiece.id,
          title: currentPiece.title,
          success: true,
          childrenCount: editableChildren.length,
        },
      ]);

      // 移动到下一个
      moveToNext();
    } catch (error) {
      setResults((prev) => [
        ...prev,
        { pieceId: currentPiece.id, title: currentPiece.title, success: false },
      ]);
    } finally {
      setIsSplitting(false);
    }
  };

  const handleSkip = () => {
    if (currentPiece) {
      setResults((prev) => [
        ...prev,
        { pieceId: currentPiece.id, title: currentPiece.title, success: true },
      ]);
    }
    moveToNext();
  };

  const moveToNext = () => {
    const nextIndex = currentPieceIndex + 1;
    if (nextIndex < selectedPieces.length) {
      setCurrentPieceIndex(nextIndex);
      setSuggestion(null);
      analyzeCurrentPiece(selectedPieces[nextIndex]);
    } else {
      // 完成所有
      router.refresh();
    }
  };

  const handleAddChild = () => {
    setEditableChildren((prev) => [
      ...prev,
      {
        title: '',
        sortOrder: prev.length + 1,
        difficulty: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveChild = (index: number) => {
    setEditableChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChildChange = (
    index: number,
    field: keyof ChildSuggestion,
    value: string | number
  ) => {
    setEditableChildren((prev) =>
      prev.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    );
  };

  const handleClose = () => {
    setSelectedPieces([]);
    setCurrentPieceIndex(0);
    setSuggestion(null);
    setResults([]);
    setEditableChildren([]);
    onClose();
  };

  const isComplete = results.length === selectedPieces.length && selectedPieces.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            整理曲目结构
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-4">
          {/* 步骤1：选择曲目 */}
          {selectedPieces.length === 0 || (!suggestion && !isAnalyzing && results.length === 0) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  选择需要整理的曲目，AI 会帮你分析是否需要拆分成子曲目
                </p>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedPieces.length === pieces.length ? '取消全选' : '全选'}
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
                {pieces.map((piece) => (
                  <label
                    key={piece.id}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPieces.includes(piece.id)}
                      onChange={() => handleSelectPiece(piece.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{piece.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {piece.composer}
                        {piece.workNumber && ` · ${piece.workNumber}`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : isComplete ? (
            /* 完成界面 */
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-medium">整理完成</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  已处理 {results.length} 首曲目
                </p>
              </div>

              <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
                {results.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3">
                    {result.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className="flex-1 truncate">{result.title}</span>
                    {result.childrenCount && (
                      <span className="text-sm text-muted-foreground">
                        拆分为 {result.childrenCount} 个子曲目
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 步骤2：处理当前曲目 */
            <div className="space-y-4">
              {/* 进度 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  正在处理 {currentPieceIndex + 1} / {selectedPieces.length}
                </span>
                <span className="font-medium">{currentPiece?.title}</span>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">AI 正在分析曲目结构...</p>
                </div>
              ) : suggestion ? (
                <div className="space-y-4">
                  {/* AI 建议 */}
                  <div className="rounded-lg bg-secondary/30 p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">
                          {suggestion.shouldSplit ? 'AI 建议拆分此曲目' : '无需拆分'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {suggestion.shouldSplit && editableChildren.length > 0 && (
                    <>
                      {/* 父曲目标题 */}
                      <div className="space-y-2">
                        <Label>父曲目名称</Label>
                        <Input
                          value={parentTitle}
                          onChange={(e) => setParentTitle(e.target.value)}
                        />
                      </div>

                      {/* 子曲目列表 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>子曲目列表</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddChild}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            添加
                          </Button>
                        </div>

                        <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
                          {editableChildren.map((child, idx) => (
                            <div key={idx} className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground w-6">
                                  {idx + 1}.
                                </span>
                                <Input
                                  value={child.title}
                                  onChange={(e) =>
                                    handleChildChange(idx, 'title', e.target.value)
                                  }
                                  placeholder="子曲目名称"
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveChild(idx)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {child.notes && (
                                <p className="text-xs text-muted-foreground ml-8">
                                  {child.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          {selectedPieces.length === 0 || (!suggestion && !isAnalyzing && results.length === 0) ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button
                onClick={handleStartReorganize}
                disabled={selectedPieces.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                开始整理 ({selectedPieces.length})
              </Button>
            </>
          ) : isComplete ? (
            <Button onClick={handleClose}>完成</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleSkip} disabled={isAnalyzing || isSplitting}>
                跳过
              </Button>
              {suggestion?.shouldSplit && editableChildren.length > 0 && (
                <Button
                  onClick={handleApplySplit}
                  disabled={isAnalyzing || isSplitting}
                >
                  {isSplitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  应用拆分
                </Button>
              )}
              {!suggestion?.shouldSplit && !isAnalyzing && (
                <Button onClick={handleSkip}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  下一个
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
