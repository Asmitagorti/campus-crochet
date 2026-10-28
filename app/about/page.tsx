import { loadSettings } from "@/lib/store-data";
import { media } from "@/lib/media";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, HandHeart, Scissors, Leaf } from "lucide-react";
import { Sprig, Title } from "@/components/design";
export const metadata: Metadata = {
  title: "Our little story | Campus-Crochet",
  description:
    "An accidentally ordered hook, a decade of crochet, and a student's dream of sharing handmade happiness.",
};
export const dynamic = "force-dynamic";
export default async function About() {
  const settings = await loadSettings();
  return (
    <main className="about-page">
      <section className="page-heading">
        <span className="eyebrow">A little yarn. A ten-year dream.</span>
        <h1>
          More than just crochet <span>♡</span>
        </h1>
        <p>Made by a student. Shaped by a decade of love for the craft.</p>
        <Sprig className="heading-sprig" />
      </section>
      <section className="page-wrap editorial-split">
        <div className="editorial-photo">
          <img
            src={media("/images/pastel-bag-clean.png")}
            alt="Pastel floral crochet bag made by the Campus-Crochet maker"
          />
          <span>small stitches, big dreams ♡</span>
          <Sprig />
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">Hello from the other end of the yarn</span>
          <h2>
            Some dreams start
            <br />
            with the wrong hook.
          </h2>
          <p>{settings.aboutIntro}</p>
          <p>
            A little curiosity, a video tutorial and some local yarn later, I
            had made my first beanie. It was far from perfect. I loved it
            anyway.
          </p>
          <p>
            That accidental beginning grew into ten years of shirts, bags,
            pouches, coasters, hats, gifts, and countless little things made for
            the people around me.
          </p>
          <span className="handwritten">
            And somewhere in all those stitches,
            <br />a little dream took shape.
          </span>
        </div>
      </section>
      <section className="story-quote">
        <span>“</span>
        <blockquote>
          I wanted to make something that people could keep.
          <br />
          Something made with time, care, and a little piece of my heart.
        </blockquote>
        <p>The feeling behind Campus-Crochet</p>
      </section>
      <section className="page-wrap about-timeline">
        <Title sub="A few little moments that brought us here.">
          One Stitch Led to Another
        </Title>
        <div className="timeline-grid">
          {[
            {
              n: "01",
              title: "A happy accident",
              text: "A crochet hook arrived instead of a loom hook. A first beanie followed, and a new kind of making began.",
            },
            {
              n: "02",
              title: "A decade of making",
              text: "Learning through videos, making gifts, trying stitches, and finding joy in turning yarn into something real.",
            },
            {
              n: "03",
              title: "A campus beginning",
              text: "Requests from people around me became the nudge to share my work as a small, independent crochet studio.",
            },
            {
              n: "04",
              title: "The dream, in stitches",
              text: "Campus-Crochet is a place for those little things: thoughtful gifts, everyday companions and pieces made to be kept.",
            },
          ].map((x) => (
            <article key={x.n}>
              <span>{x.n}</span>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="values-band">
        <div className="page-wrap">
          <Title sub="The things we keep close, in every little piece.">
            Our Little Promises
          </Title>
          <div className="value-grid">
            {[
              {
                Icon: HandHeart,
                title: "Hands, not a factory",
                text: "Every crochet piece is made by one maker, with attention to each stitch and finish.",
              },
              {
                Icon: Heart,
                title: "What you see matters",
                text: "Our own pieces are photographed for the shop. Cleaned backgrounds let the crochet take the spotlight.",
              },
              {
                Icon: Leaf,
                title: "Thoughtfully small",
                text: "Small batches and careful work, balanced with student life. We will be honest about what we can make.",
              },
            ].map(({ Icon, title, text }) => (
              <article key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-wrap about-ending">
        <Scissors />
        <h2>A little handmade looks good on you.</h2>
        <p>
          Find something for yourself, or for the person you thought of while
          reading this.
        </p>
        <Link className="stitch-button" href="/shop">
          Explore the little things <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
