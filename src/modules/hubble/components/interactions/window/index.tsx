import { HubbleInteractionComponent } from "../index";
import { motion } from "framer-motion";
import styles from "./index.module.css";
import {
  BaguetteSize,
  useBakery,
} from "../../../../baguette/components/base/index";
import { FiMusic } from "react-icons/fi";
import {
  BaguetteTypes,
  Baguette,
} from "../../../../baguette/components/base/index";
import { useMemo, useState } from "react";
export const HubbleInteractionWindow: HubbleInteractionComponent<
  Partial<Baguette<any>>
> = ({ children, open, toggle, arguments: args, node }) => {
  const manager = useBakery();
  const windowId = args.id || node.data.interaction.id;
  const windowOpen = useMemo(() => {
    return manager.open(args.id || node.data.interaction.id);
  }, [args.id, manager, node.data.interaction.id]);
  const window = useMemo(() => {
    return manager.panel(windowId);
  }, [manager, windowId]);

  return (
    <motion.span
      initial={false}
      style={{
        outline: "1px solid var(--accent-color)",
        padding: "0.1rem",
        backgroundColor: "var(--bg-color)",
        position: "relative",
        ...(window?.selected
          ? {
              backgroundColor: "var(--accent-color)",
              userSelect: "none",
              cursor: "pointer",
            }
          : {}),
      }}
      whileHover={{
        backgroundColor: "var(--accent-color)",
        userSelect: "none",
        cursor: "pointer",
      }}
      // whileTap={{
      //   opacity: 0.5,
      // }}
      onClick={() => {
        manager.toggle({
          w: BaguetteSize.Third,
          h: BaguetteSize.Third,
          args: {},
          type: BaguetteTypes.Markdown,
          id: node.data.interaction.id as string,
          selected: false,
          ...args,
        });

        if (open == windowOpen) {
          toggle();
        }
      }}
    >
      {children}
      <motion.span
        style={{
          height: "0.3rem",
          position: "absolute",
          width: "0.3rem",
          top: 0,
          right: 0,
          borderLeft: "1px solid var(--accent-color)",
          borderBottom: "1px solid var(--accent-color)",
          ...(windowOpen
            ? {
                backgroundColor: "var(--accent-color)",
              }
            : {
                backgroundColor: "var(--bg-color)",
              }),
        }}
      />
    </motion.span>
  );
};
