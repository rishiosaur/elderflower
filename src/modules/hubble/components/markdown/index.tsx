import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  useState,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import { parser } from "./parser";

import {
  BaguetteDisplay,
  BaguetteSize,
  BaguetteTypes,
  useBaguetteState,
  useBakery,
} from "../../../baguette/components/base/index";
import { Node } from "unist-util-position/lib";
import { unified } from "unified";
import remarkParse from "remark-parse/lib";
import remarkRehype from "remark-rehype/lib";
import { VFile } from "vfile";
import useSWR from "swr";
import { fetcher } from "@/modules/shared/services/fetching";
import { Grid } from "react-loading-icons";
import chroma from "chroma-js";

const MarkdownContext = createContext(
  [] as unknown as [string[], Dispatch<SetStateAction<string[]>>]
);

export const topVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: {},
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
  end: {
    opacity: 0,
  },
  tap: {
    opacity: 0.5,
  },
};

export const childVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    border: "none",
  },
  end: {
    opacity: 0,
  },
  tap: {
    opacity: 0.5,
  },
};

export const HubbleRaw: React.FC<{
  n?: Node & {
    children?: Node[];
    data?: {
      full: string;
      tags: string;
      type: string;
      props: any;
    };
    properties: any;
    tagName?: string;
    value?: string;
  };
}> = ({ n }) => {
  const [panels, setPanels] = useBaguetteState(BaguetteTypes.Markdown);
  const [r, g, b] = useMemo(() => {
    const root = document.querySelector(":root");
    const color = getComputedStyle(root as Element).getPropertyValue(
      "--accent-color"
    );
    console.log(color);

    return chroma(color).rgb();
  }, []);
  const manager = useBakery();
  const windowOpen = useMemo(() => {
    return (
      manager.open(n?.data?.tags.split(",")[0] as any) ||
      manager.open(n?.data?.props?.id)
    );
  }, [manager, n?.data?.tags, n?.data?.props]);
  const rawMap = () =>
    n?.children?.map((z, id) => <HubbleRaw n={z as any} key={id} />);
  if (n?.type === "element") {
    if (n?.tagName?.match(/h[0-9]/)) {
      const Component = (motion as any)[n.tagName as any] as typeof motion.h1;
      return (
        <AnimatePresence>
          <Component
            style={{
              lineHeight: "2em",
              opacity: 0.35,
            }}
            layout
            variants={childVariants}
          >
            {rawMap()}
          </Component>
        </AnimatePresence>
      );
    }

    if (n?.tagName === "span") {
      // console.log("span", n);
      if (n.data?.tags) {
        const { tags, type } = n.data;

        const open = tags.split(",").some((s) => panels.includes(s));
        // console.log(open);
        if (type === "p") {
          // OpenOn
          return (
            <AnimatePresence>
              {open && (
                <motion.span layout variants={childVariants}>
                  {rawMap()}
                </motion.span>
              )}
            </AnimatePresence>
          );
        }

        if (type.includes("br")) {
          // console.log("br!");
          return (
            <AnimatePresence>
              <br />
            </AnimatePresence>
          );
        }

        if (type.includes("c") && !type.includes("o")) {
          return (
            <AnimatePresence>
              {!open && (
                <motion.span tabIndex={0} variants={topVariants}>
                  {rawMap()}
                </motion.span>
              )}
            </AnimatePresence>
          );
        }

        if (type.includes("o")) {
          // Open button
          return (
            <AnimatePresence>
              {(type.includes("c") ? !open : true) && ( // Open & Close match
                <motion.span
                  whileTap={
                    !open
                      ? {
                          opacity: 0.5,
                          // cursor: "pointer",
                        }
                      : {}
                  }
                  tabIndex={0}
                >
                  <motion.span
                    layout
                    style={
                      !open
                        ? {
                            textDecoration:
                              "wavy underline var(--accent-color)",
                          }
                        : {
                            textDecoration: "none",
                          }
                    }
                    whileHover={
                      !open
                        ? {
                            backgroundColor: "var(--accent-color)",
                            // padding: "0.05rem",
                            cursor: "pointer",
                            textDecoration: "none",
                          }
                        : {}
                    }
                    onClick={() => {
                      // console.log("clicked!");
                      if (!open) {
                        setPanels((s) => s.concat(...tags.split(",")));
                      } else {
                        setPanels((s) =>
                          s.filter((z) => !tags.split(",").includes(z))
                        );
                      }
                    }}
                    variants={topVariants}
                  >
                    {rawMap()}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          );
        }

        if (type === "w") {
          const open = tags.split(",").every((s) => panels.includes(s));

          const props = JSON.parse(n.data.props);
          // const windowOpen =
          // ;
          return (
            <AnimatePresence>
              {/* <motion.span variants={childVariants}> */}
              <motion.span
                whileTap={{
                  opacity: 0.5,
                }}
                style={{
                  outline: "1px solid var(--accent-color)",
                  padding: "0.05rem",
                  backgroundColor: windowOpen
                    ? "var(--accent-color)"
                    : "var(--bg-color)",
                  position: "relative",

                  // color: windowOpen ? "var(--bg-color)" : "var(--main-color)",
                  // borderTopRightRadius: 50,
                }}
                whileHover={{
                  backgroundColor: windowOpen
                    ? "var(--bg-color)"
                    : "var(--accent-color)",
                  // color: windowOpen ? "var(--main-color)" : "var(--bg-color)",
                  // userSelect: "none",
                  cursor: "pointer",
                }}
                onClick={() => {
                  manager.toggle({
                    w: BaguetteSize.Three,
                    h: BaguetteSize.Four,
                    args: {},
                    type: BaguetteTypes.Markdown,
                    id: tags[0] as string,
                    manager,
                    selected: false,
                    display: BaguetteDisplay.Base,
                    ...props,
                  });
                  // if (windowOpen === open) {
                  if (!open) {
                    setPanels((s) => s.concat(...tags.split(",")));
                  }
                  // }
                }}
              >
                {rawMap()}
                {/* <motion.span
                    style={{
                      height: "0.3rem",
                      position: "absolute",
                      width: "0.3rem",
                      top: 0,
                      right: 0,
                      outline: "1px solid var(--accent-color)",
                      ...(windowOpen
                        ? {
                            backgroundColor: "var(--bg-color)",
                          }
                        : {
                            backgroundColor: "var(--accent-color)",
                          }),
                    }}
                  /> */}
              </motion.span>
              {/* </motion.span> */}
            </AnimatePresence>
          );
        }

        if (type === "t") {
        }
      }

      return (
        <motion.span layout variants={childVariants}>
          {rawMap()}
        </motion.span>
      );
    }

    if (n?.tagName === "img") {
      // console.log(n);
      const p = JSON.parse(
        n.properties.alt
          ?.replaceAll("“", '"')
          .replaceAll("”", '"')
          .replaceAll("”", '"') || "{}"
      );
      // console.log(p);
      return (
        <AnimatePresence>
          <motion.div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
            variants={childVariants}
            layout
          >
            <motion.div
              style={{
                position: "relative",
              }}
            >
              <motion.img
                src={n.properties.src}
                style={{
                  // background:
                  width: "100%",
                  // border: "1px solid var(--soft-color)",
                  borderRadius: "4px",
                  height: "10em",
                  objectFit: "cover",
                  marginTop: "0.5em",
                  marginBottom: p?.c ? "0" : "0.1em",
                  ...(p.t
                    ? {
                        filter: `sepia(100%) brightness(45%) `,
                      }
                    : {}),
                  ...p,
                }}
              />
              {p?.t && (
                <motion.div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "1.8em",
                  }}
                >
                  <motion.h1 style={{}}>{p.t}</motion.h1>
                </motion.div>
              )}
            </motion.div>

            {p?.c && (
              <motion.span
                style={{
                  alignSelf: "end",
                  opacity: 0.75,
                  marginBottom: "1em",
                  lineHeight: "1.3em",
                  fontSize: "small",
                }}
              >
                {p.c}
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      );
    }

    if (n?.tagName === "div") {
      if (n.data?.tags) {
        const { tags, type } = n.data;

        const open = tags.split(",").some((s) => panels.includes(s));

        if (type === "p") {
          return (
            <AnimatePresence>
              {open && (
                <motion.div
                  className="hubble-div"
                  layout
                  variants={topVariants}
                >
                  {rawMap()}
                </motion.div>
              )}
            </AnimatePresence>
          );
        }

        if (type === "c") {
          // console.log(open);
          // console.log("hi", open, n.children);
          return (
            <AnimatePresence>
              {!open && (
                <motion.div
                  className="hubble-div"
                  layout
                  variants={topVariants}
                >
                  {rawMap()}
                </motion.div>
              )}
            </AnimatePresence>
          );
        }
      }
    }

    if (n?.tagName === "p") {
      const r = rawMap();
      // console.log(r, n.children);
      if (n.children?.[0]?.value === "") {
        return <></>;
      }
      if (n.children[0].tagName === "img") {
        return <AnimatePresence>{r}</AnimatePresence>;
      }
      return (
        <AnimatePresence>
          <motion.p className="hubble-p" layout variants={childVariants}>
            {rawMap()}
          </motion.p>
        </AnimatePresence>
      );
    }

    if (n?.tagName === "em") {
      return (
        <motion.em layout variants={topVariants}>
          {rawMap()}
        </motion.em>
      );
    }

    if (n?.tagName === "b" || n?.tagName === "strong") {
      return (
        <motion.b layout variants={topVariants}>
          {rawMap()}
        </motion.b>
      );
    }

    if (n?.tagName === "ul") {
      return (
        <motion.ul layout variants={topVariants}>
          {rawMap()}
        </motion.ul>
      );
    }

    if (n?.tagName === "ol") {
      return (
        <motion.ol
          style={{ listStylePosition: "inside", listStyleType: "" }}
          variants={topVariants}
          layout
        >
          {rawMap()}
        </motion.ol>
      );
    }

    if (n?.tagName === "li") {
      return (
        <motion.li layout variants={childVariants}>
          {rawMap()}
        </motion.li>
      );
    }

    if (["pre", "code"].includes(n?.tagName)) {
      return (
        <motion.code layout variants={topVariants}>
          {rawMap()}
        </motion.code>
      );
    }

    if (n?.tagName === "a") {
      return (
        <motion.a
          layout
          variants={childVariants}
          style={{
            display: "inline",
            color: "var(--main-color)",
            textDecoration: "solid underline var(--accent-color)",
          }}
          href={n.properties?.href}
        >
          <motion.span
            style={{
              display: "inline",
            }}
          >
            {rawMap()}
          </motion.span>
        </motion.a>
      );
    }

    if (n?.tagName === "hr") {
      return (
        <motion.div
          variants={childVariants}
          style={{
            marginTop: "0.7em",
            marginBottom: "0.7em",
            opacity: 0.55,
            alignSelf: "center",
            justifySelf: "center",
            display: "flex",
            flexDirection: "row",
            gap: "0.5em",
            alignItems: "center",
            justifyContent: "center",
            // height: "0.5em",
          }}
        >
          <motion.div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "var(--accent-color)",
            }}
          />
          <motion.div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "0.25em",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Array.from(Array(3).keys()).map((v, i) => (
              <motion.span
                key={i}
                style={{
                  width: "0.3em",
                  height: "0.3em",

                  borderRadius: "50%",
                  border: "1.8px solid var(--accent-color)",
                }}
              />
            ))}
          </motion.div>
          <motion.div
            style={{
              width: "100%",
              height: "1px",
              backgroundColor: "var(--accent-color)",
            }}
          />
        </motion.div>
      );
    }
  } else {
    if (n?.type === "text") {
      // console.log("text", n);
      if (n.value.trim().length === 0) {
        return;
      }
      return (
        <motion.span
          style={{ display: "inline" }}
          layout
          variants={childVariants}
        >
          {n.value}
        </motion.span>
      );
    }
  }
};

export const HubbleMarkdown: React.FC<{
  content?: string;
  notionId?: string;
}> = ({ ...props }) => {
  const [tree, setTree] = useState(null as null | Node);

  const { data, error } = useSWR(`/api/notion/md/${props.notionId}`, fetcher);

  const parsed = useMemo(() => {
    const f = unified()
      .use(remarkParse)
      .use(remarkRehype, {
        allowDangerousHtml: true,
      })
      .use([parser]);

    const file = new VFile();
    file.value = "";
    if (props.content && !process.env.PUBLIC_TEST) {
      file.value = props.content;
    }

    if (props.notionId && data) {
      file.value = data;
    }
    const hastNode = f.runSync(f.parse(file), file);
    return hastNode;
  }, [data, props.content, props.notionId]);

  const [openPanes, setOpenPanes] = useBaguetteState(BaguetteTypes.Markdown);

  return props.notionId ? (
    data ? (
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          // alignItems: "start",
          // justifyContent: "center",
        }}
      >
        <motion.div
          layout
          variants={topVariants}
          initial="hidden"
          animate="visible"
          exit="end"
        >
          {parsed.children.map((t) => (
            <AnimatePresence>
              <HubbleRaw n={t} />
            </AnimatePresence>
          ))}
        </motion.div>
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
    )
  ) : (
    <motion.div
      layout
      variants={topVariants}
      initial="hidden"
      animate="visible"
      exit="end"
      style={{
        padding: "1rem",
      }}
    >
      {parsed.children.map((t) => (
        <HubbleRaw n={t} />
      ))}
    </motion.div>
  );
};
