'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListPlus, FolderTree } from 'lucide-react';
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
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isReorganizeDialogOpen, setIsReorganizeDialogOpen] = useState(false);

  // 只显示顶级曲目（没有 parentId 的）用于整理
  const topLevelPieces = pieces.filter((p: any) => !p.parentId);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <AddPieceForm />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none h-auto py-3 sm:py-6 px-4"
            onClick={() => setIsBatchDialogOpen(true)}
          >
            <ListPlus className="h-5 w-5 mr-2" />
            批量添加
          </Button>
          {topLevelPieces.length > 0 && (
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-auto py-3 sm:py-6 px-4"
              onClick={() => setIsReorganizeDialogOpen(true)}
            >
              <FolderTree className="h-5 w-5 mr-2" />
              整理曲目
            </Button>
          )}
        </div>
      </div>

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
