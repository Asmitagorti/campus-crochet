"use client";
import { media } from "@/lib/media";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Heart,
  ArrowRight,
  Scissors,
  HandHeart,
  Leaf,
  ShoppingBag,
  Gift,
  X,
  Plus,
} from "lucide-react";
import { categories, photo, money } from "@/lib/catalog";
import { Yarn, Sprig, Title } from "@/components/design";
import { useShop } from "@/components/site-shell";
const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.6 },
};
export default function Home() {
  const router = useRouter();
  const { liked, toggleLike, add, catalog: products, settings } = useShop();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [onlyLiked, setOnlyLiked] = useState(false);
  const showAll = false;
  const visible = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!onlyLiked || liked.includes(p.id)) &&
      `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  function browse(name = "All") {
    router.push(
      name === "All" ? "/shop" : `/shop?category=${encodeURIComponent(name)}`,
    );
  }
  return (
    <main id="home">
      <section className="hero">
        <div
          className="hero-photo"
          style={{ backgroundImage: `url("${settings.heroImage}")` }}
          role="img"
          aria-label="Warm crochet craft studio"
        />
        <div className="hero-product">
          <img
            src={media("/images/stitch.jpg")}
            alt="The original handmade blue crochet plush"
          />
          <span>your new little bestie ♡</span>
        </div>
        <img
          className="hero-blooms"
          src={media("/images/tulips-clean.png")}
          alt=""
          aria-hidden="true"
        />
        <div className="hero-paper">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="eyebrow">
              Handmade with love <span>♡</span>
            </div>
            <h1>
              {settings.heroTitle.split("\n").map((line, i) => (
                <span className="hero-title-line" key={i}>
                  {line}
                </span>
              ))}{" "}
              <span>♡</span>
            </h1>
            <p>{settings.heroDescription}</p>
            <button className="stitch-button" onClick={() => browse()}>
              Shop the collection <ArrowRight size={17} />
            </button>
            <div className="hero-footnote">
              <Scissors size={15} /> Slowly made. Wholeheartedly loved.
            </div>
          </motion.div>
          <span className="doodle hero-heart">♡</span>
          <Sprig className="sprig" />
        </div>
        <div className="hero-note">
          Real
          <br />
          Handmade
          <br />
          Real Joy ♡<span>⤹</span>
        </div>
      </section>
      <section className="promise-strip" aria-label="Our promises">
        {[
          { icon: HandHeart, title: "100% Handmade", text: "with love & care" },
          {
            icon: Leaf,
            title: "Beautiful Yarn",
            text: "soft, tactile & full of character",
          },
          {
            icon: ShoppingBag,
            title: "Campus Beginnings",
            text: "a little closer to home",
          },
          {
            icon: Heart,
            title: "Little One-of-a-kinds",
            text: "just like the people you love",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon />
            <p>
              <strong>{title}</strong>
              <span>{text}</span>
            </p>
          </div>
        ))}
      </section>
      <motion.section {...reveal} className="categories section-wrap">
        <Sprig className="corner-doodle" />
        <Title sub="Little pieces of happiness, sorted for you.">
          Explore Our Collection
        </Title>
        <div className="category-grid">
          {categories.map((c, i) => (
            <button
              className="category-card"
              key={c.name}
              onClick={() => browse(c.name)}
              style={
                { "--tilt": `${i % 2 ? 1 : -1}deg` } as React.CSSProperties
              }
            >
              <div className="photo-frame">
                <img src={photo(c.image)} alt={c.name} loading="lazy" />
              </div>
              <h3>{c.name}</h3>
              <span className="mini-button">
                View all <ArrowRight size={10} />
              </span>
            </button>
          ))}
        </div>
      </motion.section>
      <motion.section
        {...reveal}
        className="featured section-wrap"
        id="collection"
      >
        <Title sub="Handpicked favourites, made to melt hearts.">
          Featured Collection
        </Title>
        <div className="filter-row">
          <button
            className={category === "All" && !onlyLiked ? "selected" : ""}
            onClick={() => {
              setCategory("All");
              setOnlyLiked(false);
              setQuery("");
            }}
          >
            All the little things
          </button>
          {category !== "All" && (
            <button className="selected" onClick={() => setCategory("All")}>
              {category} <X size={12} />
            </button>
          )}
          {onlyLiked && (
            <button className="selected" onClick={() => setOnlyLiked(false)}>
              Your favourites <X size={12} />
            </button>
          )}
          <span>Made slowly. Meant to stay.</span>
        </div>
        <div className="product-grid">
          {visible
            .slice(
              0,
              category === "All" && !query && !onlyLiked && !showAll ? 5 : 8,
            )
            .map((p, i) => (
              <motion.article
                className="product-card"
                key={p.id}
                layout
                style={
                  { "--tilt": `${i % 2 ? 1 : -1}deg` } as React.CSSProperties
                }
              >
                <div className="product-image">
                  <button
                    className="image-open"
                    aria-label={`View ${p.name}`}
                    onClick={() => router.push(`/products/${p.id}`)}
                  >
                    <img src={p.gallery[0]} alt={p.name} loading="lazy" />
                  </button>
                  <button
                    className={`favourite ${liked.includes(p.id) ? "is-liked" : ""}`}
                    aria-label={`${liked.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                    aria-pressed={liked.includes(p.id)}
                    onClick={() => toggleLike(p.id)}
                  >
                    <Heart size={19} />
                  </button>
                </div>
                <button
                  className="product-name"
                  onClick={() => router.push(`/products/${p.id}`)}
                >
                  {p.name}
                </button>
                <p>{p.note}</p>
                <span className="price-note">{money(p.price)}</span>
                <button className="small-button" onClick={() => add(p.id)}>
                  Add to bag <Plus size={12} />
                </button>
              </motion.article>
            ))}
        </div>
        {visible.length === 0 && (
          <div className="empty-state">
            <Heart />
            <h3>No little treasures here just yet.</h3>
            <p>Try another search, or save something you love.</p>
            <button
              className="small-button"
              onClick={() => {
                setQuery("");
                setOnlyLiked(false);
                setCategory("All");
              }}
            >
              Explore everything
            </button>
          </div>
        )}
        <button className="text-link" onClick={() => router.push("/shop")}>
          Find your little happy thing <ArrowRight size={15} />
        </button>
      </motion.section>
      <motion.section {...reveal} className="story" id="story">
        <div className="story-photo">
          <img
            src={media("/images/stitch.jpg")}
            alt="The original handmade blue crochet plush held in the maker's hand"
            loading="lazy"
          />
          <span>
            Every stitch
            <br />
            is a little
            <br />
            piece of
            <br />
            my heart ♡
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">A little yarn, a ten-year dream</span>
          <h2>
            More Than Just
            <br />
            Crochet <span>♡</span>
          </h2>
          <p>
            I'm a student, a dreamer and a crochet lover. What started with an
            accidentally ordered crochet hook became a decade of making little
            things for the people I love.
          </p>
          <p>
            Campus-Crochet is that love, stitched into something you can keep.
            Small batches, real photographs, and a whole lot of heart.
          </p>
          <a className="stitch-button" href="/about">
            Our little promise <ArrowRight size={15} />
          </a>
        </div>
        <div className="story-collage">
          <div className="polaroid">
            <img
              src={media("/images/pastel-bag-clean.png")}
              alt="Pastel floral crochet shoulder bag"
              loading="lazy"
            />
            <span>made to go wherever you do ♡</span>
          </div>
          <div className="polaroid second">
            <img
              src={media("/images/bunny.jpg")}
              alt="Actual strawberry bunny crochet keepsake"
              loading="lazy"
            />
            <span>little things. big feelings.</span>
          </div>
          <Sprig className="collage-leaf" />
        </div>
      </motion.section>
      <motion.section {...reveal} className="why section-wrap" id="why">
        <Title sub="Because you deserve more than just a product — you deserve a feeling.">
          Why Choose Campus-Crochet?
        </Title>
        <div className="why-grid">
          {[
            { icon: HandHeart, a: "100% Handmade", b: "with love & care" },
            { icon: Leaf, a: "Chosen with Care", b: "yarn you can feel" },
            {
              icon: Scissors,
              a: "Real Product Photos",
              b: "the details are the difference",
            },
            { icon: Heart, a: "A Personal Touch", b: "from one maker to you" },
            {
              icon: Gift,
              a: "Thoughtful Little Gifts",
              b: "for your favourite people",
            },
          ].map(({ icon: Icon, a, b }) => (
            <div key={a}>
              <Icon />
              <h3>{a}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <Yarn className="why-yarn" />
      </motion.section>
      <motion.section {...reveal} className="love-notes section-wrap">
        <Title sub="A few things to know about your new little favourite.">
          Made With Love. Kept With Care.
        </Title>
        <div className="note-grid">
          {[
            {
              icon: Heart,
              title: "A little beautifully imperfect",
              body: "Every piece is made by hand. Small variations are part of what makes yours yours.",
              img: "bunny",
            },
            {
              icon: Scissors,
              title: "A decade in every stitch",
              body: "Ten years of learning, making and falling in love with crochet, all over again.",
              img: "coaster",
            },
            {
              icon: Leaf,
              title: "A gentle kind of love",
              body: "Hand wash gently and let your crochet air dry. A little care goes a long way.",
              img: "minion",
            },
          ].map(({ icon: Icon, title, body, img }) => (
            <article className="note-card" key={title}>
              <Icon size={23} />
              <h3>{title}</h3>
              <p>{body}</p>
              <img
                src={`/images/${img}.jpg`}
                alt={`${img} crochet detail`}
                loading="lazy"
              />
            </article>
          ))}
        </div>
      </motion.section>
      <motion.section {...reveal} className="moments section-wrap">
        <Title sub="Real photos. Real stitches. A little everyday happiness.">
          Little Moments, Big Joy
        </Title>
        <div className="moment-grid">
          {["stitch", "bunny", "coaster", "bag", "tulips", "minion"].map(
            (id, i) => (
              <button
                key={id}
                onClick={() => router.push(`/products/${id}`)}
                aria-label={`Open ${id} photo`}
              >
                <img
                  src={photo(id)}
                  alt={`Original handmade ${id} photograph`}
                  loading="lazy"
                />
                <span>
                  <Heart size={18} />
                </span>
              </button>
            ),
          )}
        </div>
        <div className="handwritten">Made by hand. Loved for real. ♡</div>
      </motion.section>
    </main>
  );
}
