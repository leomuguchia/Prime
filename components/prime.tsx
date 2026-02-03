import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

const GRID_SIZE = 25; // 5x5 grid

// Language definitions
const LANGUAGES = {
  en: {
    title: '🔢 PRIME: Math Reflex!',
    time: 'Time',
    best: 'Best',
    tap: 'Tap',
    start: 'Start!',
    tapping: 'Tapping...',
    newRecord: '🎉 New Record!',
    completed: '✅ Completed!',
    timeText: 'Time',
    bestText: 'Best'
  },
  es: {
    title: '🔢 PRIME: Math Reflex!',
    time: 'Tiempo',
    best: 'Mejor',
    tap: 'Toca',
    start: '¡Comenzar!',
    tapping: 'Tocando...',
    newRecord: '🎉 Nuevo Record!',
    completed: '✅ Completado!',
    timeText: 'Tiempo',
    bestText: 'Mejor'
  },
  fr: {
    title: '🔢 Numéro!',
    time: 'Temps',
    best: 'Meilleur',
    tap: 'Appuyez',
    start: 'Commencer!',
    tapping: 'En cours...',
    newRecord: '🎉 Nouveau Record!',
    completed: '✅ Terminé!',
    timeText: 'Temps',
    bestText: 'Meilleur'
  },
  de: {
    title: '🔢 Nummer!',
    time: 'Zeit',
    best: 'Beste',
    tap: 'Tippen',
    start: 'Starten!',
    tapping: 'Tippen...',
    newRecord: '🎉 Neuer Rekord!',
    completed: '✅ Abgeschlossen!',
    timeText: 'Zeit',
    bestText: 'Beste'
  },
  it: {
    title: '🔢 PRIME: Math Reflex!',
    time: 'Tempo',
    best: 'Migliore',
    tap: 'Tocca',
    start: 'Iniziare!',
    tapping: 'Toccando...',
    newRecord: '🎉 Nuovo Record!',
    completed: '✅ Completato!',
    timeText: 'Tempo',
    bestText: 'Migliore'
  },
  pt: {
    title: '🔢 Número!',
    time: 'Tempo',
    best: 'Melhor',
    tap: 'Toque',
    start: 'Começar!',
    tapping: 'Tocando...',
    newRecord: '🎉 Novo Recorde!',
    completed: '✅ Concluído!',
    timeText: 'Tempo',
    bestText: 'Melhor'
  },
  ja: {
    title: '🔢 数字!',
    time: '時間',
    best: 'ベスト',
    tap: 'タップ',
    start: 'スタート!',
    tapping: 'タップ中...',
    newRecord: '🎉 新記録!',
    completed: '✅ 完了!',
    timeText: '時間',
    bestText: 'ベスト'
  },
  ko: {
    title: '🔢 숫자!',
    time: '시간',
    best: '최고',
    tap: '탭',
    start: '시작!',
    tapping: '탭하는 중...',
    newRecord: '🎉 신기록!',
    completed: '✅ 완료!',
    timeText: '시간',
    bestText: '최고'
  }
};

type LanguageCode = keyof typeof LANGUAGES;

export default function PrimeGame() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [time, setTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [scaleAnims] = useState(() => 
    Array(GRID_SIZE).fill(0).map(() => new Animated.Value(1))
  );

  const t = LANGUAGES[language];

  // Initialize game
  const startGame = () => {
    generateNumbers();
    setNextNumber(1);
    setTime(0);
    setGameActive(true);
  };

  // Generate shuffled numbers 1-25
  const generateNumbers = () => {
    const numbersArray = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);
    const shuffled = numbersArray.sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  };

  // Number tap animation
  const tapAnimation = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Handle number tap
  const handleNumberTap = (number: number, index: number) => {
    if (!gameActive || number !== nextNumber) return;

    tapAnimation(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (number === GRID_SIZE) {
      // Game completed!
      setGameActive(false);
      const finalTime = time;
      
      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        Alert.alert(t.newRecord, `${t.timeText}: ${finalTime.toFixed(2)}s`);
      } else {
        Alert.alert(t.completed, `${t.timeText}: ${finalTime.toFixed(2)}s\n${t.bestText}: ${bestTime.toFixed(2)}s`);
      }
    }
    
    setNextNumber(prev => prev + 1);
  };

  // Cycle through languages
  const cycleLanguage = () => {
    const languages = Object.keys(LANGUAGES) as LanguageCode[];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameActive) {
      interval = setInterval(() => {
        setTime(prev => prev + 0.01);
      }, 10);
    }

    return () => clearInterval(interval);
  }, [gameActive]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cycleLanguage}>
          <Text style={styles.title}>{t.title}</Text>
        </TouchableOpacity>
        <View style={styles.stats}>
          <Text style={styles.timer}>{t.time}: {time.toFixed(2)}s</Text>
          {bestTime && <Text style={styles.bestTime}>{t.best}: {bestTime.toFixed(2)}s</Text>}
        </View>
      </View>

      {/* Current Target */}
      <View style={styles.targetSection}>
        <Text style={styles.targetText}>{t.tap}: {nextNumber}</Text>
      </View>

      {/* Language Indicator */}
      <View style={styles.languageIndicator}>
        <Text style={styles.languageText}>
          {language.toUpperCase()} 🌍
        </Text>
      </View>

      {/* Number Grid */}
      <View style={styles.grid}>
        {numbers.map((number, index) => (
          <Animated.View
            key={number}
            style={{ transform: [{ scale: scaleAnims[index] }] }}
          >
            <TouchableOpacity
              style={[
                styles.numberTile,
                number === nextNumber && styles.nextNumber,
                number < nextNumber && styles.completedNumber
              ]}
              onPress={() => handleNumberTap(number, index)}
              disabled={!gameActive || number !== nextNumber}
            >
              <Text style={[
                styles.numberText,
                number === nextNumber && styles.nextNumberText,
                number < nextNumber && styles.completedNumberText
              ]}>
                {number}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Controls */}
      <TouchableOpacity 
        style={[styles.button, !gameActive && styles.buttonActive]}
        onPress={startGame}
        disabled={gameActive}
      >
        <Text style={styles.buttonText}>
          {gameActive ? t.tapping : t.start}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  timer: {
    fontSize: 18,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  bestTime: {
    fontSize: 18,
    color: '#FFD93D',
    fontWeight: '600',
  },
  targetSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  targetText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  languageIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  languageText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  numberTile: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  nextNumber: {
    backgroundColor: '#4ECDC4',
    borderColor: '#fff',
  },
  completedNumber: {
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  numberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextNumberText: {
    color: '#000',
  },
  completedNumberText: {
    color: '#666',
  },
  button: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});