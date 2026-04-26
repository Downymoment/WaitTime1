import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Clock, TrendingUp, Users, ArrowRight, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import LocationCard from "@/components/LocationCard";
import CategoryFilter from "@/components/CategoryFilter";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [seeded, setSeeded] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      const res = await axios.get(`${API}/locations`, { params });
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const seedData = async () => {
    try {
      await axios.post(`${API}/seed`);
      setSeeded(true);
      fetchLocations();
    } catch (err) {
      console.error("Failed to seed", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    seedData();
  }, []);

  useEffect(() => {
    if (seeded) {
      setLoading(true);
      const timer = setTimeout(() => fetchLocations(), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory, search, seeded, fetchLocations]);

  const busyLocations = [...locations].sort((a, b) => b.active_checkins - a.active_checkins).slice(0, 3);
  const totalInQueue = locations.reduce((sum, loc) => sum + loc.active_checkins, 0);

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto" data-testid="home-page">
      {/* Hero Section */}
      <section className="p-6 md:p-12 pb-2" data-testid="hero-section">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live community data
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Skip the queue,<br />
            <span className="text-primary">not your day.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
            See real-time wait times at government offices and banks near you. Check in when you arrive to help others plan better.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-6 py-4 border-y border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{totalInQueue}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">In Queues Now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: 'Manrope, sans-serif' }}>{locations.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Locations</p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchLocations(); }}
            className="ml-auto p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Refresh data"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Search */}
      <section className="px-6 md:px-12 py-4" data-testid="search-section">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search-input"
            type="text"
            placeholder="Search offices, banks, or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-11 rounded-xl border-input bg-card shadow-sm focus:ring-2 focus:ring-ring"
            data-testid="search-input"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 md:px-12 py-2">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </section>

      {/* Trending / Busiest */}
      {!search && !selectedCategory && busyLocations.length > 0 && (
        <section className="px-6 md:px-12 py-4" data-testid="trending-section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Busiest Right Now
            </h2>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="grid gap-3">
            {busyLocations.map((loc, i) => (
              <LocationCard key={loc.id} location={loc} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* All Locations */}
      <section className="px-6 md:px-12 py-4" data-testid="all-locations-section">
        <h2 className="text-lg font-semibold tracking-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {search ? `Results for "${search}"` : selectedCategory ? "Filtered Locations" : "All Locations"}
        </h2>

        {loading ? (
          <div className="grid gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-4 mt-4 pt-3 border-t border-border/60">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="no-results">
            <p className="text-base">No locations found</p>
            <p className="text-sm mt-1">Try a different search or add a new location</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {locations.map((loc, i) => (
              <LocationCard key={loc.id} location={loc} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
