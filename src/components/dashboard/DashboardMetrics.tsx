import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface MetricCardConfig {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconClassName: string;
  hoverBorderClass?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendText?: string;
  trendClassName?: string;
  onClick?: () => void;
}

interface DashboardMetricsProps {
  metrics: MetricCardConfig[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        
        return (
          <Card 
            key={idx}
            onClick={metric.onClick}
            className={`bg-card border border-border shadow-md relative overflow-hidden rounded-xl transition-all duration-200 ${
              metric.onClick 
                ? `cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${metric.hoverBorderClass || 'hover:border-primary/50'}` 
                : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="relative z-10 space-y-2">
                <p className="text-[13px] font-medium text-muted-foreground tracking-wide">
                  {metric.title}
                </p>
                <div className="text-4xl font-bold text-foreground tracking-tight">
                  {metric.value}
                </div>
              </div>
              
              <Icon 
                className={`w-16 h-16 absolute -right-2 top-4 opacity-40 ${metric.iconClassName}`} 
                strokeWidth={1.5} 
              />
              
              {metric.trendText && (
                <div className={`mt-5 flex items-center text-xs font-medium relative z-10 ${metric.trendClassName || 'text-muted-foreground'}`}>
                  {metric.trendDirection === 'up' && <ArrowUp className="w-3.5 h-3.5 mr-1" />}
                  {metric.trendDirection === 'down' && <ArrowDown className="w-3.5 h-3.5 mr-1" />}
                  {metric.trendDirection === 'neutral' && <span className="mr-1.5">—</span>}
                  {metric.trendText}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};