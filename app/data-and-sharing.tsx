import React from 'react';
import { LegalDocumentLayout } from '../components/LegalDocumentLayout';
import { DATA_AND_SHARING_SECTIONS } from '../constants/legalInAppCopy';

export default function DataAndSharingScreen() {
  return (
    <LegalDocumentLayout
      title="Your data & sharing"
      intro="What stays on your device, what you can choose to share with peers, and how community features relate to consent."
      sections={DATA_AND_SHARING_SECTIONS}
    />
  );
}
