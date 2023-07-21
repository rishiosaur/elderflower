import {
  Baguette,
  BaguetteDisplay,
  BaguetteSize,
  BaguetteTypes,
  Bakery,
} from "@/modules/baguette/components/base";
import { Client } from "@notionhq/client";
import { GetServerSideProps, GetStaticProps } from "next";
import { NotionToMarkdown } from "notion-to-md";
import { useEffect, useState } from "react";

import ColorThief from "colorthief";
import { promisify } from "util";
import getColors from "get-image-colors";
import chroma from "chroma-js";
import { pageToMarkdown } from "@/modules/shared/components/notion/transform";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { cwd } from "process";
/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */

export const getServerSideProps: GetServerSideProps = async (req) => {
  const file = req.params.file;
  console.log(__dirname);
  const f = await readFile(
    resolve(__dirname, `../../../../../src/dev/${file}.md`)
  );
  const content = f.toString();
  console.log(content);
  return {
    props: {
      content,
    },
  };
};
export default function Post(props) {
  const [layout, setLayout] = useState([
    {
      args: {
        content: props.content,
        // notionId: props.id,
      },
      w: BaguetteSize.Four,
      h: BaguetteSize.Full,
      type: BaguetteTypes.Markdown,
      id: "main",
      display: BaguetteDisplay.Main,
    },
  ] as Baguette<any>[]);
  return <Bakery s={[layout, setLayout]} />;
}
