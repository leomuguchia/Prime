import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

export default function MentalArithmetic({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameActive, setGameActive] = useState(false);
  const [problem, setProblem] = useState({ 
    expression: '', 
    answer: 0,
    hint: ''
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [bestScore, setBestScore] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const t = LANGUAGES[language];

  const generateProblem = () => {
    const problemTypes = [
      {
        expression: () => {
          const a = Math.floor(Math.random() * 50) + 10;
          const b = Math.floor(Math.random() * 40) + 10;
          const c = Math.floor(Math.random() * 30) + 10;
          return `${a} + ${b} + ${c}`;
        },
        answer: (exp: string) => eval(exp),
        hint: 'Add all three numbers'
      },
      {
        expression: () => {
          const a = Math.floor(Math.random() * 100) + 50;
          const b = Math.floor(Math.random() * 40) + 10;
          const c = Math.floor(Math.random() * 30) + 10;
          return `${a} - ${b} - ${c}`;
        },
        answer: (exp: string) => eval(exp),
        hint: 'Subtract both numbers from the first'
      },
      {
        expression: () => {
          const a = Math.floor(Math.random() * 15) + 2;
          const b = Math.floor(Math.random() * 10) + 2;
          const c = Math.floor(Math.random() * 5) + 2;
          return `${a} × ${b} × ${c}`;
        },
        answer: (exp: string) => eval(exp.replace('×', '*')),
        hint: 'Multiply all three numbers'
      },
      {
        expression: () => {
          const total = Math.floor(Math.random() * 100) + 50;
          const parts = Math.floor(Math.random() * 5) + 2;
          return `${total} ÷ ${parts}`;
        },
        answer: (exp: string) => Math.floor(eval(exp.replace('÷', '/'))),
        hint: 'Divide evenly'
      },
      {
        expression: () => {
          const a = Math.floor(Math.random() * 20) + 10;
          const b = Math.floor(Math.random() * 10) + 5;
          const c = Math.floor(Math.random() * 5) + 2;
          return `(${a} + ${b}) × ${c}`;
        },
        answer: (exp: string) => eval(exp.replace('×', '*')),
        hint: 'Add first, then multiply'
      }
    ];

    const type = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    const expression = type.expression();
    const answer = type.answer(expression);
    const hint = type.hint;

    setProblem({ expression, answer, hint });
    setUserAnswer('');
    setShowHint(false);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(120);
    setGameActive(true);
    setStreak(0);
    generateProblem();
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    const userAnswerNum = parseInt(userAnswer);
    
    if (userAnswerNum === problem.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      generateProblem();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
      setStreak(0);
    }
  };

  const handleSubmit = () => {
    checkAnswer();
  };

  const toggleHint = () => {
    setShowHint(!showHint);
    Haptics.selectionAsync();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameActive(false);
            if (score > bestScore) {
              setBestScore(score);
              Alert.alert('Excellent!', `New Record: ${score}\nStreak: ${streak}`);
            } else {
              Alert.alert('Finished!', `Score: ${score}\nBest: ${bestScore}\nFinal Streak: ${streak}`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameActive, timeLeft, score]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Mental Arithmetic</Text>
          <Text style={styles.subtitle}>Triple Challenge</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={[styles.statValue, timeLeft < 10 && styles.timeLow]}>
            {timeLeft}s
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={[styles.statValue, streak >= 5 && styles.streakHigh]}>
            {streak}
          </Text>
        </View>
      </View>

      {/* Problem Display */}
      <Animated.View style={[styles.problemContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.problemText}>
          {problem.expression} = ?
        </Text>
        
        {showHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>💡 {problem.hint}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.hintButton}
          onPress={toggleHint}
          disabled={!gameActive}
        >
          <Text style={styles.hintButtonText}>
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Input Section */}
      <View style={styles.inputContainer}>
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
        />
        <TouchableOpacity 
          style={[styles.submitButton, !gameActive && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!gameActive}
        >
          <Text style={styles.submitText}>✓</Text>
        </TouchableOpacity>
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

      {/* Game Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {gameActive 
            ? streak >= 5 
              ? `Amazing! ${streak} in a row!` 
              : 'Solve three-number problems!' 
            : timeLeft === 0 
              ? 'Challenge Complete' 
              : 'Press Start to begin'
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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
    fontSize: 28,
    fontWeight: '500',
    color: '#000000',
  },
  timeLow: {
    color: '#FF0000',
  },
  streakHigh: {
    color: '#4CAF50',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  problemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginBottom: 32,
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    minHeight: 250,
  },
  problemText: {
    fontSize: 48,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 1,
    textAlign: 'center',
  },
  hintContainer: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  hintText: {
    fontSize: 14,
    color: '#5D4037',
    fontWeight: '500',
    textAlign: 'center',
  },
  hintButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  hintButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 32,
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
  controlButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
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
  statusContainer: {
    alignItems: 'center',
    padding: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
  },
});