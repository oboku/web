import React, { useCallback, FC, useMemo } from 'react'
import { Box, makeStyles, useTheme } from "@material-ui/core"
import { useWindowSize } from 'react-use';
import { ItemList } from '../../lists/ItemList';
import { BookListGridItem } from './BookListGridItem';
import { LibrarySorting } from '../../library/states';
import { LibraryViewMode } from '../../rxdb';
import { BookListListItem } from './BookListListItem';

export const BookList: FC<{
  viewMode?: 'grid' | 'list',
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  sorting?: LibrarySorting,
  isHorizontal?: boolean,
  style?: React.CSSProperties,
  itemWidth?: number,
  data: string[],
  density?: 'dense' | 'large',
  onItemClick?: (id: string) => void,
  withDrawerActions?: boolean
}> = ({ viewMode = 'grid', renderHeader, headerHeight, density = 'large', isHorizontal = false, style, data, itemWidth, onItemClick, withDrawerActions }) => {
  const windowSize = useWindowSize()
  const classes = useStyles({ isHorizontal, windowSize });
  const hasHeader = !!renderHeader
  const theme = useTheme()
  const listData = useMemo(() => {
    if (hasHeader) return ['header' as const, ...data]
    else return data
  }, [data, hasHeader])
  const itemsPerRow = viewMode === 'grid'
    ? windowSize.width > theme.breakpoints.values['sm'] ? 4 : 2
    : 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const densityMultiplier = density === 'dense' ? 0.8 : 1
  const listItemMargin = (windowSize.width > theme.breakpoints.values['sm'] ? 20 : 10) * densityMultiplier
  const itemHeight = viewMode === LibraryViewMode.GRID
    ? undefined
    : (((windowSize.width > theme.breakpoints.values['sm'] ? 200 : 150) * theme.custom.coverAverageRatio) + listItemMargin) * densityMultiplier
  type ListDataItem = (typeof listData)[number]

  const rowRenderer = useCallback((type, item: ListDataItem) => {
    if (item === 'header') {
      if (renderHeader) return renderHeader()
      return null
    }

    return viewMode === LibraryViewMode.GRID
      ? <BookListGridItem bookId={item} />
      : (
        <Box display="flex" alignItems="center" flex={1}>
          <BookListListItem
            bookId={item}
            itemHeight={(itemHeight || 0) - listItemMargin}
            onItemClick={onItemClick}
            withDrawerActions={withDrawerActions}
          />
        </Box>
      )
  }, [renderHeader, viewMode, itemHeight, listItemMargin, onItemClick, withDrawerActions])

  return (
    <div className={classes.container} style={style}>
      <ItemList
        data={listData}
        rowRenderer={rowRenderer as any}
        itemsPerRow={itemsPerRow}
        // only used when grid layout
        preferredRatio={adjustedRatioWhichConsiderBottom}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        isHorizontal={isHorizontal}
        itemWidth={itemWidth}
        // only used when list layout
        itemHeight={itemHeight}
      />
    </div>
  )
}

const useStyles = makeStyles((theme) => {
  type Props = { isHorizontal: boolean, windowSize: { width: number } }

  return {
    container: {
      paddingLeft: (props: Props) => props.isHorizontal ? 0 : theme.spacing(1),
      paddingRight: (props: Props) => props.isHorizontal ? 0 : theme.spacing(1),
      display: 'flex',
    },
  }
})