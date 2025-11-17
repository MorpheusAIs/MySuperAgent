import * as React from 'react';
/**
 * @since 3.4
 */
export interface ZIndexable {
    /**
     * Z-Index of this component and its children. The higher the value,
     * the more on top it will be rendered.
     * Components with higher zIndex will appear in front of components with lower zIndex.
     * @since 3.4
     * @defaultValue 0
     */
    zIndex?: number;
}
type ZIndexLayerProps = {
    /**
     * Numeric zIndex value, higher values are rendered on top of lower values.
     * If undefined or 0, the content is rendered in the default layer without portals.
     */
    zIndex: number | undefined;
    /**
     * The content to render inside this zIndex layer.
     * Undefined children are allowed and will render nothing and will still report the zIndex to the portal system.
     */
    children?: React.ReactNode;
};
/**
 * A layer that renders its children into a portal corresponding to the given zIndex.
 * We can't use regular CSS z-index because SVG does not support it.
 * So instead, we create separate DOM nodes for each zIndex layer
 * and render the children into the corresponding DOM node using React portals.
 *
 * This component must be used inside a Chart component.
 *
 * @param zIndex numeric zIndex value, higher values are rendered on top of lower values
 * @param children the content to render inside this zIndex layer
 */
export declare function ZIndexLayer({ zIndex, children }: ZIndexLayerProps): React.ReactNode;
export {};
