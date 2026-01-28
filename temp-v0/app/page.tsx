"use client"

import { useState } from "react"
import LoginScreen from "@/components/login-screen"
import Dashboard from "@/components/dashboard"
import PreferenceSetup from "@/components/preference-setup"
import RecommendationResult from "@/components/recommendation-result"
import PerfumeDetail from "@/components/perfume-detail"

export type Screen = "login" | "dashboard" | "preference-setup" | "recommendation" | "detail"

export interface UserPreferences {
  preferredNotes: string[]
  dislikedNotes: string[]
  situations: string[]
}

export interface Perfume {
  id: string
  name: string
  brand: string
  notes: {
    top: string[]
    middle: string[]
    base: string[]
  }
  aiExplanation: string
  fullExplanation?: string
  isRecommended?: boolean
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null)

  const handleLogin = () => {
    setIsLoggedIn(true)
    setCurrentScreen("dashboard")
  }

  const handleSetPreferences = (prefs: UserPreferences) => {
    setPreferences(prefs)
    setCurrentScreen("dashboard")
  }

  const handleSelectPerfume = (perfume: Perfume) => {
    setSelectedPerfume(perfume)
    setCurrentScreen("detail")
  }

  const handleViewRecommendation = (perfume: Perfume) => {
    setSelectedPerfume(perfume)
    setCurrentScreen("recommendation")
  }

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  if (currentScreen === "login") {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (currentScreen === "preference-setup") {
    return (
      <PreferenceSetup 
        onSave={handleSetPreferences} 
        onBack={() => navigateTo("dashboard")}
        initialPreferences={preferences}
      />
    )
  }

  if (currentScreen === "recommendation" && selectedPerfume) {
    return (
      <RecommendationResult 
        perfume={selectedPerfume}
        preferences={preferences}
        onBack={() => navigateTo("dashboard")}
        onViewDetail={() => navigateTo("detail")}
      />
    )
  }

  if (currentScreen === "detail" && selectedPerfume) {
    return (
      <PerfumeDetail 
        perfume={selectedPerfume}
        preferences={preferences}
        onBack={() => navigateTo("dashboard")}
      />
    )
  }

  return (
    <Dashboard 
      preferences={preferences}
      onSelectPerfume={handleSelectPerfume}
      onViewRecommendation={handleViewRecommendation}
      onNavigateToPreferences={() => navigateTo("preference-setup")}
    />
  )
}
