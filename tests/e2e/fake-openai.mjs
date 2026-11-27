// Minimal stand-in for the OpenAI API used by the e2e tests (embeddings + chat).
// Start with `node tests/e2e/fake-openai.mjs` and point OPENAI_BASE_URL at http://localhost:4010/v1.
import http from "http";
const emb = (t) => { const v = new Array(1536).fill(0); for (const w of String(t).toLowerCase().split(/\W+/)) { if (!w) continue; let h = 0; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 1536] += 1; } v[1535] += 0.001; return v; };
http.createServer((req, res) => {
  let body = ""; req.on("data", (c) => body += c); req.on("end", () => {
    const j = body ? JSON.parse(body) : {};
    if (req.url.endsWith("/embeddings")) {
      const input = Array.isArray(j.input) ? j.input : [j.input];
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify({ object: "list", model: j.model, data: input.map((t, i) => ({ object: "embedding", index: i, embedding: emb(t) })), usage: { prompt_tokens: 1, total_tokens: 1 } }));
    }
    if (req.url.endsWith("/chat/completions")) {
      const last = j.messages[j.messages.length - 1].content;
      const sys = j.messages[0].content;
      const answer = `TURNS=${j.messages.length} MODEL=${j.model} Q=${last.slice(0, 60)} CONTEXT_HAS_PAGE=${/\[p\. \d+\]/.test(sys)} See (p. 35) and **bold**\n\n- item one\n- item two`;
      if (!j.stream) { res.setHeader("content-type", "application/json"); return res.end(JSON.stringify({ id: "x", object: "chat.completion", created: 0, model: j.model, choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "standalone: " + last } }] })); }
      res.setHeader("content-type", "text/event-stream");
      for (const part of answer.match(/[\s\S]{1,10}/g)) res.write(`data: ${JSON.stringify({ id: "x", object: "chat.completion.chunk", created: 0, model: j.model, choices: [{ index: 0, delta: { content: part }, finish_reason: null }] })}\n\n`);
      res.write("data: [DONE]\n\n"); return res.end();
    }
    res.statusCode = 404; res.end();
  });
}).listen(Number(process.env.PORT || 4010), () => console.log("fake openai on 4010"));
