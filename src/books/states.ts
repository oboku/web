import { intersection } from "ramda";
import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil";
import { BookDocType } from 'oboku-shared'
import { libraryState } from "../library/states";
import { normalizedTagsState, protectedTagIdsState } from "../tags/states";
import { normalizedLinksState } from "../links/states";
import { bookDownloadsState } from "../download/states";
import { normalizedCollectionsState } from "../collections/states";

export type Book = NonNullable<UnwrapRecoilValue<typeof normalizedBooksState>[number]>

export const normalizedBooksState = atom<Record<string, BookDocType | undefined>>({
  key: 'books',
  default: {}
})

export const enrichedBookState = selectorFamily({
  key: 'enrichedBookState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const downloadState = get(bookDownloadsState(bookId))

    if (!book) return undefined

    return {
      ...book,
      ...downloadState || {},
    }
  }
})

export const booksAsArrayState = selector<Book[]>({
  key: 'booksAsArray',
  get: ({ get }) => {
    const books = get(normalizedBooksState)
    const bookIds = get(bookIdsState)

    return bookIds.map(id => books[id] as Book)
  }
})

export const bookIdsState = selector({
  key: 'bookIds',
  get: ({ get }) => {
    const books = get(normalizedBooksState)
    const { isLibraryUnlocked } = get(libraryState)
    const protectedTags = get(protectedTagIdsState)

    if (isLibraryUnlocked) return Object.keys(books)

    return Object.values(books).filter(book => intersection(protectedTags, book?.tags || []).length === 0).map(book => book?._id || '-1')
  }
})

export const bookTagsState = selectorFamily({
  key: 'bookTagsState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const tags = get(normalizedTagsState)

    return book?.tags?.map(id => tags[id])
  }
})

export const bookLinksState = selectorFamily({
  key: 'bookLinksState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const links = get(normalizedLinksState)

    return book?.links?.map(id => links[id])
  }
})

export const bookCollectionsState = selectorFamily({
  key: 'bookCollectionsState',
  get: (bookId: string) => ({ get }) => {
    const book = get(normalizedBooksState)[bookId]
    const collections = get(normalizedCollectionsState)

    return book?.collections?.map(id => collections[id])
  }
})