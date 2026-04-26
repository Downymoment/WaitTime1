import {
  Car, Landmark, Mail, Zap, Building2, BookOpen, Scale, MapPin
} from "lucide-react";

const icons = {
  car: Car,
  landmark: Landmark,
  mail: Mail,
  zap: Zap,
  "building-2": Building2,
  "book-open": BookOpen,
  scale: Scale,
  "map-pin": MapPin,
};

export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" data-testid="category-filter">
      <button
        onClick={() => onSelect(null)}
        className={`category-pill flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
          !selected
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground"
        }`}
        data-testid="category-all"
      >
        All
      </button>
      {categories.map((cat) => {
        const IconComp = icons[cat.icon] || MapPin;
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className={`category-pill flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground"
            }`}
            data-testid={`category-${cat.id}`}
          >
            <IconComp className="w-4 h-4" />
            <span className="whitespace-nowrap">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
