 {
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

export const getServerSideProps: GetServerSideProps = async (req) => {
  const id = req.params.id;
  console.log(id);
  const content = await pageToMarkdown(id as string);
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const page = await notion.pages.retrieve({
    page_id: id as string,
  });

  console.log(page.cover);
  const img = await fetch(page.cover?.file?.url || page.cover?.external?.url);
  const buf = Buffer.from(await img.arrayBuffer());

  const z = await getColors(buf, "image/jpg");
  const summary = page.properties.Summary.rich_text
    .map((z) => z.text.content)
    .join("\n");

  return {
    props: {
      content,
      id,
      notion: page,
      colors: z.map((s) => s.hex()),
      summary,
    },
  };
};
export default function Post(props) {
  useEffect(() => {
    const colors = (props.colors as string[]).map((z) => chroma(z));
    const r = document.querySelector(":root");
    r?.style.setProperty("--main-color", colors[0].brighten().hex());
    r?.style.setProperty("--accent-color", colors[0].darken(1.5).hex());
    r?.style.setProperty("--bg-color", colors[0].darken(3.5).hex());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const [layout, setLayout] = useState([
    {
      args: {
        notion: props.notion,
      },
      w: BaguetteSize.Two,
      h: BaguetteSize.Four,
      type: BaguetteTypes.Cover,
      id: "cover",
      display: BaguetteDisplay.Cover,
    },

    {
      args: {
        content: "# Summary\n\n\n" + props.summary,
      },
      w: BaguetteSize.Two,
      h: BaguetteSize.Four,
      type: BaguetteTypes.Markdown,
      id: "controls",
      display: BaguetteDisplay.CoverMute,
    },
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
