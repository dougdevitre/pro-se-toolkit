# Checklist Templates

This directory contains jurisdiction-specific checklist templates for different case types.

## Adding a New Template

1. Create a JSON file named `{jurisdiction}-{case-type}.json`
2. Follow the schema defined in `src/types/index.ts` (ChecklistItem interface)
3. Include `required` flags for mandatory items
4. Add `helpText` for items that may be confusing to self-represented litigants
5. Include `jurisdictionNotes` for jurisdiction-specific requirements

## Template Structure

```json
{
  "jurisdiction": "state-code",
  "caseType": "case-type-id",
  "items": [
    {
      "id": "unique-id",
      "text": "Plain-language description of the task",
      "required": true,
      "helpText": "Additional explanation for the user",
      "jurisdictionNotes": "State-specific details"
    }
  ]
}
```

## Contributing Templates

We welcome contributions of checklist templates for new jurisdictions. Please verify accuracy with a licensed attorney in the relevant jurisdiction before submitting.
