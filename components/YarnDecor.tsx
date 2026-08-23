export function YarnBall({ size = 40, color = '#D8A7A7', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="17" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.5" />
      <path d="M5 20 Q13 10 20 20 Q27 30 35 20" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M8 14 Q17 6 26 14 Q33 20 36 28" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M6 27 Q14 19 22 27 Q29 34 37 26" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="35" cy="20" r="2.5" fill={color} />
      <path d="M35 20 L40 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function CrochetFlower({ size = 32, color = '#A8B8A0', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const cx = 16 + 8 * Math.cos(rad)
        const cy = 16 + 8 * Math.sin(rad)
        return <ellipse key={i} cx={cx} cy={cy} rx="4.5" ry="3" transform={`rotate(${angle} ${cx} ${cy})`} fill={color} fillOpacity="0.55" />
      })}
      <circle cx="16" cy="16" r="4" fill={color} />
      <circle cx="16" cy="16" r="2" fill="#FFFDF8" />
    </svg>
  )
}

export function StitchDivider({ className = '', color = '#D8A7A7' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 800 16" fill="none" preserveAspectRatio="none" className={className} style={{ height: 16 }}>
      <path
        d="M0 8 Q50 2 100 8 Q150 14 200 8 Q250 2 300 8 Q350 14 400 8 Q450 2 500 8 Q550 14 600 8 Q650 2 700 8 Q750 14 800 8"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
    </svg>
  )
}

export function WavyThread({ color = '#A8B8A0', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className={className} style={{ height: 60 }}>
      <path
        d="M0 30 Q180 5 360 30 Q540 55 720 30 Q900 5 1080 30 Q1260 55 1440 30"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}

export function YarnIcon({ size = 24, color = '#C97B63' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M3 12 Q8 7 12 12 Q16 17 21 12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M5 8 Q10 4 15 8" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M5 16 Q10 20 15 16" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function NeedleIcon({ size = 24, color = '#8B6B5C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 19 L19 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 19 L3 21 L5 21 L5 19Z" fill={color} />
      <circle cx="19" cy="5" r="2" fill={color} />
      <path d="M17 7 L15 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CheckShieldIcon({ size = 24, color = '#A8B8A0' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L20 6 L20 12 C20 16.4 16.4 20.2 12 21 C7.6 20.2 4 16.4 4 12 L4 6 Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" strokeLinejoin="round" />
      <path d="M9 12 L11 14 L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MapPinIcon({ size = 24, color = '#C97B63' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function HeartIcon({ size = 24, color = '#D8A7A7' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 14 3 8.5C3 6 5 4 7.5 4C9 4 10.5 4.8 12 6C13.5 4.8 15 4 16.5 4C19 4 21 6 21 8.5C21 14 12 21 12 21Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.25" strokeLinejoin="round" />
    </svg>
  )
}
