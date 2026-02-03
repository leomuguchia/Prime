import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type PatternType = 'rotation' | 'progression' | 'alternation' | 'symmetry' | 'transformation';
type Shape = 'circle' | 'square' | 'triangle' | 'diamond' | 'star';
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

interface PatternTile {
  shape: Shape;
  color: Color;
  rotation: number; // 0, 90, 180, 270 degrees
  size: 'small' | 'medium' | 'large';
}

interface Pattern {
  type: PatternType;
  sequence: PatternTile[];
  correctOption: PatternTile;
  options: PatternTile[];
}

export default function PatternPath({ language, onBack }: Props) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameActive, setGameActive] = useState(false);
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [comboAnim] = useState(new Animated.Value(1));
  const [shakeAnim] = useState(new Animated.Value(0));

  const t = LANGUAGES[language];

  // Available shapes, colors, and sizes
  const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'diamond', 'star'];
  const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'purple'];
  const SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
  const ROTATIONS = [0, 90, 180, 270];

  // Color mapping for display
  const COLOR_MAP: Record<Color, string> = {
    red: '#FF6B6B',
    blue: '#4D96FF',
    green: '#6BCF7F',
    yellow: '#FFD93D',
    purple: '#9D4EDD'
  };

  // Generate a random tile
  const generateRandomTile = (): PatternTile => ({
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
    size: SIZES[Math.floor(Math.random() * SIZES.length)]
  });

  // Generate rotation pattern (items rotate consistently)
  const generateRotationPattern = (): Pattern => {
    const baseTile = generateRandomTile();
    const sequenceLength = 3;
    const sequence: PatternTile[] = [];
    
    // Generate sequence with rotating shape
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push({
        ...baseTile,
        rotation: (baseTile.rotation + i * 90) % 360
      });
    }
    
    // Correct option continues rotation
    const correctOption: PatternTile = {
      ...baseTile,
      rotation: (baseTile.rotation + sequenceLength * 90) % 360
    };
    
    // Generate wrong options
    const wrongOptions = [
      { ...correctOption, rotation: (correctOption.rotation + 90) % 360 },
      { ...correctOption, rotation: (correctOption.rotation - 90) % 360 },
      { ...correctOption, rotation: 0 },
      { ...correctOption, shape: SHAPES.filter(s => s !== baseTile.shape)[0] },
      { ...correctOption, color: COLORS.filter(c => c !== baseTile.color)[0] }
    ];
    
    const options = [
      correctOption,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'rotation',
      sequence,
      correctOption,
      options
    };
  };

  // Generate progression pattern (size/color changes progressively)
  const generateProgressionPattern = (): Pattern => {
    const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const sequenceLength = 3;
    const sequence: PatternTile[] = [];
    
    // Generate sequence with progressing size
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push({
        shape: baseShape,
        color: baseColor,
        rotation: 0,
        size: SIZES[i] // small -> medium -> large
      });
    }
    
    // Correct option is next size (wraps around)
    const correctOption: PatternTile = {
      shape: baseShape,
      color: baseColor,
      rotation: 0,
      size: SIZES[sequenceLength % SIZES.length]
    };
    
    // Generate wrong options
    const wrongOptions = [
      { ...correctOption, size: SIZES[(sequenceLength + 1) % SIZES.length] },
      { ...correctOption, size: SIZES[sequenceLength - 1] },
      { ...correctOption, shape: SHAPES.filter(s => s !== baseShape)[0] },
      { ...correctOption, color: COLORS.filter(c => c !== baseColor)[0] },
      { ...correctOption, rotation: 90 }
    ];
    
    const options = [
      correctOption,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'progression',
      sequence,
      correctOption,
      options
    };
  };

  // Generate alternation pattern (alternates between two properties)
  const generateAlternationPattern = (): Pattern => {
    const shape1 = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const shape2 = SHAPES.filter(s => s !== shape1)[Math.floor(Math.random() * (SHAPES.length - 1))];
    const color1 = COLORS[Math.floor(Math.random() * COLORS.length)];
    const color2 = COLORS.filter(c => c !== color1)[Math.floor(Math.random() * (COLORS.length - 1))];
    const sequenceLength = 4;
    const sequence: PatternTile[] = [];
    
    // Generate alternating sequence
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push({
        shape: i % 2 === 0 ? shape1 : shape2,
        color: i % 2 === 0 ? color1 : color2,
        rotation: 0,
        size: 'medium'
      });
    }
    
    // Correct option continues alternation
    const correctOption: PatternTile = {
      shape: sequenceLength % 2 === 0 ? shape1 : shape2,
      color: sequenceLength % 2 === 0 ? color1 : color2,
      rotation: 0,
      size: 'medium'
    };
    
    // Generate wrong options
    const wrongOptions = [
      { ...correctOption, shape: shape1 },
      { ...correctOption, shape: shape2 },
      { ...correctOption, color: color1 },
      { ...correctOption, color: color2 },
      { ...correctOption, shape: SHAPES.filter(s => s !== shape1 && s !== shape2)[0] }
    ];
    
    const options = [
      correctOption,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'alternation',
      sequence,
      correctOption,
      options
    };
  };

  // Generate symmetry pattern (mirror pattern)
  const generateSymmetryPattern = (): Pattern => {
    const baseTile = generateRandomTile();
    const sequenceLength = 3;
    const sequence: PatternTile[] = [];
    
    // Generate symmetric sequence
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push({
        ...baseTile,
        rotation: (baseTile.rotation + i * 45) % 360
      });
    }
    
    // Correct option completes symmetry
    const correctOption: PatternTile = {
      ...baseTile,
      rotation: (baseTile.rotation + sequenceLength * 45) % 360
    };
    
    // Generate wrong options
    const wrongOptions = [
      { ...correctOption, rotation: (correctOption.rotation + 45) % 360 },
      { ...correctOption, rotation: (correctOption.rotation - 45) % 360 },
      { ...correctOption, rotation: 0 },
      { ...correctOption, shape: SHAPES.filter(s => s !== baseTile.shape)[0] }
    ];
    
    const options = [
      correctOption,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'symmetry',
      sequence,
      correctOption,
      options
    };
  };

  // Generate transformation pattern (multiple properties change)
  const generateTransformationPattern = (): Pattern => {
    const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const sequenceLength = 3;
    const sequence: PatternTile[] = [];
    
    // Generate sequence with transforming properties
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push({
        shape: baseShape,
        color: COLORS[i % COLORS.length],
        rotation: ROTATIONS[i % ROTATIONS.length],
        size: SIZES[i % SIZES.length]
      });
    }
    
    // Correct option continues transformation
    const correctOption: PatternTile = {
      shape: baseShape,
      color: COLORS[sequenceLength % COLORS.length],
      rotation: ROTATIONS[sequenceLength % ROTATIONS.length],
      size: SIZES[sequenceLength % SIZES.length]
    };
    
    // Generate wrong options
    const wrongOptions = [
      { ...correctOption, shape: SHAPES.filter(s => s !== baseShape)[0] },
      { ...correctOption, color: COLORS[(sequenceLength + 1) % COLORS.length] },
      { ...correctOption, rotation: ROTATIONS[(sequenceLength + 1) % ROTATIONS.length] },
      { ...correctOption, size: SIZES[(sequenceLength + 1) % SIZES.length] },
      { ...correctOption, color: COLORS[sequenceLength - 1] }
    ];
    
    const options = [
      correctOption,
      ...wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3)
    ].sort(() => Math.random() - 0.5);
    
    return {
      type: 'transformation',
      sequence,
      correctOption,
      options
    };
  };

  const generatePattern = (): Pattern => {
    const patternTypes: PatternType[] = [
      'rotation',
      'progression', 
      'alternation',
      'symmetry',
      'transformation'
    ];
    
    const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    switch (type) {
      case 'rotation':
        return generateRotationPattern();
      case 'progression':
        return generateProgressionPattern();
      case 'alternation':
        return generateAlternationPattern();
      case 'symmetry':
        return generateSymmetryPattern();
      case 'transformation':
        return generateTransformationPattern();
      default:
        return generateRotationPattern();
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setStreak(0);
    setGameActive(true);
    setCurrentPattern(generatePattern());
  };

  const comboAnimation = () => {
    Animated.sequence([
      Animated.timing(comboAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(comboAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
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

  const handleAnswer = (selectedTile: PatternTile) => {
    if (!gameActive || !currentPattern) return;

    const isCorrect = 
      selectedTile.shape === currentPattern.correctOption.shape &&
      selectedTile.color === currentPattern.correctOption.color &&
      selectedTile.rotation === currentPattern.correctOption.rotation &&
      selectedTile.size === currentPattern.correctOption.size;

    if (isCorrect) {
      // Correct answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const basePoints = 15;
      const streakBonus = Math.min(streak * 3, 30); // Max 30 bonus points
      const points = basePoints + streakBonus;
      
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      
      // Combo animation
      if (streak >= 3) {
        comboAnimation();
      }
      
      // Generate new pattern
      setCurrentPattern(generatePattern());
    } else {
      // Wrong answer
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation();
      setStreak(0);
      
      // Time penalty
      setTimeLeft(prev => Math.max(0, prev - 3));
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
              Alert.alert('🎉 New Record!', `Score: ${score}\nPerfect Patterns: ${streak}`);
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

  const getPatternTypeName = (type: PatternType): string => {
    switch (type) {
      case 'rotation': return 'Rotation';
      case 'progression': return 'Progression';
      case 'alternation': return 'Alternation';
      case 'symmetry': return 'Symmetry';
      case 'transformation': return 'Transformation';
      default: return 'Pattern';
    }
  };

  // Render shape component
  const renderShape = (tile: PatternTile, size: number = 40) => {
    const color = COLOR_MAP[tile.color];
    const rotation = tile.rotation;
    
    const shapeStyle = {
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: tile.shape === 'circle' ? size / 2 : tile.shape === 'triangle' ? 0 : 6,
      borderWidth: 2,
      borderColor: color,
      transform: [{ rotate: `${rotation}deg` }],
    };

    // Special handling for different shapes
    switch (tile.shape) {
      case 'triangle':
        return (
          <View style={[styles.shapeBase, { width: size, height: size }]}>
            <View style={[styles.triangle, { borderBottomColor: color }]} />
          </View>
        );
      case 'star':
        return (
          <View style={[styles.shapeBase, { width: size, height: size }]}>
            <Text style={[styles.star, { color, fontSize: size }]}>★</Text>
          </View>
        );
      case 'diamond':
        return (
          <View style={[styles.shapeBase, { width: size, height: size }]}>
            <View style={[styles.diamond, { backgroundColor: color }]} />
          </View>
        );
      default:
        return <View style={[shapeStyle, styles.shapeBase]} />;
    }
  };

  const getSizeValue = (size: 'small' | 'medium' | 'large'): number => {
    switch (size) {
      case 'small': return 30;
      case 'medium': return 40;
      case 'large': return 50;
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
          <Text style={styles.title}>Pattern Path</Text>
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
          <Animated.View style={{ transform: [{ scale: comboAnim }] }}>
            <Text style={[styles.statValue, streak >= 3 && styles.streakHigh]}>
              {streak}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Pattern Sequence */}
      <Animated.View style={[styles.patternContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.patternType}>
          <Text style={styles.patternTypeText}>
            {currentPattern ? getPatternTypeName(currentPattern.type) : 'Visual Pattern'}
          </Text>
        </View>
        
        <Text style={styles.patternPrompt}>Complete the pattern:</Text>
        
        <View style={styles.sequenceRow}>
          {currentPattern?.sequence.map((tile, index) => (
            <View key={index} style={styles.sequenceTile}>
              {renderShape(tile, getSizeValue(tile.size))}
              {index < currentPattern.sequence.length - 1 && (
                <Text style={styles.arrow}>→</Text>
              )}
            </View>
          ))}
          <View style={styles.questionTile}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        </View>
        
        <Text style={styles.patternHint}>
          Find the tile that continues the sequence
        </Text>
      </Animated.View>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {currentPattern?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionTile}
            onPress={() => handleAnswer(option)}
            disabled={!gameActive}
          >
            {renderShape(option, 50)}
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
            <Text style={styles.infoValue}>+{Math.min(streak * 3, 30)}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? 'Identify the pattern and select the next tile' 
            : timeLeft === 0 
              ? 'Time\'s up! Tap START to play again'
              : '45 seconds to solve visual patterns'
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
  streakHigh: {
    color: '#9D4EDD',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
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
  patternType: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  patternTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  patternPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 20,
  },
  sequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sequenceTile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    color: '#999999',
    marginHorizontal: 8,
    fontWeight: '300',
  },
  questionTile: {
    width: 50,
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patternHint: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  shapeBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  diamond: {
    width: 28,
    height: 28,
    backgroundColor: '#FF6B6B',
    transform: [{ rotate: '45deg' }],
  },
  star: {
    fontSize: 40,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  optionTile: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
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