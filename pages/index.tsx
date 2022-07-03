import React from 'react'

import type { NextPage } from 'next'
import Link from 'next/link'

import { getHomePageSummary } from '../lib/getHomePageSummary'

import Banner from '../components/Banner'
import Sidebar from '../components/Sidebar'
import BlogHead from '../components/BlogHead'

export async function getStaticProps(foo: any) {
  const results = await getHomePageSummary()
  // console.log(result)

  return {
    props: { results },
  }
}

const Home: NextPage = (props: any) => {
  return (
    <>
      <BlogHead title="Rocky Jaiswal" description="Rocky Jaiswal - Technical blogs" />

      <div className="container">
        <Banner />
        <div className="main">
          <article className="content">
            {props.results?.map((result: any, index: number) => {
              return (
                <div key={index} className="summary">
                  <div className="blog_headline">
                    <h2>
                      <Link href={`${result.path}`}>
                        <a>{result.title}</a>
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
