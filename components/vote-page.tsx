"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Search, X, Check, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "./auth-provider";
import type { PollOption, PollPublic, PollResult } from "@/lib/poll-store";
import { visibleDraftSelections } from "@/lib/poll-domain";

const draftKey = "campus-poll-draft";

function PollPhoto({ option, onOpen }: { option: PollOption; onOpen: (index: number) => void }) {
  const images = option.imageUrls?.length ? option.imageUrls : [option.imageUrl];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % images.length), 1400);
    return () => window.clearInterval(timer);
  }, [playing, images.length]);
  const stop = () => { setPlaying(false); setIndex(0); };
  return <button type="button" className="poll-photo" aria-label={`View ${images.length} picture${images.length === 1 ? "" : "s"} of ${option.title}`}
    onMouseEnter={() => setPlaying(true)} onMouseLeave={stop} onFocus={() => setPlaying(true)} onBlur={stop}
    onClick={() => { setPlaying(false); onOpen(index); }}>
    <img src={images[index] || images[0]} alt={`${option.title}, picture ${index + 1} of ${images.length}`} loading="lazy" />
    {images.length > 1 && <span className="poll-photo-count" aria-hidden="true">{index + 1}/{images.length}</span>}
  </button>;
}

export default function VotePage({ initialPoll }: { initialPoll: PollPublic | null }) {
  const { user, ready, login, token, error: authError } = useAuth();
  const [poll, setPoll] = useState(initialPoll);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [ballotReady, setBallotReady] = useState(false);
  const [withdrawnCount, setWithdrawnCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [results, setResults] = useState<PollResult | null>(null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const visible = useMemo(() => poll?.options.filter((option) =>
    `${option.title} ${option.description}`.toLowerCase().includes(query.toLowerCase())) || [], [poll, query]);
  const availableIds = poll?.options.map((option) => option.id).join(",") || "";
  const counts = new Map(results?.options.map((entry) => [entry.id, entry.votes]) || []);
  const previewOption = poll?.options.find((option) => option.id === preview);
  const previewImages = previewOption?.imageUrls?.length ? previewOption.imageUrls : previewOption ? [previewOption.imageUrl] : [];

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch("/api/poll", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setPoll(data.poll || null);
        setResults(data.results || null);
      } catch {}
    };
    const timer = window.setInterval(() => void refresh(), 30000);
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  useEffect(() => {
    setSelected([]); setSubmitted(false); setWithdrawnCount(0); setConfirming(false);
    if (!poll) { setResults(null); return; }
    if (!ready || !user) return;
    try {
      const stored = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (stored?.roundId === poll.id && Array.isArray(stored.selected))
        setSelected(stored.selected.filter((id: unknown) => typeof id === "string" && poll.options.some((option) => option.id === id)));
    } catch {}
  }, [poll?.id, ready, user?.uid]);
  useEffect(() => {
    if (!poll || submitted) return;
    const ids = poll.options.map((option) => option.id);
    setSelected((current) => {
      const next = visibleDraftSelections(current, ids);
      if (next.length === current.length) return current;
      sessionStorage.setItem(draftKey, JSON.stringify({ roundId: poll.id, selected: next }));
      return next;
    });
    setConfirming(false);
  }, [poll?.id, availableIds, submitted]);
  useEffect(() => {
    if (!poll || !ready || !user) { setSubmitted(false); setBallotReady(false); return; }
    let active = true;
    setBallotReady(false);
    const refresh = async () => {
      try {
        const response = await fetch("/api/poll/ballot", { cache: "no-store", headers: { Authorization: `Bearer ${await token()}` } });
        if (!response.ok) throw Error("Could not check your saved vote. Please try again.");
        const data = await response.json();
        if (!active) return;
        setSubmitted(data.submitted === true);
        setWithdrawnCount(data.withdrawnCount || 0);
        if (data.results) setResults(data.results);
        if (data.submitted) {
          setSelected(data.selected || []);
          setConfirming(false);
          sessionStorage.removeItem(draftKey);
        }
        setBallotReady(true);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not check your saved vote."); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [poll?.id, ready, user?.uid, token]);
  useEffect(() => {
    if (!preview) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
      if (event.key === "ArrowRight" && previewImages.length > 1)
        setPreviewIndex((current) => (current + 1) % previewImages.length);
      if (event.key === "ArrowLeft" && previewImages.length > 1)
        setPreviewIndex((current) => (current + previewImages.length - 1) % previewImages.length);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [preview, previewImages.length]);

  async function toggle(id: string) {
    if (!ready || submitted || (user && !ballotReady) || !poll) return;
    if (!user) {
      sessionStorage.setItem(draftKey, JSON.stringify({ roundId: poll.id, selected: [id] }));
      await login("/vote");
      return;
    }
    if (!selected.includes(id) && selected.length >= 20) { setError("Choose up to 20 designs."); return; }
    setSelected((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      if (poll) sessionStorage.setItem(draftKey, JSON.stringify({ roundId: poll.id, selected: next }));
      return next;
    });
    setError("");
    setNotice("");
    setConfirming(false);
  }
  async function submit() {
    if (submitted) return;
    if (!poll) return;
    if (!user) {
      sessionStorage.setItem(draftKey, JSON.stringify({ roundId: poll.id, selected }));
      await login("/vote");
      return;
    }
    if (!selected.length) { setError("Choose at least one design."); return; }
    if (!ballotReady) { setError("Checking whether you have already voted. Please wait."); return; }
    if (!confirming) { setConfirming(true); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/poll/ballot", { method: "POST", headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${await token()}`,
      }, body: JSON.stringify({ roundId: poll.id, selected }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Your vote could not be saved.");
      setSubmitted(true); setResults(data.results); setSelected(data.selected);
      setWithdrawnCount(data.withdrawnCount || 0);
      setConfirming(false);
      sessionStorage.removeItem(draftKey);
      setNotice("Your vote is saved and final. Thank you for helping choose the next collection.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your vote could not be saved."); }
    finally { setBusy(false); }
  }

  if (!poll) return <main className="page-wrap vote-page empty-state">
    <Heart size={34} /><span className="eyebrow">Coming soon</span>
    <h1>The next design poll is on its way ♡</h1>
    <p>Come back soon to help choose what I make next.</p>
    <Link className="stitch-button" href="/">Back to Campus Crochet <ArrowRight size={15} /></Link>
  </main>;

  return <main className={`page-wrap vote-page ${selected.length > 0 && !submitted ? "has-floating-vote-bar" : ""}`}>
    <section className="page-heading vote-heading">
      <span className="eyebrow">You choose what comes next</span>
      <h1>{poll.title} <span>♡</span></h1>
      <p>{poll.description || "Pick every crochet design you would love to see in the collection."}</p>
      <p className="quiet-note">Sign in with Google to choose several favourites, then submit one final vote for this poll. No payment or order is taken.</p>
    </section>
    <div className="vote-toolbar">
      <label className="shop-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a design…" aria-label="Search designs" /></label>
      <strong>{selected.length} {submitted ? "saved" : "selected"}</strong>
      {results && <span>{results.totalVoters} voter{results.totalVoters === 1 ? "" : "s"} so far</span>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {authError && <p className="form-error" role="alert">{authError}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    <div className={`vote-submit-bar ${selected.length > 0 && !submitted ? "is-floating" : ""} ${confirming ? "is-confirming" : ""}`}>
      {submitted ? <div><strong>Your vote is final ♡</strong>
        <p>{withdrawnCount ? `${withdrawnCount} of your saved choices ${withdrawnCount === 1 ? "was" : "were"} removed from the visitor poll. Your other choices still count.`
          : "Your chosen items are marked below. Come back to see the results."}</p></div>
        : <>
          <div><strong aria-live="polite">{selected.length} design{selected.length === 1 ? "" : "s"} selected</strong>
            <p>{confirming ? "Please check your choices. Once submitted, you cannot change them for this poll."
              : user && !ballotReady ? "Checking your account for an earlier vote…" : "One final ballot per Google account. Choose as many as you like."}</p></div>
          {confirming && <button className="outline-button" type="button" disabled={busy} onClick={() => setConfirming(false)}>Go back</button>}
          <button className="stitch-button" type="button" disabled={busy || !ready || (!!user && (!selected.length || !ballotReady))} onClick={() => void submit()}>
            {busy ? "Saving your vote…" : !user ? "Continue with Google to vote" : confirming ? "Submit final vote" : "Finish voting"} <ArrowRight size={16} />
          </button>
        </>}
    </div>
    <div className="poll-gallery">
      {visible.map((option, index) => <article className={`product-card poll-card ${selected.includes(option.id) ? "poll-selected" : ""}`} key={option.id}>
        <PollPhoto option={option} onOpen={(index) => { setPreview(option.id); setPreviewIndex(index); }} />
        <h2>{option.title}</h2>
        {option.description && <p>{option.description}</p>}
        {submitted ? selected.includes(option.id) ? <span className="poll-locked-choice"><Check size={16} /> Your choice</span> : null
          : <button type="button" className={selected.includes(option.id) ? "stitch-button" : "outline-button"}
          aria-pressed={selected.includes(option.id)} disabled={!ready || (!!user && !ballotReady)} onClick={() => void toggle(option.id)}>
          {selected.includes(option.id) ? <Check size={16} /> : <Heart size={16} />}
          {selected.includes(option.id) ? "Chosen" : !user ? "Sign in to choose" : "Choose this design"}
        </button>}
        {results && <div className="poll-result"><span>{counts.get(option.id) || 0} votes</span><div role="img" aria-label={`${counts.get(option.id) || 0} votes`}><i style={{ width: `${results.totalVoters ? ((counts.get(option.id) || 0) / results.totalVoters) * 100 : 0}%` }} /></div></div>}
        <span className="poll-card-number">{String(index + 1).padStart(2, "0")}</span>
      </article>)}
    </div>
    {!visible.length && <p className="empty-state">No designs match that search.</p>}
    {previewOption && <div className="poll-lightbox" role="dialog" aria-modal="true" aria-label={`${previewOption.title} picture preview`} onClick={() => setPreview(null)}>
      <button className="icon-button" type="button" aria-label="Close preview" onClick={() => setPreview(null)}><X /></button>
      <img src={previewImages[previewIndex] || previewImages[0]} alt={`${previewOption.title}, picture ${previewIndex + 1} of ${previewImages.length}`} onClick={(event) => event.stopPropagation()} />
      {previewImages.length > 1 && <div className="poll-lightbox-controls" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="outline-button" onClick={() => setPreviewIndex((current) => (current + previewImages.length - 1) % previewImages.length)} aria-label="Previous picture"><ChevronLeft size={17} /> Previous</button>
        <span>{previewIndex + 1} / {previewImages.length}</span>
        <button type="button" className="outline-button" onClick={() => setPreviewIndex((current) => (current + 1) % previewImages.length)} aria-label="Next picture">Next <ChevronRight size={17} /></button>
      </div>}
    </div>}
  </main>;
}
