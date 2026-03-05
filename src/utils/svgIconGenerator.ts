/**
 * Dynamically generates a Shadcn-styled SVG Data URI for ArcGIS PictureMarkerSymbol.
 * Includes native SVG Gaussian Blur and CSS Keyframe pulsing for active alerts.
 */
export const createSensorMarkerURI = (type: string, isAlert: boolean, isVisible: boolean) => {
  // Extract exact SVG paths from lucide-react corresponding to getSensorIcon()
  let paths = '';
  switch (type) {
    case 'Wind': paths = '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>'; break;
    case 'Rain': paths = '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>'; break;
    case '3DSensor': paths = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'; break;
    case 'PDS': paths = '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>'; break;
    case 'SmartCrackDetection': paths = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'; break;
    case 'EpsilonPeak': paths = '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'; break;
    case 'EpsilonSensor':
    case 'EpsilonFlat':
    case 'EpsilonRebar':
    case 'EpsilonGraph': paths = '<path d="M21.3 15.3l-5.8 5.8a2.58 2.58 0 0 1-3.6 0l-9.8-9.8a2.58 2.58 0 0 1 0-3.6l5.8-5.8a2.58 2.58 0 0 1 3.6 0l9.8 9.8a2.58 2.58 0 0 1 0 3.6Z"/><path d="M14.5 5.5l5 5"/><path d="M12 8l3 3"/><path d="M9.5 10.5l5 5"/><path d="M7 13l3 3"/><path d="M4.5 15.5l5 5"/>'; break;
    default: paths = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
  }

  const strokeColor = isAlert ? '#ef4444' : '#64748b'; 
  const bgColor = isVisible ? '#0f172a' : 'transparent'; 

  // Native SVG Blurring & Embedded CSS Animation
  const alertStylesAndFilters = isAlert ? `
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur" />
      </filter>
    </defs>
    <style>
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.8; }
        75%, 100% { transform: scale(2.2); opacity: 0; }
      }
      .radar-pulse {
        transform-origin: 32px 32px;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
    </style>
  ` : '';

  // The pulsing ring and the soft static glow
  const glowElements = isAlert ? `
    <circle cx="32" cy="32" r="14" fill="#ef4444" class="radar-pulse" />
    <circle cx="32" cy="32" r="18" fill="#ef4444" filter="url(#glow)" opacity="0.6"/>
  ` : '';

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      ${alertStylesAndFilters}
      ${glowElements}
      
      <circle cx="32" cy="32" r="14" fill="${bgColor}" stroke="${strokeColor}" stroke-width="2.5"/>
      
      <g transform="translate(20, 20) scale(1)" fill="none" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${paths}
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};