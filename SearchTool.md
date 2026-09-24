# Search Tool


Added a `search_files` tool for searching the
project files and locating relevant code by file and line number.

## Changes

-   Added `src/tools/searchFiles.ts`
-   Integrated `search_files` into `src/ai/agent.ts`
-   Updated `src/tui/components/MessageList.tsx` to display search
    results
-   Supports recursive search, path/file filtering, case sensitivity,
    result limits, and project-root validation
-   Excludes common directories such as `node_modules`, `.git`, `dist`,
    `build`, and `coverage`

## Logic

The implementation uses Node.js built-in File System (`fs`) and Path (`path`) APIs for directory traversal and file handling.

The tool recursively traverses the project, reads suitable text files,
searches each line for the query, and returns matching file paths and
line numbers.

The agent can then use the existing `read_file` tool to inspect the
relevant code.

## Future Improvements

-   Use **ripgrep (`rg`)** for faster searches on large project
-   Improve result ranking and formatting
-   Add caching for repeated searches
