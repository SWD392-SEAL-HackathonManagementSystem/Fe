import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { judgeService } from '../services/judgeService';
import { criteriaService } from '../../criteria/services/criteriaService';
import { roundService } from '../../rounds/services/roundService';
import {
  presentationService,
  findPresentingItem,
  SCORING_OPEN_TIMER_PHASES,
} from '../services/presentationService';

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

  const scoreType = isCalibration ? 'CALIBRATION' : 'NORMAL';

  const refreshPresentationQueue = useCallback(async () => {
    if (!roundId) {
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
      return { item, queue };
    } catch (error) {
      console.warn('Không tải được hàng đợi thuyết trình:', error);
      return null;
    }
  }, [roundId, trackId]);

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
          name: sub.teamName || sub.displayCode || `Bài #${submissionId}`,
          leader: sub.leaderName || 'Trưởng nhóm',
          status: sub.status === 'SCORED' || sub.isScoredByMe ? 'SCORED' : 'PENDING',
          totalScore: sub.totalScore || sub.weightedAverageScore || 0,
          trackId: sub.trackId,
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
        setTeams(mappedTeams);

        const queueResult = await refreshPresentationQueue();
        const presenting = queueResult?.item;

        if (presenting) {
          const activeTeam = mappedTeams.find(
            (team) => team.submissionId === presenting.submissionId
          );
          if (activeTeam) {
            setSelectedTeam(activeTeam);
          } else if (mappedTeams.length > 0) {
            setSelectedTeam(mappedTeams[0]);
          }
        } else if (mappedTeams.length > 0) {
          setSelectedTeam(mappedTeams[0]);
        }
      }

      if (roundId) {
        judgeService
          .getMyScores(roundId)
          .then((resScores) => {
            console.log('Dữ liệu điểm đã chấm:', resScores);
          })
          .catch(() => {});
      }

      let rawCriteria = [];

      if (isFinal && roundId) {
        rawCriteria = await criteriaService.listByFinalRound(roundId);
      } else if (trackId) {
        rawCriteria = await criteriaService.listByTrack(trackId);
      }

      const fetchedCriteria = Array.isArray(rawCriteria)
        ? rawCriteria
        : rawCriteria?.items || rawCriteria?.data || [];

      setCriteria(fetchedCriteria);

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
  }, [assignmentId, roundId, trackId, isFinal, isCalibration, sampleSubmissionId, refreshPresentationQueue]);

  useEffect(() => {
    fetchScoringData();
  }, [fetchScoringData]);

  useEffect(() => {
    if (!roundId || isLoading) {
      return undefined;
    }

    const interval = setInterval(() => {
      refreshPresentationQueue();
    }, 3000);

    return () => clearInterval(interval);
  }, [roundId, isLoading, refreshPresentationQueue]);

  const timerPhase = presentingItem?.timer?.phase || 'IDLE';
  const timerRemainingSeconds = presentingItem?.timer?.remainingSeconds ?? 0;

  const scoringBlockReason = useMemo(() => {
    if (isCalibration) {
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
  }, [isCalibration, scoringLocked, roundId, trackQueue, presentingItem, timerPhase, selectedTeam]);

  const canScore = !scoringLocked && !scoringBlockReason;

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

    const runAdvance = async (acknowledgeIncompleteScoring = false) => {
      await presentationService.advanceNext(roundId, trackId, {
        currentSubmissionId: presentingItem.submissionId,
        ...(acknowledgeIncompleteScoring ? { acknowledgeIncompleteScoring: true } : {}),
      });
      await refreshPresentationQueue();
      message.success('Đã chuyển sang đội tiếp theo.');
    };

    setIsTimerActionLoading(true);
    try {
      await runAdvance(false);
    } catch (error) {
      const code = error?.code || error?.response?.data?.code;
      if (code === 'SCORING_INCOMPLETE_BEFORE_NEXT') {
        const ack = window.confirm(
          `${error?.message || 'Chưa chấm đủ điểm.'}\n\nChuyển đội tiếp theo anyway?`
        );
        if (ack) {
          try {
            await runAdvance(true);
          } catch (retryError) {
            message.error(retryError?.message || 'Không thể chuyển đội tiếp theo.');
          }
        }
      } else {
        message.error(error?.message || 'Không thể chuyển đội tiếp theo.');
      }
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
        scoringBlockReason || 'Chưa thể chấm điểm — kiểm tra hàng đợi và timer thuyết trình.'
      );
    }

    const missingCriteria = criteria.some((c) => currentScores[c.id] === undefined);

    if (missingCriteria) {
      return message.warning('Vui lòng chấm tất cả các tiêu chí trước khi chốt.');
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

      message.success('Đã lưu toàn bộ điểm thành công!');

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === selectedTeam.id) {
            return {
              ...t,
              status: 'SCORED',
              totalScore: calculateTotalScore(),
            };
          }
          return t;
        })
      );

      setCurrentScores({});
      setComment('');
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
  };
};
