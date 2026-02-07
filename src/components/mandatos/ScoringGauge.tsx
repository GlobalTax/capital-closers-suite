import { useEffect, useState } from "react";

interface ScoringGaugeProps {
  value: number; // 0-100
  size?: number;
  className?: string;
}

export function ScoringGauge({ value, size = 140, className = "" }: ScoringGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - 14;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;
  const valueAngle = startAngle - (animatedValue / 100) * totalArc;

  const arcPath = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy - r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy - r * Math.sin(end);
    const largeArc = Math.abs(start - end) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const getColor = (v: number) => {
    if (v <= 30) return "hsl(0, 72%, 51%)";      // red
    if (v <= 60) return "hsl(45, 93%, 47%)";      // amber
    return "hsl(142, 71%, 45%)";                    // green
  };

  const getTextColor = (v: number) => {
    if (v <= 30) return "text-red-500";
    if (v <= 60) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Background arc */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {animatedValue > 0 && (
          <path
            d={arcPath(startAngle, valueAngle)}
            fill="none"
            stroke={getColor(animatedValue)}
            strokeWidth="10"
            strokeLinecap="round"
            style={{
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
        {/* Value text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className={`text-2xl font-bold fill-current ${getTextColor(animatedValue)}`}
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round(animatedValue)}%
        </text>
        {/* Labels */}
        <text x={14} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>0</text>
        <text x={size - 14} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>100</text>
      </svg>
    </div>
  );
}
