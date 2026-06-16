import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { roundResultsService } from "../services/roundResults.service";
import { roundService } from "../../rounds/services/roundService";
import { mapRoundToFE } from "../../rounds/mappers/roundMapper";

const emptyRanking = { items: [], topNAdvance: 0, isPublished: false, roundName: "Vòng Sơ loại" };
const emptyWildcard = {
  config: { hackathonEnabled: false, roundEnabled: false, availableSlots: 0 },
  items: [],
};

export const useRoundResults = (roundId) => {
  const [ranking, setRanking] = useState(emptyRanking);
  const [tiebreaks, setTiebreaks] = useState([]);
  const [wildcard, setWildcard] = useState(emptyWildcard);
  const [round, setRound] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [decidingReviewId, setDecidingReviewId] = useState(null);

  const fetchResults = useCallback(
    async ({ silent = false } = {}) => {
      if (!roundId) return;
      silent ? setIsRefreshing(true) : setIsLoading(true);

      const [rankingResult, tiebreakResult, wildcardResult, roundResult] = await Promise.allSettled([
        roundResultsService.getRanking(roundId),
        roundResultsService.getTiebreak(roundId),
        roundResultsService.getWildcardCandidates(roundId),
        roundService.getById(roundId),
      ]);

      const nextErrors = {};
      if (rankingResult.status === "fulfilled") setRanking(rankingResult.value);
      else nextErrors.ranking = rankingResult.reason;
      if (tiebreakResult.status === "fulfilled") setTiebreaks(tiebreakResult.value);
      else nextErrors.tiebreak = tiebreakResult.reason;
      if (wildcardResult.status === "fulfilled") setWildcard(wildcardResult.value);
      else nextErrors.wildcard = wildcardResult.reason;
      if (roundResult.status === "fulfilled") setRound(mapRoundToFE(roundResult.value));
      else nextErrors.round = roundResult.reason;

      setErrors(nextErrors);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [roundId],
  );

  const decideWildcard = async (candidate, approved, note) => {
    setDecidingReviewId(candidate.reviewId);
    try {
      await roundResultsService.decideWildcardReview(candidate.reviewId, { approved, note });
      message.success(approved ? "Đã duyệt vé vớt." : "Đã từ chối vé vớt.");
      await fetchResults({ silent: true });
      return true;
    } catch (error) {
      message.error(error?.message || "Không thể cập nhật quyết định vé vớt.");
      return false;
    } finally {
      setDecidingReviewId(null);
    }
  };

  const buildAdvancePayload = useCallback(() => {
    const topN = Number(ranking.topNAdvance || round?.top_n_advance || 0);
    const byGroup = {};

    ranking.items.forEach((item) => {
      const key = item.groupLabel || "default";
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(item);
    });

    const advancedTeamIds = [];
    Object.values(byGroup).forEach((groupItems) => {
      const sorted = [...groupItems].sort((left, right) => left.rank - right.rank);
      advancedTeamIds.push(...sorted.slice(0, topN || sorted.length).map((team) => team.teamId));
    });

    const allTeamIds = ranking.items.map((item) => item.teamId);
    const advancedSet = new Set(advancedTeamIds);
    const eliminatedTeamIds = allTeamIds.filter((teamId) => !advancedSet.has(teamId));

    return { advancedTeamIds, eliminatedTeamIds, note: "" };
  }, [ranking.items, ranking.topNAdvance, round?.top_n_advance]);

  const scoringLocked = Boolean(round?.scoring_locked ?? round?.scoringLocked);
  const isPublished = Boolean(round?.is_published ?? ranking.isPublished);

  const canPublish = useMemo(
    () => scoringLocked && !isPublished && !errors.ranking && ranking.items.length > 0,
    [scoringLocked, isPublished, errors.ranking, ranking.items.length],
  );

  const canAdvance = useMemo(
    () => scoringLocked && isPublished && !errors.ranking && ranking.items.length > 0,
    [scoringLocked, isPublished, errors.ranking, ranking.items.length],
  );

  const publishRound = async () => {
    if (!roundId || !canPublish) return false;
    setIsPublishing(true);
    try {
      await roundResultsService.publishRound(roundId);
      message.success("Đã công bố kết quả sơ loại.");
      await fetchResults({ silent: true });
      return true;
    } catch (error) {
      message.error(error?.message || "Không thể công bố kết quả.");
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const advanceTeams = async (payload) => {
    if (!roundId || !canAdvance) return false;
    setIsAdvancing(true);
    try {
      await roundResultsService.advanceTeams(roundId, payload || buildAdvancePayload());
      message.success("Đã chốt danh sách chuyển vòng Chung kết.");
      await fetchResults({ silent: true });
      return true;
    } catch (error) {
      const code = error?.code || error?.response?.data?.code;
      if (code === "RESULT_NOT_PUBLISHED") {
        message.error("Cần công bố kết quả trước khi chốt chuyển vòng.");
      } else {
        message.error(error?.message || "Không thể chốt chuyển vòng.");
      }
      return false;
    } finally {
      setIsAdvancing(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => fetchResults(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchResults]);

  return {
    ranking,
    tiebreaks,
    wildcard,
    round,
    errors,
    isLoading,
    isRefreshing,
    isPublishing,
    isAdvancing,
    decidingReviewId,
    scoringLocked,
    isPublished,
    canPublish,
    canAdvance,
    buildAdvancePayload,
    fetchResults,
    decideWildcard,
    publishRound,
    advanceTeams,
  };
};

