import React, { useEffect } from 'react'
import type { NextPage } from 'next'

import hljs from 'highlight.js'

import { getAllPosts } from '../../../../lib/getAllPosts'
import { getPostData } from '../../../../lib/getPostData'
import Banner from '../../../../components/Banner'
import BlogHead from '../../../../components/BlogHead'

interface PostData {
  date: string
  title: string
}

interface Props {
  data?: PostData
  contentHtml?: string
}

export async function getStaticPaths() {
  const paths = getAllPosts()

  return {
    paths,
    fallback: true,
  }
}

export async function getStaticProps(params: unknown) {
  // console.log(params)
  const result = await getPostData(params as { params: Record<string, string | number> })

  return {
    props: {
      contentHtml: result.contentHtml,
      data: result.data,
    },
  }
}

const PostPage: NextPage = (postData: Props) => {
  useEffect(() => {
    hljs.highlightAll()
  }, [postData])

  return (
    <>
      <BlogHead
        title={`Rocky Jaiswal - ${postData?.data?.title}`}
        description="Rocky Jaiswal - Technical blogs"
      />

      <div className="container">
        <Banner />
        <div className="main">
          <article>
            <div className="blog_heading">
              <h2>{postData?.data?.title}</h2>
              <div className="blog_date">{postData?.data?.date}</div>
            </div>
            <div
              className="post"
              dangerouslySetInnerHTML={{ __html: postData.contentHtml ?? '' }}
            ></div>
          </article>
        </div>
      </div>
    </>
  )
}

export default PostPage
