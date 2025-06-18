


/** Normalizes a specified website for querying against the database. */
export function getNormalizedWebsite(website: string): string {
    // Pattern to match to the URL.
    const pattern = /^(https?:\/\/)?(?<url>((\w[\w\-]*)?\w\.)+\w+)/i;

    // Match the pattern.
    const match = pattern.exec(website);

    // If there's no match, then... you guessed it!
    if (!match) {
        return '';
    }

    // Get the url from the match.
    let result = match.groups!['url'].trim().toLowerCase();

    // Ensure it starts with www.
    if (!result.startsWith('www.')) {
        result = 'www.' + result;
    }

    return result;
}