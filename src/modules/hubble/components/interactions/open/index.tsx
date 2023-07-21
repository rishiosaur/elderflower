import { HubbleInteractionComponent } from "../index";
import { motion } from "framer-motion";
import styles from "./index.module.css";
export const HubbleInteractionOpen: HubbleInteractionComponent<{}> = ({
  children,
  open,
  toggle,
}) => {
  return (
    <motion.span
      className={open ? "" : styles.to}
      whileHover={!open ? { opacity: 0.5, cursor: "pointer" } : {}}
      onClick={() => {
        // if (!open) {
        toggle();
        // }
      }}
    >
      {children}
    </motion.span>
  );
};
