// import { withImmer } from "@/modules/shared/stores/withImmer";
// import { create } from "zustand";

// interface HubblePage {
//   openPanels: string[];
// }

// const initialState = {
//   open: [] as string[],
// };

// export const createHubble = () =>
//   create(
//     withImmer(initialState, (set, get) => ({
//       toggle: (id: string) => () =>
//         set((s) => {
//           if (!s.open.includes(id)) {
//             s.open = s.open.concat(id);
//           } else {
//             s.open = s.open
//               .map((pid) => (id === pid ? false : pid))
//               .filter(Boolean) as string[];
//           }
//         }),

//       page: (id: string) => get().open.includes(id),
//     }))
//   );
