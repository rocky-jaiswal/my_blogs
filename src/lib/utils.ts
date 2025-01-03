import type { CollectionEntry } from "astro:content";

import { parse, compareDesc } from "date-fns";
import { getCollection } from "astro:content";

const DATE_FORMAT = "dd/MM/yyyy";

export const toDate = (date: string) => parse(date, DATE_FORMAT, new Date());

export const postToUrlComponents = (post: CollectionEntry<"blog">) => {
  const date = toDate(post.data.date);

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
    compareDesc(toDate(a.data.date), toDate(b.data.date))
  );
};
