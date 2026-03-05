import { 
  Wind, 
  CloudRain,
  Activity, 
  Zap, 
  TrendingDown, 
  Ruler, 
  Maximize,
  HelpCircle
} from 'lucide-react';

export const getSensorIcon = (type: string, size: number = 14, color: string = 'white') => {
  const iconProps = { size, color, strokeWidth: 2.5 };

  switch (type) {
    case 'Wind':
      return <Wind {...iconProps} />; // Wind icon
    case 'Rain':
      return <CloudRain {...iconProps} />; // Raindrop/Cloud icon
    case '3DSensor':
      return <Maximize {...iconProps} />; // Multi-directional arrows for displacement
    case 'SmartCrackDetection':
      return <Zap {...iconProps} />; // A jagged line representing a crack
    case 'PDS': // Plastic Deformation
      return <TrendingDown {...iconProps} />; // Downward trend for yielding/deformation
    case 'EpsilonPeak':
      return <Activity {...iconProps} />; // Heartbeat/peak spike graph
    case 'EpsilonSensor':
    case 'EpsilonFlat':
    case 'EpsilonRebar':
    case 'EpsilonGraph':
      return <Ruler {...iconProps} />; // Ruler/measurement for strain gauges
    default:
      return <HelpCircle {...iconProps} />; // Fallback
  }
};