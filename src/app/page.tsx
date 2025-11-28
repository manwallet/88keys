import { prisma } from '@/lib/db';
import PieceList from '@/components/PieceList';
import AddPieceSection from '@/components/AddPieceSection';
import DashboardHeader from '@/components/DashboardHeader';
import DailyPractice from '@/components/DailyPractice';
import QuickStats from '@/components/QuickStats';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 获取所有曲目（包含子曲目）
  const pieces = await prisma.piece.findMany({
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1800px]">
        <DashboardHeader />

        {/* 三栏布局 */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[320px_1fr_320px] gap-6">
          {/* 左侧边栏 - 每日练习建议 */}
          <div className="hidden lg:block space-y-4">
            <DailyPractice pieces={pieces} />
          </div>

          {/* 中间主内容区 */}
          <div className="space-y-6 min-w-0">
            {/* 添加曲目 */}
            <AddPieceSection pieces={pieces} />

            {/* 曲目列表 */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-200">我的曲库</h2>
              <PieceList pieces={pieces} />
            </div>
          </div>

          {/* 右侧边栏 - 统计信息 */}
          <div className="hidden lg:block">
            <QuickStats pieces={pieces} />
          </div>
        </div>

        {/* 移动端显示 */}
        <div className="lg:hidden mt-6 space-y-6">
          <DailyPractice pieces={pieces} />
          <QuickStats pieces={pieces} />
        </div>
      </div>
    </div>
  );
}
