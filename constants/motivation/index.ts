import { MotivationalPackage } from '@/types';
import { MOTIVATIONAL_PACKAGES_1_5 } from './packages1-5';
import { MOTIVATIONAL_PACKAGES_6_10 } from './packages6-10';
import { MOTIVATIONAL_PACKAGES_11_15 } from './packages11-15';
import { MOTIVATIONAL_PACKAGES_16_20 } from './packages16-20';
import { MOTIVATIONAL_PACKAGES_21_25 } from './packages21-25';

export const MOTIVATIONAL_PACKAGES: MotivationalPackage[] = [
  ...MOTIVATIONAL_PACKAGES_1_5,
  ...MOTIVATIONAL_PACKAGES_6_10,
  ...MOTIVATIONAL_PACKAGES_11_15,
  ...MOTIVATIONAL_PACKAGES_16_20,
  ...MOTIVATIONAL_PACKAGES_21_25,
];
