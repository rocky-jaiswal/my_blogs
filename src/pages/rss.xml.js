import rss from '@astrojs/rss';
import { parse } from 'date-fns';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog');
	
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => {

			const date = parse(post.data.date, 'dd/MM/yyyy', new Date())
			const year = date.getFullYear()
			const month = date.getMonth() + 1
			const datex = date.getDate()
			const title = post.id.substring(11)

			return {
				...post.data,
				link: `/${year}/${month}/${datex}/${title}.html`,
			}
		}),
	});
}
