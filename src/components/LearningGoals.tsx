'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Target, Plus, Trash2, Loader2, Sparkles, Calendar,
  ChevronDown, ChevronRight, Check, X
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  priority: number;
  aiPlan: string | null;
  aiPlanDate: string | null;
}

export default function LearningGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGoals(data);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAdding(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          targetDate: newTargetDate || null,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setNewTargetDate('');
        setShowAddForm(false);
        fetchGoals();
      }
    } catch (error) {
      console.error('Failed to add goal:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个目标吗？')) return;

    setDeletingId(id);
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGeneratePlan = async (id: string) => {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.aiPlan) {
        fetchGoals();
        setExpandedId(id);
      } else {
        alert(data.error || '生成失败，请检查 AI 配置');
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('网络错误，请重试');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  const activeGoals = goals.filter(g => g.status === 'Active');
  const completedGoals = goals.filter(g => g.status === 'Completed');

  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-5">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Target className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="font-medium text-zinc-100">学习目标</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="目标标题，如：准备考级"
            className="h-8 bg-white/5 border-white/10 text-sm"
          />
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="描述（可选）"
            className="h-8 bg-white/5 border-white/10 text-sm"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              className="h-8 bg-white/5 border-white/10 text-sm flex-1"
            />
            <Button type="submit" size="sm" disabled={adding} className="h-8">
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : '添加'}
            </Button>
          </div>
        </form>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" />
        </div>
      ) : activeGoals.length === 0 && !showAddForm ? (
        <div className="py-4 text-center text-zinc-500">
          <p className="text-sm">还没有学习目标</p>
          <p className="text-xs mt-1">设定目标，让 AI 帮你制定计划</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="rounded-lg bg-white/[0.02] border border-white/5 overflow-hidden">
              {/* 目标头部 */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
                        className="p-0.5 rounded hover:bg-white/10"
                      >
                        {expandedId === goal.id ? (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-zinc-200 truncate">{goal.title}</span>
                    </div>
                    {goal.targetDate && (
                      <div className="flex items-center gap-1 mt-1 ml-6 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.targetDate).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGeneratePlan(goal.id)}
                      disabled={generatingId === goal.id}
                      className="h-7 px-2 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                      title="AI 生成计划"
                    >
                      {generatingId === goal.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(goal.id)}
                      className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      title="标记完成"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      {deletingId === goal.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI 计划内容 */}
              {expandedId === goal.id && (
                <div className="px-3 pb-3">
                  {goal.aiPlan ? (
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <div className="flex items-center gap-1 mb-2 text-xs text-violet-400">
                        <Sparkles className="h-3 w-3" />
                        AI 学习计划
                        {goal.aiPlanDate && (
                          <span className="text-violet-400/50 ml-1">({goal.aiPlanDate})</span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
                        {goal.aiPlan.split('\n').filter(Boolean).map((line, i) => {
                          // 去除 markdown 符号
                          let text = line
                            .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold**
                            .replace(/\*(.*?)\*/g, '$1')      // *italic*
                            .replace(/^#+\s*/, '')            // ### headers
                            .trim();

                          // 处理标题行（数字开头或包含冒号）
                          const titleMatch = text.match(/^(\d+\.|[一二三四五六七八九十]+、)/);
                          if (titleMatch || (text.includes('：') && text.indexOf('：') < 15)) {
                            if (text.includes('：') && text.indexOf('：') < 15) {
                              const [title, ...rest] = text.split('：');
                              return (
                                <div key={i}>
                                  <span className="text-violet-300 font-medium">{title}：</span>
                                  <span>{rest.join('：')}</span>
                                </div>
                              );
                            }
                            return <p key={i} className="text-violet-300 font-medium">{text}</p>;
                          }
                          // 处理列表项（- 或 • 开头）
                          if (/^[-•·]\s/.test(text)) {
                            return (
                              <div key={i} className="pl-3 flex gap-1.5">
                                <span className="text-violet-400">•</span>
                                <span>{text.replace(/^[-•·]\s/, '')}</span>
                              </div>
                            );
                          }
                          // 处理编号列表
                          if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(text) || /^\d+[.、)]\s/.test(text)) {
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
                    <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                      <p className="text-xs text-zinc-500">点击 ✨ 让 AI 生成学习计划</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 已完成的目标 */}
      {completedGoals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-zinc-500 mb-2">已完成 ({completedGoals.length})</p>
          <div className="space-y-1">
            {completedGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="group flex items-center gap-2 text-xs text-zinc-500">
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="truncate flex-1">{goal.title}</span>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
