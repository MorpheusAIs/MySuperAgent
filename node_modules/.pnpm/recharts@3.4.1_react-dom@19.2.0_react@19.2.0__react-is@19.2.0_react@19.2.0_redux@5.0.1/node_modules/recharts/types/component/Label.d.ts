import * as React from 'react';
import { ReactElement, ReactNode, SVGProps } from 'react';
import { RenderableText, TextAnchor, TextVerticalAnchor } from './Text';
import { DataKey, Percent, PolarViewBoxRequired, TrapezoidViewBox, ViewBox } from '../util/types';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export type LabelContentType = ReactElement | ((props: Props) => RenderableText | ReactElement);
type CartesianLabelPosition = 'top' | 'left' | 'right' | 'bottom' | 'inside' | 'outside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight' | 'insideStart' | 'insideEnd' | 'end' | 'center' | 'centerTop' | 'centerBottom' | 'middle' | {
    x?: number | Percent;
    y?: number | Percent;
};
type PolarLabelPosition = 'insideStart' | 'insideEnd' | 'end';
export type LabelPosition = CartesianLabelPosition | PolarLabelPosition;
export type LabelFormatter = (label: RenderableText) => RenderableText;
interface LabelProps extends ZIndexable {
    viewBox?: ViewBox;
    parentViewBox?: ViewBox;
    formatter?: LabelFormatter;
    value?: RenderableText;
    offset?: number;
    position?: LabelPosition;
    children?: RenderableText;
    className?: string;
    content?: LabelContentType;
    textBreakAll?: boolean;
    angle?: number;
    index?: number;
    labelRef?: React.RefObject<SVGTextElement> | null;
}
export type Props = Omit<SVGProps<SVGTextElement>, 'viewBox'> & LabelProps;
export type ImplicitLabelType = boolean | string | number | ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | (Props & {
    dataKey?: DataKey<any>;
});
export declare const CartesianLabelContextProvider: ({ x, y, upperWidth, lowerWidth, width, height, children, }: TrapezoidViewBox & {
    children: ReactNode;
}) => React.JSX.Element;
export declare const PolarLabelContextProvider: ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, clockWise, children, }: PolarViewBoxRequired & {
    children: ReactNode;
}) => React.JSX.Element;
export declare const usePolarLabelContext: () => PolarViewBoxRequired | undefined;
export declare const isLabelContentAFunction: (content: unknown) => content is (props: Props) => React.ReactNode;
export type CartesianLabelPositionInput = {
    parentViewBox?: ViewBox;
    offset: number;
    position?: CartesianLabelPosition;
};
export type LabelPositionAttributes = {
    x: number;
    y: number;
    textAnchor: TextAnchor;
    verticalAnchor: TextVerticalAnchor;
    width?: number;
    height?: number;
};
export declare const getAttrsOfCartesianLabel: (props: CartesianLabelPositionInput, viewBox: TrapezoidViewBox) => LabelPositionAttributes;
export declare function Label(outerProps: Props): React.JSX.Element | null;
export declare namespace Label {
    var displayName: string;
}
export declare function CartesianLabelFromLabelProp({ label, labelRef, }: {
    label: ImplicitLabelType | undefined;
    labelRef?: React.RefObject<SVGTextElement> | null;
}): React.JSX.Element | null;
export declare function PolarLabelFromLabelProp({ label }: {
    label: ImplicitLabelType | undefined;
}): React.JSX.Element | null;
export {};
