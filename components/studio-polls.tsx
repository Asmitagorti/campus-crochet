"use client";
import { useEffect, useState } from "react";
import { Heart, Plus, Upload } from "lucide-react";

export type AdminPoll = {
  id: string; title: string; description: string; status: "draft" | "open" | "closed";
  created_at: string; opened_at: string | null; closed_at: string | null;
  poll_options: { id: string; title: string; description: string; image_url: string; position: number; hidden_at: string | null }[];
  results: { totalVoters: number; options: { id: string; votes: number }[] };
};

export default function StudioPolls({ mode, activePollId, polls, token, onSaved }: {
  mode: "shop" | "poll"; activePollId: string | null; polls: AdminPoll[];
  token: () => Promise<string>; onSaved: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draft = polls.find((poll) => poll.status === "draft");
  const selected = polls.find((poll) => poll.id === selectedId) || draft || polls.find((poll) => poll.status === "open") || polls[0];
  const options = [...(selected?.poll_options || [])].sort((a, b) => a.position - b.position);
  const visibleCount = options.filter((option) => !option.hidden_at).length;
  const counts = new Map(selected?.results.options.map((result) => [result.id, result.votes]) || []);

  useEffect(() => {
    if (!photo) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function post(path: string, body: unknown) {
    const response = await fetch(path, { method: "POST", headers: {
      Authorization: `Bearer ${await token()}`, "Content-Type": "application/json",
    }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Could not save the poll.");
    return data;
  }
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); await onSaved(); setNotice(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Poll update failed."); }
    finally { setBusy(false); }
  }
  function resetItem() { setName(""); setPhoto(null); setEditingId(null); setExistingImage(""); }
  function changeMode(action: "open" | "shop" | "hold" | "resume" | "close", roundId?: string) {
    const message = action === "open" || action === "resume"
      ? "Show this poll to visitors and stop new checkout payments?"
      : action === "shop" ? "Show the selling website and allow new checkout payments?"
        : action === "hold" ? "Hide checkout and show the poll coming-soon page?"
        : "Close this poll permanently and show the poll coming-soon page?";
    if (!window.confirm(message)) return;
    void run(async () => {
      await post("/api/admin/mode", { action, roundId });
      window.dispatchEvent(new CustomEvent("campus-mode-changed", {
        detail: ["open", "resume", "hold", "close"].includes(action) ? "poll" : "shop",
      }));
    }, "Website mode updated.");
  }
  async function uploadImage(file: File) {
    const form = new FormData();
    form.set("file", file); form.set("purpose", "poll");
    const response = await fetch("/api/admin/upload", {
      method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form,
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Picture upload failed.");
    return String(data.url);
  }

  return <section className="studio-polls">
    <div className="studio-section-heading"><div><h2>Design poll</h2><p>Add an item with its name and picture. Visitors can choose several items, then submit one final vote.</p></div></div>
    <div className="paper-form studio-editor">
      <h3>Visitors currently see: {mode === "poll" ? activePollId ? "the open poll" : "poll coming soon" : "the selling website"}</h3>
      <div className="poll-actions">
        {mode === "poll" && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("shop")}>Show selling website</button>}
        {mode === "shop" && activePollId && <button type="button" className="stitch-button" disabled={busy} onClick={() => changeMode("resume")}>Show the open poll</button>}
        {mode === "shop" && !activePollId && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("hold")}>Show poll coming-soon page</button>}
        {activePollId && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("close")}>Close current poll</button>}
      </div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    {!draft && <div className="paper-form studio-editor">
      <h3>Start the next poll</h3>
      <p>The heading “What should I make next?” is added automatically. Add at least two items before opening it.</p>
      <button type="button" className="stitch-button" disabled={busy} onClick={() => void run(async () => {
        const result = await post("/api/admin/polls", { action: "create" });
        setSelectedId(result.id); resetItem();
      }, "New poll draft created. 🎉")}><Plus size={15} /> Create poll</button>
    </div>}
    {selected && <div className="paper-form studio-editor">
      <div className="editor-top"><div>
        <h3>{selected.title}</h3>
        <p>{new Date(selected.created_at).toLocaleDateString()} · {selected.status === "draft" ? "Draft" : selected.status === "open" ? "Open for voting" : "Closed"} · {selected.results.totalVoters} voters</p>
      </div>{selected.status === "draft" && !activePollId && <button type="button" className="stitch-button" disabled={busy || visibleCount < 2}
        onClick={() => changeMode("open", selected.id)}>Open poll · hide checkout</button>}</div>
      {selected.status === "draft" && <>
        <p className="quiet-note">Add at least two items. Each item needs only a name and its picture.</p>
        <form className="poll-item-form" onSubmit={(event) => { event.preventDefault(); void run(async () => {
          if (!photo && !existingImage) throw Error("Choose an item picture.");
          const imageUrl = photo ? await uploadImage(photo) : existingImage;
          const previous = options.find((item) => item.id === editingId);
          await post("/api/admin/poll-options", { action: "save", roundId: selected.id,
            ...(editingId ? { id: editingId } : {}), title: name, description: "", imageUrl,
            position: previous?.position ?? (options.length ? Math.max(...options.map((item) => item.position)) + 1 : 0),
          });
          resetItem();
        }, editingId ? "Item updated." : "Item added."); }}>
          <h4>{editingId ? "Edit item" : "Add an item"}</h4>
          <div className="field"><label htmlFor="poll-item-name">Item name</label><input id="poll-item-name" required minLength={2} maxLength={100}
            value={name} onChange={(event) => setName(event.target.value)} placeholder="For example, little crochet bear" /></div>
          <div className="field"><label htmlFor="poll-item-picture">Item picture</label><input id="poll-item-picture" type="file"
            accept="image/jpeg,image/png,image/webp,image/avif" required={!editingId} disabled={busy}
            onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
            <small>JPG, PNG, WebP or AVIF, under 4 MB.</small></div>
          {(photoPreview || existingImage) && <img className="poll-item-preview" src={photoPreview || existingImage} alt="Item preview" />}
          <div className="poll-actions"><button className="stitch-button" disabled={busy || (!photo && !existingImage)}><Upload size={15} /> {editingId ? "Save item" : "Add item"}</button>
            {editingId && <button type="button" className="outline-button" onClick={resetItem}>Cancel edit</button>}</div>
        </form>
      </>}
      <div className="poll-admin-grid">
        {options.map((item) => <article key={item.id} className="studio-record">
          <img src={item.image_url} alt={item.title} />
          <div><h4>{item.title}</h4>
            {item.hidden_at && <p>Removed from visitor view</p>}
            {selected.status !== "draft" && <strong><Heart size={14} /> {counts.get(item.id) || 0} votes</strong>}</div>
          {selected.status === "draft" && <div className="poll-actions">
            <button type="button" className="outline-button" onClick={() => { setEditingId(item.id); setName(item.title); setExistingImage(item.image_url); setPhoto(null); }}>Edit</button>
            <button type="button" className="outline-button" disabled={busy} onClick={() => {
              if (!window.confirm(`Remove ${item.title} from this draft?`)) return;
              void run(async () => { await post("/api/admin/poll-options", { action: "delete", roundId: selected.id, id: item.id });
                if (editingId === item.id) resetItem(); }, "Item removed.");
            }}>Remove</button>
          </div>}
          {selected.status === "open" && <div className="poll-actions">
            <button type="button" className="outline-button" disabled={busy || (!item.hidden_at && visibleCount <= 2)}
              title={!item.hidden_at && visibleCount <= 2 ? "Keep at least two items visible while voting is open." : undefined}
              onClick={() => {
                if (!item.hidden_at && !window.confirm(`Remove ${item.title} from visitors? Existing votes stay saved and cannot be changed.`)) return;
                void run(async () => { await post("/api/admin/poll-options", { action: item.hidden_at ? "restore" : "hide", roundId: selected.id, id: item.id }); },
                  item.hidden_at ? "Item restored." : "Item hidden. Past votes are kept.");
              }}>{item.hidden_at ? "Restore" : "Remove"}</button>
          </div>}
        </article>)}
      </div>
      {selected.status === "open" && <p className="quiet-note">{visibleCount <= 2
        ? "Remove is unavailable because this poll has only two visible items. To change the choices, close this round and create a new poll."
        : "Removing an item hides it from visitors. Its past votes stay in these admin results. Keep at least two items visible."}</p>}
    </div>}
    {polls.length > 1 && <details className="paper-form studio-editor poll-history">
      <summary>Past and other polls</summary>
      <div className="poll-round-picker">{polls.filter((poll) => poll.id !== selected?.id).map((poll) => <button type="button" key={poll.id}
        onClick={() => { setSelectedId(poll.id); resetItem(); }}>
        {new Date(poll.created_at).toLocaleDateString()} · {poll.status} · {poll.results.totalVoters} voters
      </button>)}</div>
    </details>}
  </section>;
}
