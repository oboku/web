/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import nodeFetch from 'node-fetch'
import { Dropbox, files } from "dropbox";
import { DataSource, SynchronizableDataSource } from "../types";
import { Readable } from 'stream'
import { DropboxDataSourceData, READER_SUPPORTED_EXTENSIONS } from "@oboku/shared";
import { PromiseReturnType } from "../../types";

const extractIdFromResourceId = (resourceId: string) => resourceId.replace(`dropbox-`, ``)
const generateResourceId = (id: string) => `dropbox-${id}`

export const dataSource: DataSource = {
  /**
   * @see https://www.dropbox.com/developers/documentation/http/documentation#files-download
   */
  download: async (link, credentials) => {
    console.log(typeof nodeFetch)
    var dbx = new Dropbox({ accessToken: credentials.accessToken, fetch: nodeFetch })

    const fileId = extractIdFromResourceId(link.resourceId)

    const response = await dbx.filesDownload({
      path: `${fileId}`
    })

    const results = response.result
    // @ts-ignore
    const fileBinary: Buffer = results.fileBinary || Buffer.from('', 'binary')

    const stream = new Readable({
      read() {
        this.push(fileBinary);
        this.push(null);
      }
    })

    return {
      metadata: {
        size: results.size.toString()
      },
      stream
    }
  },
  sync: async ({ credentials }, helpers) => {
    var dbx = new Dropbox({ accessToken: credentials.accessToken, fetch: nodeFetch })

    const { folderId } = await helpers.getDataSourceData<DropboxDataSourceData>()

    if (!folderId) {
      throw helpers.createError('unknown')
    }

    const getContentsFromFolder = async (id: string): Promise<SynchronizableDataSource['items']> => {
      let hasMore = true
      let cursor: PromiseReturnType<typeof dbx.filesListFolder>['result']['cursor'] | undefined = undefined
      let results: PromiseReturnType<typeof dbx.filesListFolder>['result']['entries'] = []

      while (hasMore) {
        let response: PromiseReturnType<typeof dbx.filesListFolderContinue>
        if (cursor) {
          response = await dbx.filesListFolderContinue({
            cursor,
          })
        } else {
          response = await dbx.filesListFolder({
            path: id,
            include_deleted: false,
            include_non_downloadable_files: false,
            include_media_info: true,
          })
        }
        cursor = response.result.cursor
        results = [
          ...results,
          ...response.result.entries
            .filter(entry =>
              entry['.tag'] === 'folder'
              || READER_SUPPORTED_EXTENSIONS.some(extension => entry.name.endsWith(extension))
            )
        ]
        hasMore = response.result.has_more
      }

      return Promise.all(results.map(async (item): Promise<SynchronizableDataSource['items'][number]> => {
        if (item[".tag"] === 'file') {
          return {
            type: 'file',
            resourceId: generateResourceId((item as files.FileMetadataReference).id),
            name: item.name,
            modifiedAt: item.server_modified
          }
        }

        return {
          type: 'folder',
          resourceId: generateResourceId((item as files.FolderMetadataReference).id),
          items: await getContentsFromFolder((item as files.FolderMetadataReference).id),
          name: item.name,
          modifiedAt: new Date().toISOString(),
        }
      }))
    }

    const [items, rootFolderResponse] = await Promise.all([
      await getContentsFromFolder(folderId),
      await dbx.filesGetMetadata({
        path: folderId
      })
    ])

    return {
      items,
      name: rootFolderResponse.result.name,
    }
  }
}