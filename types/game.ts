import { LanguageCode } from '../constants/languages';

export type Challenge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<any>;
  bestScore?: number;
  color: string;
  gradient: string[];
};

export type GameProps = {
  language: LanguageCode;
  onBack: () => void;
};