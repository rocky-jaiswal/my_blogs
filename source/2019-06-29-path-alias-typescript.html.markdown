---
title: "Path aliases with TypeScript"
tags: TypeScript
date: 29/06/2019
---

You are working on a TypeScript project and everything feels right, the code is neat, not only it is working you also feel that it is correct. As you code increases, one day you encounter this monstrosity -

    import { calculateMultiplier, roundToTwo } from '../../../utils'

The deeply nested directory structure leads to long import paths like "__../../../..__" and they are a pain to refactor and maintain. Well fear not, with a little __tsconfig__ magic we can fix this. Using something like path aliases (or mapping) we aim to only have simple imports like - __src/utils__

This change however can be broken down into three paths -

1. Make the TS compiler work and find the mapped modules
2. The tests should work
3. The final built code should work and execute with Node.js

To demo things I have a simple project setup like this -

    src/
    ├── index.ts
    ├── utils
    │   └── index.ts
    └── v1
        └── core
            └── calc
                ├── index.test.ts
                └── index.ts


### Make the TS compiler work

First, to add path aliases and compile the code (and also make VSCode work) we need to add the following to tsconfig.json (in the "compilerOptions") -

    "paths": {
			"src/*": ["src/*"]
		}

You can also get adventurous and try a cooler alias like -

    "paths": {
			"@/*": ["src/*"]
		}

Then your code can look like -

    import { calculateMultiplier, roundToTwo } from '@/utils'


### Make the tests work

In a normal world one could have assumed that the change above fixes everything. However, our tests are usually compiled with "__ts-jest__" (since jest only recognizes JavaScript) which has it's own configuration. Thankfully ts-jest has thought of this scenario and provided a [solution](https://kulshekhar.github.io/ts-jest/user/config/). So we change our ts-jest configuration in package.json (in the "jest" section add) -

    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/src/$1"
    }

Please note that this configuration (which is a simple regex) should match the tsconfig path configuration. With this setup in place, the tests should work.

### Make the built code work

Surely this should not be a thing, right? The code is compiled and the tests run, why should we need to do something else, but reality has different plans as usual. TS compiles the code but the path aliases are left as is, of-course in this case when you run Node.js on the final built code, it cannot resolve the modules.

    module.js:550
    throw err;
    ^

    Error: Cannot find module 'src/utils'
        at Function.Module._resolveFilename (module.js:548:15)

This issue has been raised with the TS team but they have the opinion that this is not a compiler issue [https://github.com/Microsoft/TypeScript/issues/10866](https://github.com/Microsoft/TypeScript/issues/10866). So to make the built code run we need another solution, thankfully a simple one exists, we need to install the package __module-alias__. This is a normal Node.js package (nothing to do with TS) that allows for aliased module resolution. We need to install this package, then add a line in package.json -

    "_moduleAliases": {
      "src": "dist" // dist is where the built TS -> JS code resides
    },

Again this should match our tsconfig, also we need to insure that this line is added before any code is executed, e.g. in the entrypoint index.ts file -

    import 'module-alias/register'

Finally, with these changes in place we can build, test and run our TypeScript code with aliased paths. Happy weekend!
