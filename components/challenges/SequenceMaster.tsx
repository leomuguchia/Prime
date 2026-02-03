import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type SequenceType = 'arithmetic' | 'geometric' | 'square' | 'fibonacci' | 'alternating';

interface Sequence {
  type: SequenceType;
  numbers: number[];
  nextNumber: number;
  options: number[];
}

export default function SequenceMaster({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [currentSequence, setCurrentSequence] = useState<Sequence | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));

  const t = LANGUAGES[language];

  // Generate arithmetic sequence (e.g., 2, 4, 6, 8, ?)
  const generateArithmetic = (): Sequence => {
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = Math.floor(Math.random() * 5) + 1;
    const length = 4;
    const numbers = Array.from({ length }, (_, i) => start + i * diff);
    const nextNumber = start + length * diff;
    
    const wrongOptions = [
      nextNumber + diff,
      nextNumber - diff,
      nextNumber + 1,
      nextNumber - 1,
      nextNumber + 2,
      nextNumber - 2
    ].filter(n => n > 0 && n !== nextNumber);
    
    const options = [
      nextNumber,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'arithmetic',
      numbers,
      nextNumber,
      options
    };
  };

  // Generate geometric sequence (e.g., 2, 4, 8, 16, ?)
  const generateGeometric = (): Sequence => {
    const start = Math.floor(Math.random() * 5) + 1;
    const ratio = Math.floor(Math.random() * 3) + 2;
    const length = 4;
    const numbers = Array.from({ length }, (_, i) => start * Math.pow(ratio, i));
    const nextNumber = start * Math.pow(ratio, length);
    
    const wrongOptions = [
      nextNumber + ratio,
      nextNumber - ratio,
      nextNumber * ratio,
      Math.floor(nextNumber / ratio),
      nextNumber + start,
      nextNumber - start
    ].filter(n => n > 0 && n !== nextNumber && n < 1000);
    
    const options = [
      nextNumber,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'geometric',
      numbers,
      nextNumber,
      options
    };
  };

  // Generate square numbers (e.g., 1, 4, 9, 16, ?)
  const generateSquare = (): Sequence => {
    const start = Math.floor(Math.random() * 5) + 1;
    const length = 4;
    const numbers = Array.from({ length }, (_, i) => Math.pow(start + i, 2));
    const nextNumber = Math.pow(start + length, 2);
    
    const wrongOptions = [
      Math.pow(start + length + 1, 2),
      Math.pow(start + length - 1, 2),
      nextNumber + (start + length),
      nextNumber - (start + length),
      (start + length) * (start + length + 1),
      (start + length) * (start + length - 1)
    ].filter(n => n > 0 && n !== nextNumber);
    
    const options = [
      nextNumber,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'square',
      numbers,
      nextNumber,
      options
    };
  };

  // Generate Fibonacci-like sequence
  const generateFibonacci = (): Sequence => {
    let a = Math.floor(Math.random() * 5) + 1;
    let b = a + Math.floor(Math.random() * 3) + 1;
    const length = 4;
    const numbers = [a, b];
    
    for (let i = 2; i < length; i++) {
      const next = numbers[i-1] + numbers[i-2];
      numbers.push(next);
    }
    
    const nextNumber = numbers[length-1] + numbers[length-2];
    
    const wrongOptions = [
      nextNumber + 1,
      nextNumber - 1,
      nextNumber + numbers[length-1],
      nextNumber - numbers[length-2],
      numbers[length-1] * 2,
      numbers[length-2] * 3
    ].filter(n => n > 0 && n !== nextNumber);
    
    const options = [
      nextNumber,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'fibonacci',
      numbers,
      nextNumber,
      options
    };
  };

  // Generate alternating pattern (e.g., +3, -1, +3, -1)
  const generateAlternating = (): Sequence => {
    const start = Math.floor(Math.random() * 10) + 1;
    const pattern = [
      Math.floor(Math.random() * 5) + 1,
      -Math.floor(Math.random() * 3) - 1
    ];
    const length = 4;
    const numbers = [start];
    
    for (let i = 1; i < length; i++) {
      const patternIndex = (i - 1) % pattern.length;
      numbers.push(numbers[i-1] + pattern[patternIndex]);
    }
    
    const patternIndex = (length - 1) % pattern.length;
    const nextNumber = numbers[length-1] + pattern[patternIndex];
    
    const wrongOptions = [
      nextNumber + pattern[0],
      nextNumber + pattern[1],
      nextNumber + 1,
      nextNumber - 1,
      numbers[length-1] + pattern[(patternIndex + 1) % pattern.length],
      numbers[length-1] + pattern[patternIndex] * 2
    ].filter(n => n > 0 && n !== nextNumber);
    
    const options = [
      nextNumber,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'alternating',
      numbers,
      nextNumber,
      options
    };
  };

  const generateSequence = (): Sequence => {
    const sequenceTypes: SequenceType[] = [
      'arithmetic',
      'geometric', 
      'square',
      'fibonacci',
      'alternating'
    ];
    
    const type = sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)];
    
    switch (type) {
      case 'arithmetic':
        return generateArithmetic();
      case 'geometric':
        return generateGeometric();
      case 'square':
        return generateSquare();
      case 'fibonacci':
        return generateFibonacci();
      case 'alternating':
        return generateAlternating();
      default:
        return generateArithmetic();
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setStreak(0);
    setGameActive(true);
    setCurrentSequence(generateSequence());
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswer = (selectedNumber: number) => {
    if (!gameActive || !currentSequence) return;

    if (selectedNumber === currentSequence.nextNumber) {
      // Correct answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const basePoints = 10;
      const streakBonus = Math.min(streak * 2, 20); // Max 20 bonus points
      const points = basePoints + streakBonus;
      
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      
      // Generate new sequence
      setCurrentSequence(generateSequence());
    } else {
      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
      setStreak(0);
      
      // Time penalty
      setTimeLeft(prev => Math.max(0, prev - 2));
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.05) {
            clearInterval(interval);
            setGameActive(false);
            
            if (score > bestScore) {
              setBestScore(score);
              Alert.alert('🎉 New Record!', `Score: ${score}\nStreak: ${streak}`);
            } else {
              Alert.alert('Time\'s Up!', `Score: ${score}\nBest: ${bestScore}\nFinal Streak: ${streak}`);
            }
            return 0;
          }
          return Number((prev - 0.05).toFixed(2));
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [gameActive, timeLeft]);

  const getSequenceTypeName = (type: SequenceType): string => {
    switch (type) {
      case 'arithmetic': return 'Arithmetic';
      case 'geometric': return 'Geometric';
      case 'square': return 'Square Numbers';
      case 'fibonacci': return 'Fibonacci';
      case 'alternating': return 'Alternating';
      default: return 'Pattern';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Sequence Master</Text>
          <Text style={styles.subtitle}>Prime</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={[styles.statValue, timeLeft < 10 && styles.timeLow]}>
            {timeLeft.toFixed(1)}s
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValue}>{streak}</Text>
        </View>
      </View>

      {/* Sequence Display */}
      <Animated.View style={[styles.sequenceContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.sequenceType}>
          <Text style={styles.sequenceTypeText}>
            {currentSequence ? getSequenceTypeName(currentSequence.type) : 'Pattern'}
          </Text>
        </View>
        
        <View style={styles.sequenceNumbers}>
          {currentSequence?.numbers.map((num, index) => (
            <View key={index} style={styles.sequenceNumber}>
              <Text style={styles.sequenceNumberText}>{num}</Text>
            </View>
          ))}
          <View style={styles.questionMark}>
            <Text style={styles.questionMarkText}>?</Text>
          </View>
        </View>
        
        <Text style={styles.sequencePrompt}>What comes next?</Text>
      </Animated.View>

      {/* Answer Options */}
      <View style={styles.optionsGrid}>
        {currentSequence?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
            disabled={!gameActive}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>BEST SCORE:</Text>
          <Text style={styles.infoValue}>{bestScore}</Text>
        </View>
        {streak > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>STREAK BONUS:</Text>
            <Text style={styles.infoValue}>+{Math.min(streak * 2, 20)}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? `Find the pattern: ${currentSequence?.numbers.join(', ')}...` 
            : timeLeft === 0 
              ? 'Time\'s up! Tap START to play again'
              : 'Identify number patterns in 60 seconds'
          }
        </Text>
      </View>

      {/* Control */}
      <TouchableOpacity 
        style={[styles.controlButton, gameActive && styles.controlButtonActive]}
        onPress={gameActive ? () => setGameActive(false) : startGame}
      >
        <Text style={[styles.controlText, gameActive && styles.controlTextActive]}>
          {gameActive ? 'STOP' : 'START'}
        </Text>
      </TouchableOpacity>
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
  timeLow: {
    color: '#FF0000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  sequenceContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  sequenceType: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  sequenceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sequenceNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sequenceNumber: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  sequenceNumberText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  questionMark: {
    backgroundColor: '#000000',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 4,
  },
  questionMarkText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sequencePrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    width: 70,
    height: 70,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  gameInfo: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  controlButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 140,
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
});