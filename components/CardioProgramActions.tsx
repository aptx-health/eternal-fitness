'use client';

import { MoreVertical, Pencil } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';

interface CardioProgramActionsProps {
  programId: string;
}

export function CardioProgramActions({ programId }: CardioProgramActionsProps) {
  const router = useRouter();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="h-9 w-9 flex items-center justify-center cursor-pointer border-2 border-border bg-input transition-all hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Program actions"
        >
          <MoreVertical className="w-5 h-5" strokeWidth={2} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-card border-2 border-primary shadow-lg z-50 min-w-[140px]"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item
            onClick={() => router.push(`/cardio/programs/${programId}/edit`)}
            className="w-full px-4 py-2.5 text-left text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer outline-none hover:bg-muted text-foreground flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
