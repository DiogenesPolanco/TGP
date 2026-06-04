interface ChartGradientsProps {
  id?: string
}

export function ChartGradients({ id = 'chart-gradients' }: ChartGradientsProps) {
  return (
    <defs>
      {/* Primary gradient */}
      <linearGradient id={`${id}-primary`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4C9AFF" />
        <stop offset="100%" stopColor="#0052CC" />
      </linearGradient>

      {/* Success gradient */}
      <linearGradient id={`${id}-success`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#57D9A3" />
        <stop offset="100%" stopColor="#36B37E" />
      </linearGradient>

      {/* Warning gradient */}
      <linearGradient id={`${id}-warning`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFC400" />
        <stop offset="100%" stopColor="#FFAB00" />
      </linearGradient>

      {/* Danger gradient */}
      <linearGradient id={`${id}-danger`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF8B57" />
        <stop offset="100%" stopColor="#FF5630" />
      </linearGradient>

      {/* Info gradient */}
      <linearGradient id={`${id}-info`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#00D4E6" />
        <stop offset="100%" stopColor="#00B8D9" />
      </linearGradient>

      {/* Neutral gradient */}
      <linearGradient id={`${id}-neutral`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C1C7CD" />
        <stop offset="100%" stopColor="#A5ADBA" />
      </linearGradient>

      {/* Glow filter for emphasis */}
      <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Shadow for depth */}
      <filter id={`${id}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#172B4D" floodOpacity="0.15" />
      </filter>
    </defs>
  )
}


