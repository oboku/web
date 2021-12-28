import { Request } from 'request'
import { LinkDocType, dataSourceHelpers } from '@oboku/shared/src'
import * as cheerio from "cheerio"
import fetch from "node-fetch"

export {
  dataSourceHelpers,
  cheerio,
  fetch
}

type NameWithMetadata = string
type ISOString = string

type SynchronizeAbleItem = {
  type: `file` | `folder`,
  resourceId: string,
  name: NameWithMetadata,
  items?: SynchronizeAbleItem[]
  modifiedAt: ISOString
}

export type SynchronizeAbleDataSource = {
  name: string,
  items: SynchronizeAbleItem[]
}

type Helpers = {}

export type DataSourcePlugin = {
  type: string,
  getMetadata: (link: LinkDocType, credentials?: any) => Promise<{
    size?: string,
    contentType?: string,
    name: string,
    languages?: string[],
    subjects?: string[],
    creators?: string[],
    coverUrl?: string,
    shouldDownload: boolean
  }>
  download: (link: LinkDocType, credentials?: any) => Promise<{
    stream: NodeJS.ReadableStream | Request,
    metadata: {
      size?: string,
      contentType?: string,
      name: string,
    }
  }>
  sync: (options: {
    userEmail: string,
    dataSourceId: string,
    credentials?: any,
    dataSourceType: string
  }, helper: Helpers) => Promise<SynchronizeAbleDataSource>,
}