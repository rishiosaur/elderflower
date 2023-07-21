import { HubbleCollapseComponent, HubbleCollapses } from "../index";
import { HTMLMotionProps, motion, MotionProps } from "framer-motion";
import styles from "./index.module.css";
import { memo, useEffect } from "react";
export const HubbleCollapsePanel: HubbleCollapseComponent = memo(
  ({ children, open, type }) => {
    const [condition, props] = {
      [HubbleCollapses.CloseOn]: [
        !open,
        {
          initial: "visible",
          exit: "hidden",
        } as HTMLMotionProps<"div">,
      ],
      [HubbleCollapses.OpenOn]: [
        open,
        {
          initial: "hidden",
          whileInView: "visible",
        } as HTMLMotionProps<"div">,
      ],
    }[type] as [boolean, HTMLMotionProps<"div">];
    return (
      <motion.div
        layout
        transition={{ ease: "easeIn" }}
        viewport={{ once: true }}
        variants={{
          visible: {},
          hidden: {},
        }}
        {...props}
      >
        {condition ? children : <></>}
      </motion.div>
    );
  },
  (e, a) => {
    return true;
  }
);
