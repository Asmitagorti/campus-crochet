import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { loadJournal } from "@/lib/store-data";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params,
    journal = await loadJournal(),
    p = journal.find((p) => p.slug === slug);
  return {
    title: p
      ? `${p.title} | The Journey | Campus-Crochet`
      : "Chapter not found",
    description: p?.excerpt,
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    journal = await loadJournal(),
    p = journal.find((p) => p.slug === slug);
  if (!p) notFound();
  const next = journal[(journal.indexOf(p) + 1) % journal.length];
  return (
    <main className="article-page page-wrap">
      <Link className="back-link" href="/journey">
        <ArrowLeft size={15} /> Back to the journey
      </Link>
      <div className="article-heading">
        <span className="eyebrow">
          {p.category} · {p.readTime}
        </span>
        <h1>
          {p.title} <span>♡</span>
        </h1>
        <p>{p.excerpt}</p>
        <span className="journal-meta">From the Campus-Crochet studio</span>
      </div>
      <div className="article-photo">
        <img src={p.image} alt={p.title} />
        <span>one little chapter at a time ♡</span>
      </div>
      <article className="article-copy">
        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
        <div className="article-signoff">
          With a little love,
          <br />
          Campus-Crochet ♡
        </div>
      </article>
      <Link className="next-chapter" href={`/journey/${next.slug}`}>
        <div>
          <span>Another little chapter</span>
          <h2>{next.title}</h2>
        </div>
        <ArrowRight />
      </Link>
    </main>
  );
}
