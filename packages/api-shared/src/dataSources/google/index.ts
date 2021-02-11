import { DataSource, SynchronizableDataSource } from '../types'
import { authorize } from './helpers'
import { drive_v3, google } from 'googleapis'
import { GoogleDriveDataSourceData, READER_SUPPORTED_MIME_TYPES } from '@oboku/shared'
import { configure } from './configure'

export { configure }

export const generateResourceId = (driveId: string) => `drive-${driveId}`
export const extractIdFromResourceId = (resourceId: string) => resourceId.replace(`drive-`, ``)

export const dataSource: DataSource = {
  download: async (link, credentials) => {
    if (!link.resourceId) {
      throw new Error('Invalid google drive file uri')
    }

    const auth = await authorize({ credentials });

    const drive = google.drive({
      version: 'v3',
      auth
    })

    const metadata = (await drive.files.get({
      fileId: extractIdFromResourceId(link.resourceId),
      fields: 'size, name'
    }, { responseType: 'json' })).data

    const response = await drive.files.get({
      fileId: extractIdFromResourceId(link.resourceId),
      alt: 'media',
    }, { responseType: 'stream' })

    return {
      stream: response.data,
      metadata: {
        ...metadata.size && {
          size: metadata.size
        },
        ...metadata.name && {
          name: metadata.name
        },
        contentType: response.headers['content-type']
      },
    }
  },
  sync: async (ctx, helpers) => {
    const auth = await authorize(ctx);
    const drive = google.drive({
      version: 'v3',
      auth
    })

    const { folderId } = await helpers.getDataSourceData<GoogleDriveDataSourceData>()

    if (!folderId) {
      throw helpers.createError('unknown')
    }

    const getContentsFromFolder = async (id: string): Promise<SynchronizableDataSource['items']> => {
      let pageToken: string | undefined
      let isDone = false
      let files: NonNullable<drive_v3.Schema$FileList['files']> = []

      while (!isDone) {
        const response = await drive.files.list({
          spaces: 'drive',
          q: `
            '${id}' in parents and (
              mimeType='application/vnd.google-apps.folder' 
              ${READER_SUPPORTED_MIME_TYPES.map(mimeType => ` or mimeType='${mimeType}'`).join('')}
            )
          `,
          includeItemsFromAllDrives: true,
          fields: 'nextPageToken, files(id, kind, name, mimeType, modifiedTime, parents, modifiedTime, trashed)',
          pageToken: pageToken,
          supportsAllDrives: true,
          pageSize: 10,
        })
        pageToken = response.data.nextPageToken || undefined
        files = [...files, ...response.data.files || []]
        if (!pageToken) {
          isDone = true
        }
      }

      return Promise.all(files
        .filter(file => file.trashed !== true)
        .map(async (file): Promise<SynchronizableDataSource['items'][number]> => {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            return {
              type: 'folder',
              resourceId: generateResourceId(file.id || ''),
              items: await getContentsFromFolder(file.id || ''),
              name: file.name || '',
              modifiedAt: file.modifiedTime || new Date().toISOString()
            }
          }

          return {
            type: 'file',
            resourceId: generateResourceId(file.id || ''),
            name: file.name || '',
            modifiedAt: file.modifiedTime || new Date().toISOString()
          }
        })
      )
    }

    const [items, rootFolderResponse] = await Promise.all([
      await getContentsFromFolder(folderId),
      await drive.files.get({
        fileId: folderId
      })
    ])

    return {
      items,
      name: rootFolderResponse.data.name || '',
    }
  }
}