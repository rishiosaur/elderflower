import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { pageToMarkdown } from "@/modules/shared/components/notion/transform";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id;

  const content = await pageToMarkdown(id as string);

  res.json(content);
};

export default handler;
