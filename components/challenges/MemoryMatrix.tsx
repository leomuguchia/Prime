import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

type GamePhase = 'memorize' | 'recall' | 'result';

export default function MemoryMatrix({ language, onBack }: Props) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('memorize');
  const [bestScore, setBestScore] = useState(0);
  const [memorizeTime, setMemorizeTime] = useState(2);
  const [tileAnimations] = useState(() => 
    Array(9).fill(0).map(() => new Animated.Value(0))
  );

  const GRID_SIZE = 9; // 3x3 grid

  const t = LANGUAGES[language];

  // Generate new sequence based on level
  const generateSequence = () => {
    const sequenceLength = Math.min(2 + level, 9); // 2-9 numbers
    const newSequence: React.SetStateAction<number[]> = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      let randomTile;
      do {
        randomTile = Math.floor(Math.random() * GRID_SIZE);
      } while (newSequence.includes(randomTile));
      
      newSequence.push(randomTile);
    }
    
    setSequence(newSequence);
  };

  // Start new level
  const startLevel = () => {
    generateSequence();
    setUserSequence([]);
    setGamePhase('memorize');
    
    // Show sequence with highlights
    showSequence();
  };

  // Animate sequence tiles
  const showSequence = () => {
    sequence.forEach((tileIndex, index) => {
      setTimeout(() => {
        highlightTile(tileIndex);
        
        // After last tile, switch to recall phase
        if (index === sequence.length - 1) {
          setTimeout(() => {
            setGamePhase('recall');
          }, 500);
        }
      }, index * 800); // Show each tile every 800ms
    });
  };

  // Highlight a single tile
  const highlightTile = (tileIndex: number) => {
    Animated.sequence([
      Animated.timing(tileAnimations[tileIndex], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(tileAnimations[tileIndex], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        delay: 200,
      }),
    ]).start();
  };

  // Handle tile tap during recall phase
  const handleTileTap = (tileIndex: number) => {
    if (gamePhase !== 'recall') return;

    // Highlight tapped tile
    Animated.sequence([
      Animated.timing(tileAnimations[tileIndex], {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tileAnimations[tileIndex], {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newUserSequence = [...userSequence, tileIndex];
    setUserSequence(newUserSequence);

    // Check if correct
    const expectedTile = sequence[newUserSequence.length - 1];
    
    if (tileIndex === expectedTile) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Check if sequence complete
      if (newUserSequence.length === sequence.length) {
        // Level completed!
        const points = level * 10;
        setScore(prev => prev + points);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Move to next level after delay
        setTimeout(() => {
          setLevel(prev => prev + 1);
          startLevel();
        }, 800);
      }
    } else {
      // Wrong tile - game over
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGamePhase('result');
      
      // Check for best score
      if (score > bestScore) {
        setBestScore(score);
        Alert.alert('🎉 New Record!', `Score: ${score}\nLevel: ${level - 1}`);
      } else {
        Alert.alert('Game Over', `Score: ${score}\nLevel: ${level - 1}\nBest: ${bestScore}`);
      }
    }
  };

  // Start new game
  const startNewGame = () => {
    setScore(0);
    setLevel(1);
    startLevel();
  };

  // Reset game
  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setGamePhase('memorize');
    startLevel();
  };

  // Initialize
  useEffect(() => {
    startLevel();
  }, []);

  // Calculate progress through sequence
  const getProgressText = () => {
    if (gamePhase === 'memorize') {
      return 'Watch & Remember';
    } else if (gamePhase === 'recall') {
      return `Tap ${userSequence.length + 1}/${sequence.length}`;
    } else {
      return 'Game Over';
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
          <Text style={styles.title}>Memory Matrix</Text>
          <Text style={styles.subtitle}>Prime</Text>
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
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gamePhase === 'memorize' 
            ? 'Memorize the sequence' 
            : gamePhase === 'recall'
              ? 'Tap tiles in same order'
              : 'Ready for new game'
          }
        </Text>
        <Text style={styles.progressText}>{getProgressText()}</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({ length: GRID_SIZE }).map((_, index) => {
          const isInSequence = sequence.includes(index);
          const isUserSelected = userSequence.includes(index);
          const isCurrentStep = gamePhase === 'recall' && userSequence.length < sequence.length && sequence[userSequence.length] === index;
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.tileWrapper,
                {
                  opacity: tileAnimations[index].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.7, 1]
                  }),
                  transform: [
                    {
                      scale: tileAnimations[index].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0.9, 1.1]
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tile,
                  isInSequence && gamePhase === 'memorize' && styles.tileMemorize,
                  isUserSelected && styles.tileSelected,
                  isCurrentStep && styles.tileCurrent,
                  gamePhase === 'result' && styles.tileDisabled
                ]}
                onPress={() => handleTileTap(index)}
                disabled={gamePhase !== 'recall'}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tileNumber,
                  isUserSelected && styles.tileNumberSelected,
                  isCurrentStep && styles.tileNumberCurrent
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {gamePhase === 'result' ? (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={startNewGame}
          >
            <Text style={styles.controlText}>NEW GAME</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={resetGame}
          >
            <Text style={styles.controlText}>RESTART</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.infoText}>
          {gamePhase === 'memorize' 
            ? `${sequence.length} numbers to remember` 
            : gamePhase === 'recall'
              ? `Sequence: ${sequence.map(s => s + 1).join(', ')}`
              : 'Tap NEW GAME to play again'
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
  statsContainer: {
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
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  tileWrapper: {
    width: '30%',
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  tileMemorize: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  tileSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  tileCurrent: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFCC80',
  },
  tileDisabled: {
    opacity: 0.7,
  },
  tileNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  tileNumberSelected: {
    color: '#2E7D32',
  },
  tileNumberCurrent: {
    color: '#EF6C00',
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
  gameInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
  },
});