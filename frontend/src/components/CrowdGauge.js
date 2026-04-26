import { Progress } from "@/components/ui/progress";

const crowdConfig = {
  low: { label: "Low Crowd", description: "Short wait expected", color: "text-emerald-600", bgColor: "bg-emerald-500", percent: 25 },
  medium: { label: "Moderate Crowd", description: "Some waiting expected", color: "text-amber-600", bgColor: "bg-amber-500", percent: 55 },
  high: { label: "Very Busy", description: "Long wait expected", color: "text-red-600", bgColor: "bg-red-500", percent: 90 },
  unknown: { label: "No Data Yet", description: "Be the first to check in!", color: "text-stone-500", bgColor: "bg-stone-400", percent: 0 },
};

export default function CrowdGauge({ level, activeCheckins = 0 }) {
  const config = crowdConfig[level] || crowdConfig.unknown;

  return (
    <div className="space-y-3" data-testid="crowd-gauge">
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold text-base ${config.color}`} style={{ fontFamily: 'Manrope, sans-serif' }}>
            {config.label}
          </p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {activeCheckins}
          </p>
          <p className="text-xs text-muted-foreground">in queue</p>
        </div>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out gauge-fill ${config.bgColor}`}
          style={{ width: `${config.percent}%` }}
          data-testid="crowd-gauge-bar"
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        <span>Empty</span>
        <span>Moderate</span>
        <span>Packed</span>
      </div>
    </div>
  );
}
