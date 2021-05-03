import { Subject } from "rxjs";
import { Context } from "./context";
import { Pagination } from "./pagination";
import { Manifest } from "./types";
export declare type ReadingOrderView = ReturnType<typeof createReadingOrderView>;
export declare const createReadingOrderView: ({ manifest, containerElement, context, pagination, options }: {
    manifest: Manifest;
    containerElement: HTMLElement;
    context: Context;
    pagination: Pagination;
    options: {
        fetchResource: "http" | ((item: Manifest['readingOrder'][number]) => Promise<string>);
    };
}) => {
    goToNextSpineItem: () => void;
    goToPreviousSpineItem: () => void;
    load: () => void;
    layout: () => void;
    getFocusedReadingItem: () => {
        getBoundingClientRect: () => DOMRect;
        loadContent: () => Promise<void>;
        unloadContent: () => Promise<void>;
        layout: () => {
            width: number;
            height: number;
            x: number;
        };
        fingerTracker: {
            track: (frame: HTMLIFrameElement) => void;
            getFingerPositionInIframe(): {
                x: number;
                y: number;
            } | undefined;
            destroy: () => void;
            $: import("rxjs").Observable<{
                event: "fingermove";
                data: {
                    x: number;
                    y: number;
                };
            } | {
                event: "fingerout";
                data: undefined;
            }>;
        };
        selectionTracker: {
            track: (frameToTrack: HTMLIFrameElement) => void;
            destroy: () => void;
            isSelecting: () => boolean;
            getSelection: () => Selection | undefined;
            $: import("rxjs").Observable<{
                event: "selectionchange" | "selectstart" | "selectend";
                data: Selection | null | undefined;
            }>;
        };
        destroy: () => void;
        load: () => void;
        adjustPositionOfElement: (edgeOffset: number | undefined) => void;
        createWrapperElement: (containerElement: HTMLElement, item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        }) => HTMLDivElement;
        createLoadingElement: (containerElement: HTMLElement, item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        }) => HTMLDivElement;
        injectStyle: (readingItemFrame: {
            getIsReady(): boolean;
            getViewportDimensions: () => {
                width: number;
                height: number;
            } | undefined;
            getIsLoaded: () => boolean;
            load: () => Promise<unknown>;
            unload: () => void;
            staticLayout: (size: {
                width: number;
                height: number;
            }) => void;
            getFrameElement: () => HTMLIFrameElement | undefined;
            removeStyle: (id: string) => void;
            addStyle(id: string, style: string, prepend?: boolean): void;
            getReadingDirection: () => "ltr" | "rtl" | undefined;
            destroy: () => void;
            $: Subject<{
                event: "domReady";
                data: HTMLIFrameElement;
            } | {
                event: "layout";
                data: {
                    isFirstLayout: boolean;
                    isReady: boolean;
                };
            }>;
        }, cssText: string) => void;
        getCfi: (pageIndex: number) => string;
        readingItemFrame: {
            getIsReady(): boolean;
            getViewportDimensions: () => {
                width: number;
                height: number;
            } | undefined;
            getIsLoaded: () => boolean;
            load: () => Promise<unknown>;
            unload: () => void;
            staticLayout: (size: {
                width: number;
                height: number;
            }) => void;
            getFrameElement: () => HTMLIFrameElement | undefined;
            removeStyle: (id: string) => void;
            addStyle(id: string, style: string, prepend?: boolean): void;
            getReadingDirection: () => "ltr" | "rtl" | undefined;
            destroy: () => void;
            $: Subject<{
                event: "domReady";
                data: HTMLIFrameElement;
            } | {
                event: "layout";
                data: {
                    isFirstLayout: boolean;
                    isReady: boolean;
                };
            }>;
        };
        element: HTMLDivElement;
        loadingElement: HTMLDivElement;
        resolveCfi: (cfiString: string | undefined) => {
            node: Node | undefined;
            offset: number;
        } | undefined;
        getFrameLayoutInformation: () => DOMRect | undefined;
        getViewPortInformation: () => {
            computedScale: number;
            viewportDimensions: {
                width: number;
                height: number;
            };
        } | undefined;
        isContentReady: () => boolean;
        getReadingDirection: () => "ltr" | "rtl";
        getIsReady: () => boolean;
        $: Subject<{
            event: "selectionchange" | "selectstart";
            data: Selection;
        } | {
            event: "layout";
            data: {
                isFirstLayout: boolean;
                isReady: boolean;
            };
        }>;
        item: {
            id: string;
            href: string;
            path: string;
            renditionLayout: "reflowable" | "pre-paginated";
            progressionWeight: number;
        };
    } | undefined;
    getChapterInfo(): import("./navigation").ChapterInfo | undefined;
    getSpineItemIndex(): number | undefined;
    destroy: () => void;
    isSelecting: () => boolean | undefined;
    getSelection: () => Selection | undefined;
    $: Subject<unknown>;
    adjustOffset: (offset: number) => void;
    getCurrentOffset: () => number;
    turnLeft: ({ allowReadingItemChange }?: {
        allowReadingItemChange?: boolean | undefined;
    }) => void;
    turnRight: ({ allowReadingItemChange }?: {
        allowReadingItemChange?: boolean | undefined;
    }) => void;
    goTo: (spineIndexOrIdOrCfi: string | number) => void;
    goToPageOfCurrentChapter: (pageIndex: number) => void;
    adjustReadingOffsetPosition: ({ shouldAdjustCfi }: {
        shouldAdjustCfi: boolean;
    }) => void;
};
