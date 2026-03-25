# Pro Se Assistant Toolkit -- Architecture

## System Overview

```mermaid
graph TB
    subgraph "Strategy Layer"
        CTS[CaseTypeSelector]
        IS[IssueSpotter]
        PR[PriorityRanker]
    end

    subgraph "Checklist Engine"
        CE[ChecklistEngine]
        JL[JurisdictionLoader]
        CT[Checklist Templates]
    end

    subgraph "Deadline System"
        DT[DeadlineTracker]
        CAL[Calendar Integration]
        REM[Reminders]
    end

    subgraph "Court Prep"
        SIM[CourtPrepSimulator]
        PQA[PracticeQA]
        DOC[DayOfCompanion]
    end

    subgraph "React Components"
        CW[CaseWizard]
        CLV[ChecklistView]
        DC[DeadlineCalendar]
        CPS[CourtPrepSim]
    end

    CTS --> IS
    IS --> PR
    PR --> CE

    CE --> JL
    JL --> CT
    CE --> DT

    DT --> CAL
    DT --> REM

    PR --> SIM
    SIM --> PQA
    SIM --> DOC

    CTS --> CW
    CE --> CLV
    DT --> DC
    SIM --> CPS
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Wizard as CaseWizard
    participant Strategy as Strategy Layer
    participant Checklist as ChecklistEngine
    participant Deadlines as DeadlineTracker
    participant Prep as CourtPrepSimulator

    User->>Wizard: Select case type & jurisdiction
    Wizard->>Strategy: Analyze case parameters
    Strategy->>Strategy: Identify legal issues
    Strategy->>Strategy: Rank by priority
    Strategy->>Checklist: Generate checklist

    Checklist->>Checklist: Load jurisdiction rules
    Checklist->>Checklist: Build task list
    Checklist->>Deadlines: Extract deadlines
    Checklist->>User: Dynamic checklist

    Deadlines->>Deadlines: Calculate due dates
    Deadlines->>User: Calendar + reminders

    User->>Prep: Start court prep
    Prep->>Prep: Load scenario for case type
    Prep->>User: Practice questions
    User->>Prep: Practice answers
    Prep->>User: Feedback + tips

    Prep->>User: Day-of companion checklist
```

## Checklist Generation Flow

```mermaid
flowchart TD
    Start[User selects case type] --> JR{Jurisdiction?}

    JR -->|Missouri| MO[Load MO rules]
    JR -->|California| CA[Load CA rules]
    JR -->|Other| OT[Load state rules]

    MO --> Merge[Merge with case type template]
    CA --> Merge
    OT --> Merge

    Merge --> Stage{Case stage?}
    Stage -->|Pre-filing| PF[Filing requirements<br/>Service rules<br/>Fee waivers]
    Stage -->|Discovery| DS[Disclosure deadlines<br/>Document requests<br/>Interrogatories]
    Stage -->|Pre-hearing| PH[Motion deadlines<br/>Exhibit prep<br/>Witness lists]
    Stage -->|Hearing| HR[Court prep checklist<br/>What to bring<br/>What to say]

    PF --> Validate[Validate completeness]
    DS --> Validate
    PH --> Validate
    HR --> Validate

    Validate --> Output[Dynamic ChecklistItem[]]
```

## Court Prep Simulator Detail

```mermaid
stateDiagram-v2
    [*] --> SelectCase
    SelectCase --> LoadScenario : case type chosen
    LoadScenario --> Overview : scenario loaded

    state "Preparation Modules" as Prep {
        Overview --> Etiquette : courtroom rules
        Etiquette --> PracticeQA : judge questions
        PracticeQA --> EvidencePresentation : presenting evidence
        EvidencePresentation --> Objections : handling objections
        Objections --> DayOf : day-of checklist
    }

    DayOf --> Summary : review
    Summary --> [*]
```

## Component Interaction

```mermaid
graph TD
    subgraph "Pages"
        CW[CaseWizard<br/>Step-by-step case setup<br/>Type + jurisdiction]
        CLV[ChecklistView<br/>Interactive task list<br/>Progress tracking]
        DC[DeadlineCalendar<br/>Visual calendar<br/>Reminder management]
        CPS[CourtPrepSim<br/>Practice Q&A<br/>Tips and guidance]
    end

    subgraph "Shared State"
        CS[Case State<br/>Type, jurisdiction,<br/>stage, parties]
        CL[Checklist State<br/>Items, completion,<br/>requirements]
        DL[Deadline State<br/>Due dates, reminders,<br/>calendar events]
    end

    CW -->|"case config"| CS
    CS -->|"generate"| CL
    CL -->|"extract dates"| DL

    CS --> CLV
    CL --> CLV
    DL --> DC
    CS --> CPS
```
