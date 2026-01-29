"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";

interface UserPreferences {
  preferredNotes: string[];
  dislikedNotes: string[];
  situations: string[];
}

const noteCategories: Record<string, string[]> = {
  floral: ["Rose", "Jasmine", "Lily", "Peony", "Tuberose", "Iris", "Violet"],
  woody: ["Sandalwood", "Cedar", "Oud", "Vetiver", "Patchouli", "Birch"],
  fresh: ["Citrus", "Bergamot", "Grapefruit", "Mint", "Green Tea", "Marine"],
  spicy: ["Cardamom", "Cinnamon", "Pepper", "Clove", "Ginger", "Saffron"],
  sweet: ["Vanilla", "Caramel", "Honey", "Tonka Bean", "Amber", "Benzoin"],
  musky: ["White Musk", "Ambroxan", "Cashmere", "Skin Musk", "Clean Musk"],
};

const situationOptions = [
  { id: "daily", label: "Daily Wear", description: "Everyday signature scent" },
  { id: "work", label: "Work / Office", description: "Professional settings" },
  { id: "evening", label: "Evening Out", description: "Dinner, events, nights out" },
  { id: "date", label: "Date Night", description: "Romantic occasions" },
  { id: "weekend", label: "Weekend Casual", description: "Relaxed, personal time" },
  { id: "special", label: "Special Occasions", description: "Memorable moments" },
];

export default function PreferencesPage() {
  const router = useRouter();
  const api = usePreferences();

  const [preferredNotes, setPreferredNotes] = useState<string[]>([]);
  const [dislikedNotes, setDislikedNotes] = useState<string[]>([]);
  const [situations, setSituations] = useState<string[]>([]);

  const toggleNote = (note: string, type: "preferred" | "disliked") => {
    if (type === "preferred") {
      if (preferredNotes.includes(note)) {
        setPreferredNotes(preferredNotes.filter((n) => n !== note));
      } else {
        setPreferredNotes([...preferredNotes, note]);
        setDislikedNotes(dislikedNotes.filter((n) => n !== note));
      }
    } else {
      if (dislikedNotes.includes(note)) {
        setDislikedNotes(dislikedNotes.filter((n) => n !== note));
      } else {
        setDislikedNotes([...dislikedNotes, note]);
        setPreferredNotes(preferredNotes.filter((n) => n !== note));
      }
    }
  };

  const toggleSituation = (id: string) => {
    if (situations.includes(id)) {
      setSituations(situations.filter((s) => s !== id));
    } else {
      setSituations([...situations, id]);
    }
  };

  const handleSave = () => {
    const preferences: UserPreferences = {
      preferredNotes,
      dislikedNotes,
      situations,
    };

    // Step 2: 영속 저장 (UPSERT)
    void api.updatePreferences({
      preferred_notes: preferences.preferredNotes,
      disliked_notes: preferences.dislikedNotes,
      usage_context: preferences.situations,
    });

    router.push("/dashboard");
  };

  const getNoteStatus = (note: string): "preferred" | "disliked" | "neutral" => {
    if (preferredNotes.includes(note)) return "preferred";
    if (dislikedNotes.includes(note)) return "disliked";
    return "neutral";
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="font-serif text-xl font-medium text-foreground">Your Preferences</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Introduction */}
        <section className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-medium text-foreground md:text-4xl">
            Organize your taste
          </h2>
          <p className="mx-auto max-w-lg leading-relaxed text-muted-foreground">
            Tell us what you like and dislike. We will explain the rest.
            This helps us understand your preferences and provide meaningful analysis.
          </p>
        </section>

        {/* Preferred Notes */}
        <section className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
              Notes you enjoy
            </h3>
            <p className="text-sm text-muted-foreground">
              Select scent notes that appeal to you. These will positively influence our recommendations.
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(noteCategories).map(([category, notes]) => (
              <div key={category}>
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {notes.map((note) => {
                    const status = getNoteStatus(note);
                    return (
                      <button
                        key={note}
                        onClick={() => toggleNote(note, "preferred")}
                        className={`
                          px-3 py-1.5 text-sm rounded-full border transition-all
                          ${
                            status === "preferred"
                              ? "bg-foreground text-background border-foreground"
                              : status === "disliked"
                                ? "bg-muted text-muted-foreground border-border opacity-50"
                                : "bg-card text-foreground border-border hover:border-foreground/50"
                          }
                        `}
                      >
                        {status === "preferred" && (
                          <Check className="mr-1 inline h-3 w-3" />
                        )}
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disliked Notes */}
        <section className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
              Notes you avoid
            </h3>
            <p className="text-sm text-muted-foreground">
              Select scent notes that you find unpleasant or overwhelming.
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(noteCategories).map(([category, notes]) => (
              <div key={category}>
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {notes.map((note) => {
                    const status = getNoteStatus(note);
                    return (
                      <button
                        key={note}
                        onClick={() => toggleNote(note, "disliked")}
                        className={`
                          px-3 py-1.5 text-sm rounded-full border transition-all
                          ${
                            status === "disliked"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : status === "preferred"
                                ? "bg-muted text-muted-foreground border-border opacity-50"
                                : "bg-card text-foreground border-border hover:border-foreground/50"
                          }
                        `}
                      >
                        {note}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Situations */}
        <section className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
              When do you wear perfume?
            </h3>
            <p className="text-sm text-muted-foreground">
              Understanding your use cases helps us recommend appropriate fragrances.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {situationOptions.map((situation) => {
              const isSelected = situations.includes(situation.id);
              return (
                <button
                  key={situation.id}
                  onClick={() => toggleSituation(situation.id)}
                  className={`
                    p-4 rounded-lg border text-left transition-all
                    ${
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-foreground border-border hover:border-foreground/50"
                    }
                  `}
                >
                  <p
                    className={`mb-1 font-medium ${
                      isSelected ? "text-background" : "text-foreground"
                    }`}
                  >
                    {situation.label}
                  </p>
                  <p
                    className={`text-sm ${
                      isSelected ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {situation.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Summary & Save */}
        <section className="border-t border-border pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {preferredNotes.length}
              </span>{" "}
              preferred notes,{" "}
              <span className="font-medium text-foreground">
                {dislikedNotes.length}
              </span>{" "}
              avoided,{" "}
              <span className="font-medium text-foreground">
                {situations.length}
              </span>{" "}
              situations
            </div>
            <Button
              onClick={handleSave}
              className="bg-foreground text-background hover:bg-foreground/90"
              disabled={preferredNotes.length === 0 && situations.length === 0}
            >
              Save Preferences
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
