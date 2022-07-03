import React from 'react'

import Link from 'next/link'
import type { NextPage } from 'next'

import { getAllPosts } from '../lib/getAllPosts'
import Banner from '../components/Banner'
import BlogHead from '../components/BlogHead'

export async function getStaticProps() {
  const result = getAllPosts()

  return {
    props: {
      result,
    },
  }
}

const AllPostsPage: NextPage = (props: any) => {
  return (
    <>
      <BlogHead title="Rocky Jaiswal - All Posts" description="Rocky Jaiswal - All Posts" />

      <div className="container">
        <Banner />
        <div className="main">
          <article>
            {props.result &&
              props.result.map((result: any, index: number) => {
                return (
                  <div key={index} className="summary">
                    <div className="blog_headline">
                      <h2>
                        <Link
                          href={`/${result.params.year}/${result.params.month}/${result.params.date}/${result.params.title}`}
                        >
                          <a>{result.params.displayTitle}</a>
                        </Link>
                        <span className="date">
                          {' '}
                          <pre>{`${result.params.year}/${result.params.month}/${result.params.date}`}</pre>
                        </span>
                      </h2>
                      <hr />
                    </div>
                  </div>
                )
              })}
          </article>
        </div>
      </div>
    </>
  )
}

export default AllPostsPage
