import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const crowdConfig = {
  low: { label: "Low Crowd", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dotColor: "bg-emerald-500" },
  medium: { label: "Moderate", color: "bg-amber-100 text-amber-800 border-amber-200", dotColor: "bg-amber-500" },
  high: { label: "Very Busy", color: "bg-red-100 text-red-800 border-red-200", dotColor: "bg-red-500" },
  unknown: { label: "No Data", color: "bg-stone-100 text-stone-600 border-stone-200", dotColor: "bg-stone-400" },
};

const categoryIcons = {
  rto: "car",
  bank: "landmark",
  post_office: "mail",
  electricity: "zap",
  municipal: "building-2",
  passport: "book-open",
  court: "scale",
  other: "map-pin",
};

export default function LocationCard({ location, index = 0 }) {
  const navigate = useNavigate();
  const crowd = crowdConfig[location.crowd_level] || crowdConfig.unknown;

  return (
    <button
      onClick={() => navigate(`/location/${location.id}`)}
      className={`w-full text-left bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer active:scale-[0.98] fade-in-up stagger-${Math.min(index + 1, 8)}`}
      data-testid={`location-card-${location.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-base" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {location.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-sm truncate">{location.address}, {location.city}</span>
          </div>
        </div>
        <Badge className={`${crowd.color} border text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${crowd.dotColor} mr-1.5 inline-block`} />
          {crowd.label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {location.estimated_wait_min > 0 ? `${location.estimated_wait_min} min` : "No wait"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {location.active_checkins} in queue
          </span>
        </div>
      </div>
    </button>
  );
}
