import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { loadJournal } from "@/lib/content";
import { Sprig } from "@/components/design";
export const metadata: Metadata = {
  title: "Journey | Campus-Crochet",
  description:
    "Stories from the studio, notes on handmade life and gentle guides to keeping crochet lovely.",
};
export const dynamic = "force-dynamic";
export default async function Journey() {
  const journal = await loadJournal();
  if (!journal.length)
    return (
      <main className="page-wrap empty-state">
        <h1>A little chapter is on its way ♡</h1>
        <Link href="/shop" className="stitch-button">
          Explore the collection
        </Link>
      </main>
    );
  return (
    <main>
      <section className="page-heading">
        <Sprig className="heading-sprig" />
        <span className="eyebrow">Notes from our little corner</span>
        <h1>
          The journey, in stitches <span>♡</span>
        </h1>
        <p>
          Little stories, thoughtful details, and the things we learn along the
          way.
        </p>
      </section>
      <section className="page-wrap journey-feature">
        <Link
          className="journal-hero-photo"
          href={`/journey/${journal[0].slug}`}
        >
          <img src={journal[0].image} alt="Golden handmade crochet beanie" />
          <span>where it all began ♡</span>
        </Link>
        <div>
          <span className="eyebrow">
            The first little chapter · {journal[0].readTime}
          </span>
          <h2>{journal[0].title}</h2>
          <p>{journal[0].excerpt}</p>
          <Link className="stitch-button" href={`/journey/${journal[0].slug}`}>
            Read the story <ArrowRight size={15} />
          </Link>
        </div>
      </section>
      <section className="page-wrap journal-section">
        <div className="section-title">
          <h2>A Few More Little Chapters ♡</h2>
          <p>A quiet moment with the craft.</p>
        </div>
        <div className="journal-grid">
          {journal.slice(1).map((p) => (
            <article className="journal-card" key={p.slug}>
              <Link href={`/journey/${p.slug}`}>
                <div className="journal-card-photo">
                  <img src={p.image} alt={p.title} />
                </div>
              </Link>
              <div className="journal-card-copy">
                <span className="journal-meta">
                  {p.category} <span>·</span> {p.readTime}
                </span>
                <h2>
                  <Link href={`/journey/${p.slug}`}>{p.title}</Link>
                </h2>
                <p>{p.excerpt}</p>
                <Link className="text-link" href={`/journey/${p.slug}`}>
                  A little more <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="journal-end">
        <BookOpen size={24} />
        <p>There is always another little chapter to make.</p>
        <Link href="/shop">
          Find a piece of the story <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
