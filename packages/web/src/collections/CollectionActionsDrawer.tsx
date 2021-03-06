import {
  Drawer,
  ListItem,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  DialogContent,
  DialogTitle,
  Dialog,
  TextField,
  DialogActions,
  Button
} from "@mui/material"
import { useEffect, useState, FC } from "react"
import {
  Edit,
  DeleteForeverRounded,
  LibraryAddRounded
} from "@mui/icons-material"
import { useRemoveCollection, useUpdateCollection } from "./helpers"
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { collectionState } from "./states"
import { ManageCollectionBooksDialog } from "./ManageCollectionBooksDialog"
import { useModalNavigationControl } from "../navigation/useModalNavigationControl"
import { useCallback } from "react"
import { useRef } from "react"

const collectionActionDrawerState = atom<{
  openedWith: undefined | string
}>({ key: "collectionActionDrawerState", default: { openedWith: undefined } })

const collectionActionDrawerChangesState = atom<undefined | [string, `delete`]>(
  {
    key: `collectionActionDrawerChangesState`,
    default: undefined
  }
)

export const useCollectionActionsDrawer = (
  id: string,
  onChanges?: (change: `delete`) => void
) => {
  const [, setCollectionActionDrawer] = useRecoilState(
    collectionActionDrawerState
  )
  const collectionActionDrawerChanges = useRecoilValue(
    collectionActionDrawerChangesState
  )
  // we use this to only ever emit once every changes
  // this also ensure when first subscribing to the hook we do not trigger the previous changes
  const latestChangesEmittedRef = useRef(collectionActionDrawerChanges)

  const open = useCallback(() => {
    setCollectionActionDrawer({ openedWith: id })
  }, [setCollectionActionDrawer, id])

  useEffect(() => {
    if (collectionActionDrawerChanges) {
      if (collectionActionDrawerChanges !== latestChangesEmittedRef.current) {
        const [changeForId, change] = collectionActionDrawerChanges
        if (changeForId === id) {
          onChanges && onChanges(change)
          latestChangesEmittedRef.current = collectionActionDrawerChanges
        }
      }
    }
  }, [collectionActionDrawerChanges, onChanges, id])

  return {
    open
  }
}

export const CollectionActionsDrawer: FC<{}> = () => {
  const [{ openedWith: collectionId }, setCollectionActionDrawerState] =
    useRecoilState(collectionActionDrawerState)
  const setCollectionActionDrawerChanges = useSetRecoilState(
    collectionActionDrawerChangesState
  )
  const [
    isEditCollectionDialogOpenedWithId,
    setIsEditCollectionDialogOpenedWithId
  ] = useState<string | undefined>(undefined)
  const [removeCollection] = useRemoveCollection()
  const [isManageBookDialogOpened, setIsManageBookDialogOpened] =
    useState(false)
  const subActionOpened = !!isEditCollectionDialogOpenedWithId

  const handleClose = useModalNavigationControl(
    {
      onExit: () => {
        setCollectionActionDrawerState({ openedWith: undefined })
        setIsEditCollectionDialogOpenedWithId(undefined)
        setIsManageBookDialogOpened(false)
      }
    },
    collectionId
  )

  const opened = !!collectionId

  const onRemoveCollection = (id: string) => {
    handleClose()
    setCollectionActionDrawerChanges([id, `delete`])
    id && removeCollection({ _id: id })
  }

  if (!collectionId) return null

  return (
    <>
      <Drawer
        anchor="bottom"
        open={opened && !subActionOpened}
        onClose={() => handleClose()}
      >
        <List>
          <ListItem
            button
            onClick={() => {
              setIsEditCollectionDialogOpenedWithId(collectionId)
            }}
          >
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItem>
          {/* <ListItem button onClick={() => {
            // delete this collection
            // create a new local one without resource id
          }}>
            <ListItemIcon><DynamicFeedRounded /></ListItemIcon>
            <ListItemText
              primary="Make this collection local"
              secondary="This collection will no longer be synchronized with the data source it originated from"
            />
          </ListItem> */}
          <ListItem
            button
            onClick={() => {
              setIsManageBookDialogOpened(true)
            }}
          >
            <ListItemIcon>
              <LibraryAddRounded />
            </ListItemIcon>
            <ListItemText primary="Manage books" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={() => onRemoveCollection(collectionId)}>
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItem>
        </List>
      </Drawer>
      <ManageCollectionBooksDialog
        open={isManageBookDialogOpened}
        onClose={() => {
          setIsManageBookDialogOpened(false)
        }}
        collectionId={collectionId}
      />
      <EditCollectionDialog
        id={isEditCollectionDialogOpenedWithId}
        onClose={() => {
          setIsEditCollectionDialogOpenedWithId(undefined)
        }}
        open={!!isEditCollectionDialogOpenedWithId}
      />
    </>
  )
}

const EditCollectionDialog: FC<{
  open: boolean
  id: string | undefined
  onClose: () => void
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState("")
  const collection = useRecoilValue(collectionState(id || "-1"))
  const [editCollection] = useUpdateCollection()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editCollection({ _id: id, name })
    }
  }

  useEffect(() => {
    setName((prev) => collection?.name || prev)
  }, [collection?.name, id])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Collection: {collection?.name}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            id && onConfirm(id, name)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
