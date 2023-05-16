import { FC, LabelHTMLAttributes, ReactElement, ReactNode } from 'react';
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    /**
     * The label to apply to any form element.
     */
    label: ReactNode;
    /**
     * Provide a string specifying that this field is optional.
     */
    optionalText?: string;
    /**
     * Pass a child element which can accept an `id` prop. If you don't specify
     * the `id` prop, one will be generated to link the label to the element. If
     * you wish to link this label to a form field without passing children, you
     * should specify the `htmlFor` prop with the `id` of your form field.
     */
    children?: ReactElement;
}
export declare const Label: FC<LabelProps>;
