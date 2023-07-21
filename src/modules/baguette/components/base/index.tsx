import {
  PropsWithChildren,
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext,
  Dispatch,
  SetStateAction,
  useRef,
  MouseEventHandler,
  MouseEvent,
} from "react";
import styles from "./index.module.css";
import { MarkdownBaguette } from "../panes/text/markdown";
import {
  AnimatePresence,
  LayoutGroup,
  MotionStyle,
  MotionValue,
  motion,
  useScroll,
} from "framer-motion";
import { SpotifyPlayingBaguette } from "../panes/spotify/playing";
import { SpotifyPlaylistBaguette } from "../panes/spotify/playlist";
import { FiBookOpen, FiMinus, FiMusic, FiPlus, FiX } from "react-icons/fi";
import { CoverBaguette } from "../panes/post/CoverBaguette";
import { ControlsBaguette } from "../panes/post/ControlsBaguette";
import { topVariants } from "@/modules/hubble/components/markdown";
import chroma, { rgb } from "chroma-js";

export enum BaguetteTypes {
  Markdown = "md",
  Aside = "cw",
  NotionDatabase = "nd",
  SpotifyPlaying = "sp",
  SpotifyPlaylist = "sl",
  Cover = "co",
  Controls = "con",
  Gallery = "gy",
  Photo = "p",
}

export type BaguetteArgs = {
  [BaguetteTypes.Markdown]:
    | {
        content: string;
      }
    | {
        notionId: string;
      };
  [BaguetteTypes.Controls]: {};
  [BaguetteTypes.Aside]: BaguetteArgs[BaguetteTypes.Markdown] & {
    title: string;
  };
  [BaguetteTypes.NotionDatabase]: {
    id: string;
  }[];
  [BaguetteTypes.SpotifyPlaying]: {};
  [BaguetteTypes.SpotifyPlaylist]: {
    id: string;
  };
  [BaguetteTypes.Cover]: {
    notion: any;
  };
  [BaguetteTypes.Controls]: {};
  [BaguetteTypes.Photo]: {
    url: string;
  };
  [BaguetteTypes.Gallery]: {
    urls: string[];
  };
};

export const BaguetteStates = {
  [BaguetteTypes.Markdown]: [] as string[],
};

export enum BaguetteSize {
  Full = "full",
  Seven = "seven",
  Six = "six",
  Five = "five",
  Four = "four",
  Three = "three",
  Two = "two",
  One = "one",
}

export enum BaguetteDisplay {
  Main = "main",
  Cover = "cover",
  CoverMute = "covermute",
  Base = "base",
}

export interface Baguette<T extends BaguetteTypes> {
  w: BaguetteSize;
  h: BaguetteSize;
  args: BaguetteArgs[T];
  type: T;
  id: string;
  display: BaguetteDisplay;
}

export interface BaguetteManager {
  open: (id: string) => boolean;
  toggle: <T extends BaguetteTypes>(
    bg: Baguette<T> | Pick<Baguette<T>, "id">
  ) => void;
  update: (id: string, bg: Partial<Baguette<any>>) => void;
  panel: <T extends BaguetteTypes>(id: string) => Baguette<T> | undefined;
}

export type BaguetteComponent<T extends BaguetteTypes> = React.FC<
  BaguetteArgs[T]
>;

const BaguetteMap = {
  [BaguetteTypes.Markdown]: MarkdownBaguette,
  [BaguetteTypes.SpotifyPlaying]: SpotifyPlayingBaguette,
  [BaguetteTypes.SpotifyPlaylist]: SpotifyPlaylistBaguette,
  [BaguetteTypes.Cover]: CoverBaguette,
  [BaguetteTypes.Controls]: ControlsBaguette,
};

const BaguetteContext = createContext({} as unknown);
export const useBaguetteState = <T extends BaguetteTypes>(type: T) =>
  useContext(BaguetteContext) as [
    (typeof BaguetteStates)[T],
    Dispatch<SetStateAction<(typeof BaguetteStates)[T]>>
  ];

const BaguetteButton: React.FC<
  PropsWithChildren<{
    id: string;
    offset: string;
    style?: MotionStyle;
    onClick: MouseEventHandler<HTMLDivElement>;
  }>
> = ({ id, children, offset, style, onClick }) => {
  // const manager = useBakery();
  return (
    <motion.div
      layout
      style={{
        position: "absolute",
        top: offset,
        right: 0,
        outline: "1px solid var(--accent-color)",

        padding: "0.2rem",
        display: "flex",
        zIndex: 3,

        alignItems: "center",
        justifyContent: "center",
        // backdropFilter: "blur(100%)",
        // borderBottomLeftRadius: "4px",
        fontSize: "0.7rem",
        overflow: "auto",
        width: "1.5rem",
        height: "1.5rem",
        opacity: 0.5,
        ...style,
      }}
      whileHover={{
        backgroundColor: "var(--accent-color)",
        cursor: "pointer",
      }}
      whileTap={{
        opacity: 0.5,
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export const Baguette = <T extends BaguetteTypes>({
  w,
  h,
  type,
  args,
  display,
  id,
  index,
}: // key,
Baguette<T>) => {
  const Component = BaguetteMap[type];

  const manager = useBakery();

  const [bgColor, setBgColor] = useState("black");

  useEffect(() => {
    if (document && getComputedStyle) {
      const z = getComputedStyle(document.documentElement).getPropertyValue(
        "--bg-color"
      );
      setBgColor(chroma(z).alpha(0.8).css());
    }
  }, [setBgColor]);

  const [supplement] = useState(null);
  const [state, setState] = useState(BaguetteStates[type] || null);

  return (
    <BaguetteContext.Provider value={[state, setState]}>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${styles.panel} ${styles[`panel-h-${h.toString()}`]} ${
          styles[`panel-w-${w.toString()}`]
        }`}
      >
        <motion.div
          layout
          style={{
            width: "100%",
            height: "100%",
            overflow: "auto",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 3,
            transition: "all 0.1s ease",
            border: "1px solid var(--accent-color)",
          }}
          whileHover={{
            opacity: 1,
          }}
        >
          {supplement ? (
            <Component {...args} manager={manager} />
          ) : (
            <Component {...args} {...supplement} manager={manager} />
          )}
        </motion.div>
        {[BaguetteDisplay.Main].includes(display) && (
          <>
            <motion.div
              layout
              style={{
                position: "absolute",
                top: "1.7em",
                zIndex: 999,
                right: 0,
                border: "1px solid var(--accent-color)",
                backgroundColor: "var(--bg-color)",
                padding: "0.2rem",
                display: "flex",

                alignItems: "center",
                justifyContent: "center",

                fontSize: "0.7rem",
                overflow: "auto",
                width: "1.5rem",
                height: "1.5rem",
                opacity: 0.5,
              }}
              whileHover={{
                backgroundColor: "var(--accent-color)",
                cursor: "pointer",
                opacity: 1,
              }}
              whileTap={{
                opacity: 0.5,
              }}
              onClick={() => {
                manager.update(id, {
                  w: BaguetteSize[
                    Object.keys(BaguetteSize)[
                      Math.min(
                        Object.values(BaguetteSize).length - 1,
                        Object.values(BaguetteSize).indexOf(w) + 1
                      )
                    ]
                  ],
                });
              }}
            >
              <FiMinus />
            </motion.div>
            <motion.div
              layout
              style={{
                position: "absolute",
                top: "4.6em",
                zIndex: 999,
                right: 0,
                border: "1px solid var(--accent-color)",

                padding: "0.2rem",
                display: "flex",
                backgroundColor: "var(--bg-color)",
                alignItems: "center",
                justifyContent: "center",
                // borderBottomLeftRadius: "4px",
                fontSize: "0.7rem",
                overflow: "auto",
                width: "1.5rem",
                height: "1.5rem",
                opacity: 0.5,
              }}
              whileHover={{
                backgroundColor: "var(--accent-color)",
                cursor: "pointer",
                opacity: 1,
              }}
              whileTap={{
                opacity: 0.5,
              }}
              onClick={() => {
                manager.update(id, {
                  w: BaguetteSize[
                    Object.keys(BaguetteSize)[
                      Math.max(0, Object.values(BaguetteSize).indexOf(w) - 1)
                    ]
                  ],
                });
              }}
            >
              <FiPlus />
            </motion.div>
          </>
        )}
        {![
          BaguetteDisplay.Main,
          BaguetteDisplay.Cover,
          BaguetteDisplay.CoverMute,
        ].includes(display) && (
          <>
            {type === BaguetteTypes.Markdown && (
              <>
                <BaguetteButton
                  id={id}
                  offset={"1.7em"}
                  onClick={() => {
                    manager.toggle({ id });
                  }}
                >
                  <FiX />
                </BaguetteButton>
                <BaguetteButton
                  id={id}
                  offset={"4.6em"}
                  onClick={() => {
                    manager.update(id, {
                      h: BaguetteSize[
                        Object.keys(BaguetteSize)[
                          Math.min(
                            Object.values(BaguetteSize).length - 1,
                            Object.values(BaguetteSize).indexOf(h) + 1
                          )
                        ]
                      ],
                    });
                  }}
                >
                  <FiMinus />
                </BaguetteButton>

                <BaguetteButton
                  id={id}
                  offset={"7.5em"}
                  onClick={() => {
                    manager.update(id, {
                      h: BaguetteSize[
                        Object.keys(BaguetteSize)[
                          Math.max(
                            0,
                            Object.values(BaguetteSize).indexOf(h) - 1
                          )
                        ]
                      ],
                    });
                  }}
                >
                  <FiPlus />
                </BaguetteButton>
              </>
            )}
          </>
        )}
        <motion.div className={styles.isolate}>
          <motion.div className={styles.noise} />
          <motion.div className={styles.overlay} />
        </motion.div>
      </motion.div>
    </BaguetteContext.Provider>
    // </AnimatePresence>
  );
};

const BaguetteManagerContext = createContext({} as unknown as BaguetteManager);

export const useBakery = () => useContext(BaguetteManagerContext);

export const Bakery: React.FC<{
  s: [Baguette<any>[], Dispatch<SetStateAction<Baguette<any>[]>>];
}> = ({ s: [layout, setLayout] }) => {
  const ref = useRef(null);
  const scroll = useScroll({
    container: ref,
  });
  return (
    <BaguetteManagerContext.Provider
      value={{
        ...scroll,
        open: (id) => layout.map((x) => x.id).includes(id),
        toggle: (bg) => {
          const opens = layout.map((z) => z.id);
          if (opens.includes(bg.id)) {
            setLayout((s) => s.filter((pane) => pane.id !== bg.id));
          } else {
            setLayout((s) => s.concat(bg));
          }
        },
        update: (id, bg) => {
          if (layout.map((z) => z.id).includes(id)) {
            setLayout((s) =>
              s.map((b) => {
                if (b.id === id) {
                  return {
                    ...b,
                    ...bg,
                  };
                } else {
                  return b;
                }
              })
            );
          }
        },
        panel: (id) => {
          return layout.find((z) => z.id === id);
        },
      }}
    >
      <AnimatePresence>
        <motion.div
          ref={ref}
          layout
          transition={{
            layout: {
              ease: "easeInOut",
              duration: 1,
            },
          }}
          className={`${styles.set}`}
          variants={topVariants}
        >
          <LayoutGroup>
            <AnimatePresence>
              {layout.map((l, i) => {
                return <Baguette {...l} key={i} index={i} />;
              })}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </AnimatePresence>
    </BaguetteManagerContext.Provider>
  );
};
