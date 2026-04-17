import React from 'react';
import { LegalDocumentLayout } from '../components/LegalDocumentLayout';
import { PRIVACY_POLICY_SECTIONS } from '../constants/legalInAppCopy';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      intro="This Privacy Policy explains what information Recovery Companion collects, how it is stored and used, when it is shared, how long it is kept, and how you can delete it. The same policy text is published in the project docs for parity with App Store Connect."
      sections={PRIVACY_POLICY_SECTIONS}
    />
  );
}
