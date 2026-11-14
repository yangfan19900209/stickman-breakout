/** Release scope is checked before loading chapters as well as by the UI. */
export const ReleaseConfig = {
  version: "1.0.8", lastChapter: 2,
  // Re-enable after account prerequisites, privacy declaration and device verification.
  friendLeaderboard: false,
} as const;

export function isChapterAvailable(chapter: number): boolean {
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= ReleaseConfig.lastChapter;
}

export function nextCampaignChapter(chapter: number): 2 | 3 | undefined {
  const next = chapter + 1;
  return isChapterAvailable(chapter) && isChapterAvailable(next) ? next as 2 | 3 : undefined;
}
