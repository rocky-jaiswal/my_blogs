import { parse } from "date-fns";
import type { CollectionEntry } from "astro:content";

export const postToUrlComponents = (post: CollectionEntry<"blog">) => {
  const date = parse(post.data.date, "dd/MM/yyyy", new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const datex = date.getDate();
  const title = post.id.substring(11);

  const monthPadded = month < 10 ? `0${month}` : `${month}`;

  return {
    year,
    month: monthPadded,
    dateStr: datex,
    date,
    title,
  };
};
