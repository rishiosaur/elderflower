import { HubbleCollapseComponent, HubbleCollapses } from "../index";
import { HTMLMotionProps, motion, MotionProps } from "framer-motion";
import styles from "./index.module.css";
export const HubbleCollapseInline: HubbleCollapseComponent = ({
  children,
  open,
  type,
}) => {
  const [condition, props] = {
    [HubbleCollapses.CloseOn]: [
      !open,
      {
        initial: {
          opacity: 1,
        },
        exit: {
          opacity: 0,
        },
      } as HTMLMotionProps<"span">,
    ],
    [HubbleCollapses.OpenOn]: [
      open,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      } as HTMLMotionProps<"span">,
    ],
  }[type] as [boolean, HTMLMotionProps<"span">];
  return condition ? (
    <motion.span layout transition={{ ease: "easeIn" }} {...props}>
      {children}
    </motion.span>
  ) : (
    <></>
  );
};
