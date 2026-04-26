import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { MapPin, Building2, Clock } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: "rto", name: "RTO Office" },
  { id: "bank", name: "Public Bank" },
  { id: "post_office", name: "Post Office" },
  { id: "electricity", name: "Electricity Board" },
  { id: "municipal", name: "Municipal Corp" },
  { id: "passport", name: "Passport Office" },
  { id: "court", name: "Court/Tribunal" },
  { id: "other", name: "Other" },
];

export default function AddLocationSheet({ open, onOpenChange }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [avgTime, setAvgTime] = useState("15");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !category || !address || !city) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/locations`, {
        name,
        category,
        address,
        city,
        avg_service_time: parseInt(avgTime) || 15,
      });
      toast.success("Location added! Thanks for contributing.");
      setName("");
      setCategory("");
      setAddress("");
      setCity("");
      setAvgTime("15");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to add location. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto" data-testid="add-location-sheet">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Add a New Location
          </SheetTitle>
          <SheetDescription>
            Help your community by adding a government office or bank.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="loc-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Office Name *
            </Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., RTO Andheri West"
              className="h-12 rounded-xl"
              data-testid="add-loc-name"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl" data-testid="add-loc-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Address *
            </Label>
            <Input
              id="loc-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., SVP Road, near Metro Station"
              className="h-12 rounded-xl"
              data-testid="add-loc-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-city">City *</Label>
            <Input
              id="loc-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
              className="h-12 rounded-xl"
              data-testid="add-loc-city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Avg. Service Time (minutes)
            </Label>
            <Input
              id="loc-time"
              type="number"
              value={avgTime}
              onChange={(e) => setAvgTime(e.target.value)}
              placeholder="15"
              min="1"
              max="120"
              className="h-12 rounded-xl"
              data-testid="add-loc-time"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-full shadow-lg hover:translate-y-[-2px] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="add-loc-submit"
          >
            {submitting ? "Adding..." : "Add Location"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
