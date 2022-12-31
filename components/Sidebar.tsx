import React from 'react'
import Link from 'next/link'

function Sidebar() {
  return (
    <div className="sidebar">
      <h3>
        <Link href="/about">
          About
        </Link>
      </h3>
      <h3>
        <Link href="/allPosts">
          All Posts
        </Link>
      </h3>
      <h3>
        <a href="https://github.com/rocky-jaiswal" target="_blank" rel="noreferrer">
          Github
        </a>
      </h3>
      <h3>
        <a href="https://dizl.de/@rockyj" target="_blank" rel="noreferrer">
          Social
        </a>
      </h3>
    </div>
  )
}

export default Sidebar
