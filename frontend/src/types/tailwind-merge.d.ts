declare module 'tailwind-merge' {
  type ClassNameValue = ClassNameArray | string | null | undefined | 0 | false;
  type ClassNameArray = ClassNameValue[];

  /**
   * A function that merges Tailwind CSS classes
   * @param classes - The classes to merge
   * @returns The merged classes
   */
  function twMerge(...classes: ClassNameValue[]): string;
  
  /**
   * Creates a custom tailwind-merge instance with custom configuration
   * @param config - The configuration object
   * @returns A custom tailwind-merge function
   */
  function createTailwindMerge(
    config: (utils: any) => any
  ): typeof twMerge;

  export { createTailwindMerge };
  export default twMerge;
}
