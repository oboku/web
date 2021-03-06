import { useRecoilValue } from "recoil"
import { paginationState, totalBookProgressState } from "./states"
import { useAtomicUpdateBook } from "../books/helpers"
import { ReadingStateState } from "@oboku/shared"
import { useDebounce } from "react-use"

export const useUpdateBookState = (bookId: string) => {
  const [updateBook] = useAtomicUpdateBook()
  const { beginCfi } = useRecoilValue(paginationState) || {}
  const totalBookProgress = useRecoilValue(totalBookProgressState)

  const updater = async () => {
    updateBook(bookId, (old) => ({
      ...old,
      // cfi will be undefined at the beginning until pagination stabilize
      ...(beginCfi && {
        readingStateCurrentBookmarkLocation: beginCfi || null
      }),
      readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
      ...(old.readingStateCurrentState !== ReadingStateState.Finished && {
        readingStateCurrentState: ReadingStateState.Reading,
        ...(totalBookProgress === 1 && {
          readingStateCurrentState: ReadingStateState.Finished
        })
      }),
      ...(typeof totalBookProgress === "number" && {
        readingStateCurrentBookmarkProgressPercent: totalBookProgress
      })
    }))
  }

  useDebounce(updater, 400, [updateBook, beginCfi, totalBookProgress])
}
