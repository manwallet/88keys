'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Loader2, BookOpen } from 'lucide-react';

interface Piece {
  id: string;
  title: string;
  composer: string;
  workNumber: string | null;
  genre: string | null;
  totalPages: number;
  learnedPages: number;
  status: string;
  difficulty: string | null;
  assignedBy: string | null;
  notes: string | null;
}

interface PieceEditPanelProps {
  pieceId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: '', label: '请选择' },
  { value: '入门', label: '入门' },
  { value: '初级', label: '初级' },
  { value: '中级', label: '中级' },
  { value: '中高级', label: '中高级' },
  { value: '高级', label: '高级' },
  { value: '专业', label: '专业' },
];

const STATUS_OPTIONS = [
  { value: 'NotStarted', label: '未开始' },
  { value: 'Active', label: '学习中' },
  { value: 'OnHold', label: '暂停' },
  { value: 'Completed', label: '已完成' },
];

const GENRE_OPTIONS = [
  { value: '', label: '请选择' },
  { value: '巴洛克', label: '巴洛克' },
  { value: '古典', label: '古典' },
  { value: '浪漫', label: '浪漫' },
  { value: '印象派', label: '印象派' },
  { value: '现代', label: '现代' },
  { value: '流行', label: '流行' },
  { value: '爵士', label: '爵士' },
  { value: '其他', label: '其他' },
];

export default function PieceEditPanel({ pieceId, onClose, onSaved }: PieceEditPanelProps) {
  const [piece, setPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    workNumber: '',
    genre: '',
    totalPages: 0,
    assignedBy: '',
    notes: '',
    learnedPages: 0,
    status: 'NotStarted',
    difficulty: '',
  });

  useEffect(() => {
    if (!pieceId) return;

    setLoading(true);
    fetch(`/api/pieces/${pieceId}`)
      .then((res) => res.json())
      .then((data) => {
        setPiece(data);
        setFormData({
          title: data.title,
          composer: data.composer,
          workNumber: data.workNumber || '',
          genre: data.genre || '',
          totalPages: data.totalPages,
          learnedPages: data.learnedPages,
          status: data.status,
          difficulty: data.difficulty || '',
          assignedBy: data.assignedBy || '',
          notes: data.notes || '',
        });
      })
      .finally(() => setLoading(false));
  }, [pieceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pieceId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();

      setMessage('已保存');
      setTimeout(() => setMessage(''), 1500);
      onSaved();
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const progress = formData.totalPages > 0
    ? Math.round((formData.learnedPages / formData.totalPages) * 100)
    : 0;

  if (!pieceId) return null;

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-zinc-900 border-l border-white/10 z-50 flex flex-col animate-slide-in">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-medium text-zinc-100 truncate pr-4">
            {loading ? '加载中...' : piece?.title}
          </h2>
          <div className="flex items-center gap-2">
            {message && (
              <span className={`text-xs ${message === '已保存' ? 'text-emerald-400' : 'text-red-400'}`}>
                {message}
              </span>
            )}
            <Button size="sm" onClick={handleSubmit} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />保存</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : (
            <>
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">基本信息</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-zinc-500">曲名</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">作曲家</Label>
                    <Input
                      value={formData.composer}
                      onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">作品号</Label>
                    <Input
                      value={formData.workNumber}
                      onChange={(e) => setFormData({ ...formData, workNumber: e.target.value })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">布置人</Label>
                    <Input
                      value={formData.assignedBy}
                      onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* 分类 */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">分类</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-500">时期</Label>
                    <select
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm"
                    >
                      {GENRE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">难度</Label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm"
                    >
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">状态</Label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 h-9 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 进度 */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  学习进度
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-500">总页数</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.totalPages}
                      onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">已学页数</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.learnedPages}
                      onChange={(e) => setFormData({ ...formData, learnedPages: parseInt(e.target.value) || 0 })}
                      className="mt-1 h-9 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                {formData.totalPages > 0 && (
                  <div className="pt-1">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                      <span>进度</span>
                      <span className={progress >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 备注 */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">备注</h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="备注信息..."
                  className="w-full min-h-[60px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
