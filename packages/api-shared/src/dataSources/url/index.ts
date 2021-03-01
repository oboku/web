import request from 'request'
import { DataSource } from '../types'

export type UriLinkData = { uri?: string }

export const dataSource: DataSource = {
  getMetadata: async () => ({ name: '' }),
  download: async (link) => {
    return new Promise((resolve, reject) => {
      const stream = request({ uri: link.resourceId })
        .on('error', reject)
        .on('response', (response) => {
          resolve({
            stream,
            metadata: {
              ...response.headers['content-length'] && {
                size: response.headers['content-length']
              },
              ...response.headers['content-type'] && {
                contentType: response.headers['content-type']
              },
              name: ''
            },
          })
        })
    })
  },
  sync: async () => ({ items: [], name: '' })
}