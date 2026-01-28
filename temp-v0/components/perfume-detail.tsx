"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserPreferences, Perfume } from "@/app/page"
import { ArrowLeft, Check, X } from "lucide-react"

interface PerfumeDetailProps {
  perfume: Perfume
  preferences: UserPreferences | null
  onBack: () => void
}

export default function PerfumeDetail({ perfume, preferences, onBack }: PerfumeDetailProps) {
  const isRecommended = perfume.isRecommended ?? true

  // Check if a note matches user preferences
  const getNoteStatus = (note: string): "preferred" | "disliked" | "neutral" => {
    if (!preferences) return "neutral"
    
    const isPreferred = preferences.preferredNotes.some(pref =>
      note.toLowerCase().includes(pref.toLowerCase()) ||
      pref.toLowerCase().includes(note.toLowerCase())
    )
    if (isPreferred) return "preferred"
    
    const isDisliked = preferences.dislikedNotes.some(disliked =>
      note.toLowerCase().includes(disliked.toLowerCase()) ||
      disliked.toLowerCase().includes(note.toLowerCase())
    )
    if (isDisliked) return "disliked"
    
    return "neutral"
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Deep Dive
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Perfume Header */}
        <section className="mb-16 text-center">
          <p className="text-sm text-muted-foreground mb-2">{perfume.brand}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-4">
            {perfume.name}
          </h1>
          <Badge 
            className={isRecommended 
              ? "bg-foreground text-background" 
              : "bg-muted text-muted-foreground"
            }
          >
            {isRecommended ? "Recommended" : "Not for you"}
          </Badge>
        </section>

        {/* Note Pyramid */}
        <section className="mb-16">
          <h2 className="font-serif text-xl font-medium text-foreground mb-8 text-center">
            Fragrance Structure
          </h2>

          <div className="space-y-8">
            {/* Top Notes */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Top Notes
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                First impression, 15-30 minutes
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.top.map((note) => {
                  const status = getNoteStatus(note)
                  return (
                    <NoteChip key={note} note={note} status={status} />
                  )
                })}
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-border" />
            </div>

            {/* Middle Notes */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Heart Notes
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Core character, 30 min - 3 hours
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.middle.map((note) => {
                  const status = getNoteStatus(note)
                  return (
                    <NoteChip key={note} note={note} status={status} />
                  )
                })}
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-border" />
            </div>

            {/* Base Notes */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Base Notes
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Foundation, 3+ hours to dry down
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {perfume.notes.base.map((note) => {
                  const status = getNoteStatus(note)
                  return (
                    <NoteChip key={note} note={note} status={status} />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          {preferences && (
            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground" />
                <span>You enjoy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/30" />
                <span>You avoid</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span>Neutral</span>
              </div>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-border mb-16" />

        {/* AI Explanation */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="font-serif text-xl font-medium text-foreground mb-2">
              {isRecommended ? "Why This Fits Your Taste" : "Why This May Not Suit You"}
            </h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Personalized Analysis
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            <p className="text-foreground leading-relaxed text-base md:text-lg mb-6">
              {perfume.fullExplanation || perfume.aiExplanation}
            </p>

            {/* Compatibility Summary */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isRecommended 
                    ? "bg-foreground text-background" 
                    : "bg-muted text-muted-foreground"
                  }
                `}>
                  {isRecommended ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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

        {/* Wear Suggestions */}
        <section className="mb-16">
          <h2 className="font-serif text-xl font-medium text-foreground mb-6">
            When to Wear
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getWearSuggestions(perfume).map((suggestion) => (
              <div 
                key={suggestion.label}
                className={`
                  p-4 rounded-lg border text-center
                  ${suggestion.suitable 
                    ? "bg-card border-border" 
                    : "bg-muted/30 border-border/50 opacity-60"
                  }
                `}
              >
                <p className="text-sm font-medium text-foreground mb-1">
                  {suggestion.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.suitability}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Back Button */}
        <section className="pt-8 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discovery
          </Button>
        </section>
      </div>
    </main>
  )
}

interface NoteChipProps {
  note: string
  status: "preferred" | "disliked" | "neutral"
}

function NoteChip({ note, status }: NoteChipProps) {
  const baseClasses = "px-4 py-2 rounded-full text-sm font-medium transition-all"
  
  const statusClasses = {
    preferred: "bg-foreground text-background",
    disliked: "bg-destructive/10 text-destructive border border-destructive/30",
    neutral: "bg-secondary text-secondary-foreground"
  }

  return (
    <span className={`${baseClasses} ${statusClasses[status]}`}>
      {note}
    </span>
  )
}

function getWearSuggestions(perfume: Perfume) {
  // Simple logic based on notes - in real app this would be AI-generated
  const hasWoody = [...perfume.notes.middle, ...perfume.notes.base].some(n => 
    ["sandalwood", "cedar", "oud", "vetiver", "patchouli"].some(w => n.toLowerCase().includes(w))
  )
  const hasFresh = perfume.notes.top.some(n =>
    ["citrus", "bergamot", "mint", "marine", "green"].some(f => n.toLowerCase().includes(f))
  )
  const hasSweet = [...perfume.notes.middle, ...perfume.notes.base].some(n =>
    ["vanilla", "caramel", "honey", "amber", "benzoin"].some(s => n.toLowerCase().includes(s))
  )

  return [
    { label: "Daily Wear", suitability: hasFresh ? "Excellent" : "Good", suitable: true },
    { label: "Work", suitability: hasWoody && !hasSweet ? "Excellent" : hasFresh ? "Good" : "Fair", suitable: hasFresh || hasWoody },
    { label: "Evening", suitability: hasSweet || hasWoody ? "Excellent" : "Good", suitable: true },
    { label: "Date Night", suitability: hasSweet ? "Excellent" : hasWoody ? "Good" : "Fair", suitable: hasSweet || hasWoody },
    { label: "Weekend", suitability: "Good", suitable: true },
    { label: "Special Event", suitability: hasWoody && hasSweet ? "Excellent" : "Good", suitable: true }
  ]
}
