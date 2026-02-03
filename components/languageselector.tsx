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
  onLanguageSelect: (language: LanguageCode) => void;
  currentLanguage: LanguageCode;
}

const LANGUAGE_DATA = {
  en: { name: 'English', native: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', native: 'Français', flag: '🇫🇷' },
  de: { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  ja: { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', native: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  ru: { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  ar: { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' }
};

const { width } = Dimensions.get('window');
const LANGUAGE_WIDTH = (width - 60) / 4.5;

export default function LanguageSelector({ onLanguageSelect, currentLanguage }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PRIME</Text>
          <Text style={styles.subtitle}>Select Language</Text>
        </View>

        {/* Current Language Preview */}
        <View style={styles.currentPreview}>
          <Text style={styles.currentFlag}>
            {LANGUAGE_DATA[currentLanguage]?.flag || '🌐'}
          </Text>
          <View style={styles.currentInfo}>
            <Text style={styles.currentName}>
              {LANGUAGE_DATA[currentLanguage]?.name || currentLanguage.toUpperCase()}
            </Text>
            <Text style={styles.currentNative}>
              {LANGUAGE_DATA[currentLanguage]?.native || ''}
            </Text>
          </View>
        </View>

        {/* Language Grid - Minimal */}
        <ScrollView 
          style={styles.languageGrid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.languageGridContent}
        >
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((lang) => {
            const isSelected = currentLanguage === lang;
            const languageInfo = LANGUAGE_DATA[lang];
            
            return (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageItem,
                  isSelected && styles.selectedLanguageItem
                ]}
                onPress={() => onLanguageSelect(lang)}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.languageFlag,
                  isSelected && styles.selectedLanguageFlag
                ]}>
                  {languageInfo?.flag || '🌐'}
                </Text>
                <Text style={[
                  styles.languageCode,
                  isSelected && styles.selectedLanguageCode
                ]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => onLanguageSelect(currentLanguage)}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 1,
  },
  currentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  currentFlag: {
    fontSize: 36,
    marginRight: 16,
  },
  currentInfo: {
    flex: 1,
  },
  currentName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  currentNative: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  languageGrid: {
    flex: 1,
  },
  languageGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  languageItem: {
    width: LANGUAGE_WIDTH,
    height: LANGUAGE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectedLanguageItem: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    transform: [{ scale: 1.05 }],
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 8,
  },
  selectedLanguageFlag: {
    color: '#FFFFFF',
  },
  languageCode: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 0.5,
  },
  selectedLanguageCode: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});