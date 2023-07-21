import { HubbleMarkdown } from "@/modules/hubble/components/markdown";
import { AnimatePresence } from "framer-motion";
import {
  BaguetteArgs,
  BaguetteTypes,
  BaguetteComponent,
} from "../../base/index";

export const MarkdownBaguette: BaguetteComponent<BaguetteTypes.Markdown> = (
  props
) => {
  return <HubbleMarkdown {...props} />;
};
