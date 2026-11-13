import { Records } from "./RunRecords";
import { isChapterAvailable } from "../core/ReleaseConfig";

/** Only earned local progress unlocks released chapters. Preview/query routes cannot grant access. */
export function canEnterChapter(records: Pick<Records, "cleared">, chapter: number): chapter is 1 | 2 {
  return isChapterAvailable(chapter) && (chapter === 1 || (chapter === 2 && records.cleared >= 1));
}
