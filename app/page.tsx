"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PerfumeCard, type PerfumeCardPerfume } from "@/components/perfumes/PerfumeCard";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeCardPerfume | null>(
    null
  );

  const samplePerfumes = useMemo<PerfumeCardPerfume[]>(
    () => [
      {
        id: "1",
        name: "Santal 33",
        brand: "Le Labo",
        notes: {
          top: ["Cardamom", "Iris", "Violet"],
          middle: ["Ambrox", "Australian Sandalwood"],
          base: ["Cedarwood", "Leather", "Musk"],
        },
        aiExplanation:
          "This woody-spicy composition aligns with your preference for warm, earthy scents. The sandalwood creates a creamy foundation that complements your noted appreciation for subtle, long-lasting fragrances.",
        fullExplanation:
          "Santal 33 represents a modern interpretation of the classic sandalwood perfume. The Australian sandalwood at its heart creates a creamy, addictive quality that you tend to gravitate toward based on your preference profile. The leather and cardamom notes add complexity without overwhelming, which matches your stated preference for refined rather than bold scents. This fragrance works exceptionally well for daily wear, particularly in professional settings where you mentioned wanting subtle projection.",
        isRecommended: true,
      },
      {
        id: "2",
        name: "Baccarat Rouge 540",
        brand: "Maison Francis Kurkdjian",
        notes: {
          top: ["Saffron", "Jasmine"],
          middle: ["Amberwood", "Ambergris"],
          base: ["Fir Resin", "Cedar"],
        },
        aiExplanation:
          "While technically masterful, this fragrance may be too sweet for your palate. Your dislike of gourmand notes suggests the caramelized amber might feel cloying over extended wear.",
        fullExplanation:
          "Baccarat Rouge 540 is undeniably beautiful, but our analysis suggests it may not align with your taste profile. The prominent sweetness from the amberwood and jasmine combination creates a gourmand-adjacent quality that conflicts with your stated preference for fresh, clean scents. Additionally, its strong projection might feel overwhelming given your preference for intimate sillage. However, if you enjoy amber notes in isolation, you might appreciate the dry-down phase more than the opening.",
        isRecommended: false,
      },
      {
        id: "3",
        name: "Bleu de Chanel",
        brand: "Chanel",
        notes: {
          top: ["Citrus", "Mint", "Pink Pepper"],
          middle: ["Grapefruit", "Nutmeg", "Jasmine"],
          base: ["Labdanum", "Cedar", "Sandalwood"],
        },
        aiExplanation:
          "A versatile choice that matches your need for a daily signature scent. The citrus opening provides freshness while the woody base offers the depth you appreciate.",
        fullExplanation:
          "Bleu de Chanel demonstrates excellent versatility, making it suitable for your mentioned use cases: daily wear, work environments, and casual outings. The fresh citrus opening aligns perfectly with your preference for clean, uplifting scents. As it develops, the woody base notes provide the subtle sophistication you mentioned wanting without becoming too heavy. Its moderate projection respects the office environment consideration you noted. This is a safe, crowd-pleasing choice that still maintains character.",
        isRecommended: true,
      },
      {
        id: "4",
        name: "Portrait of a Lady",
        brand: "Frederic Malle",
        notes: {
          top: ["Turkish Rose", "Raspberry"],
          middle: ["Clove", "Cinnamon", "Patchouli"],
          base: ["Sandalwood", "Musk", "Amber"],
        },
        aiExplanation:
          "This opulent rose-patchouli blend offers the complexity you seek for special occasions. However, the spicy intensity may conflict with your preference for understated elegance.",
        fullExplanation:
          "Portrait of a Lady is a masterpiece of perfumery, but it presents an interesting tension with your preferences. On one hand, you appreciate complex, layered compositions—and this delivers exceptionally on that front. The Turkish rose and patchouli combination creates remarkable depth. However, the prominent spice notes (clove and cinnamon) may feel aggressive given your stated preference for softer, more approachable scents. Consider this for evening events where bold statements are welcome, rather than daily wear.",
        isRecommended: true,
      },
      {
        id: "5",
        name: "Another 13",
        brand: "Le Labo",
        notes: {
          top: ["Pear", "Aldehyde"],
          middle: ["Ambroxan", "Jasmine Petals"],
          base: ["Moss", "Musk"],
        },
        aiExplanation:
          "A skin-scent philosophy that mirrors your desire for intimacy over projection. The synthetic musks create a personal aura rather than announcing your presence.",
        fullExplanation:
          "Another 13 represents a fascinating approach to fragrance that aligns beautifully with your stated aesthetic preferences. You mentioned wanting scents that feel like a second skin rather than a statement—this perfume delivers exactly that. The Ambroxan creates a clean, almost metallic warmth that melds with your natural chemistry. The minimalist structure appeals to your noted appreciation for restraint in composition. This is less about smelling like something and more about enhancing your natural presence.",
        isRecommended: true,
      },
    ],
    []
  );

  const analyzedCount = samplePerfumes.length;
  const recommendedCount = samplePerfumes.filter((p) => p.isRecommended).length;

  const navigateTo = (screen: Screen) => setCurrentScreen(screen);

  const handleLogin = () => {
    setCurrentScreen("dashboard");
  };

  const handleSetPreferences = (prefs: UserPreferences) => {
    setPreferences(prefs);
    setCurrentScreen("dashboard");
  };

  const handleSelectPerfume = (perfume: PerfumeCardPerfume) => {
    setSelectedPerfume(perfume);
    setCurrentScreen("detail");
  };

  const handleViewRecommendation = (perfume: PerfumeCardPerfume) => {
    setSelectedPerfume(perfume);
    setCurrentScreen("recommendation");
  };

  if (currentScreen === "login") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === "preference-setup") {
    return (
      <PreferenceSetup
        onSave={handleSetPreferences}
        onBack={() => navigateTo("dashboard")}
        initialPreferences={preferences}
      />
    );
  }

  if (currentScreen === "recommendation" && selectedPerfume) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-10">
            <button
              onClick={() => navigateTo("dashboard")}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Discovery</span>
            </button>
          </div>

          {/* 임시로 향수 정보만 표시 - 실제 추천 데이터는 /dashboard/recommendations에서 처리 */}
          <div className="mb-8">
            <h1 className="mb-4 font-serif text-3xl font-medium text-foreground">
              {selectedPerfume.name}
            </h1>
            <Badge
              className={
                selectedPerfume.isRecommended
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }
            >
              {selectedPerfume.isRecommended ? "Recommended" : "Not for you"}
            </Badge>
          </div>

          <section className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => navigateTo("dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discovery
            </Button>

            <Button
              onClick={() => navigateTo("detail")}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Explore Full Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        </div>
      </div>
    );
  }

  if (currentScreen === "detail" && selectedPerfume) {
    return (
      <PerfumeDetail
        perfume={selectedPerfume}
        preferences={preferences}
        onBack={() => navigateTo("dashboard")}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <section className="mb-16">
          <h2 className="mb-4 text-balance font-serif text-3xl font-medium text-foreground md:text-4xl">
            Discover why scents
            <br />
            speak to you
          </h2>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            We analyze perfumes and explain their connection to your taste profile.
            Each card below contains our AI-generated insights about why a fragrance
            might—or might not—suit you.
          </p>
        </section>

        {preferences && (
          <section className="mb-12 flex items-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Analyzed: </span>
              <span className="font-medium text-foreground">
                {analyzedCount} perfumes
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div>
              <span className="text-muted-foreground">Recommended: </span>
              <span className="font-medium text-foreground">
                {recommendedCount} matches
              </span>
            </div>
          </section>
        )}

        {!preferences && (
          <section className="mb-12 rounded-lg border border-border bg-muted/50 p-6">
            <p className="mb-3 text-foreground">
              To receive personalized explanations, tell us about your scent
              preferences.
            </p>
            <Button
              onClick={() => navigateTo("preference-setup")}
              variant="outline"
              className="bg-transparent text-sm"
            >
              Set Up Preferences
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        )}

        <section className="space-y-6">
          {samplePerfumes.map((perfume) => (
            <PerfumeCard
              key={perfume.id}
              perfume={perfume}
              onSelect={() => handleSelectPerfume(perfume)}
              onViewRecommendation={() => handleViewRecommendation(perfume)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

type Screen =
  | "login"
  | "dashboard"
  | "preference-setup"
  | "recommendation"
  | "detail";

interface UserPreferences {
  preferredNotes: string[];
  dislikedNotes: string[];
  situations: string[];
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-background px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md text-center">
        <div className="mb-12">
          <h1 className="mb-4 font-serif text-5xl font-medium tracking-tight text-foreground md:text-6xl">
            Scentory
          </h1>
          <div className="mx-auto h-px w-16 bg-border" />
        </div>

        <div className="mb-12 space-y-4">
          <p className="font-serif text-lg italic leading-relaxed text-foreground">
            Understand your perfume taste,
            <br />
            not just recommendations.
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            We analyze your preferences and explain why certain scents resonate with
            you. This is about discovery and understanding, not shopping.
          </p>
        </div>

        <Button
          onClick={onLogin}
          className="h-12 w-full max-w-xs bg-foreground text-background hover:bg-foreground/90 text-sm font-medium tracking-wide"
        >
          Continue
        </Button>

        <p className="mt-8 text-xs text-muted-foreground">
          Your data helps us understand your preferences.
          <br />
          We never sell or share your information.
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
          Phase 1 MVP
        </p>
      </div>
    </main>
  );
}

function PreferenceSetup({
  onSave,
  onBack,
  initialPreferences,
}: {
  onSave: (preferences: UserPreferences) => void;
  onBack: () => void;
  initialPreferences: UserPreferences | null;
}) {
  const [preferredNotes, setPreferredNotes] = useState<string[]>(
    initialPreferences?.preferredNotes || []
  );
  const [dislikedNotes, setDislikedNotes] = useState<string[]>(
    initialPreferences?.dislikedNotes || []
  );
  const [situations, setSituations] = useState<string[]>(
    initialPreferences?.situations || []
  );

  const noteCategories = {
    floral: ["Rose", "Jasmine", "Lily", "Peony", "Tuberose", "Iris", "Violet"],
    woody: ["Sandalwood", "Cedar", "Oud", "Vetiver", "Patchouli", "Birch"],
    fresh: ["Citrus", "Bergamot", "Grapefruit", "Mint", "Green Tea", "Marine"],
    spicy: ["Cardamom", "Cinnamon", "Pepper", "Clove", "Ginger", "Saffron"],
    sweet: ["Vanilla", "Caramel", "Honey", "Tonka Bean", "Amber", "Benzoin"],
    musky: ["White Musk", "Ambroxan", "Cashmere", "Skin Musk", "Clean Musk"],
  } as const;

  const situationOptions = [
    { id: "daily", label: "Daily Wear", description: "Everyday signature scent" },
    { id: "work", label: "Work / Office", description: "Professional settings" },
    { id: "evening", label: "Evening Out", description: "Dinner, events, nights out" },
    { id: "date", label: "Date Night", description: "Romantic occasions" },
    { id: "weekend", label: "Weekend Casual", description: "Relaxed, personal time" },
    { id: "special", label: "Special Occasions", description: "Memorable moments" },
  ] as const;

  const toggleNote = (note: string, type: "preferred" | "disliked") => {
    if (type === "preferred") {
      if (preferredNotes.includes(note)) {
        setPreferredNotes(preferredNotes.filter((n) => n !== note));
      } else {
        setPreferredNotes([...preferredNotes, note]);
        setDislikedNotes(dislikedNotes.filter((n) => n !== note));
      }
      return;
    }

    if (dislikedNotes.includes(note)) {
      setDislikedNotes(dislikedNotes.filter((n) => n !== note));
    } else {
      setDislikedNotes([...dislikedNotes, note]);
      setPreferredNotes(preferredNotes.filter((n) => n !== note));
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
    onSave({ preferredNotes, dislikedNotes, situations });
  };

  const getNoteStatus = (note: string): "preferred" | "disliked" | "neutral" => {
    if (preferredNotes.includes(note)) return "preferred";
    if (dislikedNotes.includes(note)) return "disliked";
    return "neutral";
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <section className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-medium text-foreground md:text-4xl">
            Organize your taste
          </h2>
          <p className="mx-auto max-w-lg leading-relaxed text-muted-foreground">
            Tell us what you like and dislike. We will explain the rest. This helps
            us understand your preferences and provide meaningful analysis.
          </p>
        </section>

        <section className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
              Notes you enjoy
            </h3>
            <p className="text-sm text-muted-foreground">
              Select scent notes that appeal to you. These will positively influence
              our recommendations.
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

function PerfumeDetail({
  perfume,
  preferences,
  onBack,
}: {
  perfume: PerfumeCardPerfume;
  preferences: UserPreferences | null;
  onBack: () => void;
}) {
  const isRecommended = perfume.isRecommended ?? true;

  const getNoteStatus = (note: string): "preferred" | "disliked" | "neutral" => {
    if (!preferences) return "neutral";

    const isPreferred = preferences.preferredNotes.some(
      (pref) =>
        note.toLowerCase().includes(pref.toLowerCase()) ||
        pref.toLowerCase().includes(note.toLowerCase())
    );
    if (isPreferred) return "preferred";

    const isDisliked = preferences.dislikedNotes.some(
      (disliked) =>
        note.toLowerCase().includes(disliked.toLowerCase()) ||
        disliked.toLowerCase().includes(note.toLowerCase())
    );
    if (isDisliked) return "disliked";

    return "neutral";
  };

  const NoteChip = ({
    note,
    status,
  }: {
    note: string;
    status: "preferred" | "disliked" | "neutral";
  }) => {
    const baseClasses =
      "px-4 py-2 rounded-full text-sm font-medium transition-all";

    const statusClasses = {
      preferred: "bg-foreground text-background",
      disliked: "bg-destructive/10 text-destructive border border-destructive/30",
      neutral: "bg-secondary text-secondary-foreground",
    } as const;

    return <span className={`${baseClasses} ${statusClasses[status]}`}>{note}</span>;
  };

  const getWearSuggestions = () => {
    const hasWoody = [...perfume.notes.middle, ...perfume.notes.base].some((n) =>
      ["sandalwood", "cedar", "oud", "vetiver", "patchouli"].some((w) =>
        n.toLowerCase().includes(w)
      )
    );
    const hasFresh = perfume.notes.top.some((n) =>
      ["citrus", "bergamot", "mint", "marine", "green"].some((f) =>
        n.toLowerCase().includes(f)
      )
    );
    const hasSweet = [...perfume.notes.middle, ...perfume.notes.base].some((n) =>
      ["vanilla", "caramel", "honey", "amber", "benzoin"].some((s) =>
        n.toLowerCase().includes(s)
      )
    );

    return [
      { label: "Daily Wear", suitability: hasFresh ? "Excellent" : "Good", suitable: true },
      {
        label: "Work",
        suitability:
          hasWoody && !hasSweet ? "Excellent" : hasFresh ? "Good" : "Fair",
        suitable: hasFresh || hasWoody,
      },
      { label: "Evening", suitability: hasSweet || hasWoody ? "Excellent" : "Good", suitable: true },
      { label: "Date Night", suitability: hasSweet ? "Excellent" : hasWoody ? "Good" : "Fair", suitable: hasSweet || hasWoody },
      { label: "Weekend", suitability: "Good", suitable: true },
      { label: "Special Event", suitability: hasWoody && hasSweet ? "Excellent" : "Good", suitable: true },
    ] as const;
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <section className="mb-16 text-center">
          <p className="mb-2 text-sm text-muted-foreground">{perfume.brand}</p>
          <h1 className="mb-4 font-serif text-4xl font-medium text-foreground md:text-5xl">
            {perfume.name}
          </h1>
          <Badge
            className={
              isRecommended
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }
          >
            {isRecommended ? "Recommended" : "Not for you"}
          </Badge>
        </section>

        <section className="mb-16">
          <h2 className="mb-8 text-center font-serif text-xl font-medium text-foreground">
            Fragrance Structure
          </h2>

          <div className="space-y-8">
            <div className="text-center">
              <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Top Notes
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                First impression, 15-30 minutes
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.top.map((note) => (
                  <NoteChip key={note} note={note} status={getNoteStatus(note)} />
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-border" />
            </div>

            <div className="text-center">
              <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Heart Notes
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Core character, 30 min - 3 hours
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.middle.map((note) => (
                  <NoteChip key={note} note={note} status={getNoteStatus(note)} />
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-border" />
            </div>

            <div className="text-center">
              <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Base Notes
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Foundation, 3+ hours to dry down
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.base.map((note) => (
                  <NoteChip key={note} note={note} status={getNoteStatus(note)} />
                ))}
              </div>
            </div>
          </div>

          {preferences && (
            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground" />
                <span>You enjoy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive/30" />
                <span>You avoid</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-secondary" />
                <span>Neutral</span>
              </div>
            </div>
          )}
        </section>

        <div className="mb-16 h-px w-full bg-border" />

        <section className="mb-16">
          <div className="mb-6">
            <h2 className="mb-2 font-serif text-xl font-medium text-foreground">
              {isRecommended ? "Why This Fits Your Taste" : "Why This May Not Suit You"}
            </h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Personalized Analysis
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 md:p-8">
            <p className="mb-6 text-base leading-relaxed text-foreground md:text-lg">
              {perfume.fullExplanation || perfume.aiExplanation}
            </p>

            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isRecommended ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {isRecommended ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isRecommended ? "High Compatibility" : "Low Compatibility"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on your preference profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 font-serif text-xl font-medium text-foreground">
            When to Wear
          </h2>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {getWearSuggestions().map((suggestion) => (
              <div
                key={suggestion.label}
                className={`
                  p-4 rounded-lg border text-center
                  ${suggestion.suitable ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}
                `}
              >
                <p className="mb-1 text-sm font-medium text-foreground">
                  {suggestion.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.suitability}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Discovery
          </Button>
        </section>
      </div>
    </main>
  );
}
