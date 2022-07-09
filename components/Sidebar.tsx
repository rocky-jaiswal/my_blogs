import React from 'react'
import Link from 'next/link'
import Script from 'next/script'

function Sidebar() {
  return (
    <div className="sidebar">
      <h3>
        <Link href="/about.html">
          <a>About</a>
        </Link>
      </h3>
      <h3>
        <Link href="/allPosts.html">
          <a>All Posts</a>
        </Link>
      </h3>
      <h3>
        <a href="https://github.com/rocky-jaiswal" target="_blank" rel="noreferrer">
          Github
        </a>
      </h3>
      <div>
        <a
          className="twitter-timeline"
          data-height="700"
          href="https://twitter.com/var_log_rockyj"
        ></a>
        <Script src="//platform.twitter.com/widgets.js" async={true} />
      </div>
    </div>
  )
}

export default Sidebar
