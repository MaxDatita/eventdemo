import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  isDarkMode?: boolean;
}

export function StatsCard({ title, value, icon: Icon, className, isDarkMode }: StatsCardProps) {
  return (
    <Card
      className={cn(
        'p-6 rounded-xl border-2',
        isDarkMode
          ? 'bg-gray-800 border-gray-700 text-white'
          : 'bg-white border-gray-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-medium mb-2',
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-3xl font-bold',
              isDarkMode ? 'text-white' : 'text-gray-900'
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            isDarkMode ? 'bg-gray-700' : 'bg-purple-100'
          )}
        >
          <Icon
            className={cn(
              'h-6 w-6',
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            )}
          />
        </div>
      </div>
    </Card>
  );
}



