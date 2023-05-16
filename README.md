## OBORTECH ADMIN APP: A step-by-step guide for installing and running the project

**How to install and run this project**

-   Node version: v12.22.12
-   NPM version: 8.10.0
-   Docker (Docker version 20.10.7, build 20.10.7-0ubuntu1~18.04.2)
-   Docker-compose (docker-compose version 1.29.2, build 5becea4c)
-   Use npm ci to install all node modules instead of npm install [https://docs.npmjs.com/cli/v8/commands/npm-ci]

**After installing the above tools, you need to run the below command to start this project.**

`docker-compose up --build`

**In case, you get a permission denied error for the data folder, you need to run the below command.**

`sudo chown -R [username]:[username] data`

**Below are the URLs to access this project and the database.**

Frontend URL: http://localhost:4000
Database URL: http://localhost:8080
Database username: root
Password: password

**Recommened VSCode extensions**

-   ES7/React/Redux/GraphQL
-   Trailing Spaces
-   Eslint
-   Prettier
-   Auto Rename Tag
-   Error Lens

-- Please enable "Format on save" option on your vscode

**Here are some important instructions to follow while working on the project**

1. All components should be functional components.
2. Every component should be 150 lines max, in any case, it shouldn't be more than 200 lines.
3. Any function should not be longer than 50 lines. Try to split them into smaller functions.
4. Only required variables should be managed in the state. Use local variables if the value is not going to be changed.
5. Please try to use common modes/reuse wherever required. Try to find common components in the components/common folder.
6. All function and variable names should be in camelCase: e.g exampleVariableName, exampleFunctionName.
7. All function names on the front end should start without an underscore and should be in camel case: e.g exampleFunctionName.
8. All event-based function names should start with handle: e.g handleClick, handleSubmit.
9. Database table names should be in snake_case: e.g. example_table_name.
10. Table field/column name should also be in snake_case: example_field_name.
11. Component name should always be in PasCal case: e.g ExampleComponentName.
12. Please add a comment in brief (Explaining the use of the function) for all functions in frontend and backend.
13. All frontend files should have .jsx extension and backend files should have a .js extension.
14. Code should be in a readable format. All properties should be on the same line rather than separate lines.
15. We should pass minimum props to child components. Every component should have its own functions and states. Make sure we use custom hooks for the logic part of the components.
16. There should not be any console.log or commented code when your task is done and you create a pull request.
17. All text should be added to eng.json and should be referred to from there only.
18. All buttons should have a loader. Please use the "LoaderButton" component for all buttons and use the isLoading state.
19. Please try to make use of Custom hooks to separate the logic part and view part from components to make them look smaller.
20. Please try to use style components wherever possible.

**Here are some important instructions for managing the Git branches and creating a PR**

1. Please rebase your working branches with the base branch every day in the morning before starting the work. Otherwise, you will have to fix all the conflicts your self and the you will be responsible for the loss of any code.
2. Please always create PR once you are done with the task or fixing the issue. You need to get it tested by the QA team on your local machine before creating a PR, then only it will be merged with the base branch.
3. Please always manage your tasks in separate branches so that we can merge them with the base branch as and when required to make them live. We will not merge all of them with QA at the same time.
