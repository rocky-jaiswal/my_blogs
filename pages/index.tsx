import React from 'react'

import type { NextPage } from 'next'
import Link from 'next/link'

import { getHomePageSummary } from '../lib/getHomePageSummary'

import Banner from '../components/Banner'
import Sidebar from '../components/Sidebar'
import BlogHead from '../components/BlogHead'

interface PostSummary {
  title: string
  date: string
  path: string
  contentHtml: string
}

interface Props {
  results?: PostSummary[]
}

export async function getStaticProps() {
  const results = await getHomePageSummary()

  return {
    props: { results },
  }
}

const Home: NextPage = (props: Props) => {
  return (
    <>
      <BlogHead title="Rocky Jaiswal" description="Rocky Jaiswal - Technical blogs" />

      <div className="container">
        <Banner />
        <div className="main">
          <article className="content">
            {props.results?.map((result: PostSummary, index: number) => {
              return (
                <div key={index} className="summary">
                  <div className="blog_headline">
                    <h2>
                      <Link href={`${result.path}`} prefetch={false}>
                        {result.title}
                      </Link>
                      <span className="date">
                        <pre>{result.date}</pre>
                      </span>
                    </h2>
                    <div
                      className="post"
                      dangerouslySetInnerHTML={{
                        __html: result.contentHtml,
                      }}
                    ></div>
                    <hr />
                  </div>
                </div>
              )
            })}
          </article>
          <Sidebar />
        </div>
      </div>
    </>
  )
}

export default Home
