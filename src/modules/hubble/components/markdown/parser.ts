import hyperid from "hyperid";
import { position } from "unist-util-position";
import { Position } from "unist-util-position/lib";
import { visitParents } from "unist-util-visit-parents";

type BaseTree = { children: BaseTree[] } | { value: any };

const extractValues = (nodes: BaseTree[]) =>
  nodes.map((z) => {
    if (z.value) {
      return z.value;
    }

    if (z.children) {
      return extract;
    }
  });

export const parser = function () {
  return (tree: any) => {
    // Match something like
    const tagStart = /(?<full>"\[(?<type>[a-z]*):(?<tags>[a-zA-Z0-9,]+))/g;

    const extractValues = (nodes: any[]) => {
      return nodes.map((z) => {
        if (z.value) {
          return z.value;
        }

        if (z.children) {
          return extractValues(z.children);
        }

        return null;
      });
    };

    const traverseEquality = (
      tree: (string | string[])[],
      path: number[],
      searchTerm: string
    ) => {
      for (const [index, value] of tree.entries()) {
        if (Array.isArray(value)) {
          const v = traverseEquality(value, path.concat(index), searchTerm);
          if (v) {
            return path.concat(v).flat();
          }
        } else {
          if (value?.includes(searchTerm)) {
            return path.concat(index);
          }
        }
      }

      return null;
    };

    const traverseWithPath = (nodes: any[], path: number[]) => {
      let v = nodes;
      path.forEach((z) => {
        v = v[z] || v.children[z];
      });

      return v as any;
    };

    const extractFirstValue = (node: any) => {
      if (node?.value) {
        return node.value;
      }

      if (node?.children) {
        return extractFirstValue(node.children[0]);
      }

      return null;
    };

    /*
    Basic compiler:
    1. Run through every starting regex (no props, only "[{type}:{tags}")
    2. Parse props
    */

    visitParents(
      tree,
      (node) => {
        return node?.value?.match(tagStart);
      },
      (node, ancestors) => {
        const value: string = node.value;
        const matches = [...value.matchAll(tagStart)];

        if (matches.length === 1) {
          const match = matches[0];
          const groups = match.groups as {
            type: string;
            tags: string;
            full: string;
          };
          const fullMatch = groups.full;
          const matchIndex = value.indexOf(groups.full);

          // Based off of the type & tags, we can predict the exact string that will close the tag.
          const endTagValue = `"[/${groups.type}:${groups.tags}]"`;

          // Parse props
          // Immediate next character should be a "|"
          const slicedLine = value.slice(matchIndex + fullMatch.length);
          if (slicedLine.trimStart()[0] === "|") {
            // Begin search for a closing bracket: two possibilities, on same line or different one]
            const afterBar = slicedLine.trimStart().slice(1);

            // On same line
            if (afterBar.includes(']"')) {
              // If on same line, there won't be any breaks between current node and the end of tag
              const props = afterBar.slice(0, afterBar.indexOf(']"'));

              // Now we search for the closing tag
              // Two possibilities: on same line, or not
              const afterEndBracket = afterBar.slice(
                afterBar.indexOf(']"') + 2
              );

              // If on same line (that is, there are no node breaks in the value of the tag)
              if (afterEndBracket.includes(endTagValue)) {
                // Content is just the no-break slice between the end of the opening tag and ending
                const content = afterEndBracket.slice(
                  0,
                  afterEndBracket.indexOf(endTagValue)
                );

                // Now we have to start compiling the tag into its consituent unist nodes

                // Before = part of the tag before the start i.e. 'awef "[' 'awef ' would be before
                const before = value.slice(0, matchIndex);

                // After = part of the tag after the start i.e. ']" awef' ' awef' would be after
                const after = value.slice(
                  value.indexOf(endTagValue) + endTagValue.length
                );

                // Replace that section of node with object
                ancestors[ancestors.length - 1].children = ancestors[
                  ancestors.length - 1
                ].children
                  .map((n: any) => {
                    if (n === node) {
                      return [
                        {
                          type: "text",
                          position: node.position,
                          value: before,
                        },
                        {
                          type: "element",
                          tagName: "span",
                          properties: {
                            class: "hubble-tag",
                          },
                          position: node.position,
                          data: {
                            ...groups,
                            props,
                          },
                          children: [
                            {
                              type: "text",
                              position: node.position,
                              value: content,
                            },
                          ],
                        },
                        {
                          type: "text",
                          position: node.position,
                          value: after,
                        },
                      ];
                    }
                    return n;
                  })
                  .flat();
              } else {
                // Content is multiline

                let endTagNode = null;
                for (const [idx, ancestor] of ancestors
                  .slice()
                  .reverse()
                  .entries()) {
                  const relevantNode =
                    idx === 0 ? node : ancestors.slice().reverse()[idx - 1];

                  const index = ancestor.children.indexOf(relevantNode);
                  const sliced = ancestor.children.slice(index + 1);

                  let values = extractValues(sliced);
                  const traversed = traverseEquality(values, [], endTagValue);
                  if (traversed) {
                    endTagNode = traverseWithPath(sliced, traversed);
                  }
                }

                let endTagNodeAncestors = [] as any[];
                visitParents(
                  tree,
                  (n) => n === endTagNode,
                  (e, a) => {
                    endTagNodeAncestors = a.slice().reverse();
                  }
                );

                const secondShared = ancestors
                  .slice()
                  .reverse()
                  .find((z) => endTagNodeAncestors.includes(z));

                const [trueEndTagAncestors] = [
                  endTagNodeAncestors.slice().reverse(),
                ];
                let [trueEndTagRelevant, trueNodeRelevant] = [
                  trueEndTagAncestors[
                    trueEndTagAncestors.indexOf(secondShared) + 1
                  ] || endTagNode,
                  ancestors[ancestors.indexOf(secondShared) + 1] || node,
                ];

                const contentNodes = secondShared.children.slice(
                  secondShared.children.indexOf(trueNodeRelevant) + 1,
                  secondShared.children.indexOf(trueEndTagRelevant)
                );

                if (secondShared.type === "element") {
                  const pNode = [
                    {
                      ...node,
                      value: node.value.slice(
                        node.value.indexOf(groups.full) +
                          groups.full.length +
                          props.length +
                          3
                      ),
                    },
                    ...ancestors[ancestors.length - 1].children.slice(
                      ancestors[ancestors.length - 1].children.indexOf(node) +
                        1,
                      ancestors[ancestors.length - 1].children.indexOf(
                        contentNodes[0]
                      )
                    ),
                  ];

                  const poNode = [
                    ...endTagNodeAncestors[0].children.slice(
                      endTagNodeAncestors[0].children.indexOf(
                        contentNodes[contentNodes.length - 1]
                      ) + 1,
                      endTagNodeAncestors[
                        endTagNodeAncestors.length - 1
                      ].children.indexOf(endTagNode)
                    ),
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        0,
                        endTagNode.value.indexOf(endTagValue)
                      ),
                    },
                  ];

                  const mappedContent = [...pNode, ...contentNodes, ...poNode];

                  ancestors[ancestors.length - 1].children = [
                    ...ancestors[ancestors.length - 1].children.slice(
                      0,
                      ancestors[ancestors.length - 1].children.indexOf(node)
                    ),
                    {
                      ...node,
                      value: node.value.slice(
                        0,
                        node.value.indexOf(groups.full)
                      ),
                    },
                    {
                      type: "element",
                      tagName: "span",
                      position: pNode[0].position,
                      children: [...pNode, ...contentNodes, ...poNode],
                      data: {
                        props,
                        ...groups,
                      },
                      properties: {
                        class: "hubble-tag",
                      },
                    },
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        endTagNode.value.indexOf(endTagValue) +
                          endTagValue.length
                      ),
                    },
                    ...ancestors[ancestors.length - 1].children.slice(
                      ancestors[ancestors.length - 1].children.indexOf(
                        endTagNode
                      ) + 1
                    ),
                  ];
                } else {
                  const pNode = {
                    ...ancestors[ancestors.length - 1],
                    children: [
                      {
                        ...node,
                        value: node.value.slice(
                          node.value.indexOf(groups.full) +
                            groups.full.length +
                            props.length +
                            3
                        ),
                      },
                      ...ancestors[ancestors.length - 1].children.slice(
                        ancestors[ancestors.length - 1].children.indexOf(node) +
                          1
                      ),
                    ],
                  };

                  // const poNode = [{}, ...endTagNodeAncestors[endTagNodeAncestors.length - 1]];

                  const poNode = {
                    ...endTagNodeAncestors[0],
                    children: [
                      ...endTagNodeAncestors[0].children.slice(
                        0,
                        endTagNodeAncestors[
                          endTagNodeAncestors.length - 1
                        ].children.indexOf(endTagNode)
                      ),
                      {
                        ...endTagNode,
                        value: endTagNode.value.slice(
                          0,
                          endTagNode.value.indexOf(endTagValue)
                        ),
                      },
                    ],
                  };

                  const mappedContent = {
                    type: "element",
                    tagName: "div",
                    properties: {
                      class: "hubble-tag",
                    },
                    data: {
                      ...groups,
                      props,
                    },
                    children: [pNode, ...contentNodes, poNode],
                  };

                  secondShared.children = [
                    ...secondShared.children.slice(
                      0,
                      secondShared.children.indexOf(contentNodes[0])
                    ),
                    mappedContent,
                    ...secondShared.children.slice(
                      secondShared.children.indexOf(
                        contentNodes[contentNodes.length - 1]
                      ) + 1
                    ),
                  ];

                  ancestors[ancestors.length - 1].children = [
                    ...ancestors[ancestors.length - 1].children.slice(
                      0,
                      ancestors[ancestors.length - 1].children.indexOf(node)
                    ),
                    {
                      ...node,
                      value: node.value.slice(
                        0,
                        node.value.indexOf(groups.full)
                      ),
                    },
                  ];
                  endTagNodeAncestors[0].children = [
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        endTagNode.value.indexOf(endTagValue) +
                          endTagValue.length
                      ),
                    },
                    ...endTagNodeAncestors[0].children.slice(
                      endTagNodeAncestors[0].children.indexOf(endTagNode) + 1
                    ),
                  ];
                }
              }
            } else {
              // tag is multiline
              // let endNode = null;

              const barNode = node;
              let endNode = null;

              for (const [idx, ancestor] of ancestors
                .slice()
                .reverse()
                .entries()) {
                const relevantNode =
                  idx === 0 ? node : ancestors.slice().reverse()[idx - 1];

                const index = ancestor.children.indexOf(relevantNode);
                const sliced = ancestor.children.slice(index + 1);

                let values = extractValues(sliced);
                const traversed = traverseEquality(values, [], ']"');
                if (traversed) {
                  endNode = traverseWithPath(sliced, traversed);
                }
              }

              if (endNode === null) {
                throw "No ending node";
              }

              let endNodeAncestors = [] as any[];
              visitParents(
                tree,
                (n) => n === endNode,
                (e, a) => {
                  endNodeAncestors = a.slice().reverse();
                }
              );

              // Now find props
              const firstTagSharedAncestor = endNodeAncestors.find((z, i) =>
                ancestors.slice().reverse().includes(z)
              );

              // Given that that is the only place that they have a shared root, the layer under it will be where we can start traversing.

              const [trueEndNodeAncestors, trueBarAncestors] = [
                endNodeAncestors.slice().reverse(),
                ancestors,
              ];
              let [endNodeRelevant, trueBarRelevant] = [
                trueEndNodeAncestors[
                  trueEndNodeAncestors.indexOf(firstTagSharedAncestor) + 1
                ] || endNode,
                trueBarAncestors[
                  trueBarAncestors.indexOf(firstTagSharedAncestor) + 1
                ] || node,
              ];

              const [barValue, endNodeValue] = [node, endNode].map((z) =>
                extractValues([z]).flat(Infinity).join("\n")
              );

              const propNodes = firstTagSharedAncestor.children.slice(
                firstTagSharedAncestor.children.indexOf(trueBarRelevant) + 1,
                firstTagSharedAncestor.children.indexOf(endNodeRelevant)
              );

              const values = extractValues(propNodes);

              const props = [
                barValue.slice(barValue.indexOf("|") + 1),
                values.flat(Infinity).join("\n"),
                endNodeValue.slice(0, endNodeValue.indexOf(']"')),
              ].join("\n");

              // Now we find content
              if (endNode.value.includes(endTagValue)) {
                // content will be the slice of the end tag value between the index of ']"' + 2 and the index of end tag value

                const indexOfEnd = endNodeValue.indexOf(']"') + 2;
                const indexOfTag = endNodeValue.indexOf(endTagValue);
                const content = endNodeValue.slice(indexOfEnd, indexOfTag);

                // This is content

                // Props will be calculated in the exact same way as if there was multiline content

                ancestors[ancestors.length - 1].children = [
                  ...ancestors[ancestors.length - 1].children.slice(
                    0,
                    ancestors[ancestors.length - 1].children.indexOf(node)
                  ),
                  {
                    ...node,
                    value: node.value.slice(0, node.value.indexOf(groups.full)),
                  },
                  {
                    type: "element",
                    tagName: "span",
                    children: [
                      {
                        ...node,
                        value: content,
                      },
                    ],
                    data: {
                      ...groups,
                      props,
                    },
                    properties: {
                      class: "hubble-tag",
                    },
                  },
                  {
                    ...endNode,
                    value: endNode.value.slice(
                      endNode.value.indexOf(endTagValue) + endTagValue.length
                    ),
                  },

                  ...endNodeAncestors[0].children.slice(
                    endNodeAncestors[0].children.indexOf(endNode) + 1
                  ),
                ];

                firstTagSharedAncestor.children =
                  firstTagSharedAncestor.children
                    .filter((z) => !propNodes.includes(z))
                    .filter((z) => endNodeAncestors[0] !== z);
              } else {
                // Ending is not on same line, spawn a div
                let endTagNode = null;
                for (const [idx, ancestor] of endNodeAncestors.entries()) {
                  const relevantNode =
                    idx === 0 ? endNode : endNodeAncestors[idx - 1];

                  const index = ancestor.children.indexOf(relevantNode);
                  const sliced = ancestor.children.slice(index + 1);

                  let values = extractValues(sliced);
                  const traversed = traverseEquality(values, [], endTagValue);
                  if (traversed) {
                    endTagNode = traverseWithPath(sliced, traversed);
                  }
                }

                // Find content
                let endTagNodeAncestors = [] as any[];
                visitParents(
                  tree,
                  (n) => n === endTagNode,
                  (e, a) => {
                    endTagNodeAncestors = a.slice().reverse();
                  }
                );

                const secondShared = endNodeAncestors.find((z) =>
                  endTagNodeAncestors.includes(z)
                );

                const [trueEndTagAncestors] = [
                  endTagNodeAncestors.slice().reverse(),
                ];
                let [trueEndTagRelevant, trueEndNodeRelevant] = [
                  trueEndTagAncestors[
                    trueEndTagAncestors.indexOf(secondShared) + 1
                  ] || endTagNode,
                  trueEndNodeAncestors[
                    trueEndNodeAncestors.indexOf(secondShared) + 1
                  ] || endNode,
                ];

                const contentNodes = secondShared.children.slice(
                  secondShared.children.indexOf(trueEndNodeRelevant),
                  secondShared.children.indexOf(trueEndTagRelevant) + 1
                );
                // // console.log(
                const purged = contentNodes.filter((z) => {
                  return true;
                });

                // Two possibilities for mapping: either render a span or a div
                if (secondShared.type == "element") {
                  // One start, one mid, one end - render span in element where node is

                  endNode.value = endNode.value.slice(
                    endNode.value.indexOf(']"') + 2
                  );

                  firstTagSharedAncestor.children =
                    firstTagSharedAncestor.children.filter(
                      (z) => !propNodes.includes(z)
                    );

                  const post = [
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        endTagNode.value.indexOf(endTagValue) +
                          endTagValue.length
                      ),
                    },
                    ...trueEndTagAncestors[
                      trueEndTagAncestors.length - 1
                    ].children.slice(
                      trueEndTagAncestors[
                        trueEndTagAncestors.length - 1
                      ].children.indexOf(endTagNode) + 1
                    ),
                  ];

                  ancestors[ancestors.length - 1].children = ancestors[
                    ancestors.length - 1
                  ].children
                    .map((z) => {
                      if (z === node) {
                        return [
                          {
                            ...node,
                            value: node.value.slice(
                              0,
                              node.value.indexOf(groups.full)
                            ),
                          },
                          {
                            type: "element",
                            children: [
                              ...contentNodes.slice(0, contentNodes.length - 1),
                              {
                                type: "text",
                                position: endTagNode.position,
                                value: endTagNode.value.slice(
                                  0,
                                  endTagNode.value.indexOf(endTagValue)
                                ),
                              },
                            ],
                            position: z.position,
                            properties: {
                              class: "hubble-tag",
                            },
                            data: {
                              props,
                              ...groups,
                            },
                            tagName: "span",
                          },
                          ...post,
                        ];
                      }

                      return z;
                    })
                    .flat();

                  secondShared.children = [];

                  endTagNode.value = endTagNode.value.slice(
                    endTagNode.value.indexOf(endTagValue) + endTagValue.length
                  );
                } else {
                  // N content nodes; start a new div after node

                  //
                  endNode.value = endNode.value.slice(
                    endNode.value.indexOf(']"') + 2
                  );

                  node.value = node.value.slice(
                    0,
                    node.value.indexOf(groups.full)
                  );

                  firstTagSharedAncestor.children =
                    firstTagSharedAncestor.children.filter(
                      (z) => !propNodes.includes(z)
                    );

                  const pre = secondShared.children.slice(
                    0,
                    secondShared.children.indexOf(trueEndNodeRelevant)
                  );

                  const post = secondShared.children.slice(
                    secondShared.children.indexOf(trueEndTagRelevant) + 1
                  );

                  secondShared.children = [
                    ...pre,
                    {
                      type: "element",
                      tagName: "div",
                      position: contentNodes[1].position,
                      children: contentNodes,
                      properties: {
                        class: "hubble-tag",
                      },
                      data: {
                        props,
                        ...groups,
                      },
                    },
                    ...post,
                  ];

                  endTagNode.value = endTagNode.value.slice(
                    endTagNode.value.indexOf(endTagValue) + endTagValue.length
                  );
                }
              }
            }
          } else {
            // If not present on same line, check immediately adjacent node
            // // console.log(

            const ancestorsAscending = ancestors.slice().reverse();
            let expectedBar = null;
            for (const [idx, ancestor] of ancestorsAscending.entries()) {
              const relevantNode =
                idx === 0 ? node : ancestorsAscending[idx - 1];

              const index = ancestor.children.indexOf(relevantNode);

              //
              const nextElement = ancestor.children
                .slice(index + 1)
                .find((z) => {
                  if (z.value && z.value.trim().length === 0) {
                    return false;
                  } else {
                    return true;
                  }
                });
              const value = extractFirstValue(nextElement);
              if ((value as string)?.trim().startsWith("|")) {
                expectedBar = nextElement;
                break;
              }
            }

            if (expectedBar) {
              // Begin search for a closing bracket
              // Two possibilities: ] is on same line or is on a different one
              //   const { value } = expectedBar;
              const value = extractValues([expectedBar]).flat(Infinity);
              // .join("\n");
              const indexOfBar = value.indexOf(
                value.find((z) => z.includes("|"))
              );

              let barAncestors = [] as any[];

              // Other possibility: on a different line.
              // First, get ancestors:
              visitParents(
                tree,
                (node) => node === expectedBar,
                (e, a) => {
                  barAncestors = a.slice().reverse();
                }
              );

              const sliced = value.slice(indexOfBar);

              if (sliced[0].includes(']"')) {
                const props = sliced[0].slice(1, sliced[0].indexOf(']"'));

                // to find content, there are one of two possibilities: on same line, or on different one
                if (sliced[0].includes(endTagValue)) {
                  // Content

                  const content = {
                    type: "text",
                    value: sliced[0].slice(
                      sliced[0].indexOf(']"') + 2,
                      sliced[0].indexOf(endTagValue)
                    ),
                    position: expectedBar.position,
                  };

                  const textEnd = traverseWithPath(
                    [expectedBar.children],
                    traverseEquality(
                      extractValues([expectedBar]),
                      [],
                      endTagValue
                    )
                  );
                  expectedBar.children = [];
                  ancestors[ancestors.length - 1].children = ancestors[
                    ancestors.length - 1
                  ].children
                    .map((z) => {
                      if (z === node) {
                        return [
                          {
                            ...node,
                            value: node.value.slice(
                              0,
                              node.value.indexOf(groups.full)
                            ),
                          },
                          content,
                        ];
                      } else {
                        return z;
                      }
                    })
                    .flat()
                    .concat({
                      type: "text",
                      value: textEnd.value.slice(
                        textEnd.value.indexOf(endTagValue) + endTagValue.length
                      ),
                    })
                    .concat(
                      ...expectedBar.children.slice(
                        expectedBar.children.indexOf(textEnd) + 1
                      )
                    );

                  textEnd.value = textEnd.value.slice(
                    textEnd.value.indexOf(endTagValue) + endTagValue.length
                  );
                } else {
                  let endNode = expectedBar.children[0];
                  let endNodeAncestors = [];
                  visitParents(
                    tree,
                    (n) => n === endNode,
                    (e, a) => {
                      endNodeAncestors = a.slice().reverse();
                    }
                  );
                  // Is on different line, find end node through traversal & map all children
                  let endTagNode = null;
                  for (const [idx, ancestor] of endNodeAncestors.entries()) {
                    const relevantNode =
                      idx === 0 ? endNode : endNodeAncestors[idx - 1];

                    const index = ancestor.children.indexOf(relevantNode);
                    const sliced = ancestor.children.slice(index + 1);

                    let values = extractValues(sliced);
                    const traversed = traverseEquality(values, [], endTagValue);
                    if (traversed) {
                      endTagNode = traverseWithPath(sliced, traversed);
                    }
                  }

                  let endTagNodeAncestors = [] as any[];
                  visitParents(
                    tree,
                    (n) => n === endTagNode,
                    (e, a) => {
                      endTagNodeAncestors = a.slice().reverse();
                    }
                  );

                  const firstTagSharedAncestor = endNodeAncestors.find((z) =>
                    endTagNodeAncestors.includes(z)
                  );

                  const [trueEndTagAncestors, trueEndNodeAncestors] = [
                    endTagNodeAncestors.slice().reverse(),
                    endNodeAncestors.slice().reverse(),
                  ];
                  let [trueEndTagRelevant] = [
                    trueEndTagAncestors[
                      trueEndTagAncestors.indexOf(firstTagSharedAncestor) + 1
                    ] || endTagNode,
                  ];
                  let [endNodeRelevant] = [
                    trueEndNodeAncestors[
                      trueEndNodeAncestors.indexOf(firstTagSharedAncestor) + 1
                    ] || endNode,
                  ];

                  const contentNodes = firstTagSharedAncestor.children.slice(
                    firstTagSharedAncestor.children.indexOf(endNodeRelevant),
                    firstTagSharedAncestor.children.indexOf(
                      trueEndTagRelevant
                    ) + 1
                  );

                  endNode.value = endNode.value.slice(
                    endNode.value.indexOf(']"') + 2
                  );

                  node.value = node.value.slice(
                    0,
                    node.value.indexOf(groups.full)
                  );

                  // firstTagSharedAncestor.children =
                  //   firstTagSharedAncestor.children.filter(
                  //     (z) => !propNodes.includes(z)
                  //   );

                  const pre = firstTagSharedAncestor.children.slice(
                    0,
                    firstTagSharedAncestor.children.indexOf(endNodeRelevant)
                  );

                  const post = [
                    contentNodes[contentNodes.length - 1].type === "text"
                      ? {
                          ...contentNodes[contentNodes.length - 1],
                          value: contentNodes[
                            contentNodes.length - 1
                          ].value.slice(
                            contentNodes[contentNodes.length - 1].value.indexOf(
                              endTagValue
                            ) + endTagValue.length
                          ),
                        }
                      : {
                          ...contentNodes[contentNodes.length - 1],
                          children: [
                            {
                              type: "text",
                              position: endTagNode.position,
                              value: endTagNode.value.slice(
                                endTagNode.value.indexOf(endTagValue) +
                                  endTagValue.length
                              ),
                            },
                            ...(
                              contentNodes[contentNodes.length - 1].children ||
                              []
                            ).slice(
                              (
                                contentNodes[contentNodes.length - 1]
                                  .children || []
                              ).indexOf(endTagNode) + 1
                            ),
                          ],
                        },

                    ...firstTagSharedAncestor.children.slice(
                      firstTagSharedAncestor.children.indexOf(
                        trueEndTagRelevant
                      ) + 1
                    ),
                  ];

                  const mappedNodes = [
                    ...contentNodes.slice(0, contentNodes.length - 1),
                    contentNodes[contentNodes.length - 1].type === "text"
                      ? {
                          ...contentNodes[contentNodes.length - 1],
                          value: contentNodes[
                            contentNodes.length - 1
                          ].value.slice(
                            0,
                            contentNodes[contentNodes.length - 1].value.indexOf(
                              endTagValue
                            )
                          ),
                        }
                      : {
                          ...contentNodes[contentNodes.length - 1],
                          children: [
                            ...(
                              contentNodes[contentNodes.length - 1].children ||
                              []
                            ).slice(
                              0,
                              (
                                contentNodes[contentNodes.length - 1]
                                  .children || []
                              ).indexOf(endTagNode)
                            ),
                            {
                              type: "text",
                              position: endTagNode.position,
                              value: endTagNode.value.slice(
                                0,
                                endTagNode.value.indexOf(endTagValue)
                              ),
                            },
                          ],
                        },
                  ];

                  endTagNode.value = endTagNode.value.slice(
                    endTagNode.value.indexOf(endTagValue) + endTagValue.length
                  );

                  const secondShared = ancestors
                    .slice()
                    .reverse()
                    .find((z) => endTagNodeAncestors.includes(z));

                  if (firstTagSharedAncestor.type.startsWith("element")) {
                    ancestors[ancestors.length - 1].children = [
                      ...pre,
                      ...ancestors[ancestors.length - 1].children.slice(
                        0,
                        ancestors[ancestors.length - 1].children.length - 1
                      ),
                      {
                        type: "element",
                        tagName: "span",
                        position: contentNodes[1].position,
                        children: mappedNodes,
                        properties: {
                          class: "hubble-tag",
                        },
                        data: {
                          props,
                          ...groups,
                        },
                      },
                      ...post,
                    ];
                    firstTagSharedAncestor.children = [];
                  } else {
                    firstTagSharedAncestor.children = [
                      ...pre,
                      {
                        type: "element",
                        tagName: "div",
                        position: contentNodes[1].position,
                        children: mappedNodes,
                        properties: {
                          class: "hubble-tag",
                        },
                        data: {
                          props,
                          ...groups,
                        },
                      },
                      ...post,
                    ];
                  }
                }
              } else {
                // Traverse ancestors - we are trying to find the first value that containes a ]" at some point in its code.
                let endNode = null;

                for (const [idx, ancestor] of barAncestors.entries()) {
                  const relevantNode =
                    idx === 0 ? expectedBar : barAncestors[idx - 1];

                  const index = ancestor.children.indexOf(relevantNode);
                  const sliced = ancestor.children.slice(index + 1);

                  let values = extractValues(sliced);
                  const traversed = traverseEquality(values, [], ']"');
                  if (traversed) {
                    endNode = traverseWithPath(sliced, traversed);
                  }
                }

                if (!endNode) {
                  throw "No ending node";
                }

                // now that we have a start & end node, we can search for the closing tag:

                // Two possibilities: same line, or different line
                // if (endNode.va)

                let endNodeAncestors = [] as any[];
                visitParents(
                  tree,
                  (n) => n === endNode,
                  (e, a) => {
                    endNodeAncestors = a.slice().reverse();
                  }
                );

                // Now find props
                const firstTagSharedAncestor = endNodeAncestors.find((z, i) =>
                  barAncestors.includes(z)
                );

                // Given that that is the only place that they have a shared root, the layer under it will be where we can start traversing.

                const [trueEndNodeAncestors, trueBarAncestors] = [
                  endNodeAncestors.slice().reverse(),
                  barAncestors.slice().reverse(),
                ];
                let [endNodeRelevant, trueBarRelevant] = [
                  trueEndNodeAncestors[
                    trueEndNodeAncestors.indexOf(firstTagSharedAncestor) + 1
                  ] || endNode,
                  trueBarAncestors[
                    trueBarAncestors.indexOf(firstTagSharedAncestor) + 1
                  ] || expectedBar,
                ];

                const [barValue, endNodeValue] = [expectedBar, endNode].map(
                  (z) => extractValues([z]).flat(Infinity).join("\n")
                );

                const propNodes = firstTagSharedAncestor.children.slice(
                  firstTagSharedAncestor.children.indexOf(trueBarRelevant) + 1,
                  firstTagSharedAncestor.children.indexOf(endNodeRelevant)
                );

                const values = extractValues(propNodes);

                const props = [
                  barValue.slice(barValue.indexOf("|") + 1),
                  values.flat(Infinity).join("\n"),
                  endNodeValue.slice(0, endNodeValue.indexOf(']"')),
                ].join("\n");

                if (endNode.value.includes(endTagValue)) {
                  // content will be the slice of the end tag value between the index of ']"' + 2 and the index of end tag value

                  const indexOfEnd = endNodeValue.indexOf(']"') + 2;
                  const indexOfTag = endNodeValue.indexOf(endTagValue);
                  const contentString = endNodeValue.slice(
                    indexOfEnd,
                    indexOfTag
                  );
                  // This is content

                  firstTagSharedAncestor.children = [
                    ...firstTagSharedAncestor.children.slice(
                      0,
                      firstTagSharedAncestor.children.indexOf(trueBarRelevant)
                    ),
                    ...firstTagSharedAncestor.children.slice(
                      firstTagSharedAncestor.children.indexOf(endNodeRelevant) +
                        1
                    ),
                  ];

                  const content = {
                    type: "text",
                    value: contentString,
                    position: node.position,
                  };

                  ancestors[ancestors.length - 1].children = ancestors[
                    ancestors.length - 1
                  ].children
                    .map((z) => {
                      if (z === node) {
                        return [
                          {
                            ...node,
                            value: node.value.slice(
                              0,
                              node.value.indexOf(groups.full)
                            ),
                          },
                          {
                            type: "element",
                            tagName: "span",
                            properties: {
                              class: "hubble-tag",
                            },
                            children: [content],
                            data: {
                              props,
                              ...groups,
                            },
                          },
                        ];
                      } else {
                        return z;
                      }
                    })
                    .flat()
                    .concat({
                      type: "text",
                      value: endNode.value.slice(
                        endNode.value.indexOf(endTagValue) + endTagValue.length
                      ),
                    })
                    .concat(
                      ...endNodeAncestors[0].children.slice(
                        endNodeAncestors[0].children.indexOf(endNode) + 1
                      )
                    );

                  // endNode.value =
                  // Props will be calculated in the exact same way as if there was multiline content
                } else {
                  // Ending is not on same line, spawn a div
                  let endTagNode = null;
                  for (const [idx, ancestor] of endNodeAncestors.entries()) {
                    const relevantNode =
                      idx === 0 ? endNode : endNodeAncestors[idx - 1];

                    const index = ancestor.children.indexOf(relevantNode);
                    const sliced = ancestor.children.slice(index + 1);

                    let values = extractValues(sliced);
                    const traversed = traverseEquality(values, [], endTagValue);
                    if (traversed) {
                      endTagNode = traverseWithPath(sliced, traversed);
                    }
                  }

                  // Find content
                  let endTagNodeAncestors = [] as any[];
                  visitParents(
                    tree,
                    (n) => n === endTagNode,
                    (e, a) => {
                      endTagNodeAncestors = a.slice().reverse();
                    }
                  );

                  const secondShared = endNodeAncestors.find((z) =>
                    endTagNodeAncestors.includes(z)
                  );

                  const [trueEndTagAncestors] = [
                    endTagNodeAncestors.slice().reverse(),
                  ];
                  let [trueEndTagRelevant, trueEndNodeRelevant] = [
                    trueEndTagAncestors[
                      trueEndTagAncestors.indexOf(secondShared) + 1
                    ] || endTagNode,
                    trueEndNodeAncestors[
                      trueEndNodeAncestors.indexOf(secondShared) + 1
                    ] || endNode,
                  ];

                  const contentNodes = secondShared.children.slice(
                    secondShared.children.indexOf(trueEndNodeRelevant),
                    secondShared.children.indexOf(trueEndTagRelevant) + 1
                  );
                  if (secondShared.type === "element") {
                    const pre = secondShared.children.slice(
                      0,
                      secondShared.children.indexOf(endNodeRelevant)
                    );

                    firstTagSharedAncestor.children = [
                      ...firstTagSharedAncestor.children.slice(
                        0,
                        firstTagSharedAncestor.children.indexOf(trueBarRelevant)
                      ),
                      ...firstTagSharedAncestor.children.slice(
                        firstTagSharedAncestor.children.indexOf(
                          endNodeRelevant
                        ) + 1
                      ),
                    ];

                    //
                    endNode.value = endNode.value.slice(
                      endNode.value.indexOf(']"') + 2
                    );

                    node.value = node.value.slice(
                      0,
                      node.value.indexOf(groups.full)
                    );

                    const post = [
                      contentNodes[contentNodes.length - 1].type === "text"
                        ? {
                            ...contentNodes[contentNodes.length - 1],
                            value: contentNodes[
                              contentNodes.length - 1
                            ].value.slice(
                              contentNodes[
                                contentNodes.length - 1
                              ].value.indexOf(endTagValue) + endTagValue.length
                            ),
                          }
                        : {
                            ...contentNodes[contentNodes.length - 1],
                            children: [
                              {
                                type: "text",
                                position: endTagNode.position,
                                value: endTagNode.value.slice(
                                  endTagNode.value.indexOf(endTagValue) +
                                    endTagValue.length
                                ),
                              },
                              ...(
                                contentNodes[contentNodes.length - 1]
                                  .children || []
                              ).slice(
                                (
                                  contentNodes[contentNodes.length - 1]
                                    .children || []
                                ).indexOf(endTagNode) + 1
                              ),
                            ],
                          },
                      ...secondShared.children.slice(
                        secondShared.children.indexOf(trueEndTagRelevant) + 1
                      ),
                    ];
                    const mappedNodes = [
                      ...contentNodes.slice(0, contentNodes.length - 1),
                      contentNodes[contentNodes.length - 1].type === "text"
                        ? {
                            ...contentNodes[contentNodes.length - 1],
                            value: contentNodes[
                              contentNodes.length - 1
                            ].value.slice(
                              0,
                              contentNodes[
                                contentNodes.length - 1
                              ].value.indexOf(endTagValue)
                            ),
                          }
                        : {
                            ...contentNodes[contentNodes.length - 1],
                            children: [
                              ...(
                                contentNodes[contentNodes.length - 1]
                                  .children || []
                              ).slice(
                                0,
                                (
                                  contentNodes[contentNodes.length - 1]
                                    .children || []
                                ).indexOf(endTagNode)
                              ),
                              {
                                type: "text",
                                position: endTagNode.position,
                                value: endTagNode.value.slice(
                                  0,
                                  endTagNode.value.indexOf(endTagValue)
                                ),
                              },
                            ],
                          },
                    ];

                    endTagNode.value = endTagNode.value.slice(
                      endTagNode.value.indexOf(endTagValue) + endTagValue.length
                    );

                    ancestors[ancestors.length - 1].children = [
                      // ...pre,
                      ...ancestors[ancestors.length - 1].children.slice(
                        0,
                        ancestors[ancestors.length - 1].children.length
                      ),
                      {
                        type: "element",
                        tagName: "span",
                        position: contentNodes[1].position,
                        children: mappedNodes,
                        properties: {
                          class: "hubble-tag",
                        },
                        data: {
                          props,
                          ...groups,
                        },
                      },
                      ...post,
                    ];

                    secondShared.children = [];
                  } else {
                    endNode.value = endNode.value.slice(
                      endNode.value.indexOf(']"') + 2
                    );

                    node.value = node.value.slice(
                      0,
                      node.value.indexOf(groups.full)
                    );
                    firstTagSharedAncestor.children = [
                      ...firstTagSharedAncestor.children.slice(
                        0,
                        firstTagSharedAncestor.children.indexOf(trueBarRelevant)
                      ),
                      ...firstTagSharedAncestor.children.slice(
                        firstTagSharedAncestor.children.indexOf(endNodeRelevant)
                      ),
                    ];

                    const pre = secondShared.children.slice(
                      0,
                      secondShared.children.indexOf(trueEndNodeRelevant)
                    );

                    const post = secondShared.children.slice(
                      secondShared.children.indexOf(trueEndTagRelevant) + 1
                    );

                    secondShared.children = [
                      ...pre,
                      {
                        type: "element",
                        tagName: "div",
                        position: contentNodes[1].position,
                        children: contentNodes,
                        properties: {
                          class: "hubble-tag",
                        },
                        data: {
                          props,
                          ...groups,
                        },
                      },
                      ...post,
                    ];

                    endTagNode.value = endTagNode.value.slice(
                      endTagNode.value.indexOf(endTagValue) + endTagValue.length
                    );
                    // firstTagSharedAncestor.children =
                    //   firstTagSharedAncestor.children.filter(
                    //     (z) => !propNodes.includes(z)
                    //   );
                  }
                  //
                  // firstTagSharedAncestor.children = [];
                }
              }
            } else {
              // If there isn't a bar, then ]" must immediately follow because no props
              if (!slicedLine.startsWith(']"')) {
                throw `expected closing brackets ${slicedLine}`;
              }
              const afterEndBracket = slicedLine.slice(
                slicedLine.indexOf(']"') + 2
              );
              // Now we find content
              if (afterEndBracket.includes(endTagValue)) {
                const content = afterEndBracket.slice(
                  0,
                  afterEndBracket.indexOf(endTagValue)
                );

                ancestors[ancestors.length - 1].children = ancestors[
                  ancestors.length - 1
                ].children
                  .map((z) => {
                    if (z === node) {
                      return [
                        {
                          ...node,
                          value: node.value.slice(
                            0,
                            node.value.indexOf(groups.full)
                          ),
                        },
                        {
                          type: "element",
                          tagName: "span",
                          children: [
                            {
                              type: "text",
                              value: content,
                              position: node.position,
                            },
                          ],
                          properties: {
                            class: "hubble-tag",
                          },
                          data: {
                            ...groups,
                          },
                        },
                        {
                          ...node,
                          value: node.value.slice(
                            node.value.indexOf(endTagValue) + endTagValue.length
                          ),
                        },
                      ];
                    }

                    return z;
                  })
                  .flat();
              } else {
                // Content is multiline

                let endTagNode = null;
                for (const [idx, ancestor] of ancestors
                  .slice()
                  .reverse()
                  .entries()) {
                  const relevantNode =
                    idx === 0 ? node : ancestors.slice().reverse()[idx - 1];

                  const index = ancestor.children.indexOf(relevantNode);
                  const sliced = ancestor.children.slice(index + 1);

                  let values = extractValues(sliced);

                  const traversed = traverseEquality(values, [], endTagValue);

                  if (traversed) {
                    endTagNode = traverseWithPath(sliced, traversed);
                  }
                }

                let endTagNodeAncestors = [] as any[];
                visitParents(
                  tree,
                  (n) => n === endTagNode,
                  (e, a) => {
                    endTagNodeAncestors = a.slice().reverse();
                  }
                );

                const secondShared = ancestors
                  .slice()
                  .reverse()
                  .find((z) => endTagNodeAncestors.includes(z));

                const [trueEndTagAncestors] = [
                  endTagNodeAncestors.slice().reverse(),
                ];
                let [trueEndTagRelevant, nodeRelevant] = [
                  trueEndTagAncestors[
                    trueEndTagAncestors.indexOf(secondShared) + 1
                  ] || endTagNode,
                  ancestors[ancestors.indexOf(secondShared) + 1] || node,
                ];

                const contentNodes = secondShared.children.slice(
                  secondShared.children.indexOf(nodeRelevant) + 1,
                  secondShared.children.indexOf(trueEndTagRelevant)
                );

                if (secondShared.type === "element") {
                  const mappedNodes = [
                    {
                      ...node,
                      value: node.value.slice(
                        node.value.indexOf(groups.full) + groups.full.length + 2
                      ),
                    },
                    ...contentNodes,
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        0,
                        endTagNode.value.indexOf(endTagValue)
                      ),
                    },
                  ];

                  secondShared.children = [
                    ...secondShared.children.slice(
                      0,
                      secondShared.children.indexOf(node)
                    ),
                    {
                      ...node,
                      value: node.value.slice(
                        0,
                        node.value.indexOf(groups.full)
                      ),
                    },
                    {
                      type: "element",
                      tagName: "span",
                      children: mappedNodes,
                      properties: {
                        class: "hubble-tag",
                      },
                      data: {
                        ...groups,
                      },
                    },
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        endTagNode.value.indexOf(endTagValue) +
                          endTagValue.length
                      ),
                    },
                    ...secondShared.children.slice(
                      secondShared.children.indexOf(endTagNode) + 1
                    ),
                  ];
                } else {
                  secondShared.children = [
                    ...secondShared.children.slice(
                      0,
                      secondShared.children.indexOf(nodeRelevant) + 1
                    ),

                    {
                      type: "element",
                      position: contentNodes[0].position,
                      children: contentNodes,
                      tagName: "div",
                      data: {
                        ...groups,
                      },
                      properties: {
                        class: "hubble-tag",
                      },
                    },

                    ...secondShared.children.slice(
                      secondShared.children.indexOf(trueEndTagRelevant)
                    ),
                  ];
                  ancestors[ancestors.length - 1].children = [
                    ...ancestors[ancestors.length - 1].children.slice(
                      0,
                      ancestors[ancestors.length - 1].children.indexOf(node)
                    ),
                    {
                      ...node,
                      value: node.value.slice(
                        0,
                        node.value.indexOf(groups.full)
                      ),
                    },
                  ];

                  endTagNodeAncestors[0].children = [
                    {
                      ...endTagNode,
                      value: endTagNode.value.slice(
                        endTagNode.value.indexOf(endTagValue) +
                          endTagValue.length
                      ),
                    },
                    ...endTagNodeAncestors[0].children.slice(
                      endTagNodeAncestors[0].children.indexOf(endTagNode) + 1
                    ),
                  ];
                }
              }
            }
          }
        } else {
          const fullMatch =
            /(?<full>"\[(?<type>[a-z]*):(?<tags>[a-zA-Z0-9,]+)\|?(?<props>\S*?)\]"(?<content>.*?)"\[\/\k<type>:\k<tags>\]")/g;

          const fullMatches = [...value.matchAll(fullMatch)];

          const indices = fullMatches.map((z) => [
            z.index,
            z.groups.full.length,
          ]);
          const contentNodes = fullMatches.map((id, idx) => {
            return [
              {
                type: "element",
                tagName: "span",
                children: [
                  {
                    ...node,
                    value: id.groups.content,
                  },
                ],
                properties: {
                  class: "hubble-tag",
                },
                data: {
                  ...id.groups,
                  props: id.groups.props,
                },
              },
              idx !== fullMatches.length - 1
                ? {
                    ...node,
                    value: value.slice(
                      id.index + id.groups.full.length,
                      fullMatches[idx + 1].index
                    ),
                  }
                : null,
            ];
          });

          if (fullMatches.length - matches.length > 1) {
            throw "not enough matching tags";
          }

          ancestors[ancestors.length - 1].children = ancestors[
            ancestors.length - 1
          ].children
            .map((z) => {
              if (z === node) {
                return [
                  {
                    ...node,
                    value: node.value.slice(
                      0,
                      node.value.indexOf(fullMatches[0].groups.full)
                    ),
                  },
                  ...contentNodes.flat().filter(Boolean),
                  {
                    ...node,
                    value: node.value.slice(
                      node.value.indexOf(
                        fullMatches[fullMatches.length - 1].groups.full
                      ) + fullMatches[fullMatches.length - 1].groups.full.length
                    ),
                  },
                ];
              } else {
                return z;
              }
            })
            .flat();
        }
      }
    );
  };
};
