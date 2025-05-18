// Re-export all types from auth.tsexport * from './auth';

// Re-export all types from api.tsexport * from './api';

// Add other type exports here as needed

/**
 * Utility type to make specific properties required in a type
 */
export type RequiredProps<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P];
};

/**
 * Utility type to make specific properties optional in a type
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

/**
 * Utility type to make all properties optional and nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Utility type to extract the type of array elements
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
