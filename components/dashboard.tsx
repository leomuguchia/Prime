import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { LANGUAGES, LanguageCode } from '../constants/languages';

interface Props {
  language: LanguageCode;
  onLanguageChange: () => void;
  onChallengeSelect: (challengeId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// All 14 Challenges organized by category
const CHALLENGES = [
  // Reflex & Speed Challenges (Most popular)
  {
    id: 'numberTap',
    name: 'Number Tap',
    description: 'Tap numbers 1-25 in order',
    icon: '🔢',
    color: '#000000',
    type: 'Reflex',
    category: 'speed'
  },
  {
    id: 'mathSprint', 
    name: 'Math Sprint',
    description: 'Quick mental calculations',
    icon: '⚡',
    color: '#000000',
    type: 'Speed',
    category: 'speed'
  },
  {
    id: 'reflexRush',
    name: 'Reflex Rush',
    description: 'React to colors & shapes',
    icon: '🎯',
    color: '#000000',
    type: 'Reflex',
    category: 'speed'
  },
  
  // Memory Challenges
  {
    id: 'memoryMatrix',
    name: 'Memory Matrix',
    description: 'Remember tile patterns',
    icon: '🧠',
    color: '#000000',
    type: 'Memory',
    category: 'memory'
  },
  {
    id: 'memoryNumbers',
    name: 'Memory Numbers',
    description: 'Remember sequences',
    icon: '📝',
    color: '#000000',
    type: 'Memory',
    category: 'memory'
  },
  
  // Logic & Pattern Challenges
  {
    id: 'patternMatch',
    name: 'Pattern Match',
    description: 'Find the pattern',
    icon: '🔍',
    color: '#000000',
    type: 'Logic',
    category: 'logic'
  },
  {
    id: 'patternPath',
    name: 'Pattern Path',
    description: 'Complete visual patterns',
    icon: '🔄',
    color: '#000000',
    type: 'Logic',
    category: 'logic'
  },
  {
    id: 'sequenceMaster',
    name: 'Sequence Master',
    description: 'Identify number patterns',
    icon: '📈',
    color: '#000000',
    type: 'Logic',
    category: 'logic'
  },
  
  // Math & Calculation Challenges
  {
    id: 'primeHunter',
    name: 'Prime Hunter',
    description: 'Find prime numbers',
    icon: '🎯',
    color: '#000000',
    type: 'Math',
    category: 'math'
  },
  {
    id: 'divisionChallenge',
    name: 'Division Master',
    description: 'Division practice',
    icon: '➗',
    color: '#000000',
    type: 'Math',
    category: 'math'
  },
  {
    id: 'mentalArithmetic',
    name: 'Mental Arithmetic',
    description: 'Mixed operations',
    icon: '🧮',
    color: '#000000',
    type: 'Math',
    category: 'math'
  },
  {
    id: 'mathFactMaster',
    name: 'Math Facts',
    description: 'Master basic facts',
    icon: '⭐',
    color: '#000000',
    type: 'Math',
    category: 'math'
  },
  
  // Advanced & Endless Challenges
  {
    id: 'infiniteMathZen',
    name: 'Math Zen',
    description: 'Relaxing endless math',
    icon: '☯️',
    color: '#000000',
    type: 'Zen',
    category: 'advanced'
  },
  {
    id: 'mathStream',
    name: 'Math Stream',
    description: 'Endless math challenge',
    icon: '∞',
    color: '#000000',
    type: 'Endless',
    category: 'advanced'
  },
];

export default function Dashboard({ language, onLanguageChange, onChallengeSelect }: Props) {
  const t = LANGUAGES[language];

  // Group challenges by category
  const speedChallenges = CHALLENGES.filter(c => c.category === 'speed');
  const memoryChallenges = CHALLENGES.filter(c => c.category === 'memory');
  const logicChallenges = CHALLENGES.filter(c => c.category === 'logic');
  const mathChallenges = CHALLENGES.filter(c => c.category === 'math');
  const advancedChallenges = CHALLENGES.filter(c => c.category === 'advanced');

  const renderChallengeSection = (title: string, challenges: typeof CHALLENGES) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {challenges.map((challenge) => (
        <TouchableOpacity
          key={challenge.id}
          style={styles.challengeCard}
          onPress={() => onChallengeSelect(challenge.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconCircle}>
              <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            </View>
            
            <View style={styles.cardText}>
              <View style={styles.cardHeader}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{challenge.type}</Text>
                </View>
              </View>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            </View>
          </View>
          
          <View style={styles.cardArrow}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Prime</Text>
            <TouchableOpacity 
              onPress={onLanguageChange} 
              style={styles.languageButton}
              activeOpacity={0.6}
            >
              <Text style={styles.languageCode}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>math reflex</Text>
        </View>

        {/* Simple Divider */}
        <View style={styles.divider} />

        {/* Challenges Grid */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.challengesGrid}
        >
          <Text style={styles.mainTitle}>Brain Training Challenges</Text>
          
          {renderChallengeSection('⚡ Speed & Reflex', speedChallenges)}
          {renderChallengeSection('🧠 Memory', memoryChallenges)}
          {renderChallengeSection('🔍 Logic & Patterns', logicChallenges)}
          {renderChallengeSection('🧮 Math Skills', mathChallenges)}
          {renderChallengeSection('🌟 Advanced', advancedChallenges)}
          
          {/* Challenge Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Challenge Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>Total Challenges</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>∞</Text>
                <Text style={styles.statLabel}>Levels</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Languages</Text>
              </View>
            </View>
          </View>
          
          {/* Coming Soon Section */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonTitle}>More Challenges Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              We're constantly adding new brain training exercises to keep your mind sharp!
            </Text>
          </View>
        </ScrollView>

        {/* Footer Stats */}
        <View style={styles.footerStats}>
          <View style={styles.statItem}>
            <Text style={styles.footerStatNumber}>14</Text>
            <Text style={styles.footerStatLabel}>Challenges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.footerStatNumber}>12</Text>
            <Text style={styles.footerStatLabel}>Languages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.footerStatNumber}>0</Text>
            <Text style={styles.footerStatLabel}>Played Today</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  languageCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  challengesGrid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  challengeIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardText: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.5,
  },
  challengeDescription: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
  },
  cardArrow: {
    paddingLeft: 8,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#999999',
    fontWeight: '300',
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  comingSoonSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerStats: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerStatNumber: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  footerStatLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
});