const state = {
  uid: "",
};

export const get = {
  uid: () => {
    return state.uid;
  },
};

export const set = {
  uid: (value: string) => {
    state.uid = value;
  },
};
