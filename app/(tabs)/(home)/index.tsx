import React from 'react';
import { AppEntryRedirect } from '../../../components/AppEntryRedirect';

/**
 * Today tab stack default: same entry routing as root `app/index.tsx` so a tappable
 * check-in opens Check-in Now instead of always jumping past it to Today Hub.
 */
export default function HomeStackEntryScreen() {
  return <AppEntryRedirect />;
}
