"use client"

import { useEffect } from "react"

export function ConsoleSilencer() {
  useEffect(() => {
    const noop = () => {}
    console.log = noop
    console.info = noop
    console.warn = noop
    console.error = noop
    console.debug = noop
  }, [])

  return null
}
