import type { CollectionEntry } from "astro:content";

import { parse, compareDesc } from "date-fns";
import { getCollection } from "astro:content";

export const postToUrlComponents = (post: CollectionEntry<"blog">) => {
  const date = parse(post.data.date, "dd/MM/yyyy", new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const datex = date.getDate();
  const title = post.id.substring(11); // remove the date part

  const monthPadded = month < 10 ? `0${month}` : `${month}`;

  return {
    year,
    month: monthPadded,
    dateStr: datex,
    date,
    title,
  };
};

export const sortedPosts = async () => {
  const posts = await getCollection("blog");

  return posts.sort((a, b) =>
    compareDesc(
      parse(a.data.date, "dd/MM/yyyy", new Date()),
      parse(b.data.date, "dd/MM/yyyy", new Date())
    )
  );
};
