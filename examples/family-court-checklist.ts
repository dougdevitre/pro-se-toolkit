/**
 * Example: Generate a jurisdiction-specific family court checklist
 *
 * Demonstrates how to use the ChecklistEngine to produce a
 * dynamic checklist for a custody case in Missouri, track
 * completion, and validate readiness for filing.
 */

import { ChecklistEngine } from '../src/checklists/engine';
import type { CaseType, ChecklistItem, Deadline } from '../src/types';

async function main() {
  // --- Step 1: Define the case ---

  const caseType: CaseType = {
    id: 'custody-modification',
    name: 'Custody Modification',
    category: 'custody',
    jurisdiction: 'MO',
    description: 'Modify an existing custody arrangement due to changed circumstances.',
  };

  // --- Step 2: Generate the checklist ---

  const engine = new ChecklistEngine();

  const checklist: ChecklistItem[] = await engine.generate(
    caseType.id,
    caseType.jurisdiction,
  );

  console.log(`Generated ${checklist.length} checklist items for ${caseType.name} in ${caseType.jurisdiction}:\n`);

  for (const item of checklist) {
    const status = item.completed ? '[x]' : '[ ]';
    const required = item.required ? '(REQUIRED)' : '(optional)';
    console.log(`  ${status} ${item.text} ${required}`);
    if (item.helpText) {
      console.log(`      Help: ${item.helpText}`);
    }
    if (item.jurisdictionNotes) {
      console.log(`      MO Note: ${item.jurisdictionNotes}`);
    }
  }

  // --- Step 3: Track completion ---

  // Simulate completing some items
  const completedIds = [checklist[0].id, checklist[1].id];
  for (const id of completedIds) {
    engine.markComplete(id);
  }

  const progress = engine.getProgress();
  console.log(`\nProgress: ${progress.completed}/${progress.total} items complete`);
  console.log(`  Required remaining: ${progress.requiredRemaining}`);

  // --- Step 4: Validate readiness ---

  const validation = engine.validate();
  console.log(`\nFiling readiness: ${validation.ready ? 'READY' : 'NOT READY'}`);

  if (!validation.ready) {
    console.log('Missing required items:');
    for (const missing of validation.missingRequired) {
      console.log(`  - ${missing.text}`);
      if (missing.dueDate) {
        console.log(`    Due: ${missing.dueDate.toLocaleDateString()}`);
      }
    }
  }

  // --- Step 5: Extract deadlines ---

  const deadlines: Deadline[] = engine.extractDeadlines(caseType.id);
  console.log(`\nUpcoming deadlines (${deadlines.length}):`);
  for (const dl of deadlines) {
    console.log(`  ${dl.dueDate.toLocaleDateString()} - ${dl.title} (${dl.type})`);
  }
}

main().catch(console.error);
