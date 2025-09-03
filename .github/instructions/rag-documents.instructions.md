

# Rag Documents Feature

**IMPORTANT NOTE: Rag Documents do NOT implement the `IChatDocumentData` or the generalized `ChatDocument` functionality.**

The following pertains to the feature of the `RagDocument` type.

## Objectives
The objectives of the `RagDocument` type are the following:
  - Allow the ability to upload and store arbitrary file data.
  - Some file types include:
    - Text Documents
    - PDF
    - Text-based source code files
  - Store embedding vectors for the files.
  - Files will need to be chunked to allow proper usage and functionality of the data.
  - Allow vector-search on the data.
    - Allow the ability to include parts of the documents in LLM Chat contexts.
    - Retrieve some or all of files for user searches.

