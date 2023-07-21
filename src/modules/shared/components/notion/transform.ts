import {
  Baguette,
  BaguetteComponent,
  BaguetteDisplay,
  BaguetteSize,
  BaguetteTypes,
} from "@/modules/baguette/components/base";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
      return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, "g"), newStr);
  };
}

export const propertiesToJson = (properties: any) => {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      const types = {
        title: () => {
          return value.title?.map((z) => z.plain_text).join("") || "";
        },
        rich_text: () => {
          return value.rich_text?.map((z) => z.plain_text).join("") || "";
        },
        select: () => {
          return value.select?.name || "";
        },
        multi_select: () => {
          return value.multi_select?.map((z) => z.name) || [];
        },
        checkbox: () => {
          return value.checkbox || false;
        },
      };
      const m = types[value.type]();
      return [key, m];
    })
  );
};

export const pageToMarkdown = async (id: string) => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const n2m = new NotionToMarkdown({
    notionClient: notion,
  });

  const blocks = await n2m.pageToMarkdown(id);
  console.log(blocks);
  const _content = n2m.toMarkdownString(blocks);
  console.log(_content);
  let content = _content
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("”", '"');
  // return content;

  const page = await notion.pages.retrieve({
    page_id: id,
  });

  console.log();

  let matches = [
    ...content.matchAll(
      /\[(?<name>[a-zA-Z0-9 ]*?)\]\(https:\/\/www\.notion\.so\/(?<id>[a-zA-Z0-9]*?)\)/g
    ),
  ];

  console.log(matches);

  const pages = await Promise.all(
    matches.map(async (match) => {
      const notionId = match.groups.id;
      const p = await notion.pages.retrieve({
        page_id: notionId,
      });
      const properties = propertiesToJson(p.properties);
      return properties;
    })
  );

  for (const [i, m] of matches.entries()) {
    const page = pages[i];
    const props: Baguette<BaguetteTypes.Markdown> = {
      args: {
        notionId: m.groups.id,
      },
      type: BaguetteTypes.Markdown,
      id: m.groups.id,
      display: BaguetteDisplay.Base,
      h: BaguetteSize.Four,
    };

    const splice = `"[w:${m.groups.id}|${JSON.stringify(props)}]"${
      m.groups.name
    }"[/w:${m.groups.id}]"`;

    content = content.split(m[0]).join(splice);
  }

  return content;
};

export const idContentSwitch = (id: string, content: string) => {
    const dev = process.env.NODE_ENV
    return dev === 'development' ? { id } : {content}
}
