import { useEffect, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { searchState } from "./states"
import { booksAsArrayState } from "../books/states"
import { useBooksSortedBy } from "../books/helpers"

export const useSearch = () => {
  const [search, setSearch] = useRecoilState(searchState)
  const [results, setResults] = useState<typeof books>([])
  const books = useRecoilValue(booksAsArrayState)
  const sortedResults = useBooksSortedBy(results, "alpha")

  useEffect(() => {
    if (!search) {
      return setResults([])
    }

    const res = books.filter((book) => {
      const searchRegex = new RegExp(search || "", "i")

      // console.log(searchRegex, book.title?.search(searchRegex))

      const indexOfFirstMatch = book.title?.search(searchRegex) || 0
      return indexOfFirstMatch >= 0 ? true : false
    })

    setResults(res)
  }, [search, books])

  return [search, setSearch, sortedResults] as [
    typeof search,
    typeof setSearch,
    typeof sortedResults
  ]
}
