import { produce } from "immer";
import { State, GetState, StoreApi, StateCreator } from "zustand";

export const withImmer =
  <PrimaryState extends State, SecondaryState extends State>(
    initialState: PrimaryState,
    createState: (
      set: (fn: (draftState: PrimaryState) => void) => void,
      get: GetState<PrimaryState>,
      api: StoreApi<PrimaryState>
    ) => SecondaryState
  ): StateCreator<PrimaryState & SecondaryState> =>
  (set, get, api) =>
    Object.assign(
      {},
      initialState,
      createState(
        (fn) => set((baseState) => produce(baseState, fn)),
        get as GetState<PrimaryState>,
        api as StoreApi<PrimaryState>
      )
    );
