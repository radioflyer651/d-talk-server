---
applyTo: '**/*.ts'
---

# TypeScript Coding Standards
The following rules must be followed when generating new TypeScript content.
  - When using an `if` statement, NEVER use a single line.  ALWAYS enclose the "true" code in a block. I.e.
  ```typescript
  if(x===1){
    callSomeFunction();
  }
  ```
  - Avoid using type `any` whenever possible.  If used, explain why in a comment.
  - Always use appropriate types for variables and parameters.
  - When creating data types, use `interfaces`, and avoid using `classes` when possible.
    - Any data that will be shared between the client and server MUST be an `interface`.
  - Use vertical whitespace for readability.  When moving from one block of code representing an overall task, make sure there's whitespace separating the next block of code.
    - Ensure there are inline comments, at a minimum, on each block of code.
  - Avoid using `null` in code, except where it's already defined.  Use `undefined` instead.
  - Avoid using functions like `String()` and `Number()`.  Use the commonly used methods, like `.toString()`, and `parseInt()`.
  - Class constructors must be the first member in the class definition.
  - Never use default exports.  Export items individually.  Ex:
  ```typescript
  export const thisExample = 12;
  
  export class SomeClass{
    
  }
  ```

## Commenting
  - At a minimum, each "block" of functionality within the code must have an inline comment indicating what that block is doing.  (i.e. sorting a list, collecting parent nodes, etc.)
  - All comments (inline or otherwise), but be complete sentences and follow proper english grammar rules.
  - When generating new functions, properties, methods, etc. use JSDOC comments to annotate the item.
  - Never include comments that are not meant to be committed to the codebase for long-term retention, with the following exception:
    - ANY and ALL comments meant to be considered and/or addressed by the developer at the time of generation must be preceded by `TODO-Immediate: ` or `TODO-Information: `
      - Use `TODO-Immediate: ` when the developer must address unfinished code or code used as a placeholder.
      - Use `TODO-Information: ` for any notes the developer should know about the generated code before accepting it for use.
  