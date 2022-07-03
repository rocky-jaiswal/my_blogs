import fs from 'fs'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export async function getPostData({ params }: any) {
  const filePath = `content/${params.year}-${params.month}-${params.date}-${params.title}.md`

  const markdown = fs.readFileSync(filePath).toString('utf-8')

  const result = matter(markdown)

  const processedContent = await remark().use(html).process(result.content)
  const contentHtml = processedContent.toString()

  return { ...result, contentHtml }
}
