/**
 * Mode Switcher Component
 *
 * Allows users to switch between Engineer Mode and Team Mode
 */

import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModeSwitcher() {
  const { mode, setMode } = useLayout();

  return (
    <div className="inline-flex items-center gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={mode === 'engineer' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('engineer')}
        className={cn(
          'gap-2 h-8',
          mode === 'engineer' && 'bg-primary text-primary-foreground'
        )}
      >
        <Wrench className="w-4 h-4" />
        <span className="font-medium">工程师</span>
      </Button>

      <Button
        variant={mode === 'team' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('team')}
        className={cn(
          'gap-2 h-8',
          mode === 'team' && 'bg-primary text-primary-foreground'
        )}
      >
        <Users className="w-4 h-4" />
        <span className="font-medium">团队</span>
      </Button>
    </div>
  );
}
