import * as React from 'react';
import { ReactElement } from 'react';
import { ImplicitLabelType } from '../component/Label';
import { IfOverflow } from '../util/IfOverflow';
import { Props as RectangleProps } from '../shape/Rectangle';
import { ZIndexable } from '../zIndex/ZIndexLayer';
interface ReferenceAreaProps extends ZIndexable {
    ifOverflow?: IfOverflow;
    x1?: number | string;
    x2?: number | string;
    y1?: number | string;
    y2?: number | string;
    className?: number | string;
    yAxisId?: number | string;
    xAxisId?: number | string;
    shape?: ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>);
    label?: ImplicitLabelType;
}
export type Props = RectangleProps & ReferenceAreaProps;
export declare function ReferenceArea(outsideProps: Props): React.JSX.Element;
export declare namespace ReferenceArea {
    var displayName: string;
}
export {};
