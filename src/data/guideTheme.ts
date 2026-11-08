import { Database, FileStack, Scale, ShieldCheck, type LucideIcon } from 'lucide-react';

export type GuideTheme = {
  color: string;
  ink: string;
  icon: LucideIcon;
};

export const guideThemes: GuideTheme[] = [
  { color: '#6366F1', ink: '#C7D2FE', icon: FileStack },
  { color: '#38BDF8', ink: '#BAE6FD', icon: Database },
  { color: '#10B981', ink: '#A7F3D0', icon: ShieldCheck },
  { color: '#F59E0B', ink: '#FDE68A', icon: Scale },
];

export function themeFor(index: number): GuideTheme {
  return guideThemes[index] ?? guideThemes[0];
}
