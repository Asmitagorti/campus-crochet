import { media } from "./media";

export const defaultSettings = {
  brand: "campus-Crochet",
  announcement: "Handmade on campus, just for you.",
  heroTitle: "Tiny stitches,\nBig smiles",
  heroDescription:
    "Adorable crochet keepsakes, made by hand, for real moments. Real yarn. Real character. Just pure, handmade cuteness.",
  heroImage: media("/images/hero.png"),
  storyBackgroundImage: media("/images/round-coasters.jpg"),
  storyImage: media("/images/bag.jpg"),
  aboutIntro:
    "Mine did. When I was seven, I loved making Rainbow Loom bracelets for friends and family. I asked my mum for a bigger hook. She accidentally ordered a crochet hook instead.",
  contactIntro:
    "Wondering about a colour, an exact measurement, or the perfect gift? Ask away. This is a small student-run studio, and your questions are always welcome.",
};
export type SiteSettings = typeof defaultSettings;
