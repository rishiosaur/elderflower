import { PropsWithChildren } from "react";
import { useOpen, useToggle } from "../../stores/index";

import { HubbleCollapseInline } from "./inline/index";
import { HubbleCollapsePanel } from "./panel";

export enum HubbleCollapses {
  OpenOn = "p",
  CloseOn = "c",
}

export type HubbleCollapseComponent = React.FC<
  PropsWithChildren<{
    open: boolean;
    type: HubbleCollapses;
  }>
>;

export const HubbleCollapse: React.FC<
  PropsWithChildren<{
    type: HubbleCollapses;
    open: boolean;

    inline: boolean;
  }>
> = ({ type, open, inline, children }) => {
  const Component = inline ? HubbleCollapseInline : HubbleCollapsePanel;

  return (
    <Component type={type} open={open}>
      {children}
    </Component>
  );
};
