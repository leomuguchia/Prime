import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES, LanguageCode } from '../../constants/languages';

interface Props {
  language: LanguageCode;
  onBack: () => void;
}

const GRID_SIZE = 16; // 4x4 grid
const TIME_LIMIT = 30; // 30 seconds

export default function PrimeHunter({ language, onBack }: Props) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameActive, setGameActive] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [scaleAnims] = useState(() => 
    Array(GRID_SIZE).fill(0).map(() => new Animated.Value(1))
  );
  const [targetPrime, setTargetPrime] = useState<number>(0);

  const t = LANGUAGES[language];

  // Generate prime numbers up to 100
  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    let i = 5;
    while (i * i <= num) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
      i += 6;
    }
    return true;
  };

  // Generate a random prime number under 100
  const generateRandomPrime = (): number => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
    return primes[Math.floor(Math.random() * primes.length)];
  };

  // Initialize game
  const startGame = () => {
    generateGrid();
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setGameActive(true);
    setTargetPrime(generateRandomPrime());
  };

  // Generate grid with random numbers (1-100)
  const generateGrid = () => {
    const numbersArray = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      numbersArray.push(Math.floor(Math.random() * 99) + 1);
    }
    // Ensure at least 3 prime numbers in grid
    let primeCount = numbersArray.filter(num => isPrime(num)).length;
    while (primeCount < 3) {
      const randomIndex = Math.floor(Math.random() * GRID_SIZE);
      const randomPrime = generateRandomPrime();
      numbersArray[randomIndex] = randomPrime;
      primeCount = numbersArray.filter(num => isPrime(num)).length;
    }
    setNumbers(numbersArray);
  };

  // Tap animation
  const tapAnimation = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Handle number tap
  const handleNumberTap = (number: number, index: number) => {
    if (!gameActive) return;

    tapAnimation(index);

    if (isPrime(number) && number === targetPrime) {
      // Correct prime tapped
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(prev => prev + 1);
      
      // Find new prime to hunt
      const primesInGrid = numbers.filter(num => isPrime(num) && num !== targetPrime);
      if (primesInGrid.length > 0) {
        setTargetPrime(primesInGrid[Math.floor(Math.random() * primesInGrid.length)]);
      } else {
        // No more primes, regenerate grid
        generateGrid();
        setTargetPrime(generateRandomPrime());
      }
    } else if (isPrime(number)) {
      // Wrong prime tapped
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeLeft(prev => Math.max(0, prev - 1)); // Penalty: -1 second
    } else {
      // Non-prime tapped
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeLeft(prev => Math.max(0, prev - 0.5)); // Smaller penalty
    }
  };

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.05) {
            clearInterval(interval);
            setGameActive(false);
            
            // Game over - check for best score
            if (score > bestScore) {
              setBestScore(score);
              Alert.alert('🎉 New Record!', `Score: ${score}\nTap all prime numbers in 30 seconds!`);
            } else {
              Alert.alert('Game Complete', `Score: ${score}\nBest: ${bestScore}`);
            }
            return 0;
          }
          return Number((prev - 0.05).toFixed(2));
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [gameActive, timeLeft]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Prime Hunter</Text>
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
          <Text style={styles.statLabel}>BEST</Text>
          <Text style={styles.statValue}>{bestScore}</Text>
        </View>
      </View>

      {/* Target Prime */}
      <View style={styles.targetContainer}>
        <Text style={styles.targetLabel}>Find This Prime:</Text>
        <Text style={styles.targetPrime}>{targetPrime}</Text>
        <Text style={styles.targetNote}>Tap only prime numbers</Text>
      </View>

      {/* Number Grid */}
      <View style={styles.grid}>
        {numbers.map((number, index) => (
          <Animated.View
            key={`${number}-${index}`}
            style={{ transform: [{ scale: scaleAnims[index] }] }}
          >
            <TouchableOpacity
              style={[
                styles.numberTile,
                isPrime(number) && styles.primeTile,
                isPrime(number) && number === targetPrime && styles.targetPrimeTile,
                !gameActive && styles.disabledTile
              ]}
              onPress={() => handleNumberTap(number, index)}
              disabled={!gameActive}
            >
              <Text style={[
                styles.numberText,
                isPrime(number) && styles.primeText,
                isPrime(number) && number === targetPrime && styles.targetPrimeText
              ]}>
                {number}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          {gameActive 
            ? 'Tap the target prime number' 
            : timeLeft === 0 
              ? 'Time\'s up! Tap START to play again'
              : 'Tap START to begin'
          }
        </Text>
      </View>

      {/* Controls */}
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
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  targetContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  targetLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  targetPrime: {
    fontSize: 48,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  targetNote: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 8,
  },
  numberTile: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primeTile: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  targetPrimeTile: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  disabledTile: {
    backgroundColor: '#F8F8F8',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  primeText: {
    color: '#E53935',
  },
  targetPrimeText: {
    color: '#FFFFFF',
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