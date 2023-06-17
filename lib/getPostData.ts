import fs from 'fs'
import matter from 'gray-matter'
import html from 'remark-html'
import { remark } from 'remark'

interface Params {
  params: Record<string, string | number>
}

export async function getPostData({ params }: Params) {
  let title = params.title.toString()

  if (title.endsWith('.html')) {
    title = title.substring(0, title.length - 5)
  }

  const filePath = `content/${params.year}-${params.month}-${params.date}-${title}.md`

  const markdown = fs.readFileSync(filePath).toString('utf-8')

  const result = matter(markdown)

  const processedContent = await remark().use(html).process(result.content)
  const contentHtml = processedContent.toString()

  return { ...result, contentHtml }
}
