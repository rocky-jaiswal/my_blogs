import fs from 'fs'
import matter from 'gray-matter'

export function getAllPosts() {
  const fileNames = fs.readdirSync('content')

  return fileNames.reverse().map((fileName: string) => {
    const markdown = fs.readFileSync(`content/${fileName}`).toString('utf-8')

    const result = matter(markdown)

    return {
      params: {
        year: fileName.substring(0, 4),
        month: fileName.substring(5, 7),
        date: fileName.substring(8, 10),
        title: fileName.substring(11, fileName.length - 3),
        displayTitle: result.data.title,
      },
    }
  })
}
