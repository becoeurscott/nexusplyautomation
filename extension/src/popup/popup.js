/**
 * Token entry. Stored in chrome.storage.local, which is scoped to this
 * extension and not readable by any web page — including the ones the content
 * script runs inside.
 *
 * "Connect" verifies the token against /balance before saving it, so a typo is
 * caught here rather than silently failing later on every overlay action.
 */
const $ = (id) => document.getElementById(id);

function show(msg, cls) {
  $("status").textContent = msg;
  $("status").className = "status " + (cls ?? "");
}

chrome.storage.local.get("token").then(({ token }) => {
  if (token) show("Connected.", "ok");
});

$("save").onclick = async () => {
  const token = $("token").value.trim();
  if (!token) return show("Paste a token first.", "err");

  show("Checking…");
  await chrome.storage.local.set({ token });

  const res = await chrome.runtime.sendMessage({ type: "balance" });
  if (!res || res.ok === false) {
    // Don't keep a token we already know is rejected — leaving it stored would
    // make every later action fail with the same error for no reason.
    await chrome.storage.local.remove("token");
    return show(res?.error ?? "That token didn't work.", "err");
  }

  $("token").value = "";
  show(`Connected. ${res.balance} credits left.`, "ok");
};

$("clear").onclick = async () => {
  await chrome.storage.local.remove("token");
  show("Disconnected.");
};
