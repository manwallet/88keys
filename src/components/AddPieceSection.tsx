'use client';

import { useState } from 'react';
import { Plus, ListPlus, FolderTree } from 'lucide-react';
import AddPieceForm from './AddPieceForm';
import BatchAddDialog from './BatchAddDialog';
import ReorganizeDialog from './ReorganizeDialog';

interface Piece {
  id: string;
  title: string;
  composer: string;
  workNumber?: string | null;
}

interface AddPieceSectionProps {
  pieces: Piece[];
}

export default function AddPieceSection({ pieces }: AddPieceSectionProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isReorganizeDialogOpen, setIsReorganizeDialogOpen] = useState(false);

  // 只显示顶级曲目（没有 parentId 的）用于整理
  const topLevelPieces = pieces.filter((p: any) => !p.parentId);

  return (
    <div>
      {/* 三个等宽卡片按钮 */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setIsAddFormOpen(true)}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 sm:p-6 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-emerald-500/20 p-2.5 sm:p-3 transition-transform group-hover:scale-110">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-zinc-200">添加曲目</span>
          </div>
        </button>

        <button
          onClick={() => setIsBatchDialogOpen(true)}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-4 sm:p-6 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-violet-500/20 p-2.5 sm:p-3 transition-transform group-hover:scale-110">
              <ListPlus className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-zinc-200">批量添加</span>
          </div>
        </button>

        <button
          onClick={() => setIsReorganizeDialogOpen(true)}
          disabled={topLevelPieces.length === 0}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 sm:p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:shadow-none"
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-amber-500/20 p-2.5 sm:p-3 transition-transform group-hover:scale-110 group-disabled:group-hover:scale-100">
              <FolderTree className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-zinc-200">整理曲目</span>
          </div>
        </button>
      </div>

      {/* 添加曲目表单弹窗 */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <AddPieceForm onClose={() => setIsAddFormOpen(false)} />
          </div>
        </div>
      )}

      <BatchAddDialog
        isOpen={isBatchDialogOpen}
        onClose={() => setIsBatchDialogOpen(false)}
      />

      <ReorganizeDialog
        isOpen={isReorganizeDialogOpen}
        onClose={() => setIsReorganizeDialogOpen(false)}
        pieces={topLevelPieces}
      />
    </div>
  );
}
