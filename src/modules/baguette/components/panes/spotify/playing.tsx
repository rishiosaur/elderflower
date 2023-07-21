import { HubbleMarkdown } from "@/modules/hubble/components/markdown";
import { AnimatePresence, motion } from "framer-motion";
import {
  BaguetteArgs,
  BaguetteTypes,
  BaguetteComponent,
} from "../../base/index";
import useSWR from "swr";
import { fetcher } from "@/modules/shared/services/fetching";
import { useMemo } from "react";

export const SpotifyPlayingBaguette: BaguetteComponent<
  BaguetteTypes.SpotifyPlaying
> = () => {
  const { data, error } = useSWR("/api/spotify/current", fetcher, {
    refreshInterval: 500,
  });

  return (
    <motion.div>
      <motion.div style={{ display: "inline-flex", flexDirection: "row" }}>
        <div></div>
        <p>{}</p>
      </motion.div>
    </motion.div>
    // <AnimatePresence mode="sync">
    //   <HubbleMarkdown content={content} manager={manager} />
    // </AnimatePresence>
  );
};
