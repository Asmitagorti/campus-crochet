"use client";
import { useState } from "react";
import { Heart, Plus, Upload } from "lucide-react";

export type AdminPoll = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "open" | "closed";
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  poll_options: { id: string; title: string; description: string; image_url: string; position: number }[];
  results: { totalVoters: number; options: { id: string; votes: number }[] };
};

type OptionDraft = { id?: string; title: string; description: string; imageUrl: string; position: number };
const emptyOption: OptionDraft = { title: "", description: "", imageUrl: "", position: 0 };

export default function StudioPolls({ mode, activePollId, polls, token, onSaved }: {
  mode: "shop" | "poll";
  activePollId: string | null;
  polls: AdminPoll[];
  token: () => Promise<string>;
  onSaved: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [option, setOption] = useState<OptionDraft>(emptyOption);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selected = polls.find((poll) => poll.id === selectedId) || polls.find((poll) => poll.status === "draft") || polls[0];
  const options = [...(selected?.poll_options || [])].sort((a, b) => a.position - b.position);
  const counts = new Map(selected?.results.options.map((result) => [result.id, result.votes]) || []);

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
  function changeMode(action: "open" | "shop" | "hold" | "pause" | "resume" | "close", roundId?: string) {
    const message = action === "open" || action === "resume"
      ? "Show this poll to visitors and stop new checkout payments?"
      : action === "shop" || action === "pause" ? "Show the selling website and allow new checkout payments?"
        : action === "hold" ? "Hide checkout and show the poll coming-soon page?"
        : "Close this poll permanently and show the poll coming-soon page?";
    if (!window.confirm(message)) return;
    void run(async () => {
      await post("/api/admin/mode", { action, roundId });
      window.dispatchEvent(new CustomEvent("campus-mode-changed", { detail: ["open", "resume", "hold", "close"].includes(action) ? "poll" : "shop" }));
    }, "Website mode updated.");
  }
  async function uploadImage(file: File) {
    const form = new FormData();
    form.set("file", file); form.set("purpose", "poll");
    const response = await fetch("/api/admin/upload", {
      method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form,
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Photo upload failed.");
    return String(data.url);
  }
  function bulkUpload(files: FileList | null) {
    if (!selected || selected.status !== "draft" || !files?.length) return;
    const picked = Array.from(files).slice(0, 50);
    void run(async () => {
      for (const [index, file] of picked.entries()) {
        const imageUrl = await uploadImage(file);
        const titleFromFile = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 100);
        await post("/api/admin/poll-options", { action: "save", roundId: selected.id,
          title: titleFromFile.length >= 2 ? titleFromFile : "New design",
          description: "", imageUrl, position: options.length + index });
      }
    }, `${picked.length} design photo${picked.length === 1 ? "" : "s"} added. Review the names before opening.`);
  }

  return <section className="studio-polls">
    <div className="studio-section-heading"><div><h2>Design polls</h2><p>Let visitors choose what you make next. One Google account can update one ballot per round.</p></div></div>
    <div className="paper-form studio-editor">
      <h3>Website mode: {mode === "poll" ? "Design poll" : "Selling website"}</h3>
      {activePollId && <p>Current round: {polls.find((poll) => poll.id === activePollId)?.title || activePollId}</p>}
      <div className="poll-actions">
        {mode === "poll" && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("shop")}>Show shop · enable checkout</button>}
        {mode === "shop" && activePollId && <button type="button" className="stitch-button" disabled={busy} onClick={() => changeMode("resume")}>Resume poll · hide checkout</button>}
        {mode === "shop" && !activePollId && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("hold")}>Show poll holding page · hide checkout</button>}
        {activePollId && <button type="button" className="outline-button" disabled={busy} onClick={() => changeMode("close")}>Close round</button>}
      </div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    <form className="paper-form studio-editor" onSubmit={(event) => { event.preventDefault(); void run(async () => {
      const result = await post("/api/admin/polls", { action: "create", title, description });
      setSelectedId(result.id); setTitle(""); setDescription(""); setOption(emptyOption);
    }, "Draft poll created."); }}>
      <h3>Start a new poll draft</h3>
      <div className="field"><label htmlFor="poll-title">Poll title</label><input id="poll-title" required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What should I make next?" /></div>
      <div className="field"><label htmlFor="poll-description">Introduction</label><textarea id="poll-description" maxLength={1000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Pick all the designs you would love to see." /></div>
      <button className="stitch-button" disabled={busy}><Plus size={15} /> Create draft</button>
    </form>
    {!!polls.length && <div className="poll-round-picker" aria-label="Poll rounds">
      {polls.map((poll) => <button key={poll.id} type="button" className={selected?.id === poll.id ? "selected" : ""}
        onClick={() => { setSelectedId(poll.id); setOption(emptyOption); }}>
        {poll.title} · {poll.status} · {poll.results.totalVoters} voter{poll.results.totalVoters === 1 ? "" : "s"}
      </button>)}
    </div>}
    {selected && <div className="paper-form studio-editor">
      <div className="editor-top"><div><h3>{selected.title}</h3><p>{selected.status === "draft" ? "Draft · add at least two photos" : selected.status === "open" ? "Open for voting" : "Closed · results kept"}</p></div>
        {selected.status === "draft" && !activePollId && <button type="button" className="stitch-button" disabled={busy || options.length < 2}
          onClick={() => changeMode("open", selected.id)}>Open poll · hide checkout</button>}
      </div>
      {selected.description && <p>{selected.description}</p>}
      {selected.status === "draft" && <>
        <label className="outline-button poll-upload"><Upload size={15} /> Upload several design photos
          <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy}
            onChange={(event) => { bulkUpload(event.target.files); event.target.value = ""; }} />
        </label>
        <p className="quiet-note">Photos are separate from the shop catalogue. File names become draft design names that you can edit below.</p>
        <form onSubmit={(event) => { event.preventDefault(); void run(async () => {
          await post("/api/admin/poll-options", { action: "save", roundId: selected.id, ...option });
          setOption(emptyOption);
        }, "Design saved."); }}>
          <h4>{option.id ? "Edit design" : "Add a design"}</h4>
          <div className="form-columns">
            <div className="field"><label htmlFor="option-name">Design name</label><input id="option-name" required minLength={2} maxLength={100} value={option.title} onChange={(event) => setOption({ ...option, title: event.target.value })} /></div>
            <div className="field"><label htmlFor="option-order">Display order</label><input id="option-order" type="number" min={0} max={1000} step={1} required value={option.position} onChange={(event) => setOption({ ...option, position: Number(event.target.value) })} /></div>
          </div>
          <div className="field"><label htmlFor="option-description">Short note</label><textarea id="option-description" maxLength={500} rows={2} value={option.description} onChange={(event) => setOption({ ...option, description: event.target.value })} /></div>
          <div className="field"><label htmlFor="option-image">Poll photo</label><input id="option-image" readOnly required value={option.imageUrl} placeholder="Upload a poll photo" /></div>
          <label className="outline-button poll-upload"><Upload size={15} /> Upload photo
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy}
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void run(async () => { const imageUrl = await uploadImage(file); setOption((current) => ({ ...current, imageUrl })); }, "Photo uploaded. Save the design to add it to the poll."); event.target.value = ""; }} />
          </label>
          <button className="stitch-button" disabled={busy || !option.imageUrl}>Save design</button>
          {option.id && <button type="button" className="outline-button" onClick={() => setOption(emptyOption)}>Cancel edit</button>}
        </form>
      </>}
      <div className="poll-admin-grid">
        {options.map((candidate) => <article key={candidate.id} className="studio-record">
          <img src={candidate.image_url} alt={candidate.title} />
          <div><h4>{candidate.title}</h4><p>{candidate.description || `Design ${candidate.position + 1}`}</p>
            {selected.status !== "draft" && <strong><Heart size={14} /> {counts.get(candidate.id) || 0} votes</strong>}</div>
          {selected.status === "draft" && <div className="poll-actions">
            <button className="outline-button" type="button" onClick={() => setOption({ id: candidate.id, title: candidate.title, description: candidate.description, imageUrl: candidate.image_url, position: candidate.position })}>Edit</button>
            <button className="outline-button" type="button" disabled={busy} onClick={() => {
              if (!window.confirm(`Remove ${candidate.title} from this draft?`)) return;
              void run(async () => { await post("/api/admin/poll-options", { action: "delete", roundId: selected.id, id: candidate.id }); }, "Design removed.");
            }}>Remove</button>
          </div>}
        </article>)}
      </div>
      {selected.status !== "draft" && <p className="quiet-note">{selected.results.totalVoters} people have submitted a ballot. Each design count includes every ballot that selected it.</p>}
    </div>}
  </section>;
}
