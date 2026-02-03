import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

const GRID_SIZE = 25;

export default function NumberTap({ language, onBack }: Props) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [time, setTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Number Tap</Text>
          <Text style={styles.subtitle}>Prime</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CURRENT</Text>
          <Text style={styles.statValue}>{nextNumber}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{time.toFixed(2)}s</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>
            {bestTime ? `${bestTime.toFixed(2)}s` : '--'}
          </Text>
        </View>
      </View>

      {/* Target Indicator */}
      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>Find & Tap</Text>
        <Text style={styles.targetNumber}>{nextNumber}</Text>
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
                number === nextNumber && styles.nextNumberTile,
                number < nextNumber && styles.completedTile,
                !gameActive && styles.disabledTile
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
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, gameActive && styles.controlButtonActive]}
          onPress={gameActive ? () => setGameActive(false) : startGame}
        >
          <Text style={[styles.controlText, gameActive && styles.controlTextActive]}>
            {gameActive ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.instructions}>
          {gameActive ? 'Tap numbers in order' : 'Tap START to begin'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  targetContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  targetLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  targetNumber: {
    fontSize: 36,
    fontWeight: '500',
    color: '#000000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 8,
  },
  numberTile: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nextNumberTile: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  completedTile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F0F0',
  },
  disabledTile: {
    backgroundColor: '#F8F8F8',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  nextNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  completedNumberText: {
    color: '#CCCCCC',
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 140,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FF0000',
  },
  controlText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  controlTextActive: {
    fontWeight: '700',
  },
  instructions: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
  },
});