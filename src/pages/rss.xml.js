import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { postToUrlComponents } from '../lib/utils';

export async function GET(context) {
	const posts = await getCollection('blog');
	
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => {
			const { year, month, dateStr, title } = postToUrlComponents(post)

			return {
				...post.data,
				link: `/${year}/${month}/${dateStr}/${title}.html`,
			}
		}),
	});
}
