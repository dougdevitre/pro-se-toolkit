/**
 * @module components/CaseWizard
 *
 * Multi-step wizard component that guides users through
 * case type identification and initial strategy setup.
 * Uses plain-language questions and clear explanations
 * to help users understand their legal situation.
 */

import React from 'react';

export interface CaseWizardProps {
  /** Callback when case type is identified */
  onCaseIdentified?: (caseTypeId: string) => void;
  /** Pre-selected jurisdiction */
  jurisdiction?: string;
}

export const CaseWizard: React.FC<CaseWizardProps> = ({ onCaseIdentified, jurisdiction }) => {
  // TODO: Implement multi-step case identification wizard
  return (
    <div data-testid="case-wizard">
      <p>Case Type Wizard — {jurisdiction || 'Select your state'}</p>
    </div>
  );
};

export default CaseWizard;
