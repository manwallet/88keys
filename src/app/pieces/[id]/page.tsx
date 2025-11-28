'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Clock,
  Calendar,
  BookOpen,
  X,
} from 'lucide-react';

interface PracticeSession {
  id: string;
  date: string;
  note: string | null;
  duration: number;
  mood: string | null;
}

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
  sessions: PracticeSession[];
  _count: {
    sessions: number;
  };
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

const MOOD_OPTIONS = [
  { value: '', label: '请选择' },
  { value: '很好', label: '很好' },
  { value: '不错', label: '不错' },
  { value: '一般', label: '一般' },
  { value: '疲惫', label: '疲惫' },
  { value: '困难', label: '困难' },
];

export default function PieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [piece, setPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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

  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionData, setSessionData] = useState({
    duration: 30,
    note: '',
    mood: '',
  });
  const [addingSession, setAddingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPiece() {
      try {
        const { id } = await params;
        const res = await fetch(`/api/pieces/${id}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error('获取曲目失败');
        const data = await res.json();
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPiece();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { id } = await params;
      const res = await fetch(`/api/pieces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('保存失败');

      setMessage('保存成功');
      const updated = await res.json();
      setPiece({ ...piece!, ...updated });
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSession(true);

    try {
      const { id } = await params;
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pieceId: id,
          ...sessionData,
        }),
      });

      if (!res.ok) throw new Error('添加练习记录失败');

      const pieceRes = await fetch(`/api/pieces/${id}`);
      const updated = await pieceRes.json();
      setPiece(updated);

      setSessionData({ duration: 30, note: '', mood: '' });
      setShowAddSession(false);
      setMessage('练习记录已添加');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这条练习记录吗？')) return;

    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('删除失败');

      const { id } = await params;
      const pieceRes = await fetch(`/api/pieces/${id}`);
      const updated = await pieceRes.json();
      setPiece(updated);

      setMessage('练习记录已删除');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!piece) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">曲目不存在</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    );
  }

  const progress =
    formData.totalPages > 0
      ? Math.round((formData.learnedPages / formData.totalPages) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="font-medium text-zinc-100 truncate max-w-[300px]">{piece.title}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 消息提示 */}
      {(message || error) && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          {message && (
            <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 border border-emerald-500/20">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：编辑表单 */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <h2 className="text-sm font-medium text-zinc-400 mb-4">基本信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs text-zinc-500">曲名</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Label className="text-xs text-zinc-500">作曲家</Label>
                    <Input
                      value={formData.composer}
                      onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">作品号</Label>
                    <Input
                      value={formData.workNumber}
                      onChange={(e) => setFormData({ ...formData, workNumber: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="Op.XX"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">布置人</Label>
                    <Input
                      value={formData.assignedBy}
                      onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                      className="mt-1 bg-white/5 border-white/10"
                      placeholder="老师名"
                    />
                  </div>
                </div>
              </div>

              {/* 分类和状态 */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <h2 className="text-sm font-medium text-zinc-400 mb-4">分类和状态</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-500">时期</Label>
                    <select
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm"
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
                      className="mt-1 flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm"
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
                      className="mt-1 flex h-9 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 学习进度 */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  学习进度
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-zinc-500">总页数</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.totalPages}
                      onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })}
                      className="mt-1 bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">已学页数</Label>
                    <Input
                      type="number"
                      min="0"
                      max={formData.totalPages}
                      value={formData.learnedPages}
                      onChange={(e) => setFormData({ ...formData, learnedPages: parseInt(e.target.value) || 0 })}
                      className="mt-1 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                {formData.totalPages > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                      <span>进度</span>
                      <span className={progress >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 备注 */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <Label className="text-xs text-zinc-500">备注</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="其他备注信息..."
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </form>
          </div>

          {/* 右侧：练习记录 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  练习记录
                  <span className="text-zinc-600">({piece._count.sessions})</span>
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddSession(!showAddSession)}
                  className="h-7 text-xs"
                >
                  {showAddSession ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3 mr-1" />}
                  {showAddSession ? '' : '添加'}
                </Button>
              </div>

              {/* 添加练习记录 */}
              {showAddSession && (
                <form onSubmit={handleAddSession} className="mb-4 p-3 bg-white/5 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-zinc-500">时长(分钟)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={sessionData.duration}
                        onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) || 0 })}
                        className="mt-1 h-8 bg-white/5 border-white/10"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">状态</Label>
                      <select
                        value={sessionData.mood}
                        onChange={(e) => setSessionData({ ...sessionData, mood: e.target.value })}
                        className="mt-1 flex h-8 w-full rounded-md border border-white/10 bg-white/5 px-2 text-sm"
                      >
                        {MOOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-500">笔记</Label>
                    <textarea
                      value={sessionData.note}
                      onChange={(e) => setSessionData({ ...sessionData, note: e.target.value })}
                      placeholder="练习心得..."
                      className="mt-1 flex min-h-[60px] w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full h-8" disabled={addingSession}>
                    {addingSession ? <Loader2 className="h-3 w-3 animate-spin" /> : '添加'}
                  </Button>
                </form>
              )}

              {/* 记录列表 */}
              {piece.sessions.length === 0 ? (
                <p className="text-center py-8 text-zinc-600 text-sm">暂无练习记录</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {piece.sessions.map((session) => (
                    <div key={session.id} className="group p-3 rounded-lg bg-white/[0.02] border border-white/5 relative">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">
                          {new Date(session.date).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{session.duration}分钟</span>
                          {session.mood && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">{session.mood}</span>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={deletingSessionId === session.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400"
                            title="删除"
                          >
                            {deletingSessionId === session.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      {session.note && (
                        <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{session.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
