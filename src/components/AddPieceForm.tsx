'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Loader2 } from 'lucide-react';

const pieceSchema = z.object({
  title: z.string().min(1, '请输入曲名'),
  composer: z.string().min(1, '请输入作曲家'),
  workNumber: z.string().optional(),
  genre: z.string().optional(),
  totalPages: z.string().optional(),
  difficulty: z.string().optional(),
  status: z.string().optional(),
  assignedBy: z.string().optional(),
});

type PieceFormData = z.infer<typeof pieceSchema>;

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

interface AddPieceFormProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function AddPieceForm({ mobile = false, onClose }: AddPieceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PieceFormData>({
    resolver: zodResolver(pieceSchema),
    defaultValues: {
      title: '',
      composer: '',
      workNumber: '',
      genre: '',
      totalPages: '',
      difficulty: '',
      status: 'NotStarted',
      assignedBy: '',
    },
  });

  const titleValue = watch('title');

  const onSubmit = async (data: PieceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pieces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '添加失败');
      }

      reset();
      setIsExpanded(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiFill = async () => {
    if (!titleValue || titleValue.trim().length < 2) {
      setError('请先输入曲名以使用 AI 填充');
      return;
    }

    setIsAiLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/fill-piece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: titleValue }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'AI 填充失败');
      }

      const data = await response.json();

      // AI 返回的标准化曲名
      if (data.title) setValue('title', data.title);
      if (data.composer) setValue('composer', data.composer);
      if (data.workNumber) setValue('workNumber', data.workNumber);
      if (data.genre) setValue('genre', data.genre);
      if (data.difficulty) setValue('difficulty', data.difficulty);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 填充失败');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 弹窗模式：直接显示表单
  if (onClose) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>添加新曲目</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                setError(null);
                onClose();
              }}
            >
              取消
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => {
            await handleSubmit(async (data) => {
              await onSubmit(data);
              onClose();
            })(e);
          }} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">曲名 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    placeholder="输入曲名，点击右侧按钮让 AI 帮你补全信息"
                    {...register('title')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAiFill}
                    disabled={isAiLoading}
                    title="AI 自动填充"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-1" />
                        AI 填充
                      </>
                    )}
                  </Button>
                </div>
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="composer">作曲家 *</Label>
                <Input id="composer" placeholder="例如：贝多芬" {...register('composer')} />
                {errors.composer && (
                  <p className="text-sm text-destructive">{errors.composer.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workNumber">作品号</Label>
                <Input id="workNumber" placeholder="例如：Op. 27 No. 2" {...register('workNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">时期/流派</Label>
                <select
                  id="genre"
                  {...register('genre')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {GENRE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">难度</Label>
                <select
                  id="difficulty"
                  {...register('difficulty')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPages">总页数</Label>
                <Input
                  id="totalPages"
                  type="number"
                  placeholder="0"
                  min="0"
                  {...register('totalPages')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedBy">布置人</Label>
                <Input
                  id="assignedBy"
                  placeholder="例如：王老师"
                  {...register('assignedBy')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">状态</Label>
                <div className="flex gap-4 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register('status')}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    添加曲目
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // 内联模式：需要先点击展开
  if (!isExpanded) {
    if (mobile) {
      return (
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-full h-auto py-4 px-2 flex-col gap-1"
          variant="outline"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">添加曲目</span>
        </Button>
      );
    }
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="w-full py-6 text-lg"
        variant="outline"
      >
        <Plus className="h-5 w-5 mr-2" />
        添加新曲目
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>添加新曲目</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              reset();
              setError(null);
            }}
          >
            取消
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">曲名 *</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  placeholder="输入曲名，点击右侧按钮让 AI 帮你补全信息"
                  {...register('title')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAiFill}
                  disabled={isAiLoading}
                  title="AI 自动填充"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      AI 填充
                    </>
                  )}
                </Button>
              </div>
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="composer">作曲家 *</Label>
              <Input id="composer" placeholder="例如：贝多芬" {...register('composer')} />
              {errors.composer && (
                <p className="text-sm text-destructive">{errors.composer.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="workNumber">作品号</Label>
              <Input id="workNumber" placeholder="例如：Op. 27 No. 2" {...register('workNumber')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">时期/流派</Label>
              <select
                id="genre"
                {...register('genre')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {GENRE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">难度</Label>
              <select
                id="difficulty"
                {...register('difficulty')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {DIFFICULTY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPages">总页数</Label>
              <Input
                id="totalPages"
                type="number"
                placeholder="0"
                min="0"
                {...register('totalPages')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedBy">布置人</Label>
              <Input
                id="assignedBy"
                placeholder="例如：王老师"
                {...register('assignedBy')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="status">状态</Label>
              <div className="flex gap-4 flex-wrap">
                {STATUS_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register('status')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  添加曲目
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
