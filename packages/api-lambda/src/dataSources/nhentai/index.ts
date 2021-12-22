import { dataSourceHelpers, dataSourcePlugins } from "@oboku/shared/src";
import { DataSourcePlugin } from "../types";
import { load } from "cheerio";
import { BASE_URI } from "./constants";
import fetch from "node-fetch";

export const plugin: DataSourcePlugin = {
  ...dataSourcePlugins.NHENTAI,
  download: async (link) => {
    throw new Error(`Not implemented`)
  },
  getMetadata: async (link) => {
    const galleryId = dataSourceHelpers.extractIdFromResourceId(dataSourcePlugins.NHENTAI.uniqueResourceIdentifier, link.resourceId)
    const uri = `${BASE_URI}/g/${galleryId}`

    const response = await fetch(uri)

    const $ = load(await response.text())

    /**
     * first h1.title contains title. There can be several title such as original japanese one but will usually be inside h2 or others
     */
    const title = $(`h1.title`).text()

    let languages: string[] = []
    let creators: string[] = []
    let subjects: string[] = []

    $(`.tag-container.field-name`).contents().each((_, e) => {
      // #text
      if (e.nodeType === 3) {
        const label = $(e).text().trim()
        switch (label) {
          case `Languages:`: {
            $(e).next(`.tags`).find(`.name`).each((_, spanNode) => {
              languages.push($(spanNode).text())
            })
            break
          }
          case `Artists:`: {
            $(e).next(`.tags`).find(`.name`).each((_, spanNode) => {
              creators.push($(spanNode).text())
            })
            break
          }
          case `Tags:`: {
            $(e).next(`.tags`).find(`.name`).each((_, spanNode) => {
              subjects.push($(spanNode).text())
            })
            break
          }
          default:
        }
      }
    })
    /**
     * there are both <a> and <img> inside. The a link target the 1 item of the book and is original size. The <img> is used by the
     * website for cover on the gallery home and is usually resized. We want to use the <a> in order to work with the original size.
     * We get something like `/g/1235/1/`
     */
    const coverPageUrl = `${BASE_URI}${$(`#cover a`).attr().href}`

    /**
     * Then we parse the cover page url and retrieve the original raw file link
     */
    const coverPageResponse = await fetch(coverPageUrl)
    const coverPage$ = load(await coverPageResponse.text())

    const coverUrl = coverPage$(`#image-container img`).attr().src

    return {
      name: title,
      languages,
      creators,
      subjects,
      coverUrl,
      /**
       * we have nothing to download.
       * we try to return all metadata from here
       */
      shouldDownload: false
    }
  },
  sync: async () => {
    throw new Error(`Not implemented`)
  },
}