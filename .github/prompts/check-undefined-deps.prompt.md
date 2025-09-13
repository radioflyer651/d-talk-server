---
mode: agent
---

# Check For Undefined
  - Add null/undefined checks to the constructor of the service(s) currently in context.

Reference the [TypeScript Standards](../instructions/typescript-standards.instructions.md).

Example
```typescript
export class SomeClass{
    constructor(
        readonly dependency1: SomeType,
        private dependency2: SomeOtherType,
    ){
        // ...
        if(!this.dependency1){
            throw new Error(`dependency1 must have a value.`);
        }
        if(!this.dependency2){
            throw new Error(`dependency2 must have a value.`);
        }
        // ...
    }

    // ...
}
```

Perform this action now.