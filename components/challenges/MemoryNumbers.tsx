import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

export default function MemoryNumbers({ language, onBack }: Props) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'showing' | 'guessing' | 'gameOver'>('showing');
  const [bestLevel, setBestLevel] = useState(1);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const t = LANGUAGES[language];

  const generateSequence = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  };

  const startGame = () => {
    const newSequence = generateSequence(3);
    setSequence(newSequence);
    setUserSequence([]);
    setLevel(1);
    setGameState('showing');
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setGameState('showing');
    
    for (let i = 0; i < seq.length; i++) {
      setHighlightedIndex(i);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 800));
      setHighlightedIndex(-1);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setGameState('guessing');
    setUserSequence([]);
  };

  const handleNumberPress = (number: number) => {
    if (gameState !== 'guessing') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newUserSequence = [...userSequence, number];
    setUserSequence(newUserSequence);

    // Check if correct
    const currentIndex = newUserSequence.length - 1;
    if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
      // Wrong sequence
      setGameState('gameOver');
      if (level > bestLevel) {
        setBestLevel(level);
        Alert.alert('🎉 New Record!', `Level: ${level}`);
      } else {
        Alert.alert('Game Over', `Level: ${level}\nBest: ${bestLevel}`);
      }
      return;
    }

    // Check if sequence complete
    if (newUserSequence.length === sequence.length) {
      // Level complete
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        const newLevel = level + 1;
        const newSequence = generateSequence(2 + newLevel);
        setSequence(newSequence);
        setLevel(newLevel);
        showSequence(newSequence);
      }, 500);
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
          <Text style={styles.title}>Memory Numbers</Text>
          <Text style={styles.subtitle}>Prime</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SEQUENCE</Text>
          <Text style={styles.statValue}>{sequence.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestLevel}</Text>
        </View>
      </View>

      {/* Game State */}
      <View style={styles.gameStateContainer}>
        <Text style={styles.gameStateText}>
          {gameState === 'showing' ? 'Watch & Remember' : 
           gameState === 'guessing' ? 'Repeat the Sequence' : 
           'Game Complete'}
        </Text>
      </View>

      {/* Sequence Display */}
      <View style={styles.sequenceContainer}>
        <View style={styles.sequence}>
          {sequence.map((num, index) => (
            <View
              key={index}
              style={[
                styles.sequenceNumber,
                highlightedIndex === index && styles.highlightedNumber,
                gameState === 'guessing' && styles.hiddenNumber
              ]}
            >
              <Text style={[
                styles.sequenceText,
                highlightedIndex === index && styles.highlightedText
              ]}>
                {num}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Progress */}
      {gameState === 'guessing' && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Your Input:</Text>
          <View style={styles.userSequence}>
            {userSequence.map((num, index) => (
              <View key={index} style={styles.userNumber}>
                <Text style={styles.userNumberText}>{num}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.progressCount}>
            {userSequence.length}/{sequence.length}
          </Text>
        </View>
      )}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numberButton,
              gameState !== 'guessing' && styles.numberButtonDisabled
            ]}
            onPress={() => handleNumberPress(num)}
            disabled={gameState !== 'guessing'}
          >
            <Text style={styles.numberButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {gameState === 'gameOver' ? (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={startGame}
          >
            <Text style={styles.controlText}>PLAY AGAIN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={startGame}
            disabled={gameState !== 'showing'}
          >
            <Text style={styles.controlText}>
              {gameState === 'showing' ? 'SKIP' : 'WAITING...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameState === 'showing' 
            ? 'Watch the numbers, then repeat them' 
            : gameState === 'guessing'
              ? 'Tap numbers in the same order'
              : 'Sequence gets longer each level'
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
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  gameStateContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  sequenceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sequence: {
    flexDirection: 'row',
    gap: 12,
  },
  sequenceNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  highlightedNumber: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    transform: [{ scale: 1.1 }],
  },
  hiddenNumber: {
    backgroundColor: '#F5F5F5',
    borderColor: '#F0F0F0',
  },
  sequenceText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  highlightedText: {
    color: '#FFFFFF',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 12,
  },
  userSequence: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  userNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNumberText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressCount: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  numberButtonDisabled: {
    backgroundColor: '#F8F8F8',
    opacity: 0.6,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
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
    padding: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});