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
  