import {
  HubbleMarkdown,
  childVariants,
  topVariants,
} from "@/modules/hubble/components/markdown";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import {
  BaguetteArgs,
  BaguetteTypes,
  BaguetteComponent,
} from "../../base/index";
import useSWR from "swr";
import { fetcher } from "@/modules/shared/services/fetching";
import { useEffect, useMemo } from "react";
import {
  FiClock,
  FiDisc,
  FiHeart,
  FiMusic,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import styles from "./playlist.module.css";
import { Grid } from "react-loading-icons";
import { useRouter } from "next/router";

export const SpotifyPlaylistBaguette: BaguetteComponent<
  BaguetteTypes.SpotifyPlaylist
> = ({ id }) => {
  const { data, error } = useSWR(`/api/spotify/playlist/${id}`, fetcher);

  const router = useRouter();

  return data ? (
    <motion.div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        padding: "1rem",
      }}
      variants={topVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        whileHover={{
          cursor: "pointer",
          userSelect: "none",
          opacity: 0.5,
        }}
        style={{
          opacity: 1,
        }}
        onTap={() => {
          router.push(data?.external_urls?.spotify);
        }}
        whileTap={{
          opacity: 0.5,
        }}
      >
        <motion.div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            alignItems: "center",
          }}
          variants={topVariants}
        >
          <motion.div variants={childVariants}>
            <motion.img
              style={{
                height: "8rem",
                width: "8rem",
                borderRadius: "4px",
                outline: "2px solid var(--accent-color)",
              }}
              src={data?.images[0].url}
            />
          </motion.div>

          <motion.div>
            <motion.div
              style={{
                display: "inline-flex",
                gap: "0.5rem",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.div
                style={{
                  display: "inline-flex",
                  padding: "2px",
                  borderRadius: "2px",
                  gap: "0.25rem",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {data?.collaborative ? (
                  <FiUsers
                    style={{ fontStyle: "italic", fontSize: "0.85rem" }}
                  />
                ) : (
                  <FiUser
                    style={{ fontStyle: "italic", fontSize: "0.85rem" }}
                  />
                )}

                <motion.span
                  style={{ fontStyle: "italic", fontSize: "0.85rem" }}
                >
                  {data?.owner?.display_name}
                </motion.span>
              </motion.div>

              <motion.span>•</motion.span>

              <motion.div
                style={{
                  display: "inline-flex",
                  padding: "2px",
                  borderRadius: "2px",
                  gap: "0.25rem",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiHeart style={{ fontStyle: "italic", fontSize: "0.85rem" }} />

                <motion.span
                  style={{ fontStyle: "italic", fontSize: "0.85rem" }}
                >
                  {data?.followers?.total} follower
                  {data?.followers?.total > 1 || data?.followers?.total === 0
                    ? "s"
                    : ""}
                </motion.span>
              </motion.div>
            </motion.div>
            <h2 style={{ paddingTop: "0.4rem", margin: 0 }}>{data?.name}</h2>
            {data?.description && <motion.p>{data?.description}</motion.p>}
          </motion.div>
        </motion.div>
      </motion.div>
      {data?.tracks?.items.map((it, i) => {
        return (
          <motion.div variants={childVariants} key={i} layout>
            <motion.div
              whileHover={{
                cursor: "pointer",
                outline: "1px solid var(--accent-color)",
                borderRadius: "2px",
                userSelect: "none",
              }}
              style={{
                display: "grid",
                gridTemplateColumns: "3rem repeat(15, 1fr)",
                gridTemplateRows: "3rem",
                columnGap: "0.5rem",
                overflow: "none",
                alignItems: "center",
              }}
              whileTap={{
                opacity: 0.5,
                transition: {
                  delay: 0,
                  delayChildren: 0,
                },
              }}
              onTap={(e) => {
                router.push(it.track?.external_urls?.spotify);
              }}
            >
              <motion.img
                src={it.track?.album?.images[0].url}
                style={{
                  height: "2.5rem",
                  width: "2.5rem",
                  gridArea: "1/1",
                  borderRadius: "2px",
                  alignSelf: "center",
                  justifySelf: "center",
                }}
              />
              <motion.div
                style={{
                  gridArea: "1 / 2 / 2 / 9",
                  display: "flex",
                  height: "100%",
                  alignSelf: "center",
                  alignContent: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  textOverflow: "ellipsis",
                }}
              >
                <motion.h4
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: "smaller",
                  }}
                >
                  {it.track?.name}
                </motion.h4>
                <motion.p
                  style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    fontSize: "0.7rem",
                    whiteSpace: "nowrap",
                    gap: "0.2rem",
                    opacity: 0.8,
                    fontStyle: "italic",
                    lineHeight: "0.3em",
                  }}
                >
                  {it.track?.artists.map((at, idx) => {
                    return (
                      <>
                        <motion.span>{at.name}</motion.span>
                        <motion.span>
                          {idx < it.track?.artists.length - 1 && "+"}
                        </motion.span>
                      </>
                    );
                  })}
                </motion.p>
              </motion.div>
              <motion.div
                style={{
                  gridArea: "1 / 11 / 6 / 15",
                  display: "flex",
                  fontSize: "0.7rem",
                  flexDirection: "row",
                  textOverflow: "ellipsis",
                  alignItems: "center",
                  gap: "0.2rem",
                  overflow: "hidden",
                  lineHeight: 0,
                }}
              >
                <motion.p
                  style={{
                    whiteSpace: "nowrap",
                    opacity: 0.8,
                    fontStyle: "italic",
                    overflow: "hidden",
                    top: "3px",
                  }}
                >
                  {" "}
                  {it?.track?.album?.name}
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  ) : (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <motion.div style={{ alignSelf: "center", justifySelf: "center" }}>
        <Grid fontSize={"3.5rem"} width={"2rem"} fill="var(--accent-color)" />
      </motion.div>
    </div>
  );
};
