// Converts MySQL DECIMAL values (returned as strings) into plain numbers.
export const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number | null) => (value == null ? 0 : Number(value)),
};
