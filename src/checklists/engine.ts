/**
 * @module checklists/engine
 *
 * Dynamic checklist engine that generates and manages
 * task lists based on case type, jurisdiction, and
 * current case stage. Automatically adjusts as the
 * case progresses and new requirements emerge.
 */

import type { ChecklistItem, Deadline } from '../types';

/** Progress summary for the current checklist. */
export interface ChecklistProgress {
  total: number;
  completed: number;
  requiredTotal: number;
  requiredCompleted: number;
  requiredRemaining: number;
  percentComplete: number;
}

/** Validation result indicating whether the checklist is filing-ready. */
export interface ChecklistValidation {
  ready: boolean;
  missingRequired: ChecklistItem[];
  warnings: string[];
}

/** A jurisdiction-specific rule that modifies checklist behavior. */
export interface JurisdictionRule {
  jurisdiction: string;
  caseTypes: string[];
  additionalItems: Partial<ChecklistItem>[];
  notes: Record<string, string>;
  filingFeeWaiverAvailable: boolean;
}

/**
 * ChecklistEngine generates, manages, and validates dynamic checklists
 * for self-represented litigants based on case type and jurisdiction.
 */
export class ChecklistEngine {
  private items: Map<string, ChecklistItem> = new Map();
  private jurisdictionRules: Map<string, JurisdictionRule> = new Map();

  /**
   * Generate a checklist for a given case type and jurisdiction.
   *
   * @param caseTypeId - The case type identifier (e.g. 'custody-modification')
   * @param jurisdiction - Two-letter state code (e.g. 'MO', 'CA')
   * @returns Array of checklist items tailored to the case and jurisdiction
   */
  async generate(caseTypeId: string, jurisdiction: string): Promise<ChecklistItem[]> {
    this.items.clear();

    // Load base template for the case type
    const baseItems = await this.loadBaseTemplate(caseTypeId);

    // Apply jurisdiction-specific modifications
    const rule = this.jurisdictionRules.get(jurisdiction);
    const jurisdictionItems = rule
      ? this.applyJurisdictionRules(baseItems, rule)
      : baseItems;

    // Store and return
    for (const item of jurisdictionItems) {
      this.items.set(item.id, item);
    }

    return jurisdictionItems;
  }

  /**
   * Mark a checklist item as complete.
   *
   * @param itemId - The ID of the item to mark complete
   * @throws If the item ID is not found
   */
  markComplete(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) throw new Error(`Checklist item not found: ${itemId}`);
    item.completed = true;
  }

  /**
   * Mark a checklist item as incomplete.
   *
   * @param itemId - The ID of the item to mark incomplete
   */
  markIncomplete(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) throw new Error(`Checklist item not found: ${itemId}`);
    item.completed = false;
  }

  /**
   * Get progress summary for the current checklist.
   *
   * @returns Progress metrics including completion counts and percentages
   */
  getProgress(): ChecklistProgress {
    const all = Array.from(this.items.values());
    const completed = all.filter((i) => i.completed);
    const required = all.filter((i) => i.required);
    const requiredCompleted = required.filter((i) => i.completed);

    return {
      total: all.length,
      completed: completed.length,
      requiredTotal: required.length,
      requiredCompleted: requiredCompleted.length,
      requiredRemaining: required.length - requiredCompleted.length,
      percentComplete: all.length > 0
        ? Math.round((completed.length / all.length) * 100)
        : 0,
    };
  }

  /**
   * Validate whether the checklist is ready for filing.
   * Checks that all required items are complete and flags warnings.
   *
   * @returns Validation result with readiness status and missing items
   */
  validate(): ChecklistValidation {
    const all = Array.from(this.items.values());
    const missingRequired = all.filter((i) => i.required && !i.completed);
    const warnings: string[] = [];

    // Check for items approaching due dates
    const now = new Date();
    for (const item of all) {
      if (item.dueDate && !item.completed) {
        const daysUntilDue = Math.ceil(
          (item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilDue < 0) {
          warnings.push(`OVERDUE: "${item.text}" was due ${Math.abs(daysUntilDue)} days ago.`);
        } else if (daysUntilDue <= 7) {
          warnings.push(`URGENT: "${item.text}" is due in ${daysUntilDue} days.`);
        }
      }
    }

    return {
      ready: missingRequired.length === 0,
      missingRequired,
      warnings,
    };
  }

  /**
   * Track ongoing progress -- update an item with partial notes or status.
   *
   * @param itemId - The checklist item ID
   * @param notes - Free-text notes or status update
   */
  track(itemId: string, notes: string): void {
    const item = this.items.get(itemId);
    if (!item) throw new Error(`Checklist item not found: ${itemId}`);
    item.helpText = notes;
  }

  /**
   * Extract filing deadlines from the checklist items.
   *
   * @param caseId - The case ID to associate deadlines with
   * @returns Array of Deadline objects derived from checklist due dates
   */
  extractDeadlines(caseId: string): Deadline[] {
    const deadlines: Deadline[] = [];

    for (const item of this.items.values()) {
      if (item.dueDate) {
        deadlines.push({
          id: `dl-${item.id}`,
          caseId,
          title: item.text,
          dueDate: item.dueDate,
          type: this.inferDeadlineType(item.text),
          reminderDays: [7, 3, 1],
          completed: item.completed,
        });
      }
    }

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Register a jurisdiction rule set for customizing checklists.
   */
  registerJurisdiction(rule: JurisdictionRule): void {
    this.jurisdictionRules.set(rule.jurisdiction, rule);
  }

  /** Get all current checklist items. */
  getItems(): ChecklistItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Load a base checklist template for a case type.
   * In production, templates are loaded from the templates directory.
   */
  private async loadBaseTemplate(caseTypeId: string): Promise<ChecklistItem[]> {
    // Base templates for common case types
    const templates: Record<string, Partial<ChecklistItem>[]> = {
      'custody-modification': [
        { text: 'Complete Motion to Modify Custody form', required: true },
        { text: 'Prepare Statement of Changed Circumstances', required: true },
        { text: 'Gather supporting evidence (school records, communication logs)', required: true },
        { text: 'File motion with court clerk', required: true },
        { text: 'Serve other party with filed motion', required: true },
        { text: 'File proof of service', required: true },
        { text: 'Request fee waiver if applicable', required: false },
        { text: 'Prepare proposed parenting plan', required: false },
        { text: 'Compile witness list', required: false },
        { text: 'Review courtroom procedures and etiquette', required: false },
      ],
      'divorce': [
        { text: 'Complete Petition for Dissolution of Marriage', required: true },
        { text: 'Prepare financial disclosure statement', required: true },
        { text: 'Inventory marital assets and debts', required: true },
        { text: 'File petition with court clerk', required: true },
        { text: 'Serve respondent', required: true },
        { text: 'File proof of service', required: true },
      ],
    };

    const template = templates[caseTypeId] ?? templates['custody-modification'];
    return template.map((t, i) => ({
      id: `chk-${caseTypeId}-${i}`,
      text: t.text ?? '',
      required: t.required ?? false,
      completed: false,
      helpText: t.helpText,
      jurisdictionNotes: t.jurisdictionNotes,
      dueDate: t.dueDate,
    }));
  }

  /**
   * Apply jurisdiction-specific rules to modify checklist items.
   */
  private applyJurisdictionRules(
    items: ChecklistItem[],
    rule: JurisdictionRule,
  ): ChecklistItem[] {
    const result = [...items];

    // Add jurisdiction-specific notes to existing items
    for (const item of result) {
      const note = rule.notes[item.id];
      if (note) {
        item.jurisdictionNotes = note;
      }
    }

    // Append jurisdiction-specific additional items
    for (const additional of rule.additionalItems) {
      result.push({
        id: `chk-jur-${rule.jurisdiction}-${result.length}`,
        text: additional.text ?? '',
        required: additional.required ?? false,
        completed: false,
        helpText: additional.helpText,
        jurisdictionNotes: additional.jurisdictionNotes,
        dueDate: additional.dueDate,
      });
    }

    return result;
  }

  /** Infer a deadline type from the checklist item text. */
  private inferDeadlineType(text: string): Deadline['type'] {
    const lower = text.toLowerCase();
    if (lower.includes('file') || lower.includes('submit')) return 'filing';
    if (lower.includes('hearing') || lower.includes('court date')) return 'hearing';
    if (lower.includes('serve') || lower.includes('respond')) return 'response';
    if (lower.includes('discovery') || lower.includes('disclosure')) return 'discovery';
    return 'other';
  }
}

/** Backwards-compatible function export. */
export async function generateChecklist(
  caseTypeId: string,
  jurisdiction: string,
): Promise<ChecklistItem[]> {
  const engine = new ChecklistEngine();
  return engine.generate(caseTypeId, jurisdiction);
}
