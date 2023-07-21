import { m, motion } from "framer-motion";
import {
  BaguetteComponent,
  BaguetteDisplay,
  BaguetteSize,
  BaguetteTypes,
  useBakery,
} from "../../base";
import {
  childVariants,
  topVariants,
} from "../../../../hubble/components/markdown/index";
import { FiFileText, FiHome, FiMessageCircle, FiMusic } from "react-icons/fi";
import { useState } from "react";

export const CoverBaguette: BaguetteComponent<BaguetteTypes.Cover> = (
  props
) => {
  const image = props.notion.cover.file.url;
  const title = props.notion.properties.Name.title[0].text.content;
  const description =
    props.notion.properties.Description.rich_text[0].text.content;
  const playlist = props.notion.properties.Playlist.rich_text[0].text.content;

  const manager = useBakery();
  return (
    <motion.div
      style={{
        backgroundImage: `url("${image}")`,
        objectFit: "cover",

        width: "calc(100% + 2rem)",
        height: "calc(100% + 2rem)",
        margin: "-1rem",
        position: "relative",
        backgroundOrigin: "center",
        backgroundSize: "cover",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "0.7em",
          textAlign: "center",
        }}
      >
        <h1>{title}</h1>
        <p>{description}</p>
        <motion.div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.2em",
          }}
          variants={topVariants}
        >
          <motion.div
            variants={childVariants}
            style={{
              border: "1px solid var(--main-color)",
              width: "1.5em",
              height: "1.5em",
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "0",
            }}
            whileHover={{
              backgroundColor: "var(--accent-color)",
              cursor: "pointer",
              userSelect: "none",
            }}
            whileTap={{
              opacity: 0.5,
            }}
          >
            <motion.span
              style={{
                fontSize: "medium",
              }}
            >
              <FiHome />
            </motion.span>
          </motion.div>
          <motion.div
            variants={childVariants}
            style={{
              border: "1px solid var(--main-color)",
              width: "1.5em",
              height: "1.5em",
              display: "flex",
              flexDirection: "column",
              borderRadius: "4px",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "0",
            }}
            whileHover={{
              backgroundColor: "var(--accent-color)",
              cursor: "pointer",
              userSelect: "none",
            }}
            whileTap={{
              opacity: 0.5,
            }}
          >
            <motion.span
              style={{
                fontSize: "medium",
              }}
            >
              <FiFileText />
            </motion.span>
          </motion.div>
          <motion.div
            variants={childVariants}
            style={{
              border: "1px solid var(--main-color)",
              width: "1.5em",
              height: "1.5em",
              display: "flex",
              flexDirection: "column",
              //   gap: "10px",
              borderRadius: "4px",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "0",
            }}
            whileHover={{
              backgroundColor: "var(--accent-color)",
              cursor: "pointer",
              userSelect: "none",
            }}
            whileTap={{
              opacity: 0.5,
            }}
            onClick={() => {
              manager.toggle({
                type: BaguetteTypes.SpotifyPlaylist,
                w: BaguetteSize.Three,
                h: BaguetteSize.Three,
                args: {
                  id: playlist,
                },
                id: "rec-playlist",
                display: BaguetteDisplay.Base,
              });
            }}
          >
            <motion.span
              style={{
                fontSize: "medium",
              }}
            >
              <FiMusic />
            </motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
