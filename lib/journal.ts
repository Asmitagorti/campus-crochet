export type JournalEntry = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  readTime: string;
  sections: { heading: string; paragraphs: string[] }[];
};
export const journal: JournalEntry[] = [
  {
    slug: "the-hook-that-started-it-all",
    category: "Our story",
    title: "The hook that started it all",
    excerpt:
      "A happy accident, a very imperfect beanie, and the beginning of a ten-year love for crochet.",
    image: "/images/beanie-clean.png",
    readTime: "3 minute read",
    sections: [
      {
        heading: "The wrong hook, the right beginning",
        paragraphs: [
          "Before crochet, there were Rainbow Loom bracelets. I made dozens for friends and family, experimenting with beads and different designs. When I asked my mum for a bigger hook, a crochet hook arrived instead.",
          "I looked up what it was, found a video about making a beanie, and picked up some local yarn. My first attempt was not a beautiful piece of craftsmanship. But it was something I had made, and I loved it.",
        ],
      },
      {
        heading: "Something you can keep",
        paragraphs: [
          "Loom bands could snap after months or years, taking hours of careful work with them. Yarn felt different. It opened up a world of pieces that could be cared for and kept.",
          "A matching set for a doll became another project, and another. Over the years came shirts, bags, pouches, vests, sweaters, coasters, beanies and hats. Many of them became gifts.",
        ],
      },
      {
        heading: "A little dream, made real",
        paragraphs: [
          "I always wanted a place to share what I made. Requests from people around me finally helped turn that wish into Campus-Crochet.",
          "The studio is starting on campus, in small batches, with the same feeling that started it all: the joy of making a little something with your own hands.",
        ],
      },
    ],
  },
  {
    slug: "a-little-care-goes-a-long-way",
    category: "Care & keeping",
    title: "A little care goes a long way",
    excerpt:
      "A gentle guide to washing, drying and keeping your crochet lovely for the everyday moments ahead.",
    image: "/images/coaster-clean.png",
    readTime: "3 minute read",
    sections: [
      {
        heading: "Keep it gentle",
        paragraphs: [
          "Handmade crochet deserves a gentle touch. For yarn-only pieces, use cool water and a small amount of mild detergent. Hand wash carefully without rubbing, stretching or scrubbing.",
          "Treat little stitched faces, flowers and attached details with extra care. If you are unsure how to clean a particular piece, ask us before washing it.",
        ],
      },
      {
        heading: "Let it take its time",
        paragraphs: [
          "Avoid wringing or twisting. Gently press the water out with a clean towel, reshape the piece and leave it to air dry flat.",
          "Keep it away from direct heat. A patient, gentle dry helps preserve the shape you love.",
        ],
      },
      {
        heading: "A note for mixed-material gifts",
        paragraphs: [
          "Gift cards and other pieces that combine paper and yarn should stay dry. Do not submerge them. A careful spot clean of the yarn is a better choice.",
          "Store pieces somewhere dry and handle decorations gently. A little care keeps those little details feeling special.",
        ],
      },
    ],
  },
  {
    slug: "why-the-little-details-matter",
    category: "Behind the stitches",
    title: "Why the little details matter",
    excerpt:
      "Real stitches, real photographs, and the quiet work behind something that feels like yours.",
    image: "/images/bunny-clean.png",
    readTime: "2 minute read",
    sections: [
      {
        heading: "A photograph is a promise",
        paragraphs: [
          "When you choose something online, the photograph is often the closest you can get to holding it. We want that first look to help you understand the crochet, the texture and the little details.",
          "The shop uses photographs of our own handmade pieces. Some backgrounds are cleaned so the item is easier to see; original views are included where available.",
        ],
      },
      {
        heading: "The character of handmade",
        paragraphs: [
          "Two handmade pieces will have small differences. A loop may sit a little differently, a shape may have its own softness. Those variations come from the way crochet is made, stitch by stitch.",
          "Our aim is consistency in care and quality, while keeping the character that makes a handmade object feel personal.",
        ],
      },
      {
        heading: "Ask the little questions",
        paragraphs: [
          "Want to know the exact measurements? Wondering about a shade, a lining or a particular detail? Please ask. We would rather help you choose thoughtfully than leave you guessing.",
          "The little details are part of the experience, from your first look to the moment you take your piece home.",
        ],
      },
    ],
  },
];
