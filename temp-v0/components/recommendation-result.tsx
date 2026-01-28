"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserPreferences, Perfume } from "@/app/page"
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react"

interface RecommendationResultProps {
  perfume: Perfume
  preferences: UserPreferences | null
  onBack: () => void
  onViewDetail: () => void
}

export default function RecommendationResult({ 
  perfume, 
  preferences, 
  onBack, 
  onViewDetail 
}: RecommendationResultProps) {
  const isRecommended = perfume.isRecommended ?? true

  // Find matching and conflicting notes based on preferences
  const allPerfumeNotes = [
    ...perfume.notes.top, 
    ...perfume.notes.middle, 
    ...perfume.notes.base
  ]
  
  const matchingNotes = preferences 
    ? allPerfumeNotes.filter(note => 
        preferences.preferredNotes.some(pref => 
          note.toLowerCase().includes(pref.toLowerCase()) || 
          pref.toLowerCase().includes(note.toLowerCase())
        )
      )
    : []
  
  const conflictingNotes = preferences
    ? allPerfumeNotes.filter(note =>
        preferences.dislikedNotes.some(disliked =>
          note.toLowerCase().includes(disliked.toLowerCase()) ||
          disliked.toLowerCase().includes(note.toLowerCase())
        )
      )
    : []

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
            <span className="text-sm">Back to Discovery</span>
          </button>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Analysis Report
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Perfume Header */}
        <section className="mb-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">{perfume.brand}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-6">
            {perfume.name}
          </h1>
          
          {/* Recommendation Badge */}
          <div className="inline-flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isRecommended 
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground"
              }
            `}>
              {isRecommended ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <p className={`font-medium ${isRecommended ? "text-foreground" : "text-muted-foreground"}`}>
                {isRecommended ? "Recommended for You" : "Not Recommended"}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on your preference profile
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="w-full h-px bg-border mb-12" />

        {/* AI Reasoning Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="font-serif text-xl font-medium text-foreground mb-2">
              Our Analysis
            </h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Why this {isRecommended ? "works" : "may not work"} for you
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            <p className="text-foreground leading-relaxed text-base md:text-lg">
              {perfume.fullExplanation || perfume.aiExplanation}
            </p>
          </div>
        </section>

        {/* Note Analysis */}
        {preferences && (matchingNotes.length > 0 || conflictingNotes.length > 0) && (
          <section className="mb-12">
            <h2 className="font-serif text-xl font-medium text-foreground mb-6">
              Note Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Matching Notes */}
              {matchingNotes.length > 0 && (
                <div className="p-5 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Check className="w-4 h-4 text-foreground" />
                    <h3 className="font-medium text-foreground">Notes You Enjoy</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchingNotes.map((note) => (
                      <Badge 
                        key={note}
                        className="bg-foreground text-background"
                      >
                        {note}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    These notes align with your stated preferences
                  </p>
                </div>
              )}

              {/* Conflicting Notes */}
              {conflictingNotes.length > 0 && (
                <div className="p-5 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <X className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-foreground">Notes You Avoid</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {conflictingNotes.map((note) => (
                      <Badge 
                        key={note}
                        variant="secondary"
                        className="bg-muted text-muted-foreground"
                      >
                        {note}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    These notes conflict with your stated dislikes
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Key Takeaway */}
        <section className="mb-12 p-6 bg-muted/50 border border-border rounded-lg">
          <h3 className="font-serif text-lg font-medium text-foreground mb-3">
            Key Takeaway
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {isRecommended 
              ? `${perfume.name} aligns well with your preference profile. The fragrance structure suggests it would complement your taste for ${preferences?.preferredNotes.slice(0, 2).join(" and ") || "sophisticated scents"} without overwhelming notes you typically avoid.`
              : `While ${perfume.name} is a well-crafted fragrance, our analysis suggests it may not suit your specific preferences. The presence of notes you tend to avoid could make this a challenging wear for you.`
            }
          </p>
        </section>

        {/* Actions */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discovery
          </Button>
          
          <Button 
            onClick={onViewDetail}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Explore Full Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </section>
      </div>
    </main>
  )
}
