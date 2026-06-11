"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Segment {
  key: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  innerLabel?: React.ReactNode;
}

export function Donut({ segments, size = 160, innerLabel }: Props) {
  const safe = segments.map((s) => ({ ...s, value: Math.max(0, s.value) }));
  const total = safe.reduce((sum, s) => sum + s.value, 0);
  const data = total > 0 ? safe : [{ key: "empty", value: 1, color: "var(--surface-3)" }];

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 1.5 : 0}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={true}
            animationDuration={650}
            stroke="none"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", pointerEvents: "none" }}>
        {innerLabel}
      </div>
    </div>
  );
}
