import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const crowdColor = (val) => {
  if (val <= 3) return "#059669";
  if (val <= 8) return "#D97706";
  return "#DC2626";
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const level = val <= 3 ? "Low" : val <= 8 ? "Moderate" : "Busy";
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          ~{val} avg check-ins
        </p>
        <p className="text-xs font-medium mt-0.5" style={{ color: crowdColor(val) }}>
          {level} Traffic
        </p>
      </div>
    );
  }
  return null;
};

export default function BestTimeChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm" data-testid="best-time-chart-empty">
        No historical data yet. Check-in to start building crowd patterns!
      </div>
    );
  }

  return (
    <div data-testid="best-time-chart" className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#78716C' }}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#78716C' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 8 }} />
          <Bar dataKey="avg_checkins" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={crowdColor(entry.avg_checkins)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Busy</span>
        </div>
      </div>
    </div>
  );
}
