"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserPreferences, Perfume } from "@/app/page"
import { Settings, ArrowRight } from "lucide-react"

interface DashboardProps {
  preferences: UserPreferences | null
  onSelectPerfume: (perfume: Perfume) => void
  onViewRecommendation: (perfume: Perfume) => void
  onNavigateToPreferences: () => void
}

const samplePerfumes: Perfume[] = [
  {
    id: "1",
    name: "Santal 33",
    brand: "Le Labo",
    notes: {
      top: ["Cardamom", "Iris", "Violet"],
      middle: ["Ambrox", "Australian Sandalwood"],
      base: ["Cedarwood", "Leather", "Musk"]
    },
    aiExplanation: "This woody-spicy composition aligns with your preference for warm, earthy scents. The sandalwood creates a creamy foundation that complements your noted appreciation for subtle, long-lasting fragrances.",
    fullExplanation: "Santal 33 represents a modern interpretation of the classic sandalwood perfume. The Australian sandalwood at its heart creates a creamy, addictive quality that you tend to gravitate toward based on your preference profile. The leather and cardamom notes add complexity without overwhelming, which matches your stated preference for refined rather than bold scents. This fragrance works exceptionally well for daily wear, particularly in professional settings where you mentioned wanting subtle projection.",
    isRecommended: true
  },
  {
    id: "2",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    notes: {
      top: ["Saffron", "Jasmine"],
      middle: ["Amberwood", "Ambergris"],
      base: ["Fir Resin", "Cedar"]
    },
    aiExplanation: "While technically masterful, this fragrance may be too sweet for your palate. Your dislike of gourmand notes suggests the caramelized amber might feel cloying over extended wear.",
    fullExplanation: "Baccarat Rouge 540 is undeniably beautiful, but our analysis suggests it may not align with your taste profile. The prominent sweetness from the amberwood and jasmine combination creates a gourmand-adjacent quality that conflicts with your stated preference for fresh, clean scents. Additionally, its strong projection might feel overwhelming given your preference for intimate sillage. However, if you enjoy amber notes in isolation, you might appreciate the dry-down phase more than the opening.",
    isRecommended: false
  },
  {
    id: "3",
    name: "Bleu de Chanel",
    brand: "Chanel",
    notes: {
      top: ["Citrus", "Mint", "Pink Pepper"],
      middle: ["Grapefruit", "Nutmeg", "Jasmine"],
      base: ["Labdanum", "Cedar", "Sandalwood"]
    },
    aiExplanation: "A versatile choice that matches your need for a daily signature scent. The citrus opening provides freshness while the woody base offers the depth you appreciate.",
    fullExplanation: "Bleu de Chanel demonstrates excellent versatility, making it suitable for your mentioned use cases: daily wear, work environments, and casual outings. The fresh citrus opening aligns perfectly with your preference for clean, uplifting scents. As it develops, the woody base notes provide the subtle sophistication you mentioned wanting without becoming too heavy. Its moderate projection respects the office environment consideration you noted. This is a safe, crowd-pleasing choice that still maintains character.",
    isRecommended: true
  },
  {
    id: "4",
    name: "Portrait of a Lady",
    brand: "Frederic Malle",
    notes: {
      top: ["Turkish Rose", "Raspberry"],
      middle: ["Clove", "Cinnamon", "Patchouli"],
      base: ["Sandalwood", "Musk", "Amber"]
    },
    aiExplanation: "This opulent rose-patchouli blend offers the complexity you seek for special occasions. However, the spicy intensity may conflict with your preference for understated elegance.",
    fullExplanation: "Portrait of a Lady is a masterpiece of perfumery, but it presents an interesting tension with your preferences. On one hand, you appreciate complex, layered compositions—and this delivers exceptionally on that front. The Turkish rose and patchouli combination creates remarkable depth. However, the prominent spice notes (clove and cinnamon) may feel aggressive given your stated preference for softer, more approachable scents. Consider this for evening events where bold statements are welcome, rather than daily wear.",
    isRecommended: true
  },
  {
    id: "5",
    name: "Another 13",
    brand: "Le Labo",
    notes: {
      top: ["Pear", "Aldehyde"],
      middle: ["Ambroxan", "Jasmine Petals"],
      base: ["Moss", "Musk"]
    },
    aiExplanation: "A skin-scent philosophy that mirrors your desire for intimacy over projection. The synthetic musks create a personal aura rather than announcing your presence.",
    fullExplanation: "Another 13 represents a fascinating approach to fragrance that aligns beautifully with your stated aesthetic preferences. You mentioned wanting scents that feel like a second skin rather than a statement—this perfume delivers exactly that. The Ambroxan creates a clean, almost metallic warmth that melds with your natural chemistry. The minimalist structure appeals to your noted appreciation for restraint in composition. This is less about smelling like something and more about enhancing your natural presence.",
    isRecommended: true
  }
]

export default function Dashboard({ 
  preferences, 
  onSelectPerfume, 
  onViewRecommendation,
  onNavigateToPreferences 
}: DashboardProps) {
  const analyzedCount = samplePerfumes.length
  const recommendedCount = samplePerfumes.filter(p => p.isRecommended).length

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-medium text-foreground">Scentory</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNavigateToPreferences}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction Section */}
        <section className="mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4 text-balance">
            Discover why scents
            <br />
            speak to you
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            We analyze perfumes and explain their connection to your taste profile. 
            Each card below contains our AI-generated insights about why a fragrance 
            might—or might not—suit you.
          </p>
        </section>

        {/* Stats Bar */}
        {preferences && (
          <section className="mb-12 flex items-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Analyzed: </span>
              <span className="font-medium text-foreground">{analyzedCount} perfumes</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="text-muted-foreground">Recommended: </span>
              <span className="font-medium text-foreground">{recommendedCount} matches</span>
            </div>
          </section>
        )}

        {/* Preference Setup Prompt */}
        {!preferences && (
          <section className="mb-12 p-6 bg-muted/50 rounded-lg border border-border">
            <p className="text-foreground mb-3">
              To receive personalized explanations, tell us about your scent preferences.
            </p>
            <Button 
              onClick={onNavigateToPreferences}
              variant="outline"
              className="text-sm bg-transparent"
            >
              Set Up Preferences
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </section>
        )}

        {/* Perfume Cards */}
        <section className="space-y-6">
          {samplePerfumes.map((perfume) => (
            <PerfumeCard 
              key={perfume.id}
              perfume={perfume}
              onSelect={() => onSelectPerfume(perfume)}
              onViewRecommendation={() => onViewRecommendation(perfume)}
            />
          ))}
        </section>
      </div>
    </main>
  )
}

interface PerfumeCardProps {
  perfume: Perfume
  onSelect: () => void
  onViewRecommendation: () => void
}

function PerfumeCard({ perfume, onSelect, onViewRecommendation }: PerfumeCardProps) {
  const allNotes = [...perfume.notes.top, ...perfume.notes.middle.slice(0, 2)]
  
  return (
    <article 
      className="group p-6 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground mb-1">
            {perfume.name}
          </h3>
          <p className="text-sm text-muted-foreground">{perfume.brand}</p>
        </div>
        {perfume.isRecommended !== undefined && (
          <Badge 
            variant={perfume.isRecommended ? "default" : "secondary"}
            className={perfume.isRecommended 
              ? "bg-foreground text-background" 
              : "bg-muted text-muted-foreground"
            }
          >
            {perfume.isRecommended ? "Recommended" : "Not for you"}
          </Badge>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-wrap gap-2 mb-5">
        {allNotes.map((note) => (
          <span 
            key={note}
            className="px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded-full"
          >
            {note}
          </span>
        ))}
      </div>

      {/* AI Explanation Preview */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {perfume.aiExplanation}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onViewRecommendation()
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View Analysis
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Deep Dive
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </article>
  )
}
