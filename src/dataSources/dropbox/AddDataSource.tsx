import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core'
import { ArrowBackIosRounded, LocalOfferRounded } from '@material-ui/icons'
import React, { ComponentProps, FC, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { DropboxDataSourceData, DataSourceType } from 'oboku-shared'
import { tagsAsArrayState } from '../../tags/states'
import { TagsSelectionList } from '../../tags/TagsSelectionList'
import { useCreateDataSource } from '../helpers'
import { Picker } from './Picker'
import { DropboxFile } from './types'

export const AddDataSource: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: true | undefined }>({})
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const addDataSource = useCreateDataSource()
  const [selectedFolder, setSelectedFolder] = useState<DropboxFile | undefined>(undefined)
  const [folderChain, setFolderChain] = useState<DropboxFile[]>([{ name: '', id: 'root', isDir: true }])
  const currentFolder = folderChain[folderChain.length - 1]
  const tags = useRecoilValue(tagsAsArrayState)
  const [showPicker, setShowPicker] = useState(false)

  const onPick: ComponentProps<typeof Picker>['onClose'] = (files) => {
    setShowPicker(false)
    if (files && files.length > 0) {
      setSelectedFolder(files[0])
    }
  }

  return (
    <>
      <Dialog onClose={onClose} open fullScreen>
        <DialogTitle>Dropbox datasource</DialogTitle>
        <DialogContent style={{ padding: 0, display: 'flex', flexFlow: 'column' }}>
          <List >
            <ListItem onClick={() => setIsTagSelectionOpen(true)}>
              <ListItemIcon>
                <LocalOfferRounded />
              </ListItemIcon>
              <ListItemText
                primary="Apply tags"
                secondary={Object.keys(selectedTags).map(id => tags.find(tag => tag?._id === id)?.name).join(' ')}
              />
            </ListItem>
            <ListItem>
              <Typography noWrap>Selected: {selectedFolder?.name || 'None'}</Typography>
            </ListItem>
            {currentFolder.id !== 'root' && (
              <ListItem>
                <Button
                  style={{
                    flex: 1,
                  }}
                  startIcon={<ArrowBackIosRounded style={{}} />}
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setFolderChain(value => value.slice(0, value.length - 1))
                  }}
                >Go back</Button>
              </ListItem>
            )}
          </List>
          <Box flex={1} display="flex" justifyContent="center" alignItems="center">
            <Button color="primary" variant="contained" onClick={() => setShowPicker(true)}>
              Choose a folder
        </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
        </Button>
          <Button
            color="primary"
            disabled={!selectedFolder}
            onClick={() => {
              onClose()
              if (selectedFolder) {
                const customData: DropboxDataSourceData = {
                  applyTags: Object.keys(selectedTags),
                  folderId: selectedFolder.id,
                  folderName: selectedFolder.name
                }
                addDataSource({
                  type: DataSourceType.DROPBOX,
                  data: JSON.stringify(customData),
                })
              }
            }}
          >
            Confirm
        </Button>
        </DialogActions>
        <Dialog open={isTagSelectionOpen} onClose={() => setIsTagSelectionOpen(false)}>
          <DialogTitle>Choose tags to apply automatically</DialogTitle>
          <TagsSelectionList
            tags={tags}
            isSelected={(id) => !!selectedTags[id]}
            onItemClick={(id) => {
              if (selectedTags[id]) {
                setSelectedTags(({ [id]: removed, ...rest }) => rest)
              } else {
                setSelectedTags((value) => ({ ...value, [id]: true }))
              }
            }}
          />
          <DialogActions>
            <Button onClick={() => setIsTagSelectionOpen(false)} color="primary" autoFocus>
              Close
        </Button>
          </DialogActions>
        </Dialog>
      </Dialog >
      {showPicker && <Picker onClose={onPick} select="folder" multiselect={false} />}
    </>
  )
}