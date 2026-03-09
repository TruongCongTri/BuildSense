import { 
  Wind, 
  CloudRain,
  Activity, 
  Zap, 
  TrendingDown, 
  Ruler, 
  Maximize,
  HelpCircle,
  Thermometer,
  Weight,
  Gauge
} from 'lucide-react';

/**
 * Returns the appropriate Lucide icon component based on the sensor type string.
 * Supports both specific engineering types and general physical property types.
 */
export const getSensorIcon = (type: string, size: number = 14, color: string = 'white') => {
  const iconProps = { size, color, strokeWidth: 2.5 };

  // Normalize type to handle potential casing mismatches
  switch (type) {
    // NEW TYPES (Used in Chart & Tooltip)
    case 'Temperature':
      return <Thermometer {...iconProps} />;
    case 'Load':
      return <Weight {...iconProps} />;
    case 'Strain':
      return <Gauge {...iconProps} />;

    // EXISTING TYPES
    case 'Wind':
      return <Wind {...iconProps} />;
    case 'Rain':
      return <CloudRain {...iconProps} />;
    case '3DSensor':
      return <Maximize {...iconProps} />;
    case 'SmartCrackDetection':
      return <Zap {...iconProps} />;
    case 'PDS': // Plastic Deformation
      return <TrendingDown {...iconProps} />;
    case 'EpsilonPeak':
      return <Activity {...iconProps} />;
    case 'EpsilonSensor':
    case 'EpsilonFlat':
    case 'EpsilonRebar':
    case 'EpsilonGraph':
      return <Ruler {...iconProps} />;
    
    default:
      return <HelpCircle {...iconProps} />; // Fallback for unknown types
  }
};