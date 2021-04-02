import { BookDocType, GoogleDriveDataSourceData } from '@oboku/shared/src'
import { DataSource, SynchronizableDataSource } from "./types"
import { createHelpers } from "./helpers"
import { difference } from "ramda"
import { Logger } from "../Logger"

const logger = Logger.namespace('sync')

type Helpers = Parameters<DataSource['sync']>[1]
type Context = Parameters<DataSource['sync']>[0]
type SynchronizableItem = SynchronizableDataSource['items'][number]

function isFolder(item: SynchronizableDataSource | SynchronizableItem): item is SynchronizableItem {
  return (item as SynchronizableItem).type === 'folder'
}

function isFile(item: SynchronizableDataSource | SynchronizableItem): item is SynchronizableItem {
  return (item as SynchronizableItem).type === 'file'
}

export const sync = async (
  synchronizable: SynchronizableDataSource,
  ctx: Context,
  helpers: ReturnType<typeof createHelpers>
) => {
  console.log(`dataSourcesSync run for user ${ctx.userEmail} with dataSource ${ctx.dataSourceId}`)

  await syncFolder({ ctx, helpers, item: synchronizable, hasCollectionAsParent: false, lvl: 0, parents: [] })
}

const syncFolder = async ({ ctx, helpers, hasCollectionAsParent, item, lvl, parents }: {
  ctx: Context,
  helpers: Helpers,
  lvl: number,
  hasCollectionAsParent: boolean,
  item: SynchronizableDataSource | SynchronizableItem,
  parents: (SynchronizableItem | SynchronizableDataSource)[]
}) => {
  const metadataForFolder = helpers.extractMetadataFromName(item.name)
  logger.log(`syncFolder ${item.name}: metadata `, metadataForFolder)

  const isCollection = isFolder(item) && !hasCollectionAsParent && lvl > 0 && !metadataForFolder.isNotACollection

  if (metadataForFolder.isIgnored) {
    logger.log(`syncFolder ${item.name}: ignore`)
    return
  }

  await Promise.all(metadataForFolder.tags.map(name => helpers.getOrcreateTagFromName(name)))

  // Do not regsiter as collection if
  // - root
  // - metadata says otherwise
  // - parent is not already a collection
  if (isFolder(item) && isCollection) {
    await registerOrUpdateCollection({ ctx, item, helpers })
  }

  logger.log(`syncFolder ${item.name}: with items ${item.items?.length || 0} items`)

  await Promise.all((item.items || []).map(async subItem => {
    if (isFile(subItem)) {
      await createOrUpdateBook({
        ctx,
        item: subItem,
        helpers,
        parents: [...parents, item],
      })
    } else if (isFolder(subItem)) {
      await syncFolder({
        ctx,
        helpers,
        lvl: lvl + 1,
        hasCollectionAsParent: isCollection,
        item: subItem,
        parents: [...parents, item],
      })
    }
  }))
}

const createOrUpdateBook = async ({ ctx: { dataSourceType }, helpers, parents, item }: {
  ctx: Context,
  parents: (SynchronizableItem | SynchronizableDataSource)[],
  item: SynchronizableItem,
  helpers: Helpers,
}) => {
  try {
    logger.log(`createOrUpdateBook "${item.name}":`, item.resourceId)
    const parentTags = parents.reduce((tags: string[], parent) => [...tags, ...helpers.extractMetadataFromName(parent.name).tags], [])
    const metadata = helpers.extractMetadataFromName(item.name)
    const parentFolders = parents.filter(parent => isFolder(parent)) as SynchronizableItem[]
    const existingLink = await helpers.findOne('link', { selector: { resourceId: item.resourceId } })

    logger.log(`createOrUpdateBook "${item.name}": existingLink`, existingLink?._id)

    let existingBook: BookDocType | null = null
    if (existingLink?.book) {
      existingBook = await helpers.findOne('book', { selector: { _id: existingLink.book } })

      if (existingBook) {
        if (!existingBook.isAttachedToDataSource) {
          logger.log(`createOrUpdateBook "${item.name}": isAttachedToDataSource is false and therefore will be migrated as true`, existingBook._id)
          await helpers.atomicUpdate('book', existingBook._id, data => ({
            ...data,
            isAttachedToDataSource: true
          }))
        }
        logger.log(`createOrUpdateBook "${item.name}": existingBook`, existingBook._id)
      }
    }

    if (!existingLink || !existingBook) {
      let bookId = existingBook?._id
      if (!bookId) {
        logger.log(`createOrUpdateBook "${item.name}": new file detected, creating book`)
        const insertedBook = await helpers.createBook({
          title: item.name,
          isAttachedToDataSource: true,
        })
        bookId = insertedBook.id
      }

      const insertedLink = await helpers.create('link', {
        type: dataSourceType,
        resourceId: item.resourceId,
        book: bookId,
        data: JSON.stringify({}),
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      })
      await helpers.addLinkToBook(bookId, insertedLink.id)
      await helpers.addTagsFromNameToBook(bookId, [...metadata.tags, ...parentTags])
      await synchronizeBookWithParentCollections(bookId, parentFolders, helpers)

      helpers.refreshBookMetadata({ bookId: bookId }).catch(logger.error)
    } else {
      /**
       * We already have a link that exist for this datasource with this book.
       * We will try to retrieve the book and update it if needed.
       */
      // We check the last updated date of the book
      const lastMetadataUpdatedAt = new Date(existingBook?.lastMetadataUpdatedAt || 0)
      if (lastMetadataUpdatedAt < new Date(item.modifiedAt || 0) || !(await helpers.isBookCoverExist(existingBook._id))) {
        // console.log(`dataSourcesSync book file ${item.resourceId} has a more recent modifiedTime ${item.modifiedAt} than its lastMetadataUpdatedAt ${lastMetadataUpdatedAt}, triggering metadata refresh`)

        helpers.refreshBookMetadata({ bookId: existingBook?._id }).catch(logger.error)
      } else {
        logger.log(`book ${existingLink.book} has no changes detected, skip metadata refresh`)
      }

      await synchronizeBookWithParentCollections(existingBook._id, parentFolders, helpers)

      await helpers.addTagsFromNameToBook(existingBook._id, [...metadata.tags, ...parentTags])
      // Finally we update the tags to the book if needed
      const { applyTags } = await helpers.getDataSourceData<GoogleDriveDataSourceData>()
      await helpers.addTagsToBook(existingBook._id, applyTags || [])
    }
  } catch (e) {
    logger.error(`createOrUpdateBook something went wrong for book ${item.name} (${item.resourceId})`)
    logger.error(e)
    throw e
  }
}

/**
 * For every parents of the book we will lookup if there are collections that exist without
 * referencing it. If so then we will attach the collection and the book together
 */
const synchronizeBookWithParentCollections = async (bookId: string, parents: SynchronizableItem[], helpers: Helpers) => {
  const parentResourceIds = parents?.map(parent => parent.resourceId) || []

  // Retrieve all the new collection to which attach the book and add the book in the list
  // if there is no collection we don't run the query since it will return everything because of the empty $or
  if (parentResourceIds.length > 0) {
    /**
     * Use case:
     * Some collections does not have the book yet
     * 
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const collectionsThatHaveNotThisBookAsReferenceYet = await helpers.find('obokucollection', {
      selector: {
        $or: parentResourceIds.map(resourceId => ({ resourceId })),
        books: {
          $nin: [bookId]
        }
      }
    })

    if (collectionsThatHaveNotThisBookAsReferenceYet.length > 0) {
      logger.log(`synchronizeBookWithParentCollections ${collectionsThatHaveNotThisBookAsReferenceYet.length} collections does not have ${bookId} attached to them yet`)
      await Promise.all(
        collectionsThatHaveNotThisBookAsReferenceYet
          .map(collection =>
            helpers.atomicUpdate('obokucollection', collection._id, old => ({
              ...old,
              books: [...old.books.filter(id => id !== bookId), bookId]
            }))
          )
      )
    }

    const parentCollections = await helpers.find('obokucollection', {
      selector: {
        $or: parentResourceIds.map(resourceId => ({ resourceId })),
      }
    })
    const parentCollectionIds = parentCollections.map(({ _id }) => _id)

    /**
     * Use case: 
     * The book does not have one of the parent collection yet
     * 
     * Result:
     * We attach all the parent collections to the book by combining them with existing collection of the book.
     * Make sure to not remove any existing collection from the book and to avoid duplicate
     */
    const book = await helpers.findOne('book', { selector: { _id: bookId } })
    if (book) {
      const bookHasNotOneOfTheCollectionsYet = parentCollectionIds.some(collectionId => !book.collections.includes(collectionId))
      if (bookHasNotOneOfTheCollectionsYet) {
        logger.log(`synchronizeBookWithParentCollections ${bookId} has some missing parent collections. It will be updated to include them`)
        await helpers.atomicUpdate('book', bookId, old => ({
          ...old,
          collections: [...new Set([...old.collections, ...parentCollectionIds])]
        }))
      }
    }
  }

  /**
   * Use case:
   * The book does not have parent collections
   * 
   * Result:
   * We do not remove collection yet. See for the future
   */
  if (parentResourceIds.length === 0) {
    // @todo remove collections from the book ?
  }
}

const registerOrUpdateCollection = async ({ item: { name, resourceId }, helpers, ctx }: {
  ctx: Context,
  item: SynchronizableItem
  helpers: Helpers
}) => {
  let collectionId: string | undefined
  /**
   * Try to get existing collection by same resource id
   * If there is one and the name is different we update it
   */
  const sameCollectionByResourceId = await helpers.findOne('obokucollection', { selector: { resourceId, } })
  if (sameCollectionByResourceId) {
    collectionId = sameCollectionByResourceId._id
    if (sameCollectionByResourceId.name !== name) {
      logger.log(`registerOrUpdateCollection ${name} has been updated. The item will be updated to reflect datasource`)
      await helpers.atomicUpdate('obokucollection', sameCollectionByResourceId._id, old => ({ ...old, name }))
    }
  } else {
    logger.log(`registerOrUpdateCollection ${name} does not exist yet and will be created`)
    /**
     * Otherwise we just create a new collection with this resource id
     * Note that there could be another collection with same name. But since it
     * does not come from the same datasource it should still be treated as different
     */
    const created = await helpers.create('obokucollection', {
      name,
      resourceId,
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      dataSourceId: ctx.dataSourceId
    })
    collectionId = created.id
  }

  // try to remove book that does not exist anymore if needed
  const collection = await helpers.findOne('obokucollection', { selector: { _id: collectionId } })
  if (collection) {
    const booksInCollection = await helpers.find('book', { selector: { _id: { $in: collection?.books || [] } } })
    const booksInCollectionAsIds = booksInCollection.map(({ _id }) => _id)
    const toRemove = difference(collection.books, booksInCollectionAsIds)
    if (toRemove.length > 0) {
      logger.log(`registerOrUpdateCollection ${name} contains books that does not exist anymore and they will be removed from it`)
      await helpers.atomicUpdate('obokucollection', collection?._id, old => ({
        ...old,
        books: old.books.filter(id => !toRemove.includes(id))
      }))
    }
  }
}