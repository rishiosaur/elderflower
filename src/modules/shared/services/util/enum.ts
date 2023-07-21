export const getEnumIndex = <T extends object>(enum_: T, indexModifier: number, value: keyof T) => {
    const index = Object.keys(enum_).indexOf(value)
    const indexModifier = 
};
