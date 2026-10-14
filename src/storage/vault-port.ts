import type { NoteSnapshot } from "../domain/types";
export interface VaultPort {
  read(path: string): Promise<NoteSnapshot | null>;
  create(path: string, markdown: string): Promise<void>;
  update(
    path: string,
    expectedRevision: string,
    markdown: string,
  ): Promise<void>;
  remove(path: string, expectedRevision: string): Promise<void>;
}
