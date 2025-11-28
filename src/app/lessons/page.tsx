'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Calendar,
  Clock,
  User,
  Music,
  Check,
  Trash2,
  Search,
  X,
} from 'lucide-react';

interface Piece {
  id: string;
  title: string;
  composer: string;
}

interface LessonItem {
  id: string;
  piece: Piece;
  feedback?: string;
}

interface Lesson {
  id: string;
  date: string;
  teacher: string;
  duration: number;
  notes?: string;
  items: LessonItem[];
  _count: {
    items: number;
  };
}

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // 新建上课记录表单
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    teacher: '',
    duration: 60,
    notes: '',
    pieceIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pieceSearchQuery, setPieceSearchQuery] = useState('');

  // 搜索过滤
  const filteredLessons = lessons.filter((lesson) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lesson.teacher.toLowerCase().includes(query) ||
      lesson.notes?.toLowerCase().includes(query) ||
      lesson.items.some((item) =>
        item.piece.title.toLowerCase().includes(query) ||
        item.piece.composer.toLowerCase().includes(query)
      ) ||
      new Date(lesson.date).toLocaleDateString('zh-CN').includes(query)
    );
  });

  // 曲目选择搜索过滤
  const filteredPieces = pieces.filter((piece) => {
    if (!pieceSearchQuery.trim()) return true;
    const query = pieceSearchQuery.toLowerCase();
    return (
      piece.title.toLowerCase().includes(query) ||
      piece.composer.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lessonsRes, piecesRes] = await Promise.all([
        fetch('/api/lessons'),
        fetch('/api/pieces'),
      ]);

      if (lessonsRes.status === 401 || piecesRes.status === 401) {
        router.push('/login');
        return;
      }

      const lessonsData = await lessonsRes.json();
      const piecesData = await piecesRes.json();

      setLessons(lessonsData);
      setPieces(piecesData);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('创建失败');

      setFormData({
        date: new Date().toISOString().split('T')[0],
        teacher: '',
        duration: 60,
        notes: '',
        pieceIds: [],
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePiece = (pieceId: string) => {
    setFormData((prev) => ({
      ...prev,
      pieceIds: prev.pieceIds.includes(pieceId)
        ? prev.pieceIds.filter((id) => id !== pieceId)
        : [...prev.pieceIds, pieceId],
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条上课记录吗？')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/lessons/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('删除失败');

      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">上课记录</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索老师、曲目..."
                className="pl-9 pr-8 w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加上课记录
            </Button>
          </div>
        </div>

        {/* 添加表单 */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>新建上课记录</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  取消
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>上课日期</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>老师</Label>
                    <Input
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
                      }
                      placeholder="老师名字"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>时长（分钟）</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 60,
                        })
                      }
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>上课曲目（可多选）</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="relative border-b">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={pieceSearchQuery}
                        onChange={(e) => setPieceSearchQuery(e.target.value)}
                        placeholder="搜索曲目..."
                        className="pl-9 border-0 rounded-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="max-h-[160px] overflow-auto">
                      {filteredPieces.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground text-center">没有匹配的曲目</p>
                      ) : (
                        filteredPieces.map((piece) => (
                          <label
                            key={piece.id}
                            className="flex items-center gap-3 p-2 hover:bg-secondary/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.pieceIds.includes(piece.id)}
                              onChange={() => togglePiece(piece.id)}
                              className="h-4 w-4"
                            />
                            <span className="truncate">
                              {piece.title} - {piece.composer}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>课堂笔记</Label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="记录课堂内容、老师反馈..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        保存
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 上课记录列表 */}
        {lessons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">还没有上课记录</p>
            <p className="text-sm mt-1">点击上方按钮添加第一次上课记录</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">没有找到匹配「{searchQuery}」的记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(lesson.date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {lesson.teacher}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {lesson.duration} 分钟
                        </span>
                      </div>

                      {lesson.items.length > 0 && (
                        <div className="flex items-start gap-1">
                          <Music className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {lesson.items.map((item) => (
                              <span
                                key={item.id}
                                className="text-xs bg-secondary px-2 py-0.5 rounded"
                              >
                                {item.piece.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {lesson.notes && (
                        <p className="text-sm text-muted-foreground">
                          {lesson.notes}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lesson.id)}
                      disabled={deletingId === lesson.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === lesson.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
