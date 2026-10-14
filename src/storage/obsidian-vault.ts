import { App, TFile } from "obsidian";
import { revision, validateRoute } from "../domain/core";
import type { VaultPort } from "./vault-port";
export class ObsidianVault implements VaultPort {
  constructor(private app: App) {}
  private check(path: string) {
    if (!validateRoute(path).ok) throw Error("Invalid note path: " + path);
  }
  async read(path: string) {
    this.check(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return null;
    const markdown = await this.app.vault.read(f);
    return { path, markdown, revision: revision(markdown) };
  }
  async create(path: string, markdown: string) {
    this.check(path);
    const parts = path.split("/");
    parts.pop();
    let folder = "";
    for (const part of parts) {
      folder += (folder ? "/" : "") + part;
      if (!this.app.vault.getAbstractFileByPath(folder))
        await this.app.vault.createFolder(folder);
    }
    await this.app.vault.create(path, markdown);
  }
  async update(path: string, expectedRevision: string, markdown: string) {
    this.check(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) throw Error("Note no longer exists");
    await this.app.vault.process(f, (current) => {
      if (revision(current) !== expectedRevision)
        throw Error("Note changed since it was read");
      return markdown;
    });
  }
  async remove(path: string, expectedRevision: string) {
    // Obsidian has atomic process(), but no compare-and-delete operation. Never race a
    // human edit by deleting a newly created note during multi-file recovery.
    const current = await this.read(path);
    if (current === null) return;
    if (current.revision !== expectedRevision) throw Error("Note changed");
    throw Error("New note retained for manual removal: " + path);
  }
}
