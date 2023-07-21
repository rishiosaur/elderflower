import { HubbleInteractionComponent } from "../index";
import { motion } from "framer-motion";
import styles from "./index.module.css";
export const HubbleInteractionToggle: HubbleInteractionComponent<{}> = ({
  children,
  open,
}) => {
  return (
    <span
      style={{
        display: "inline",
        position: "relative",
      }}
    >
      <motion.span
        className={styles.to}
        whileHover={true ? { opacity: 0.5, cursor: "pointer" } : {}}
        onClick={() => {}}
      >
        {children}
      </motion.span>
      <span
        style={{
          width: "5px",
          height: "5px",
          backgroundColor: "var(--accent-color)",
          borderRadius: "100%",
          right: 0,
          top: 0,
          position: "absolute",
          zIndex: 2,
        }}
      />
    </span>
  );
};
