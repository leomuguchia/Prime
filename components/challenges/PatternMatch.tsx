import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type PatternType = 'arithmetic' | 'geometric' | 'alternating';

export default function PatternMatch({ language, onBack }: Props) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [currentPatternType, setCurrentPatternType] = useState<PatternType>('arithmetic');
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [streak, setStreak] = useState(0);

  const t = LANGUAGES[language];

  const generatePattern = (patternType: PatternType, length: number = 4) => {
    let sequence: number[] = [];
    const start = Math.floor(Math.random() * 10) + 1;
    
    switch (patternType) {
      case 'arithmetic':
        const difference = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < length; i++) {
          sequence.push(start + i * difference);
        }
        break;
      case 'geometric':
        const ratio = Math.floor(Math.random() * 3) + 2;
        let current = start;
        for (let i = 0; i < length; i++) {
          sequence.push(current);
          current *= ratio;
        }
        break;
      case 'alternating':
        const altDiff = Math.floor(Math.random() * 4) + 1;
        let altCurrent = start;
        for (let i = 0; i < length; i++) {
          sequence.push(altCurrent);
          altCurrent += (i % 2 === 0 ? altDiff : -altDiff);
        }
        break;
    }
    
    return sequence;
  };

  const generateOptions = (correctAnswer: number) => {
    const optionsSet = new Set<number>([correctAnswer]);
    
    while (optionsSet.size < 4) {
      const randomOffset = Math.floor(Math.random() * 20) - 10;
      const wrongAnswer = correctAnswer + randomOffset;
      if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && !optionsSet.has(wrongAnswer)) {
        optionsSet.add(wrongAnswer);
      }
    }
    
    return Array.from(optionsSet).sort(() => Math.random() - 0.5);
  };

  const startLevel = () => {
    const patternTypes: PatternType[] = ['arithmetic', 'geometric', 'alternating'];
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    const fullPattern = generatePattern(patternType, 4);
    const displayPattern = fullPattern.slice(0, 3);
    const nextNumber = fullPattern[3];
    
    setPattern(displayPattern);
    setCurrentPatternType(patternType);
    setCorrectAnswer(nextNumber);
    setOptions(generateOptions(nextNumber));
    setGameActive(true);
  };

  const handleAnswer = (selectedAnswer: number) => {
    if (!gameActive) return;

    if (selectedAnswer === correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const basePoints = 10;
      const streakBonus = Math.min(streak * 2, 20);
      const totalPoints = basePoints + streakBonus;
      
      setScore(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      setLevel(prev => prev + 1);
      startLevel();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameActive(false);
      setStreak(0);
      
      if (score > bestScore) {
        setBestScore(score);
        Alert.alert(
          '🎉 New Record!',
          `Score: ${score}\nLevel: ${level}\nStreak: ${streak}`
        );
      } else {
        Alert.alert(
          'Pattern Complete',
          `Score: ${score}\nLevel: ${level}\nBest: ${bestScore}`
        );
      }
    }
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setStreak(0);
    startLevel();
  };

  useEffect(() => {
    startLevel();
  }, []);

  const getPatternTypeName = (type: PatternType): string => {
    switch (type) {
      case 'arithmetic': return 'Arithmetic';
      case 'geometric': return 'Geometric';
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
          <Text style={styles.title}>Pattern Match</Text>
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
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
        </View>
      </View>

      {/* Pattern Type */}
      <View style={styles.patternTypeContainer}>
        <Text style={styles.patternTypeLabel}>PATTERN TYPE</Text>
        <Text style={styles.patternTypeValue}>
          {getPatternTypeName(currentPatternType)}
        </Text>
      </View>

      {/* Pattern Display */}
      <View style={styles.patternContainer}>
        <Text style={styles.patternPrompt}>Complete the pattern:</Text>
        
        <View style={styles.patternRow}>
          {pattern.map((num, index) => (
            <View key={index} style={styles.patternItem}>
              <Text style={styles.patternNumber}>{num}</Text>
              {index < pattern.length - 1 && (
                <Text style={styles.patternArrow}>→</Text>
              )}
            </View>
          ))}
          <View style={styles.questionItem}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        </View>
      </View>

      {/* Options Grid */}
      <View style={styles.optionsGrid}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, !gameActive && styles.optionButtonDisabled]}
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
          <Text style={styles.infoLabel}>STREAK:</Text>
          <Text style={styles.infoValue}>
            {streak} (+{Math.min(streak * 2, 20)} bonus)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PATTERN:</Text>
          <Text style={styles.infoValue}>
            {pattern.join(', ')} → ?
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!gameActive ? (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={startGame}
          >
            <Text style={styles.controlText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={() => setGameActive(false)}
          >
            <Text style={styles.controlText}>QUIT</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? 'Find the number that continues the pattern' 
            : 'Tap PLAY AGAIN to continue'
          }
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
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  patternTypeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  patternTypeLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  patternTypeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  patternContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  patternPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 24,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternNumber: {
    fontSize: 36,
    fontWeight: '500',
    color: '#000000',
    width: 60,
    textAlign: 'center',
  },
  patternArrow: {
    fontSize: 24,
    color: '#999999',
    fontWeight: '300',
    marginHorizontal: 8,
  },
  questionItem: {
    width: 60,
    height: 60,
    backgroundColor: '#000000',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  questionMark: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonDisabled: {
    backgroundColor: '#F8F8F8',
    opacity: 0.7,
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
  controls: {
    alignItems: 'center',
    marginBottom: 24,
  },
  controlButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  controlButtonSecondary: {
    backgroundColor: '#666666',
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});