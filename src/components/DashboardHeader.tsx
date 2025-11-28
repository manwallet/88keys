'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Music, Calendar } from 'lucide-react';

export default function DashboardHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Music className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">钢琴曲目管理</h1>
      </div>
      <div className="flex gap-2">
        <Link href="/lessons">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            上课记录
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          退出
        </Button>
      </div>
    </div>
  );
}
