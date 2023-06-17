import React from 'react'
// import { useRouter } from 'next/router'

import '../styles/globals.css'
import '../styles/highlight.css'
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  // this is hack for disabling prefetch
  // const router = useRouter()

  // useMemo(() => {
  //   router.prefetch = async () => {}
  // }, [router])

  return <Component {...pageProps} />
}

export default MyApp
