import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

export default function MathFactMaster({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameActive, setGameActive] = useState(false);
  const [problem, setProblem] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [bestScore, setBestScore] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [table, setTable] = useState(2);
  const [showTableSelector, setShowTableSelector] = useState(true);

  const t = LANGUAGES[language];

  const generateProblem = () => {
    // Generate multiplication problem for selected table
    const num1 = table;
    const num2 = Math.floor(Math.random() * 12) + 1;
    const answer = num1 * num2;
    
    setProblem({ num1, num2, answer });
    setUserAnswer('');
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(90);
    setGameActive(true);
    setShowTableSelector(false);
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
      generateProblem();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
    }
  };

  const handleSubmit = () => {
    checkAnswer();
  };

  const selectTable = (newTable: number) => {
    setTable(newTable);
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
            setShowTableSelector(true);
            if (score > bestScore) {
              setBestScore(score);
              Alert.alert('New Record!', `Score: ${score}\nTable of ${table}`);
            } else {
              Alert.alert('Time\'s Up!', `Score: ${score}\nBest: ${bestScore}`);
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
          <Text style={styles.title}>Math Fact Master</Text>
          <Text style={styles.subtitle}>Multiplication Tables</Text>
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
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
        </View>
      </View>

      {/* Table Selector */}
      {showTableSelector && !gameActive && (
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>Select Multiplication Table</Text>
          <View style={styles.tableGrid}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.tableButton,
                  table === num && styles.tableButtonSelected
                ]}
                onPress={() => selectTable(num)}
              >
                <Text style={[
                  styles.tableText,
                  table === num && styles.tableTextSelected
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Problem Display */}
      <Animated.View style={[styles.problemContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.problemText}>
          {problem.num1} × {problem.num2} = ?
        </Text>
        <Text style={styles.tableIndicator}>
          Table of {table}
        </Text>
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
        onPress={gameActive ? () => {
          setGameActive(false);
          setShowTableSelector(true);
        } : startGame}
      >
        <Text style={[styles.controlText, gameActive && styles.controlTextActive]}>
          {gameActive ? 'STOP' : 'START'}
        </Text>
      </TouchableOpacity>

      {/* Game Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {gameActive 
            ? `Quick! Multiply by ${table}` 
            : timeLeft === 0 
              ? 'Game Complete' 
              : showTableSelector
                ? 'Select table and start'
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
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  selectorContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  tableButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  tableButtonSelected: {
    backgroundColor: '#000000',
  },
  tableText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
  },
  tableTextSelected: {
    color: '#FFFFFF',
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
    minHeight: 200,
  },
  problemText: {
    fontSize: 56,
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 2,
  },
  tableIndicator: {
    fontSize: 16,
    color: '#666666',
    marginTop: 20,
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