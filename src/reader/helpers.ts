import { useRecoilCallback, useRecoilValue } from "recoil"
import * as states from "./states"
import { Rendition } from "epubjs"
import { useEffect, useState } from "react"
import { useUpdateBook } from "../books/helpers"
import { bookState } from "../books/states"
import { ReadingStateState } from "oboku-shared"
import { useDebounce } from "react-use"

const statesToReset = [
  states.currentApproximateProgressState,
  states.currentChapterState,
  states.currentLocationState,
  states.currentPageState,
  states.tocState,
  states.layoutState,
  states.isMenuShownState,
  states.totalApproximativePagesState,
]

export const useResetStateOnUnmount = () => {
  const resetStates = useRecoilCallback(({ reset }) => () => {
    statesToReset.forEach(state => reset(state))
  }, [])

  useEffect(() => {
    return () => resetStates()
  }, [resetStates])
}

/**
 * Generate good enough page range for progress and current page.
 * We use 600 char as breaker as it's a good enough middle. 
 * @todo optimize to retrieve from storage
 * @see https://github.com/futurepress/epub.js/blob/master/examples/locations.html
 */
export const useGenerateLocations = (rendition: Rendition | undefined, words = 300) => {
  const [locations, setLocations] = useState<string[] | undefined>(undefined)
  const layout = useRecoilValue(states.layoutState)

  useEffect(() => {
    if (!rendition || layout !== 'reflow') return

    (async () => {
      await rendition.book.ready

      // if we call generate again for some reason the locations will stack on top of each other
      // so we clean them before every generation
      rendition.book.locations.load(JSON.stringify([]))

      // Generates CFI for every X characters (Characters per/page)
      // await rendition?.book.locations.generate(600)
      const locations = await (rendition?.book.locations.generate(words) as Promise<string[]>)

      setLocations(locations)

      // Will trigger a relocate
      rendition.reportLocation()
    })()
  }, [rendition, words, layout])

  return locations
}

export const useUpdateBookState = (bookId: string) => {
  const [editBook] = useUpdateBook()
  const currentLocation = useRecoilValue(states.currentLocationState)
  const currentApproximateProgress = useRecoilValue(states.currentApproximateProgressState)
  const book = useRecoilValue(bookState(bookId))
  const readingStateCurrentBookmarkLocation = book?.readingStateCurrentBookmarkLocation

  useDebounce(() => {
    if (currentLocation && currentLocation?.start?.cfi !== readingStateCurrentBookmarkLocation) {
      editBook({
        _id: bookId,
        readingStateCurrentBookmarkLocation: currentLocation?.start?.cfi,
        readingStateCurrentState: ReadingStateState.Reading,
        ...currentApproximateProgress && {
          // progress
          readingStateCurrentBookmarkProgressPercent: currentApproximateProgress,
        },
        ...currentApproximateProgress === 1 && {
          readingStateCurrentState: ReadingStateState.Finished,
        }
      })
    }
  }, 400, [currentApproximateProgress, currentLocation, readingStateCurrentBookmarkLocation] as any)
}