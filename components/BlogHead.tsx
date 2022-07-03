import React from 'react'

import Head from 'next/head'

interface Props {
  title: string
  description: string
}

function BlogHead(props: Props) {
  return (
    <Head>
      <title>{props.title}</title>
      <meta name="description" content={props.description} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

export default BlogHead
