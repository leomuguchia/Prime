import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

export default function DivisionChallenge({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [problem, setProblem] = useState({ dividend: 0, divisor: 0, answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [bestScore, setBestScore] = useState(0);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [difficulty, setDifficulty] = useState('easy');

  const t = LANGUAGES[language];

  const generateProblem = () => {
    let dividend, divisor, answer;
    
    switch (difficulty) {
      case 'easy':
        divisor = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        dividend = divisor * answer;
        break;
      case 'medium':
        divisor = Math.floor(Math.random() * 12) + 3;
        answer = Math.floor(Math.random() * 12) + 1;
        dividend = divisor * answer;
        break;
      case 'hard':
        divisor = Math.floor(Math.random() * 15) + 5;
        answer = Math.floor(Math.random() * 15) + 1;
        dividend = divisor * answer;
        break;
      default:
        divisor = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        dividend = divisor * answer;
    }
    
    setProblem({ dividend, divisor, answer });
    setUserAnswer('');
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
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
              Alert.alert('New High Score!', `Score: ${score}\nDifficulty: ${difficulty}`);
            } else {
              Alert.alert('Finished!', `Score: ${score}\nBest Score: ${bestScore}`);
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
          <Text style={styles.title}>Division Challenge</Text>
          <Text style={styles.subtitle}>Perfect Division</Text>
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

      {/* Difficulty Selector */}
      {!gameActive && (
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyTitle}>Select Difficulty</Text>
          <View style={styles.difficultyButtons}>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'easy' && styles.difficultyButtonSelected
              ]}
              onPress={() => setDifficulty('easy')}
            >
              <Text style={[
                styles.difficultyText,
                difficulty === 'easy' && styles.difficultyTextSelected
              ]}>
                Easy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'medium' && styles.difficultyButtonSelected
              ]}
              onPress={() => setDifficulty('medium')}
            >
              <Text style={[
                styles.difficultyText,
                difficulty === 'medium' && styles.difficultyTextSelected
              ]}>
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.difficultyButton,
                difficulty === 'hard' && styles.difficultyButtonSelected
              ]}
              onPress={() => setDifficulty('hard')}
            >
              <Text style={[
                styles.difficultyText,
                difficulty === 'hard' && styles.difficultyTextSelected
              ]}>
                Hard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Problem Display */}
      <Animated.View style={[styles.problemContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.problemText}>
          {problem.dividend} ÷ {problem.divisor} = ?
        </Text>
        <Text style={styles.difficultyIndicator}>
          Difficulty: {difficulty.toUpperCase()}
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
            ? 'Divide quickly and accurately!' 
            : timeLeft === 0 
              ? 'Challenge Complete' 
              : 'Select difficulty and start'
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
  difficultyContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  difficultyButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#000000',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  difficultyTextSelected: {
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
  difficultyIndicator: {
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