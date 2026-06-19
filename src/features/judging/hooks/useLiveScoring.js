import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { message } from 'antd';
import { judgeService } from '../services/judgeService';
import { criteriaService } from '../../criteria/services/criteriaService';
import { roundService } from '../../rounds/services/roundService';
import {
  presentationService,
  findPresentingItem,
  SCORING_OPEN_TIMER_PHASES,
} from '../services/presentationService';
import {
  sortTeamsByPresentationQueue,
  groupMyScoresBySubmission,
  isSubmissionFullyScored,
  computeWeightedTotal,
  findTeamBySubmissionId,
  loadScoreDraft,
  saveScoreDraft,
  clearScoreDraft,
  mergeSavedAndDraftScores,
} from '../utils/liveScoringUtils';

/**
 * Custom hook quản lý logic phòng chấm thi (Live Scoring)
 * Xử lý tải danh sách đội, tiêu chí, tính điểm và submit điểm về hệ thống.
 */
export const useLiveScoring = (assignmentId, roundId, trackId, isFinal, options = {}) => {
  const {
    isCalibration = false,
    calibrationSessionId = null,
    sampleSubmissionId = null,
  } = options;

  const [teams, setTeams] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScores, setCurrentScores] = useState({});
  const [comment, setComment] = useState('');
  const [presentingItem, setPresentingItem] = useState(null);
  const [trackQueue, setTrackQueue] = useState(null);
  const [isTimerActionLoading, setIsTimerActionLoading] = useState(false);
  const [scoringLocked, setScoringLocked] = useState(false);
  const [savedScoresBySubmission, setSavedScoresBySubmission] = useState({});
  const [scoringStatus, setScoringStatus] = useState(null);
  const [isConfirmingScoring, setIsConfirmingScoring] = useState(false);
  const draftSaveTimerRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const pendingAutosaveRef = useRef(null);

  const scoreType = isCalibration ? 'CALIBRATION' : 'NORMAL';
  const skipPresentationQueue = isFinal && !isCalibration;

  const refreshPresentationScoringStatus = useCallback(async () => {
    if (!roundId || skipPresentationQueue) {
      return null;
    }

    try {
      const data = await judgeService.getPresentationScoringStatus(roundId, trackId);
      setScoringStatus(data);
      return data;
    } catch (error) {
      console.warn('Không tải được tiến độ xác nhận chấm:', error);
      return null;
    }
  }, [roundId, trackId, skipPresentationQueue]);

  const refreshPresentationQueue = useCallback(async () => {
    if (!roundId || skipPresentationQueue) {
      return null;
    }

    try {
      const queueData = await presentationService.getQueue(roundId, trackId);
      const { presentingItem: item, trackQueue: queue } = findPresentingItem(
        queueData,
        trackId
      );
      setPresentingItem(item);
      setTrackQueue(queue);
      setTeams((prev) => sortTeamsByPresentationQueue(prev, queue));
      await refreshPresentationScoringStatus();
      return { item, queue };
    } catch (error) {
      console.warn('Không tải được hàng đợi thuyết trình:', error);
      return null;
    }
  }, [roundId, trackId, skipPresentationQueue, refreshPresentationScoringStatus]);

  useEffect(() => {
    if (!roundId) {
      setScoringLocked(false);
      return;
    }

    roundService
      .getById(roundId)
      .then((round) => {
        setScoringLocked(Boolean(round?.scoringLocked ?? round?.scoring_locked));
      })
      .catch(() => setScoringLocked(false));
  }, [roundId]);

  const fetchScoringData = useCallback(async () => {
    const cleanParams = {};

    if (roundId) {
      cleanParams.roundId = roundId;
    }

    if (trackId) {
      cleanParams.trackId = trackId;
    }

    if (Object.keys(cleanParams).length === 0) {
      message.error('Lỗi dữ liệu: Không tìm thấy ID Vòng thi/Bảng đấu.');
      return;
    }

    setIsLoading(true);

    try {
      const resTeams = await judgeService.getSubmissions(cleanParams).catch(() => []);

      const rawTeamsData = Array.isArray(resTeams)
        ? resTeams
        : resTeams?.items || resTeams?.data || [];

      const mappedTeams = rawTeamsData.map((sub) => {
        const submissionId = sub.submissionId ?? sub.id;
        return {
          id: submissionId,
          submissionId,
          displayCode: sub.displayCode || `#${submissionId}`,
          name: sub.displayCode || `Bài #${submissionId}`,
          leader: sub.trackName || 'Track',
          status: 'PENDING',
          totalScore: 0,
          trackId: sub.trackId,
          submissionStatus: sub.status,
        };
      });

      let fetchedCriteria = [];
      let rawCriteria = [];

      if (isFinal && roundId) {
        rawCriteria = await criteriaService.listByFinalRound(roundId);
      } else if (trackId) {
        rawCriteria = await criteriaService.listByTrack(trackId);
      }

      fetchedCriteria = Array.isArray(rawCriteria)
        ? rawCriteria
        : rawCriteria?.items || rawCriteria?.data || [];

      setCriteria(fetchedCriteria);

      let savedBySubmission = {};
      if (roundId) {
        try {
          const resScores = await judgeService.getMyScores(roundId);
          const scoreRows = Array.isArray(resScores)
            ? resScores
            : resScores?.items || resScores?.data || [];
          savedBySubmission = groupMyScoresBySubmission(scoreRows);
          setSavedScoresBySubmission(savedBySubmission);
        } catch {
          setSavedScoresBySubmission({});
        }
      }

      const criteriaCount = fetchedCriteria.length;
      const teamsWithScores = mappedTeams.map((team) => {
        const fullyScored = isSubmissionFullyScored(
          team.submissionId,
          savedBySubmission,
          criteriaCount
        );
        const saved = savedBySubmission[team.submissionId];
        return {
          ...team,
          status: fullyScored ? 'SCORED' : 'PENDING',
          totalScore: fullyScored ? computeWeightedTotal(saved, fetchedCriteria) : 0,
        };
      });

      if (mappedTeams.length === 0) {
        console.warn('Chưa có đội thi nào nộp bài hoặc được phân công.');
      }

      if (isCalibration && sampleSubmissionId) {
        const calibrationTeam = {
          id: sampleSubmissionId,
          submissionId: sampleSubmissionId,
          name: `Calibration #${sampleSubmissionId}`,
          leader: 'Mẫu calibration',
          status: 'PENDING',
          totalScore: 0,
          trackId,
        };
        setTeams([calibrationTeam]);
        setSelectedTeam(calibrationTeam);
      } else {
        let queueResult = null;
        if (!skipPresentationQueue) {
          queueResult = await refreshPresentationQueue();
        }

        const orderedTeams = sortTeamsByPresentationQueue(
          teamsWithScores,
          queueResult?.queue || trackQueue
        );
        setTeams(orderedTeams);

        if (skipPresentationQueue) {
          if (orderedTeams.length > 0) {
            setSelectedTeam(orderedTeams[0]);
          }
        } else {
          const presenting = queueResult?.item;

          if (presenting) {
            const activeTeam = findTeamBySubmissionId(orderedTeams, presenting.submissionId);
            if (activeTeam) {
              setSelectedTeam(activeTeam);
            } else if (orderedTeams.length > 0) {
              setSelectedTeam(orderedTeams[0]);
            }
          } else if (orderedTeams.length > 0) {
            setSelectedTeam(orderedTeams[0]);
          }
        }
      }

      if (fetchedCriteria.length === 0) {
        message.warning('Vòng thi/Bảng đấu này chưa được cấu hình tiêu chí chấm điểm!');
      }
    } catch (error) {
      console.error('Lỗi fetch dữ liệu chấm:', error);
      message.error('Lỗi kết nối máy chủ khi lấy dữ liệu.');
      setCriteria([]);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, roundId, trackId, isFinal, isCalibration, sampleSubmissionId, skipPresentationQueue, refreshPresentationQueue]);

  useEffect(() => {
    fetchScoringData();
  }, [fetchScoringData]);

  useEffect(() => {
    if (!selectedTeam?.submissionId) {
      setCurrentScores({});
      setComment('');
      return;
    }

    const submissionId = selectedTeam.submissionId;
    const saved = savedScoresBySubmission[submissionId];
    const draft = loadScoreDraft(assignmentId, submissionId);

    if (selectedTeam.status === 'SCORED' && saved) {
      setCurrentScores(saved.scores);
      setComment(saved.comment || '');
      clearScoreDraft(assignmentId, submissionId);
      return;
    }

    const merged = mergeSavedAndDraftScores(saved, draft);
    if (Object.keys(merged.scores).length > 0 || merged.comment) {
      setCurrentScores(merged.scores);
      setComment(merged.comment);
    } else {
      setCurrentScores({});
      setComment('');
    }
  }, [assignmentId, selectedTeam?.submissionId, selectedTeam?.status, savedScoresBySubmission]);

  const persistScoreDraft = useCallback(
    (scores, draftComment) => {
      const submissionId = selectedTeam?.submissionId ?? selectedTeam?.id;
      if (!submissionId || selectedTeam?.status === 'SCORED') {
        return;
      }

      saveScoreDraft(assignmentId, submissionId, {
        scores,
        comment: draftComment,
      });
    },
    [assignmentId, selectedTeam?.submissionId, selectedTeam?.id, selectedTeam?.status]
  );

  useEffect(() => {
    const submissionId = selectedTeam?.submissionId ?? selectedTeam?.id;
    if (!submissionId || selectedTeam?.status === 'SCORED') {
      return undefined;
    }

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      persistScoreDraft(currentScores, comment);
    }, 300);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [currentScores, comment, persistScoreDraft, selectedTeam?.submissionId, selectedTeam?.id, selectedTeam?.status]);

  useEffect(() => {
    if (!roundId || isLoading || skipPresentationQueue) {
      return undefined;
    }

    const interval = setInterval(() => {
      refreshPresentationQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [roundId, isLoading, skipPresentationQueue, refreshPresentationQueue]);

  const timerPhase = presentingItem?.timer?.phase || 'IDLE';
  const timerRemainingSeconds = presentingItem?.timer?.remainingSeconds ?? 0;

  const scoringBlockReason = useMemo(() => {
    if (isCalibration || skipPresentationQueue) {
      if (scoringLocked) {
        return 'Vòng đã khóa chấm điểm (SCORING_LOCKED) — chỉ xem điểm.';
      }
      return null;
    }

    if (scoringLocked) {
      return 'Vòng đã khóa chấm điểm (SCORING_LOCKED) — chỉ xem điểm.';
    }

    if (!roundId) {
      return 'Thiếu roundId để đồng bộ hàng đợi thuyết trình.';
    }

    if (trackQueue && trackQueue.shuffled === false) {
      return 'Hàng đợi chưa được xáo trộn — Coordinator vào màn Hàng đợi thuyết trình để Xáo trộn.';
    }

    if (!presentingItem) {
      return 'Chưa có đội đang thuyết trình (PRESENTING) — vào Hàng đợi thuyết trình để shuffle và Start timer.';
    }

    if (!SCORING_OPEN_TIMER_PHASES.includes(timerPhase)) {
      if (timerPhase === 'SETUP') {
        return 'Đội đang chuyển tiếp — Presentation Controller cần bấm Start timer.';
      }
      return 'Chưa bắt đầu phiên thuyết trình — Presentation Controller cần Start timer.';
    }

    const selectedSubmissionId = selectedTeam?.submissionId ?? selectedTeam?.id;
    if (
      selectedSubmissionId &&
      presentingItem.submissionId &&
      selectedSubmissionId !== presentingItem.submissionId
    ) {
      return `Chỉ chấm đội đang thuyết trình: ${presentingItem.teamName || presentingItem.displayCode}.`;
    }

    return null;
  }, [isCalibration, skipPresentationQueue, scoringLocked, roundId, trackQueue, presentingItem, timerPhase, selectedTeam]);

  const canScore = !scoringLocked && !scoringBlockReason;

  const autosaveScoresToServer = useCallback(async () => {
    const submissionId = selectedTeam?.submissionId ?? selectedTeam?.id;
    if (!submissionId || isCalibration || selectedTeam?.status === 'SCORED' || !canScore) {
      return;
    }

    const payloadScores = pendingAutosaveRef.current?.scores ?? currentScores;
    const payloadComment = pendingAutosaveRef.current?.comment ?? comment;
    const entries = Object.entries(payloadScores).filter(([criterionId, value]) => {
      const numeric = Number(value);
      return !Number.isNaN(numeric) && numeric >= 0 && numeric < 10;
    });

    if (!entries.length) {
      return;
    }

    try {
      await Promise.all(
        entries.map(([criterionId, scoreValue]) =>
          judgeService.submitScore({
            submissionId,
            criterionId: Number(criterionId),
            scoreValue: Number(scoreValue),
            comment: payloadComment.trim(),
            scoreType,
          })
        )
      );

      const nextSavedEntry = {
        scores: { ...(savedScoresBySubmission[submissionId]?.scores ?? {}), ...payloadScores },
        comment: payloadComment.trim(),
      };

      setSavedScoresBySubmission((prev) => ({
        ...prev,
        [submissionId]: nextSavedEntry,
      }));
    } catch (error) {
      console.warn('Không thể tự động lưu điểm nháp:', error);
    }
  }, [
    selectedTeam,
    isCalibration,
    canScore,
    currentScores,
    comment,
    scoreType,
    savedScoresBySubmission,
  ]);

  useEffect(() => {
    const submissionId = selectedTeam?.submissionId ?? selectedTeam?.id;
    if (!submissionId || selectedTeam?.status === 'SCORED' || isCalibration || !canScore) {
      return undefined;
    }

    pendingAutosaveRef.current = { scores: currentScores, comment };

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      autosaveScoresToServer();
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    currentScores,
    comment,
    canScore,
    isCalibration,
    autosaveScoresToServer,
    selectedTeam?.submissionId,
    selectedTeam?.id,
    selectedTeam?.status,
  ]);

  const handleScoreChange = (criteriaId, value) => {
    setCurrentScores((prev) => ({
      ...prev,
      [criteriaId]: value,
    }));
  };

  const calculateTotalScore = () => {
    let total = 0;

    criteria.forEach((c) => {
      const rawScore = currentScores[c.id] || 0;
      total += rawScore * (c.weight || 0);
    });

    return total.toFixed(2);
  };

  const isCurrentlyScoring = useMemo(() => {
    const hasScores = Object.keys(currentScores).length > 0;
    const isNotScored = selectedTeam?.status !== 'SCORED';

    return hasScores && isNotScored;
  }, [currentScores, selectedTeam]);

  const runTimerAction = async (action) => {
    if (!roundId) {
      return;
    }

    setIsTimerActionLoading(true);
    try {
      await action();
      await refreshPresentationQueue();
    } catch (error) {
      message.error(error?.message || 'Không thể điều khiển timer thuyết trình.');
    } finally {
      setIsTimerActionLoading(false);
    }
  };

  const handleTimerToggle = () =>
    runTimerAction(async () => {
      if (timerPhase === 'PAUSED') {
        await presentationService.resumeTimer(roundId, trackId);
        return;
      }

      if (timerPhase === 'PRESENTING' || timerPhase === 'QA') {
        await presentationService.pauseTimer(roundId, trackId);
        return;
      }

      await presentationService.startTimer(roundId, trackId);
    });

  const handleStartQa = () =>
    runTimerAction(() => presentationService.qaTimer(roundId, trackId));

  const handleResetTimer = () =>
    runTimerAction(() => presentationService.resetTimer(roundId, trackId));

  const handleAdvanceNext = async () => {
    if (!roundId || !presentingItem?.submissionId) {
      message.warning('Chưa có đội đang thuyết trình để chuyển tiếp.');
      return;
    }

    if (!scoringStatus?.canAdvanceQueue) {
      const solo = (scoringStatus?.judgesAssigned ?? 0) <= 1;
      message.warning(
        solo
          ? 'Chưa chốt điểm đủ tiêu chí cho bài đang thuyết trình — hãy Chốt điểm trước khi bấm Đội tiếp.'
          : `Chưa đủ judge chấm xong (${scoringStatus?.judgesFullyScored ?? scoringStatus?.judgesScored ?? 0}/${scoringStatus?.judgesAssigned ?? 0}). Mỗi judge cần chấm đủ tiêu chí và Chốt điểm.`
      );
      return;
    }

    const runAdvance = async () => {
      await presentationService.advanceNext(roundId, trackId, {
        currentSubmissionId: presentingItem.submissionId,
      });
      const queueResult = await refreshPresentationQueue();
      const nextPresenting = queueResult?.item;
      if (nextPresenting?.submissionId) {
        setTeams((prevTeams) => {
          const ordered = sortTeamsByPresentationQueue(prevTeams, queueResult.queue);
          const nextTeam = findTeamBySubmissionId(ordered, nextPresenting.submissionId);
          if (nextTeam) {
            setSelectedTeam(nextTeam);
          }
          return ordered;
        });
      }
      message.success('Đã chuyển sang đội tiếp theo.');
    };

    setIsTimerActionLoading(true);
    try {
      await runAdvance();
    } catch (error) {
      message.error(error?.message || 'Không thể chuyển đội tiếp theo.');
    } finally {
      setIsTimerActionLoading(false);
    }
  };

  const submitFinalScore = async () => {
    if (!selectedTeam) {
      return;
    }

    if (!canScore) {
      return message.warning(
        scoringBlockReason ||
          (skipPresentationQueue
            ? 'Chưa thể chấm điểm — kiểm tra trạng thái vòng Chung kết.'
            : 'Chưa thể chấm điểm — kiểm tra hàng đợi và timer thuyết trình.')
      );
    }

    const missingCriteria = criteria.some((c) => currentScores[c.id] === undefined);

    if (missingCriteria) {
      return message.warning('Vui lòng chấm tất cả các tiêu chí trước khi chốt.');
    }

    const invalidScore = criteria.find((c) => {
      const val = Number(currentScores[c.id]);
      return Number.isNaN(val) || val < 0 || val >= 10;
    });
    if (invalidScore) {
      return message.warning('Điểm mỗi tiêu chí phải trong khoảng từ 0 đến nhỏ hơn 10.');
    }

    setIsSubmitting(true);

    try {
      if (isCalibration && calibrationSessionId) {
        const submitPromises = criteria.map((c) =>
          judgeService.submitCalibrationScore({
            calibrationSessionId,
            submissionId: selectedTeam.submissionId ?? selectedTeam.id,
            criterionId: c.id,
            scoreValue: currentScores[c.id] || 0,
            comment: comment.trim(),
          })
        );
        await Promise.all(submitPromises);
        message.success('Đã lưu điểm calibration!');
        setCurrentScores({});
        setComment('');
        return;
      }

      const submitPromises = criteria.map((c) => {
        const payload = {
          submissionId: selectedTeam.submissionId ?? selectedTeam.id,
          criterionId: c.id,
          scoreValue: currentScores[c.id] || 0,
          comment: comment.trim(),
          scoreType,
        };
        return judgeService.submitScore(payload);
      });

      await Promise.all(submitPromises);

      judgeService
        .updateScoringCompletion(assignmentId, 'IN_PROGRESS')
        .catch(() => {});

      const submissionId = selectedTeam.submissionId ?? selectedTeam.id;
      const savedEntry = {
        scores: { ...currentScores },
        comment: comment.trim(),
      };
      setSavedScoresBySubmission((prev) => ({
        ...prev,
        [submissionId]: savedEntry,
      }));

      const finalTotal = calculateTotalScore();

      message.success('Đã lưu toàn bộ điểm thành công!');

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === selectedTeam.id) {
            return {
              ...t,
              status: 'SCORED',
              totalScore: finalTotal,
            };
          }
          return t;
        })
      );
      setSelectedTeam((prev) =>
        prev && prev.id === selectedTeam.id
          ? {
              ...prev,
              status: 'SCORED',
              totalScore: finalTotal,
            }
          : prev
      );

      clearScoreDraft(assignmentId, submissionId);
      setCurrentScores({});
      setComment('');
      await refreshPresentationScoringStatus();
    } catch (error) {
      const status = error?.status || error?.response?.status;
      const code = error?.code;

      if (status === 423 || code === 423 || code === 'SCORING_LOCKED') {
        message.error('Vòng thi đã đóng sổ - không thể thao tác thêm!');
        setScoringLocked(true);
      } else if (code === 'SCORING_NOT_OPEN') {
        message.error(
          error?.message ||
            'Chưa mở cửa chấm điểm — kiểm tra hàng đợi PRESENTING và timer trên server.'
        );
        refreshPresentationQueue();
      } else {
        message.error(error?.message || 'Lỗi khi lưu điểm. Vui lòng thử lại!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmScoring = async () => {
    const submissionId =
      selectedTeam?.submissionId ??
      selectedTeam?.id ??
      presentingItem?.submissionId;
    if (!submissionId) {
      message.warning('Chưa chọn bài đang thuyết trình để xác nhận.');
      return;
    }

    setIsConfirmingScoring(true);
    try {
      await judgeService.confirmSubmissionScoring(submissionId);
      message.success('Đã xác nhận chấm xong bài này.');
      await refreshPresentationScoringStatus();
    } catch (error) {
      message.error(error?.message || 'Không thể xác nhận chấm xong.');
    } finally {
      setIsConfirmingScoring(false);
    }
  };

  const canAdvanceQueue = Boolean(scoringStatus?.canAdvanceQueue);
  const isPresentingSelected =
    (selectedTeam?.submissionId ?? selectedTeam?.id) === presentingItem?.submissionId;
  const canConfirmScoring =
    !skipPresentationQueue &&
    !isCalibration &&
    isPresentingSelected &&
    selectedTeam?.status === 'SCORED' &&
    !scoringStatus?.myConfirmed;

  return {
    teams,
    criteria,
    selectedTeam,
    setSelectedTeam,
    isLoading,
    isSubmitting,
    currentScores,
    handleScoreChange,
    comment,
    setComment,
    calculateTotalScore,
    submitFinalScore,
    isCurrentlyScoring,
    scoreType,
    presentingItem,
    timerPhase,
    timerRemainingSeconds,
    canScore,
    scoringBlockReason,
    handleTimerToggle,
    handleStartQa,
    handleResetTimer,
    handleAdvanceNext,
    isTimerActionLoading,
    refreshPresentationQueue,
    scoringLocked,
    isCalibration,
    trackQueue,
    presentingSubmissionId: presentingItem?.submissionId ?? null,
    scoringStatus,
    canAdvanceQueue,
  };
};
