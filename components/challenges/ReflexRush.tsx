import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type ChallengeType = 'color' | 'shape' | 'colorShape' | 'word' | 'math';
type Color = 'red' | 'blue' | 'green' | 'yellow';
type Shape = 'circle' | 'square' | 'triangle' | 'diamond';

interface Challenge {
  type: ChallengeType;
  color?: Color;
  shape?: Shape;
  text?: string;
  correctOption: number; // 0-3 index
  options: string[];
  timeLimit: number;
}

export default function ReflexRush({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [challengeStartTime, setChallengeStartTime] = useState<number>(0);
  
  const flashAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const t = LANGUAGES[language];

  // Color mapping
  const COLOR_MAP: Record<Color, string> = {
    red: '#FF6B6B',
    blue: '#4D96FF',
    green: '#6BCF7F',
    yellow: '#FFD93D'
  };

  // Shape names
  const SHAPE_NAMES = {
    circle: 'Circle',
    square: 'Square',
    triangle: 'Triangle',
    diamond: 'Diamond'
  };

  // Generate color challenge
  const generateColorChallenge = (): Challenge => {
    const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const targetText = colors[Math.floor(Math.random() * colors.length)];
    
    // 30% chance of mismatched color/text (Stroop effect)
    const useStroop = Math.random() < 0.3;
    const displayColor = useStroop ? colors.filter(c => c !== targetColor)[0] : targetColor;
    
    const options = [...colors].sort(() => Math.random() - 0.5);
    const correctOption = options.indexOf(targetColor);
    
    const timeLimit = Math.max(1.5, 3 - streak * 0.05); // Gets faster with streak
    
    return {
      type: 'color',
      color: displayColor,
      text: targetText.charAt(0).toUpperCase() + targetText.slice(1),
      correctOption,
      options: options.map(color => color.charAt(0).toUpperCase() + color.slice(1)),
      timeLimit
    };
  };

  // Generate shape challenge
  const generateShapeChallenge = (): Challenge => {
    const shapes: Shape[] = ['circle', 'square', 'triangle', 'diamond'];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    const options = [...shapes].sort(() => Math.random() - 0.5);
    const correctOption = options.indexOf(targetShape);
    
    const timeLimit = Math.max(1.5, 3 - streak * 0.05);
    
    return {
      type: 'shape',
      shape: targetShape,
      correctOption,
      options: options.map(shape => SHAPE_NAMES[shape]),
      timeLimit
    };
  };

  // Generate color+shape challenge
  const generateColorShapeChallenge = (): Challenge => {
    const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
    const shapes: Shape[] = ['circle', 'square', 'triangle', 'diamond'];
    
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Generate options
    const options = [];
    for (let i = 0; i < 4; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      options.push(`${color} ${shape}`);
    }
    
    // Ensure correct option is present
    const correctOption = Math.floor(Math.random() * 4);
    options[correctOption] = `${targetColor} ${targetShape}`;
    
    const timeLimit = Math.max(2, 4 - streak * 0.05);
    
    return {
      type: 'colorShape',
      color: targetColor,
      shape: targetShape,
      correctOption,
      options,
      timeLimit
    };
  };

  // Generate word challenge (Stroop test)
  const generateWordChallenge = (): Challenge => {
    const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 70% match, 30% mismatch
    const textColor = Math.random() < 0.7 ? targetColor : colors.filter(c => c !== targetColor)[0];
    const textWord = colors[Math.floor(Math.random() * colors.length)];
    
    const options = [...colors].sort(() => Math.random() - 0.5);
    const correctOption = options.indexOf(targetColor);
    
    const timeLimit = Math.max(2, 3.5 - streak * 0.05);
    
    return {
      type: 'word',
      color: textColor,
      text: textWord.charAt(0).toUpperCase() + textWord.slice(1),
      correctOption,
      options: options.map(color => color.charAt(0).toUpperCase() + color.slice(1)),
      timeLimit
    };
  };

  // Generate math challenge
  const generateMathChallenge = (): Challenge => {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
        answer = num1 * num2;
        break;
    }
    
    const options = [];
    options.push(answer!.toString());
    
    // Generate wrong options
    while (options.length < 4) {
      const wrong: number = answer! + (Math.floor(Math.random() * 5) - 2);
      if (wrong !== answer && wrong > 0 && !options.includes(wrong.toString())) {
        options.push(wrong.toString());
      }
    }
    
    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    const correctOption = shuffledOptions.indexOf(answer!.toString());
    
    const timeLimit = Math.max(2, 3.5 - streak * 0.05);
    
    return {
      type: 'math',
      text: `${num1} ${operation} ${num2} = ?`,
      correctOption,
      options: shuffledOptions,
      timeLimit
    };
  };

  const generateChallenge = (): Challenge => {
    const challengeTypes: ChallengeType[] = ['color', 'shape', 'colorShape', 'word', 'math'];
    
    // Weight based on streak
    let type: ChallengeType;
    if (streak < 5) {
      type = challengeTypes[Math.floor(Math.random() * 3)]; // color, shape, or word
    } else if (streak < 10) {
      type = challengeTypes[Math.floor(Math.random() * 4)]; // add colorShape
    } else {
      type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]; // all types
    }
    
    switch (type) {
      case 'color':
        return generateColorChallenge();
      case 'shape':
        return generateShapeChallenge();
      case 'colorShape':
        return generateColorShapeChallenge();
      case 'word':
        return generateWordChallenge();
      case 'math':
        return generateMathChallenge();
      default:
        return generateColorChallenge();
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setStreak(0);
    setReactionTimes([]);
    setGameActive(true);
    
    const firstChallenge = generateChallenge();
    setCurrentChallenge(firstChallenge);
    setChallengeStartTime(Date.now());
    setTimeLeft(firstChallenge.timeLimit);
    
    // Game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.05) {
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
          }
          gameOver();
          return 0;
        }
        return Number((prev - 0.05).toFixed(2));
      });
    }, 50);
  };

  const handleAnswer = (selectedIndex: number) => {
    if (!gameActive || !currentChallenge) return;

    const reactionTime = Date.now() - challengeStartTime;
    const isCorrect = selectedIndex === currentChallenge.correctOption;

    if (isCorrect) {
      // Correct answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Calculate points based on reaction time
      const maxPoints = 10;
      const timePenalty = Math.min(reactionTime / 100, maxPoints); // 100ms = 1 point penalty
      const points = Math.max(1, Math.round(maxPoints - timePenalty));
      const streakBonus = Math.min(streak * 2, 20);
      const totalPoints = points + streakBonus;
      
      setScore(prev => prev + totalPoints);
      setStreak(prev => prev + 1);
      setReactionTimes(prev => [...prev, reactionTime]);
      
      // Flash animation
      flashAnimation();
      
      // Generate next challenge
      const nextChallenge = generateChallenge();
      setCurrentChallenge(nextChallenge);
      setChallengeStartTime(Date.now());
      setTimeLeft(nextChallenge.timeLimit);
      
    } else {
      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
      setStreak(0);
      
      // Time penalty
      setTimeLeft(prev => Math.max(0, prev - 2));
    }
  };

  const handleTimeout = () => {
    if (!gameActive || !currentChallenge) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setStreak(0);
    
    // Generate new challenge
    const nextChallenge = generateChallenge();
    setCurrentChallenge(nextChallenge);
    setChallengeStartTime(Date.now());
    setTimeLeft(nextChallenge.timeLimit);
  };

  const gameOver = () => {
    setGameActive(false);
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;
    
    if (score > bestScore) {
      setBestScore(score);
      Alert.alert(
        '⚡ New Record!',
        `Score: ${score}\nAvg Reaction: ${avgReactionTime.toFixed(0)}ms\nStreak: ${streak}`,
        [{ text: 'Play Again', onPress: startGame }]
      );
    } else {
      Alert.alert(
        'Time\'s Up!',
        `Score: ${score}\nBest: ${bestScore}\nAvg Reaction: ${avgReactionTime.toFixed(0)}ms`,
        [{ text: 'Play Again', onPress: startGame }]
      );
    }
  };

  // Animations
  const flashAnimation = () => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Timeout for current challenge
  useEffect(() => {
    if (gameActive && currentChallenge) {
      const timeout = setTimeout(() => {
        handleTimeout();
      }, currentChallenge.timeLimit * 1000);

      return () => clearTimeout(timeout);
    }
  }, [gameActive, currentChallenge]);

  const getChallengeTypeName = (type: ChallengeType): string => {
    switch (type) {
      case 'color': return 'Color Match';
      case 'shape': return 'Shape Match';
      case 'colorShape': return 'Color + Shape';
      case 'word': return 'Word Color';
      case 'math': return 'Quick Math';
      default: return 'Reflex Test';
    }
  };

  const renderChallenge = () => {
    if (!currentChallenge) return null;

    switch (currentChallenge.type) {
      case 'color':
        return (
          <View style={styles.challengeDisplay}>
            <View style={[styles.colorBox, { backgroundColor: COLOR_MAP[currentChallenge.color!] }]}>
              <Text style={[styles.colorText, { color: '#FFFFFF' }]}>
                {currentChallenge.text}
              </Text>
            </View>
            <Text style={styles.challengePrompt}>Tap the color name:</Text>
          </View>
        );
      
      case 'shape':
        return (
          <View style={styles.challengeDisplay}>
            <View style={styles.shapeBox}>
              <Text style={styles.shapeIcon}>
                {currentChallenge.shape === 'circle' && '○'}
                {currentChallenge.shape === 'square' && '□'}
                {currentChallenge.shape === 'triangle' && '△'}
                {currentChallenge.shape === 'diamond' && '◇'}
              </Text>
            </View>
            <Text style={styles.challengePrompt}>Tap the shape name:</Text>
          </View>
        );
      
      case 'colorShape':
        return (
          <View style={styles.challengeDisplay}>
            <View style={[styles.colorShapeBox, { backgroundColor: COLOR_MAP[currentChallenge.color!] }]}>
              <Text style={styles.shapeIcon}>
                {currentChallenge.shape === 'circle' && '○'}
                {currentChallenge.shape === 'square' && '□'}
                {currentChallenge.shape === 'triangle' && '△'}
                {currentChallenge.shape === 'diamond' && '◇'}
              </Text>
            </View>
            <Text style={styles.challengePrompt}>Tap {currentChallenge.color} {currentChallenge.shape}:</Text>
          </View>
        );
      
      case 'word':
        return (
          <View style={styles.challengeDisplay}>
            <Text style={[styles.wordText, { color: COLOR_MAP[currentChallenge.color!] }]}>
              {currentChallenge.text}
            </Text>
            <Text style={styles.challengePrompt}>Tap the text color:</Text>
          </View>
        );
      
      case 'math':
        return (
          <View style={styles.challengeDisplay}>
            <Text style={styles.mathText}>{currentChallenge.text}</Text>
            <Text style={styles.challengePrompt}>Solve quickly:</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  const getAverageReactionTime = () => {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / reactionTimes.length);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Reflex Rush</Text>
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
          <Animated.View style={{ transform: [{ scale: flashAnim }] }}>
            <Text style={[styles.statValue, streak >= 5 && styles.streakHigh]}>
              {streak}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Challenge Type */}
      <View style={styles.challengeType}>
        <Text style={styles.challengeTypeText}>
          {currentChallenge ? getChallengeTypeName(currentChallenge.type) : 'Ready'}
        </Text>
        <Text style={styles.timeLimit}>
          {currentChallenge ? `${currentChallenge.timeLimit.toFixed(1)}s` : '--'}
        </Text>
      </View>

      {/* Challenge Display */}
      <Animated.View style={[
        styles.challengeContainer,
        { transform: [{ translateX: shakeAnim }] }
      ]}>
        {renderChallenge()}
      </Animated.View>

      {/* Options Grid */}
      <View style={styles.optionsGrid}>
        {currentChallenge?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(index)}
            disabled={!gameActive}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Performance Stats */}
      <View style={styles.performanceContainer}>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>BEST SCORE:</Text>
          <Text style={styles.performanceValue}>{bestScore}</Text>
        </View>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>AVG REACTION:</Text>
          <Text style={styles.performanceValue}>
            {getAverageReactionTime()}ms
          </Text>
        </View>
        {streak > 0 && (
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>STREAK BONUS:</Text>
            <Text style={styles.performanceValue}>+{Math.min(streak * 2, 20)}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? 'React quickly before time runs out!' 
            : timeLeft === 0 
              ? 'Time\'s up! Tap START to play again'
              : 'Test your reflexes in 30 seconds'
          }
        </Text>
      </View>

      {/* Control */}
      <TouchableOpacity 
        style={[styles.controlButton, gameActive && styles.controlButtonActive]}
        onPress={gameActive ? gameOver : startGame}
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
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
  },
  timeLow: {
    color: '#FF0000',
  },
  streakHigh: {
    color: '#4D96FF',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  challengeType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  challengeTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeLimit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengeContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  challengeDisplay: {
    alignItems: 'center',
  },
  colorBox: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorText: {
    fontSize: 32,
    fontWeight: '700',
  },
  shapeBox: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  shapeIcon: {
    fontSize: 80,
    color: '#000000',
  },
  colorShapeBox: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  wordText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  mathText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  challengePrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  performanceContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  performanceValue: {
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