// App.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LanguageCode } from './constants/languages';
import LanguageSelector from './components/languageselector';
import Dashboard from './components/dashboard';
import NumberTap from './components/challenges/NumberTap';
import MathSprint from './components/challenges/MathSprint';
import MemoryNumbers from './components/challenges/MemoryNumbers';
import PatternMatch from './components/challenges/PatternMatch';
import MemoryMatrix from './components/challenges/MemoryMatrix';  
import PatternPath from './components/challenges/PatternPath';
import PrimeHunter from './components/challenges/PrimeHunter';
import SequenceMaster from './components/challenges/SequenceMaster';
import DivisionChallenge from './components/challenges/DivisionChallenge';
import MentalArithmetic from './components/challenges/MentalArithmetic';
import MathFactMaster from './components/challenges/MathFact';
import InfiniteMathZen from './components/challenges/InfiniteMathZen';
import MathStream from './components/challenges/MathStream';
import ReflexRush from './components/challenges/ReflexRush';

type AppState = 'language-select' | 'dashboard' | 'challenge';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('language-select');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);

  const handleLanguageSelect = (selectedLanguage: LanguageCode) => {
    setLanguage(selectedLanguage);
    setCurrentState('dashboard');
  };

  const handleChallengeSelect = (challengeId: string) => {
    setCurrentChallenge(challengeId);
    setCurrentState('challenge');
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
    setCurrentChallenge(null);
  };

  const handleLanguageChange = () => {
    setCurrentState('language-select');
  };

  const renderChallenge = () => {
    const props = { language, onBack: handleBackToDashboard };
    
    switch (currentChallenge) {
      case 'numberTap':
        return <NumberTap {...props} />;
      case 'mathSprint':
        return <MathSprint {...props} />;
      case 'memoryNumbers':
        return <MemoryNumbers {...props} />;
      case 'patternMatch':
        return <PatternMatch {...props} />;
      case 'memoryMatrix':
        return <MemoryMatrix {...props} />;
      case 'patternPath':
        return <PatternPath {...props} />;
      case 'primeHunter':
        return <PrimeHunter {...props} />;
      case 'sequenceMaster':
        return <SequenceMaster {...props} />;
      case 'divisionChallenge':
        return <DivisionChallenge {...props} />;
      case 'mentalArithmetic':
        return <MentalArithmetic {...props} />;
      case 'mathFactMaster':
        return <MathFactMaster {...props} />;
      case 'infiniteMathZen':
        return <InfiniteMathZen {...props} />;
      case 'mathStream':
        return <MathStream {...props} />;
      case 'reflexRush':
        return <ReflexRush {...props} />;
      default:
        return null;
    }
  };

  const renderCurrentScreen = () => {
    switch (currentState) {
      case 'language-select':
        return (
          <LanguageSelector
            onLanguageSelect={handleLanguageSelect}
            currentLanguage={language}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            language={language}
            onLanguageChange={handleLanguageChange}
            onChallengeSelect={handleChallengeSelect}
          />
        );
      case 'challenge':
        return renderChallenge();
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderCurrentScreen()}
      <StatusBar style="light" />
    </View>
  );
}