import React, { useMemo, FC, ComponentProps, useRef, useState } from 'react'
import { useScrollbarWidth, useMeasure } from 'react-use';
import { RecyclerListView, DataProvider, LayoutProvider } from "recyclerlistview/web";
import { ArrowBackIosRounded, ArrowForwardIosRounded, ExpandMoreRounded, ExpandLessRounded } from '@material-ui/icons';
import { TOnItemStatusChanged } from 'recyclerlistview/dist/web/core/ViewabilityTracker';
import { ScrollEvent } from 'recyclerlistview/dist/web/core/scrollcomponent/BaseScrollView';
import { makeStyles } from '@material-ui/core';

//Create the data provider and provide method which takes in two rows of data and return if those two are different or not.
//THIS IS VERY IMPORTANT, FORGET PERFORMANCE IF THIS IS MESSED UP
const initialDataProvider = new DataProvider((r1, r2) => {
  return r1 !== r2;
})

// export const useItemListLayoutProvider = (
//   getLayoutTypeForIndex?: (index: number) => string | number
// ) => (itemWidth: number, itemHeight: number) => {
//   //Create the layout provider
//   //First method: Given an index return the type of item e.g ListItemType1, ListItemType2 in case you have variety of items in your list/grid
//   //Second: Given a type and object set the exact height and width for that type on given object, if you're using non deterministic rendering provide close estimates
//   //If you need data based check you can access your data provider here
//   //You'll need data in most cases, we don't provide it by default to enable things like data virtualization in the future
//   //NOTE: For complex lists LayoutProvider will also be complex it would then make sense to move it to a different file
//   return new LayoutProvider(
//     index => 1,
//     (type, dim) => {
//       dim.width = itemWidth
//       dim.height = itemHeight
//     }
//   ), [itemWidth, itemHeight]
// }

export const ItemList: FC<{
  rowRenderer: ComponentProps<typeof RecyclerListView>['rowRenderer'],
  isHorizontal: ComponentProps<typeof RecyclerListView>['isHorizontal'],
  data: any[],
  itemsPerRow: number,
  preferredRatio: number,
  className?: string,
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  itemWidth?: number,
}> = ({ rowRenderer, data, itemsPerRow, preferredRatio = 1, className, renderHeader, headerHeight, isHorizontal, itemWidth }) => {
  const classes = useClasses()
  const sbw = useScrollbarWidth() || 0;
  const listRef = useRef<RecyclerListView<any, any>>()
  const [ref, { width }] = useMeasure();
  const [visibleIndices, setVisibleIndices] = useState([0])
  const [offsetY, setOffsetY] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [endReached, setEndReached] = useState(false)
  const maxWidth = (width - sbw)
  const hasHeader = !!renderHeader
  const computedItemWidth = itemWidth ? itemWidth : maxWidth / itemsPerRow
  const itemHeight = computedItemWidth / preferredRatio
  const displayScrollerButtons = hasHeader ? data.length > 1 : data.length > 0

  //Create the layout provider
  //First method: Given an index return the type of item e.g ListItemType1, ListItemType2 in case you have variety of items in your list/grid
  //Second: Given a type and object set the exact height and width for that type on given object, if you're using non deterministic rendering provide close estimates
  //If you need data based check you can access your data provider here
  //You'll need data in most cases, we don't provide it by default to enable things like data virtualization in the future
  //NOTE: For complex lists LayoutProvider will also be complex it would then make sense to move it to a different file
  const layoutProvider = useMemo(() => new LayoutProvider(
    index => hasHeader && index === 0 ? 'header' : 'item',
    (type, dim) => {
      switch (type) {
        case 'header': {
          dim.width = maxWidth
          dim.height = headerHeight || 0
          break
        }
        default: {
          dim.width = computedItemWidth
          dim.height = itemHeight
        }
      }
    }
  ), [computedItemWidth, itemHeight, hasHeader, headerHeight, maxWidth])

  const onVisibleIndicesChanged: TOnItemStatusChanged = (indices: number[]) => {
    setVisibleIndices(indices)
    console.log('onVisibleIndicesChanged', visibleIndices)
  }

  const offsets = isHorizontal
    ? data.map((_, i) => Math.floor(listRef?.current?.getLayout(i)?.x || 0))
    : data.map((_, i) => Math.floor(listRef?.current?.getLayout(i)?.y || 0))

  const onScroll = (rawEvent: ScrollEvent, x: number, y) => {
    // setOffsetY(rawEvent.nativeEvent.contentOffset.y)
    // setOffsetX(rawEvent.nativeEvent.contentOffset.x)
    // if (endReached) {
    //   setEndReached(false)
    // }
    // if (rawEvent.nativeEvent.contentOffset.y >= offsets[offsets.length - 1])
  }

  const dataProvider = useMemo(() => initialDataProvider.cloneWithRows(data), [data])

  const onExpandMoreClick = () => {
    const offset = listRef?.current?.getCurrentScrollOffset()
    if (offset !== undefined) {
      const nextIndexOffset = offsets.find(o => o > offset)
      if (nextIndexOffset) {
        if (isHorizontal) {
          listRef?.current?.scrollToOffset(nextIndexOffset, 0, false)
        } else {
          listRef?.current?.scrollToOffset(0, nextIndexOffset, false)
        }
      }
    }
  }

  const onExpandLessClick = () => {
    const firstIndex = listRef?.current?.findApproxFirstVisibleIndex()
    if (firstIndex !== undefined && firstIndex > 0) {
      setEndReached(false)
      listRef?.current?.scrollToIndex(firstIndex - 1, false)
    }
  }

  return (
    <div style={{ display: 'flex', height: 1, flexGrow: 1, flex: 1, position: 'relative' }} className={className} ref={ref as any}>
      {data.length > 0 && (
        <RecyclerListView
          ref={listRef as any}
          layoutProvider={layoutProvider}
          dataProvider={dataProvider}
          rowRenderer={rowRenderer}
          onScroll={onScroll}
          onVisibleIndicesChanged={onVisibleIndicesChanged}
          // onEndReached={() => setEndReached(true)}
          render
          isHorizontal={isHorizontal}
          scrollViewProps={{
            showsVerticalScrollIndicator: false,
            useWindowScroll: false,
            style: {
              width: '100%',
              // backgroundColor: 'red'
            }
          }}
        />
      )}
      {displayScrollerButtons && (
        <>
          {!isHorizontal && (
            <div
              className={`${classes.verticalScrollButton} ${classes.verticalScrollButtonLess}`}
              onClick={onExpandLessClick}
            >
              <ExpandLessRounded style={{ color: 'white' }} />
            </div>
          )}
          {!isHorizontal && (
            <div
              className={`${classes.verticalScrollButton} ${classes.verticalScrollButtonMore}`}
              onClick={onExpandMoreClick}
            >
              <ExpandMoreRounded style={{ color: 'white' }} />
            </div>
          )}
          {isHorizontal && (
            <div
              style={{
                position: 'absolute',
                left: 5,
              }}
              className={classes.horizontalButton}
              onClick={onExpandLessClick}
            >
              <ArrowBackIosRounded style={{ color: 'white' }} />
            </div>
          )}
          {isHorizontal && (
            <div
              style={{
                position: 'absolute',
                right: 5,
              }}
              className={classes.horizontalButton}
              onClick={onExpandMoreClick}
            >
              <ArrowForwardIosRounded style={{ color: 'white' }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

const useClasses = makeStyles((theme) => {
  type Props = { isHorizontal: boolean, windowSize: { width: number } }

  return {
    verticalScrollButton: {
      position: 'absolute',
      padding: '10px 20px 10px 20px',
      width: 40,
      backgroundColor: 'gray',
      opacity: 0.7,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      bottom: theme.spacing(1),
      display: 'flex',
    },
    verticalScrollButtonMore: {
      right: theme.spacing(1),
    },
    verticalScrollButtonLess: {
      left: theme.spacing(1),
    },
    horizontalButton: {
      padding: theme.spacing(1),
      backgroundColor: 'gray',
      opacity: 0.5,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'translateY(-50%)',
      top: '50%',
      display: 'flex',
      flexFlow: 'column',
    }
  }
})