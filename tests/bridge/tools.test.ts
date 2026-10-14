import { it, expect } from "vitest";
import { ToolHandlers, schemas } from "../../src/bridge/tool-handlers";
import { startBridge } from "../../src/bridge/server";
import { emptyState } from "../../src/domain/core";
import { VaultIndex } from "../../src/index/vault-index";
import { ChangeWriter } from "../../src/capture/change-writer";
it("has exactly the six note-management tools, and read/propose never mutate", async () => {
  expect(Object.keys(schemas).sort()).toEqual(
    [
      "get_workspace_policy",
      "find_notes",
      "read_note",
      "propose_capture",
      "apply_changes",
      "get_receipt",
    ].sort(),
  );
  const state = emptyState(),
    index = new VaultIndex();
  let count = 0;
  const vault = {
    read: async () => null,
    create: async () => {
      count++;
    },
    update: async () => {
      count++;
    },
    remove: async () => {
      count++;
    },
  };
  const h = new ToolHandlers(
    state,
    index,
    vault,
    new ChangeWriter(vault, state, async () => {}),
    async () => {},
  );
  await h.dispatchTool("get_workspace_policy", {});
  await h.dispatchTool("find_notes", { text: "" });
  await h.dispatchTool("propose_capture", {
    draft: {
      id: "1",
      mode: "idea",
      sourceRefs: [],
      writes: [],
      topicLinks: [],
      prompts: [],
      corrections: [],
      questions: [],
    },
  });
  expect(count).toBe(0);
  await expect(
    h.dispatchTool("read_note", { path: "../secret.md" }),
  ).rejects.toThrow();
  await expect(h.dispatchTool("not_a_tool", {})).rejects.toThrow();
});
it("bridge rejects wrong identity, credentials, origin and oversized input", async () => {
  const bridge = await startBridge("test-vault", async () => ({ ok: true }), {
    persistDescriptor: false,
  });
  try {
    const call = (
      body: unknown,
      token = bridge.token,
      extra: Record<string, string> = {},
    ) =>
      fetch(bridge.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + token,
          ...extra,
        },
        body: JSON.stringify(body),
      });
    expect(
      (
        await call({
          vaultId: "test-vault",
          name: "get_workspace_policy",
          input: {},
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          { vaultId: "test-vault", name: "get_workspace_policy", input: {} },
          "bad",
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await call({
          vaultId: "wrong",
          name: "get_workspace_policy",
          input: {},
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await call({ vaultId: "test-vault" }, bridge.token, {
          origin: "https://evil.example",
        })
      ).status,
    ).toBe(403);
    expect((await call({ data: "x".repeat(1100000) })).status).toBe(413);
  } finally {
    await bridge.close();
  }
});
