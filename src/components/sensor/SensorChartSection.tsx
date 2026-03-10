/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  CartesianGrid,
  Rectangle,
} from "recharts";
import type { Sensor, HistoricalData } from "../../../shared/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import type { DateRange } from "react-day-picker";
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Play,
  Pause,
  Clock,
  SlidersHorizontal,
  RotateCcw,
  Calendar as CalendarIcon,
} from "lucide-react";

// --- HELPER FUNCTIONS ---
const parseTimestamp = (val: string | number): number => {
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof val === "number" ? val : 0;
};

const formatXAxisTick = (val: string | number): string => {
  const d = new Date(parseTimestamp(val));
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} ${d.getHours()}h`;
};

const formatSliderLabel = (ts: number, showDate: boolean) => {
  const d = new Date(ts);
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (showDate) {
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")} ${timeStr}`;
  }
  return timeStr;
};

const formatShortDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTooltipLabel = (
  label: string | number,
  payload?: { payload: { timestamp: string | number } }[],
): string => {
  const rawTimestamp =
    payload && payload.length > 0 && payload[0]?.payload
      ? payload[0].payload.timestamp
      : label;
  const date = new Date(parseTimestamp(rawTimestamp));
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const CustomBarShape = (props: any) => {
  const { x, y, height, fill } = props;
  const barWidth = 6; 
  
  if (height === undefined || height === null || Number.isNaN(height) || height <= 0) {
    return null;
  }

  return (
    <Rectangle
      x={x - barWidth / 2} 
      y={y}
      width={barWidth}
      height={height}
      fill={fill}
      radius={[2, 2, 0, 0]} 
    />
  );
};

interface SensorChartSectionProps {
  sensor: Sensor;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  chartData: HistoricalData[];
  isLoading: boolean;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onTimePlay?: (timestamp: number) => void;
}

export const SensorChartSection: React.FC<SensorChartSectionProps> = ({
  sensor,
  isOpen,
  onToggle,
  chartData,
  isLoading,
  dateRange,
  setDateRange,
  onTimePlay,
}) => {
  const [currentNow, setCurrentNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNow(Date.now());
    }, 1000); 
    return () => clearInterval(interval);
  }, []);

  const timeBounds = useMemo(() => {
    if (!dateRange?.from) return { start: 0, endOfDay: 0, maxDataTime: 0 };
    
    const from = new Date(dateRange.from);
    const to = dateRange.to ? new Date(dateRange.to) : from;

    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).getTime();
    const endOfDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime();

    const maxDataTime = endOfDay > currentNow ? currentNow : endOfDay;

    return { start, endOfDay, maxDataTime };
  }, [dateRange, currentNow]);

  const isSingleDay = useMemo(() => {
    if (!dateRange?.from) return false;
    if (!dateRange?.to) return true;
    return timeBounds.endOfDay - timeBounds.start <= 24 * 60 * 60 * 1000;
  }, [dateRange, timeBounds]);

  // Shows the entire history
  const [timeRange, setTimeRange] = useState<number[]>([
    timeBounds.start,
    timeBounds.maxDataTime,
  ]);
  const [playbackTime, setPlaybackTime] = useState<number>(
    timeBounds.maxDataTime,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const rangeKey = `${sensor.id}-${dateRange?.from?.getTime()}-${dateRange?.to?.getTime()}`;
  const [prevRangeKey, setPrevRangeKey] = useState(rangeKey);
  
  if (rangeKey !== prevRangeKey) {
    setPrevRangeKey(rangeKey);
    setTimeRange([timeBounds.start, timeBounds.maxDataTime]);
    setPlaybackTime(timeBounds.maxDataTime);
    setIsPlaying(false);
  }

  const [prevMaxTime, setPrevMaxTime] = useState(timeBounds.maxDataTime);
  
  if (timeBounds.maxDataTime !== prevMaxTime) {
    const delta = timeBounds.maxDataTime - prevMaxTime;
    setPrevMaxTime(timeBounds.maxDataTime);

    const isToday = dateRange?.to ? (dateRange.to.getTime() >= new Date().setHours(0,0,0,0)) : true;

    if (isToday) {
      setTimeRange(prev => {
        if (timeBounds.maxDataTime - prev[1] < 5000) {
          const newStart = prev[0] > timeBounds.start ? prev[0] + delta : prev[0];
          return [newStart, timeBounds.maxDataTime]; 
        }
        return prev;
      });

      setPlaybackTime(prev => {
        if (timeBounds.maxDataTime - prev < 5000 && !isPlaying) return timeBounds.maxDataTime;
        return prev;
      });
    }
  }

  // Safely plots the bars and prevents stacking
  const rangeData = useMemo(() => {
    return chartData
      .map((d) => ({
        ...d,
        numericTime: parseTimestamp(d.timestamp)
      }))
      .filter((d) => d.numericTime >= timeRange[0] && d.numericTime <= timeRange[1]);
  }, [chartData, timeRange]);

  const animatedData = useMemo(() => {
    if (!isPlaying && playbackTime >= timeRange[1]) return rangeData;

    return rangeData.map((d) => {
      return d.numericTime <= playbackTime 
        ? d 
        : { timestamp: d.timestamp, numericTime: d.numericTime };
    });
  }, [rangeData, playbackTime, isPlaying, timeRange]);

  const yDomain = useMemo(() => {
    const validData = rangeData.filter((d) => typeof d.value === "number");
    if (!validData.length) return ["auto", "auto"];
    const values = validData.map((d) => d.value);
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    return [min - Math.abs(min) * 0.1, max + Math.abs(max) * 0.1];
  }, [rangeData]);

  const stepMs = isSingleDay ? (15 * 60 * 1000) : (60 * 60 * 1000);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          const next = prev + stepMs;
          if (next >= timeRange[1]) {
            setIsPlaying(false);
            return timeRange[1];
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRange, stepMs]);

  useEffect(() => {
    if (isPlaying && onTimePlay) onTimePlay(playbackTime);
  }, [playbackTime, isPlaying, onTimePlay]);

  const togglePlay = () => {
    if (!isPlaying && playbackTime >= timeRange[1] - 5000) {
      setPlaybackTime(timeRange[0]);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimeRange([timeBounds.start, timeBounds.maxDataTime]);
    setPlaybackTime(timeBounds.maxDataTime);
  };

  const avgValue = useMemo(() => {
    if (!rangeData || rangeData.length === 0) return "0.0";
    const sum = rangeData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return (sum / rangeData.length).toFixed(1);
  }, [rangeData]);

  const renderChart = () => {
    const playheadLine =
      !isPlaying && playbackTime >= timeRange[1] ? null : (
        <ReferenceLine
          x={playbackTime}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      );

    const sharedXAxis = (
      <XAxis
        dataKey="numericTime" 
        type="number"
        domain={[timeRange[0], timeRange[1] + 60000]}
        tickFormatter={formatXAxisTick}
        tick={{ fontSize: 10 }}
        stroke="hsl(var(--muted-foreground))"
        minTickGap={30}
        allowDataOverflow={true} 
      />
    );

    if (sensor.type === "Temperature") {
      return (
        <AreaChart
          data={animatedData}
          margin={{ top: 10, right: 0, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          {sharedXAxis}
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label: any, payload: any) =>
                  formatTooltipLabel(label, payload)
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f97316"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#tempGradient)"
            isAnimationActive={false}
          />
          {playheadLine}
        </AreaChart>
      );
    }

    if (sensor.type === "Load") {
      return (
        <BarChart
          data={animatedData}
          margin={{ top: 10, right: 0, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          {sharedXAxis}
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label: any, payload: any) =>
                  formatTooltipLabel(label, payload)
                }
              />
            }
          />
          <ReferenceLine
            y={20}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: "Legal Limit (20T)",
              position: "insideTopLeft",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />
          <Bar 
            dataKey="value" 
            fill="#3b82f6" 
            isAnimationActive={false} 
            shape={<CustomBarShape />} 
          />
          {playheadLine}
        </BarChart>
      );
    }

    if (sensor.type === "Strain") {
      return (
        <LineChart
          data={animatedData}
          margin={{ top: 10, right: 0, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          {sharedXAxis}
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label: any, payload: any) =>
                  formatTooltipLabel(label, payload)
                }
              />
            }
          />
          <Line
            type="step"
            dataKey="value"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          {playheadLine}
        </LineChart>
      );
    }

    return null;
  };

  const chartElement = renderChart();

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-3 focus:outline-none">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Data Insights
          </h3>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs justify-start text-left font-normal w-auto min-w-[160px] pr-3 bg-card border-border hover:bg-accent/50"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {dateRange?.from ? (
                dateRange.to &&
                dateRange.from.getTime() !== dateRange.to.getTime() ? (
                  `${formatShortDate(dateRange.from)} - ${formatShortDate(dateRange.to)}`
                ) : (
                  formatShortDate(dateRange.from)
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover border-border shadow-xl rounded-xl" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => { if (range) setDateRange(range); }}
              numberOfMonths={1}
              disabled={(date) => date.getTime() > currentNow} 
            />
          </PopoverContent>
        </Popover>
      </div>

      <CollapsibleContent className="w-full overflow-hidden space-y-4 pt-1">
        {/* CARD 1: Viewing Window & Playback */}      
        <Card className="w-full shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
          <CardContent className="p-4 space-y-5">
            {isSingleDay && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Viewing Window</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReset}
                      className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatSliderLabel(timeBounds.start, !isSingleDay)}</span>
                    <span className="font-semibold text-primary text-center">
                      {formatSliderLabel(timeRange[0], !isSingleDay)} - {formatSliderLabel(timeRange[1], !isSingleDay)}
                    </span>
                    <span>{formatSliderLabel(timeBounds.maxDataTime, !isSingleDay)}</span>
                  </div>
                  <Slider
                    value={timeRange}
                    min={timeBounds.start}
                    max={timeBounds.maxDataTime}
                    step={1000} 
                    onValueChange={(vals) => {
                      setTimeRange(vals);
                      setIsPlaying(false);
                      setPlaybackTime(vals[1]);
                    }}
                  />
                </div>
                <div className="w-full h-px bg-border/50"></div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Timeline Playback</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isSingleDay && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReset}
                      className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isPlaying ? "destructive" : "default"}
                    onClick={togglePlay}
                    className="h-7 px-3 text-xs gap-1"
                  >
                    {isPlaying ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatSliderLabel(timeRange[0], !isSingleDay)}</span>
                <span className="font-semibold text-primary text-center">
                  Active: {formatSliderLabel(playbackTime, !isSingleDay)}
                </span>
                <span>{formatSliderLabel(timeRange[1], !isSingleDay)}</span>
              </div>
              <Slider
                value={[playbackTime]}
                min={timeRange[0]}
                max={timeRange[1]}
                step={1000}
                onValueChange={(vals) => { setPlaybackTime(vals[0]); setIsPlaying(false); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Average Data & Chart Container */}
        <Card className="w-full overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Average {sensor.type}</div>
                <div className="text-3xl font-bold text-foreground tracking-tight">
                  {avgValue}
                  <span className="text-lg ml-1 font-normal text-muted-foreground">{sensor.unit}</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Loading data...</div>
            ) : chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data available.</div>
            ) : (
              <ChartContainer config={{}} className="h-[200px] w-full min-w-0 max-w-full mt-2 overflow-hidden">
                {chartElement ? chartElement : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Unsupported chart type</div>}
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};