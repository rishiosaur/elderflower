import { PropsWithChildren } from "react";
import { HubbleInteractionOpen } from "./open";
import { HubbleInteractionToggle } from "./toggle/index";
import { HubbleInteractionWindow } from "./window/index";

export enum HubbleInteractions {
  Open = "o",
  Toggle = "t",
  Window = "w",
}

export type HubbleInteractionComponent<T> = React.FC<
  PropsWithChildren<{
    open: boolean;
    toggle: () => void;
    arguments: T;
    node: any;
  }>
>;

export const HubbleInteraction: React.FC<
  PropsWithChildren<{
    type: HubbleInteractions;
    open: boolean;
    toggle: () => void;
    arguments: any;
    node: any;
  }>
> = ({ type, toggle, open, node, children, arguments: args }) => {
  const Component = {
    [HubbleInteractions.Open]: HubbleInteractionOpen,
    [HubbleInteractions.Window]: HubbleInteractionWindow,
    [HubbleInteractions.Toggle]: HubbleInteractionToggle,
  }[type] as HubbleInteractionComponent<any>;
  return (
    <Component
      arguments={JSON.parse(args || "{}")}
      open={open}
      toggle={toggle}
      node={node}
    >
      {children}
    </Component>
  );
};
