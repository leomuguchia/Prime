import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type Operation = '+' | '-' | '×' | '÷';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface MathProblem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  timeLimit: number; // seconds to answer
}

export default function MathStream({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timePlayed, setTimePlayed] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [bestTime, setBestTime] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const gameTimeRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const t = LANGUAGES[language];

  // Difficulty settings
  const DIFFICULTY_SETTINGS = {
    easy: {
      maxNumber: 20,
      operations: ['+', '-'],
      timeLimit: 5,
      points: 1,
      speedIncrease: 0.98, // 2% faster each correct answer
    },
    medium: {
      maxNumber: 50,
      operations: ['+', '-', '×'],
      timeLimit: 4,
      points: 2,
      speedIncrease: 0.975,
    },
    hard: {
      maxNumber: 100,
      operations: ['+', '-', '×', '÷'],
      timeLimit: 3,
      points: 3,
      speedIncrease: 0.97,
    },
    expert: {
      maxNumber: 200,
      operations: ['+', '-', '×', '÷'],
      timeLimit: 2,
      points: 5,
      speedIncrease: 0.965,
    }
  };

  // Generate a math problem based on difficulty
  const generateProblem = (): MathProblem => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const operation = settings.operations[Math.floor(Math.random() * settings.operations.length)] as Operation;
    
    let num1, num2, answer;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * settings.maxNumber) + 1;
        num2 = Math.floor(Math.random() * settings.maxNumber) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * settings.maxNumber) + 10;
        num2 = Math.floor(Math.random() * settings.maxNumber) + 1;
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        answer = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        num1 = answer * num2;
        break;
    }
    
    // Calculate dynamic time limit based on streak
    const baseTime = settings.timeLimit;
    const speedMultiplier = Math.pow(settings.speedIncrease, Math.min(streak, 50));
    const dynamicTimeLimit = Math.max(1, baseTime * speedMultiplier);
    
    return {
      num1: num1!,
      num2: num2!,
      operation,
      answer: answer!,
      timeLimit: parseFloat(dynamicTimeLimit.toFixed(1))
    };
  };

  // Start the infinite loop
  const startGame = () => {
    setScore(0);
    setTimePlayed(0);
    setLives(3);
    setStreak(0);
    setDifficulty('easy');
    setGameActive(true);
    setCurrentProblem(generateProblem());
    setTimeLeft(DIFFICULTY_SETTINGS.easy.timeLimit);
    
    // Start game timer
    gameTimeRef.current = setInterval(() => {
      setTimePlayed(prev => prev + 0.1);
    }, 100);
  };

  // Check answer and proceed
  const checkAnswer = () => {
    if (!userAnswer.trim() || !currentProblem) return;

    const userAnswerNum = parseInt(userAnswer);
    
    if (userAnswerNum === currentProblem.answer) {
      // Correct answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const settings = DIFFICULTY_SETTINGS[difficulty];
      const basePoints = settings.points;
      const streakBonus = Math.floor(streak / 5); // +1 point every 5 streak
      const points = basePoints + streakBonus;
      
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      
      // Increase difficulty based on streak
      if (streak >= 20 && difficulty !== 'expert') {
        setDifficulty('expert');
      } else if (streak >= 15 && difficulty !== 'hard') {
        setDifficulty('hard');
      } else if (streak >= 10 && difficulty !== 'medium') {
        setDifficulty('medium');
      }
      
      // Generate next problem
      pulseAnimation();
      const nextProblem = generateProblem();
      setCurrentProblem(nextProblem);
      setTimeLeft(nextProblem.timeLimit);
      setUserAnswer('');
      
    } else {
      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
      setStreak(0);
      
      // Lose a life
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          gameOver();
          return 0;
        }
        return newLives;
      });
      
      // Reset difficulty if lost many lives
      if (lives <= 2 && difficulty !== 'easy') {
        setDifficulty('easy');
      }
      
      // Same problem stays, user tries again
      setUserAnswer('');
    }
  };

  // Handle timeout (ran out of time)
  const handleTimeout = () => {
    if (!gameActive || !currentProblem) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setStreak(0);
    
    // Lose a life
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        gameOver();
        return 0;
      }
      return newLives;
    });
    
    // Reset difficulty if lost many lives
    if (lives <= 2 && difficulty !== 'easy') {
      setDifficulty('easy');
    }
    
    // Generate new problem
    const nextProblem = generateProblem();
    setCurrentProblem(nextProblem);
    setTimeLeft(nextProblem.timeLimit);
    setUserAnswer('');
  };

  // Game over
  const gameOver = () => {
    setGameActive(false);
    clearInterval(timerRef.current);
    clearInterval(gameTimeRef.current);
    
    if (timePlayed > bestTime) {
      setBestTime(timePlayed);
      Alert.alert(
        '🏆 New Record!',
        `Survived: ${timePlayed.toFixed(1)}s\nScore: ${score}\nDifficulty: ${difficulty}`,
        [{ text: 'Play Again', onPress: startGame }]
      );
    } else {
      Alert.alert(
        'Game Over',
        `Time: ${timePlayed.toFixed(1)}s\nScore: ${score}\nBest: ${bestTime.toFixed(1)}s`,
        [{ text: 'Play Again', onPress: startGame }]
      );
    }
  };

  // Animations
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // Timer for current problem
  useEffect(() => {
    if (gameActive && currentProblem) {
      clearInterval(timerRef.current);
      
      setTimeLeft(currentProblem.timeLimit);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.05) {
            handleTimeout();
            return 0;
          }
          return parseFloat((prev - 0.1).toFixed(1));
        });
      }, 100);
    }

    return () => clearInterval(timerRef.current);
  }, [gameActive, currentProblem]);

  // Auto-submit when answer length matches expected
  useEffect(() => {
    if (userAnswer.length > 0 && currentProblem) {
      const expectedLength = currentProblem.answer.toString().length;
      if (userAnswer.length === expectedLength) {
        setTimeout(() => checkAnswer(), 100);
      }
    }
  }, [userAnswer]);

  const handleSubmit = () => {
    checkAnswer();
  };

  const getDifficultyColor = (diff: Difficulty): string => {
    switch (diff) {
      case 'easy': return '#6BCF7F';
      case 'medium': return '#FFD93D';
      case 'hard': return '#FF6B6B';
      case 'expert': return '#9D4EDD';
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
          <Text style={styles.title}>Math Stream</Text>
          <Text style={styles.subtitle}>Prime</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        
        <View style={styles.livesContainer}>
          {[...Array(3)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.lifeDot,
                i < lives && styles.lifeActive,
                i >= lives && styles.lifeLost
              ]}
            />
          ))}
          <Text style={styles.livesText}>LIVES</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{timePlayed.toFixed(1)}s</Text>
        </View>
      </View>

      {/* Difficulty & Streak */}
      <View style={styles.midStats}>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
          <Text style={styles.difficultyText}>{difficulty.toUpperCase()}</Text>
        </View>
        
        <View style={styles.streakContainer}>
          <Text style={styles.streakLabel}>STREAK</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.streakValue}>{streak}</Text>
          </Animated.View>
        </View>
        
        <View style={styles.bestContainer}>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{bestTime.toFixed(1)}s</Text>
        </View>
      </View>

      {/* Problem Display */}
      <Animated.View style={[
        styles.problemContainer,
        { transform: [{ translateX: shakeAnim }] }
      ]}>
        {currentProblem && (
          <>
            <Text style={styles.problemText}>
              {currentProblem.num1} {currentProblem.operation} {currentProblem.num2} = ?
            </Text>
            <View style={styles.timeBar}>
              <View 
                style={[
                  styles.timeFill, 
                  { 
                    width: `${(timeLeft / currentProblem.timeLimit) * 100}%`,
                    backgroundColor: timeLeft > 2 ? '#6BCF7F' : timeLeft > 1 ? '#FFD93D' : '#FF6B6B'
                  }
                ]} 
              />
            </View>
            <Text style={styles.timeText}>
              {timeLeft.toFixed(1)}s
            </Text>
          </>
        )}
      </Animated.View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          style={[styles.input, !gameActive && styles.inputDisabled]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Answer"
          placeholderTextColor="#999"
          keyboardType="numeric"
          editable={gameActive}
          onSubmitEditing={handleSubmit}
          autoFocus={gameActive}
          selectionColor="#000000"
          maxLength={4}
        />
        <TouchableOpacity 
          style={[styles.submitButton, !gameActive && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!gameActive}
        >
          <Text style={styles.submitText}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SPEED:</Text>
          <Text style={styles.infoValue}>
            {currentProblem ? `${currentProblem.timeLimit.toFixed(1)}s/problem` : '--'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>POINTS:</Text>
          <Text style={styles.infoValue}>
            {DIFFICULTY_SETTINGS[difficulty].points} + {Math.floor(streak / 5)} streak
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? `Keep solving! Speed increases with streak` 
            : timePlayed === 0 
              ? 'Solve math problems until you run out of lives'
              : 'Game Over! Press START to play again'
          }
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!gameActive ? (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={startGame}
          >
            <Text style={styles.controlText}>START</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.controlButtonActive]}
            onPress={gameOver}
          >
            <Text style={styles.controlText}>QUIT</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  livesContainer: {
    alignItems: 'center',
  },
  lifeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    marginBottom: 2,
  },
  lifeActive: {
    backgroundColor: '#FF6B6B',
  },
  lifeLost: {
    backgroundColor: '#E0E0E0',
  },
  livesText: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  midStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  bestContainer: {
    alignItems: 'center',
  },
  bestLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bestValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  problemContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  problemText: {
    fontSize: 48,
    fontWeight: '500',
    color: '#000000',
    letterSpacing: 1,
    marginBottom: 20,
  },
  timeBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  timeFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  submitButton: {
    width: 70,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '500',
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
  controls: {
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
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
});