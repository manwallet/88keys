'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkInit = async () => {
      try {
        const res = await fetch('/api/setup');
        const data = await res.json();
        if (!data.initialized) {
          router.push('/setup');
        }
      } catch (error) {
        console.error('Failed to check initialization status:', error);
      }
    };
    checkInit();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'System not initialized') {
          router.push('/setup');
          return;
        }
        throw new Error(data.error || '登录失败');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message === 'Invalid password' ? '密码错误' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">钢琴曲目管理</h1>
          <p className="text-sm text-muted-foreground">
            输入密码以访问您的曲库
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="text-center"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive font-medium text-center bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                验证中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
