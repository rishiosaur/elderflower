import {
  Baguette,
  BaguetteDisplay,
  BaguetteSize,
  BaguetteTypes,
  Bakery,
} from "../modules/baguette/components/base/index";
import { pageToMarkdown } from "@/modules/shared/components/notion/transform";
import { useState } from "react";

export default function Home(props) {
  const [layout, setLayout] = useState([
    {
      args: {
        notionId: props.id,
      },
      w: BaguetteSize.Three,
      h: BaguetteSize.Full,
      type: BaguetteTypes.Markdown,
      id: "main",
      display: BaguetteDisplay.Cover,
    },
  ] as Baguette<any>[]);
  return <Bakery s={[layout, setLayout]} />;
}

export const getServerSideProps = async () => {
  const id = process.env.NOTION_HOME;
  // const content = await pageToMarkdown(id as string);
  return {
    props: {
      id,
      // content,
    },
  };
};
