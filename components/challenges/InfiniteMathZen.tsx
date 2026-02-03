import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type Operation = '+' | '-' | '×' | '÷';

export default function InfiniteMathZen({ language, onBack }: Props) {
  const [problem, setProblem] = useState({ num1: 0, num2: 0, operation: '+' as Operation, answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [flowAnim] = useState(new Animated.Value(0));
  const [sessionTime, setSessionTime] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = LANGUAGES[language];

  const generateProblem = () => {
    const operations: Operation[] = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer;
    
    // Adjust difficulty based on streak
    const difficulty = Math.min(Math.floor(streak / 10) + 1, 5);
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * (20 * difficulty)) + 5;
        num2 = Math.floor(Math.random() * (20 * difficulty)) + 5;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * (30 * difficulty)) + 20;
        num2 = Math.floor(Math.random() * (20 * difficulty)) + 5;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * (12 * difficulty)) + 1;
        num2 = Math.floor(Math.random() * (12 * difficulty)) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * (10 * difficulty)) + 2;
        answer = Math.floor(Math.random() * (12 * difficulty)) + 1;
        num1 = num2 * answer;
        break;
    }
    
    setProblem({ num1, num2, operation, answer: answer! });
    setUserAnswer('');
    
    // Pulse animation on new problem
    Animated.sequence([
      Animated.timing(pulseAnim, { 
        toValue: 1.1, 
        duration: 150, 
        useNativeDriver: true 
      }),
      Animated.timing(pulseAnim, { 
        toValue: 1, 
        duration: 150, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const pulseCorrect = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { 
        toValue: 1.2, 
        duration: 200, 
        useNativeDriver: true 
      }),
      Animated.timing(pulseAnim, { 
        toValue: 1, 
        duration: 200, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const startFlowAnimation = () => {
    Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: t => t,
      })
    ).start();
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    const userAnswerNum = parseInt(userAnswer);
    const isCorrect = userAnswerNum === problem.answer;
    
    setTotalProblems(prev => prev + 1);
    
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectCount(prev => prev + 1);
      
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      
      pulseCorrect();
      
      // Subtle haptic for high streaks
      if (newStreak % 5 === 0 && newStreak > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
    }
    
    // Update accuracy
    const newAccuracy = Math.round((correctCount + (isCorrect ? 1 : 0)) / (totalProblems + 1) * 100);
    setAccuracy(newAccuracy);
    
    generateProblem();
    
    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = () => {
    checkAnswer();
  };

  const resetSession = () => {
    setStreak(0);
    setTotalProblems(0);
    setAccuracy(100);
    setCorrectCount(0);
    setSessionTime(0);
    generateProblem();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    generateProblem();
    startFlowAnimation();
    
    // Start session timer
    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Flow animation interpolation
  const flowInterpolate = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header - Minimal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Math Flow</Text>
          <Text style={styles.subtitle}>Infinite Zen Mode</Text>
        </View>
        <TouchableOpacity onPress={resetSession} style={styles.resetButton}>
          <Text style={styles.resetText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Flow Circle */}
      <View style={styles.flowContainer}>
        <Animated.View style={[
          styles.flowCircle,
          { transform: [{ rotate: flowInterpolate }] }
        ]}>
          <View style={styles.flowDot} />
        </Animated.View>
        
        <Animated.View style={[
          styles.streakContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <Text style={styles.streakLabel}>STREAK</Text>
          <Text style={[
            styles.streakValue,
            streak >= 10 && styles.streakHigh,
            streak >= 20 && styles.streakVeryHigh
          ]}>
            {streak}
          </Text>
        </Animated.View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ACCURACY</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SOLVED</Text>
          <Text style={styles.statValue}>{totalProblems}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestStreak}</Text>
        </View>
      </View>

      {/* Problem Display - Zen-like */}
      <Animated.View style={[
        styles.problemContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <Text style={styles.problemText}>
          {problem.num1}
        </Text>
        <View style={styles.operationRow}>
          <Text style={styles.operationText}>{problem.operation}</Text>
          <Text style={styles.problemText}>
            {problem.num2}
          </Text>
          <Text style={styles.operationText}>=</Text>
          <View style={styles.answerPlaceholder}>
            <Text style={styles.answerPlaceholderText}>?</Text>
          </View>
        </View>
      </Animated.View>

      {/* Input Section - Minimal */}
      <View style={styles.inputSection}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Enter answer"
          placeholderTextColor="#999"
          keyboardType="numeric"
          onSubmitEditing={handleSubmit}
          autoFocus={true}
          selectionColor="#000000"
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>↵</Text>
        </TouchableOpacity>
      </View>

      {/* Zen Status */}
      <View style={styles.zenStatus}>
        <Text style={styles.zenText}>
          {streak === 0 
            ? 'Begin your math journey...'
            : streak < 5
            ? 'Finding your rhythm...'
            : streak < 10
            ? 'In the flow...'
            : streak < 20
            ? 'Unstoppable!'
            : 'Mathematical mastery!'
          }
        </Text>
        {streak >= 5 && (
          <Text style={styles.streakEncouragement}>
            {streak} correct in a row! Keep going...
          </Text>
        )}
      </View>

      {/* Zen Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Zen Tips</Text>
        <Text style={styles.tip}>• Breathe deeply between problems</Text>
        <Text style={styles.tip}>• Focus on accuracy over speed</Text>
        <Text style={styles.tip}>• Let mistakes go, keep flowing</Text>
        <Text style={styles.tip}>• The journey is the destination</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '200',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 28,
    color: '#666666',
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '400',
    letterSpacing: 2,
    marginTop: 4,
  },
  flowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: 120,
  },
  flowCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  flowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    position: 'absolute',
    top: -4,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '300',
    color: '#000000',
  },
  streakHigh: {
    color: '#4CAF50',
    fontWeight: '400',
  },
  streakVeryHigh: {
    color: '#2196F3',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
  },
  problemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginBottom: 30,
  },
  problemText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 2,
  },
  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  operationText: {
    fontSize: 40,
    fontWeight: '300',
    color: '#666666',
    marginHorizontal: 20,
  },
  answerPlaceholder: {
    width: 80,
    height: 60,
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  answerPlaceholderText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#888888',
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    color: '#000000',
    fontWeight: '400',
  },
  submitButton: {
    width: 60,
    backgroundColor: '#000000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  submitText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  zenStatus: {
    alignItems: 'center',
    marginBottom: 30,
  },
  zenText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  streakEncouragement: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tipsTitle: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  tip: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
    marginBottom: 6,
    lineHeight: 20,
  },
});