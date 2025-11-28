'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Bot, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('获取设置失败');
      const data = await res.json();
      setLlmBaseUrl(data.llmBaseUrl);
      setLlmModel(data.llmModel);
      setHasApiKey(data.hasApiKey);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const body: any = {
        llmBaseUrl,
        llmModel,
      };

      if (llmApiKey) {
        body.llmApiKey = llmApiKey;
      }

      if (newPassword) {
        body.newPassword = newPassword;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('保存设置失败');

      setMessage('设置已保存');
      setNewPassword('');
      setLlmApiKey('');
      if (llmApiKey) setHasApiKey(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI 配置 */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">AI 配置</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              配置 AI 服务后，可以在添加曲目时自动填充作曲家、作品号等信息。支持 OpenAI 兼容的 API。
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API 地址</Label>
                <Input
                  placeholder="https://api.openai.com/v1"
                  value={llmBaseUrl}
                  onChange={(e) => setLlmBaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  支持 OpenAI、DeepSeek、通义千问等兼容 API
                </p>
              </div>

              <div className="space-y-2">
                <Label>模型名称</Label>
                <Input
                  placeholder="gpt-3.5-turbo"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  例如：gpt-4o-mini、deepseek-chat、qwen-turbo
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder={hasApiKey ? '••••••••（已配置，留空保持不变）' : '输入 API Key'}
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">安全设置</h2>
            </div>

            <div className="space-y-2">
              <Label>修改密码</Label>
              <Input
                type="password"
                placeholder="输入新密码（留空保持不变）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div className="rounded-md bg-green-500/20 p-3 text-sm text-green-400 border border-green-500/30">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-400 border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
