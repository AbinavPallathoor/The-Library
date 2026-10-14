export type Role = "learning" | "idea" | "reference";
export type CaptureMode = "new-learning" | "recall" | "idea" | "reference";
export type EvidenceState = "user-statement" | "source-backed" | "tentative";
export interface TopicLink {
  hubPath: string;
  notePath: string;
  heading?: string;
}
export interface NoteSnapshot {
  path: string;
  markdown: string;
  revision: string;
}
export interface RecallPrompt {
  id: string;
  notePath: string;
  question: string;
  answer: string;
  kind: "explain" | "compare" | "draw" | "apply" | "fact";
  evidence: EvidenceState;
  enrolled: boolean;
  assessment?: "again" | "partial" | "remembered";
  reviewedAt?: number;
}
export interface NoteWrite {
  path: string;
  expectedRevision: string | null;
  markdown: string;
  role: Role;
}
export interface CaptureDraft {
  id: string;
  mode: CaptureMode;
  sourceRefs: string[];
  explicitCourseCode?: string;
  writes: NoteWrite[];
  topicLinks: TopicLink[];
  prompts: RecallPrompt[];
  corrections: string[];
  questions: string[];
}
export interface ChangeSet extends CaptureDraft {
  vaultId: string;
}
export interface Receipt {
  requestId: string;
  changeSetId: string;
  status: "applied" | "conflict" | "partial" | "undone";
  paths: string[];
  conflicts: string[];
  questions: string[];
}
export interface LibraryQuery {
  text: string;
  role?: Role;
  tags: string[];
  sort: "title" | "modified";
}
export interface ReadingPosition {
  notePath: string;
  heading?: string;
  scrollTop: number;
}
export interface Journal {
  requestId: string;
  digest: string;
  changeSet: ChangeSet;
  before: NoteSnapshot[];
  created: string[];
  after: Record<string, string>;
  status: "pending" | "complete";
  receipt?: Receipt;
  previousRoles: Record<string, Role>;
  previousPrompts: RecallPrompt[];
  previousLinks: TopicLink[];
}
export interface ClearState {
  schemaVersion: 1;
  vaultId: string;
  topicLinks: TopicLink[];
  prompts: RecallPrompt[];
  drafts: ChangeSet[];
  receipts: Receipt[];
  pins: string[];
  positions: ReadingPosition[];
  roles: Record<string, Role>;
  journals: Journal[];
  lastNote?: string;
  query: LibraryQuery;
  settings: {
    folders: string[];
    captureFolder: string;
    openOnStart: boolean;
    readingFont: string;
    notebookColours?: Record<string, string>;
  };
  captures: {
    id: string;
    text: string;
    source: string;
    mode: CaptureMode;
    explicitCourseCode?: string;
  }[];
}
export interface NoteRecord extends NoteSnapshot {
  title: string;
  aliases: string[];
  tags: string[];
  headings: string[];
  links: string[];
  excerpt: string;
  modified: number;
  role: Role;
}
