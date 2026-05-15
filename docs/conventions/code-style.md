# QuizMaster Code Style Guidelines

## Frontend

- TypeScript strict mode
- oxlint + oxfmt with default rules, except:
  - Single quotes in TypeScript, double quotes in JSX/TSX
  - No semicolons
- File names kebab-case

## Backend

- Java 21 formatted by **Prettier** with the `prettier-plugin-java` plugin.
  Run `pnpm code` (or `pnpm code:be`) to apply, `pnpm code:ci:be` to check.
  Config in `.prettierrc.json5` at repo root: 4-space indent, 120-char width.
  IntelliJ and VS Code both have official Prettier integrations.
- **Error Prone** runs as part of `compileJava` and surfaces likely bugs as
  warnings.
- Spring Boot REST API controllers
- JPA/Hibernate repositories
- Service layer only where necessary (elaborate business logic)
- Unit tests include running DB (no mocking)

## BDD Specifications

- All features are covered by user-centric Specifications by Example
  - Features are described in Gherkin and stored in `specs/features`
  - There is no functionality not covered by a scenario
  - `*.feature` file names in PascalCase
- Cucumber.js and Playwright are used to run the specs
  - Page Object pattern is used to organize test code
    - One Page Object per logical page, stored in `specs/src/pages`
    - All locators and user actions are implemented in Page Objects
  - Steps files are stored in `specs/src/steps`
    - Steps share data using global `QuizmasterWorld` object in `specs/src/steps/world/world.ts`
    - No Playwright API in steps files. All DOM manipulation is via Page Objects
  - Page Objects and Steps file names in kebab-case
