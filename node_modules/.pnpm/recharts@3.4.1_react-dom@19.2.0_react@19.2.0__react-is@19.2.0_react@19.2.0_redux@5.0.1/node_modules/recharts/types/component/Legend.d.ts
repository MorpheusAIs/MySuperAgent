import * as React from 'react';
import { CSSProperties } from 'react';
import { LegendPayload, Props as DefaultProps } from './DefaultLegendContent';
import { UniqueOption } from '../util/payload/getUniqPayload';
import { ElementOffset } from '../util/useElementOffset';
export type LegendItemSorter = 'value' | 'dataKey' | ((item: LegendPayload) => number | string);
export type Props = Omit<DefaultProps, 'payload' | 'ref'> & {
    wrapperStyle?: CSSProperties;
    width?: number;
    height?: number;
    payloadUniqBy?: UniqueOption<LegendPayload>;
    onBBoxUpdate?: (box: ElementOffset | null) => void;
    /**
     * If portal is defined, then Legend will use this element as a target
     * for rendering using React Portal: https://react.dev/reference/react-dom/createPortal
     *
     * If this is undefined then Legend renders inside the recharts-wrapper element.
     */
    portal?: HTMLElement | null;
    /**
     * Sorts Legend items. Defaults to `value` which means it will sort alphabetically
     * by the label.
     *
     * If `null` is provided then the payload is not sorted. Be aware that without sort,
     * the order of items may change between renders!
     */
    itemSorter?: LegendItemSorter | null;
};
export declare function Legend(outsideProps: Props): React.ReactPortal | null;
export declare namespace Legend {
    var displayName: string;
}
