import React from 'react';
import { LegalDocumentLayout } from '../components/LegalDocumentLayout';
import { PRIVACY_POLICY_SECTIONS } from '../constants/legalInAppCopy';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      intro="How Recovery Companion handles your information on this device and in optional online features."
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
