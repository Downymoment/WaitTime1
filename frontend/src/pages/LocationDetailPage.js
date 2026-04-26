import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Users, Calendar, UserCheck, Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import CrowdGauge from "@/components/CrowdGauge";
import BestTimeChart from "@/components/BestTimeChart";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryNames = {
  rto: "RTO Office",
  bank: "Public Bank",
  post_office: "Post Office",
  electricity: "Electricity Board",
  municipal: "Municipal Corp",
  passport: "Passport Office",
  court: "Court/Tribunal",
  other: "Other",
};

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [bestTimes, setBestTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkinNickname, setCheckinNickname] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const fetchLocation = async () => {
    try {
      const res = await axios.get(`${API}/locations/${id}`);
      setLocation(res.data);
    } catch (err) {
      toast.error("Location not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchBestTimes = async () => {
    try {
      const res = await axios.get(`${API}/locations/${id}/best-times`);
      setBestTimes(res.data);
    } catch (err) {
      console.error("Failed to fetch best times");
    }
  };

  useEffect(() => {
    fetchLocation();
    fetchBestTimes();
  }, [id]);

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const res = await axios.post(`${API}/locations/${id}/checkin`, {
        nickname: checkinNickname || undefined,
      });
      toast.success(`Checked in! You're #${res.data.position_in_queue} in queue`);
      setJustCheckedIn(true);
      setCheckinNickname("");
      fetchLocation();
    } catch (err) {
      toast.error("Check-in failed. Try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `WaitTime - ${location?.name}`,
        text: `Current wait: ${location?.estimated_wait_min} min at ${location?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto p-6 md:p-12 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto page-enter" data-testid="location-detail-page">
      {/* Back Header */}
      <div className="p-6 md:px-12 pb-0">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to all locations</span>
        </button>

        {/* Title Area */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 rounded-full text-xs">
              {categoryNames[location.category] || location.category}
            </Badge>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: 'Manrope, sans-serif' }}
              data-testid="location-name"
            >
              {location.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{location.address}, {location.city}</span>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex-shrink-0 p-2.5 rounded-full border border-border hover:bg-muted transition-colors"
            aria-label="Share location"
            data-testid="share-button"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wait Time Hero */}
      <div className="px-6 md:px-12 mt-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-1 text-center" data-testid="wait-time-card">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated Wait Time</p>
          <p
            className="text-5xl font-extrabold text-foreground"
            style={{ fontFamily: 'Manrope, sans-serif' }}
            data-testid="wait-time-value"
          >
            {location.estimated_wait_min > 0 ? `${location.estimated_wait_min}` : "0"}
            <span className="text-xl font-semibold text-muted-foreground ml-2">min</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Based on {location.active_checkins} active check-in{location.active_checkins !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Crowd Gauge */}
      <div className="px-6 md:px-12 mt-6">
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="crowd-section">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Crowd Level
          </h2>
          <CrowdGauge level={location.crowd_level} activeCheckins={location.active_checkins} />
        </div>
      </div>

      {/* Check-in Section */}
      <div className="px-6 md:px-12 mt-6">
        <div className="bg-accent/30 border border-primary/20 rounded-2xl p-6" data-testid="checkin-section">
          <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <UserCheck className="w-5 h-5 inline mr-2 text-primary" />
            Check In Here
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Help others by reporting that you're in the queue
          </p>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Nickname (optional)"
              value={checkinNickname}
              onChange={(e) => setCheckinNickname(e.target.value)}
              className="h-12 rounded-xl flex-1"
              data-testid="checkin-nickname"
            />
            <button
              onClick={handleCheckin}
              disabled={checkingIn || justCheckedIn}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full shadow-lg hover:translate-y-[-2px] transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              data-testid="checkin-button"
            >
              {checkingIn ? "..." : justCheckedIn ? "Checked In" : "Check In"}
            </button>
          </div>
          {justCheckedIn && (
            <p className="text-sm text-primary font-medium mt-3 fade-in-up" data-testid="checkin-success">
              Thanks for contributing! Your check-in helps the community.
            </p>
          )}
        </div>
      </div>

      {/* Best Time to Visit */}
      <div className="px-6 md:px-12 mt-6">
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="best-time-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <Calendar className="w-5 h-5 inline mr-2 text-primary" />
              Best Time to Visit
            </h2>
            <span className="text-xs text-muted-foreground">Last 7 days avg</span>
          </div>
          <BestTimeChart data={bestTimes} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 md:px-12 mt-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6" data-testid="recent-activity-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Recent Activity
            </h2>
            <Badge variant="secondary" className="rounded-full text-xs">
              {location.total_checkins_today} today
            </Badge>
          </div>
          {location.recent_checkins && location.recent_checkins.length > 0 ? (
            <div className="space-y-3">
              {location.recent_checkins.slice(0, 8).map((c, i) => {
                const time = new Date(c.timestamp);
                const mins = Math.round((Date.now() - time.getTime()) / 60000);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between py-2 ${i < location.recent_checkins.length - 1 ? 'border-b border-border/50' : ''} fade-in-up stagger-${Math.min(i + 1, 8)}`}
                    data-testid={`recent-checkin-${i}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{c.nickname}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mins < 1 ? "Just now" : `${mins}m ago`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6" data-testid="no-recent-activity">
              No recent activity. Be the first to check in!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
