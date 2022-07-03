import fs from 'fs'
import matter from 'gray-matter'
import html from 'remark-html'
import { remark } from 'remark'

export async function getHomePageSummary() {
  const fileNames = fs.readdirSync('content')

  const promises = fileNames
    .slice(-7)
    .reverse()
    .map(async (filePath) => {
      const markdown = fs.readFileSync(`content/${filePath}`).toString('utf-8')

      const result = matter(markdown)

      const processedContent = await remark().use(html).process(result.content)
      const contentHtml = processedContent.toString().substring(0, 150) + ' ...'

      const year = filePath.substring(0, 4)
      const month = filePath.substring(5, 7)
      const date = filePath.substring(8, 10)
      const title = filePath.substring(11, filePath.length - 3)

      return {
        title: result.data.title,
        date: result.data.date,
        path: `/${year}/${month}/${date}/${title}`,
        contentHtml,
      }
    })

  const data = await Promise.all(promises)

  return data
}
