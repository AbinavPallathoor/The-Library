// This module is loaded only when the user starts the desktop bridge.
export async function startBridge(
  vaultId: string,
  dispatch: (name: string, input: unknown) => Promise<unknown>,
  options: { persistDescriptor?: boolean } = {},
) {
  const http = await import("node:http"),
    crypto = await import("node:crypto");
  const token = crypto.randomBytes(32).toString("hex");
  let port = 0;
  const server = http.createServer(async (req, res) => {
    const send = (status: number, data: unknown) => {
      res.writeHead(status, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    if (req.method !== "POST" || req.url !== "/v1/rpc") {
      send(404, { error: "Not found" });
      return;
    }
    if (req.headers.host !== `127.0.0.1:${port}` || req.headers.origin) {
      send(403, { error: "Forbidden origin" });
      return;
    }
    const received = req.headers.authorization ?? "",
      expected = "Bearer " + token;
    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    ) {
      send(401, { error: "Unauthorized" });
      return;
    }
    if (req.headers["content-type"] !== "application/json") {
      send(415, { error: "JSON required" });
      return;
    }
    let size = 0;
    const chunks: Buffer[] = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          send(413, { error: "Request too large" });
          return;
        }
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (body.vaultId !== vaultId) {
        send(403, { error: "Wrong vault" });
        return;
      }
      if (typeof body.name !== "string" || !Object.hasOwn(body, "input")) {
        send(400, { error: "Malformed request" });
        return;
      }
      const result = await dispatch(body.name, body.input);
      send(200, { result });
    } catch (e) {
      send(400, { error: e instanceof Error ? e.message : "Request failed" });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw Error("Bridge failed to bind");
  port = address.port;
  const url = `http://127.0.0.1:${port}/v1/rpc`;
  let descriptorPath = "";
  if (options.persistDescriptor !== false) {
    try {
      const fs = await import("node:fs/promises"),
        os = await import("node:os"),
        path = await import("node:path");
      const dir = path.join(os.homedir(), ".clear", "connections");
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      descriptorPath = path.join(dir, vaultId + ".json");
      await fs.writeFile(
        descriptorPath,
        JSON.stringify({ url, token, vaultId }),
        { mode: 0o600 },
      );
      await fs.chmod(descriptorPath, 0o600);
    } catch (e) {
      server.close();
      throw e;
    }
  }
  return {
    url,
    token,
    descriptorPath,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((e) => (e ? reject(e) : resolve()));
        server.closeAllConnections();
      });
      if (descriptorPath) {
        const fs = await import("node:fs/promises");
        try {
          await fs.unlink(descriptorPath);
        } catch {
          /* Already removed. */
        }
      }
    },
  };
}
