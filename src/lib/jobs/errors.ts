// An error that retrying can't fix, such as a PDF with no text or a file that
// isn't a PDF. The queue marks the chat failed straight away instead of retrying.
export class PermanentJobError extends Error {
    readonly permanent = true;
}

export const isPermanent = (err: unknown) =>
    err instanceof PermanentJobError || (err as { permanent?: unknown })?.permanent === true;
