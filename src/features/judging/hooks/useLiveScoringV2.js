// src/features/judging/hooks/useLiveScoringV2.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { message } from 'antd';
import { judgeService } from '../services/judgeService';
import { criteriaService } from '../../criteria/services/criteriaService';
import { presentationService } from '../services/presentationService';

export const useLiveScoringV2 = (assignmentId, roundId, trackId, isFinal, initialAssignmentType) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const currentUserId = userInfo.userId || userInfo.id;

  const [queueData, setQueueData] = useState(null);
  const [submissionsData, setSubmissionsData] = useState([]);
  const [criteria, setCriteria] = useState([]);
  
  // State lưu trữ Form
  const [currentScores, setCurrentScores] = useState({});
  const [comment, setComment] = useState('');
  
  // State quản lý Điểm đã chốt từ Backend
  const [rawMyScores, setRawMyScores] = useState([]);
  const [myScoredSubmissions, setMyScoredSubmissions] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoringLocked, setScoringLocked] = useState(false);
  const [isTimerActionLoading, setIsTimerActionLoading] = useState(false);

  // KHÓA MUTEX: Chặn tuyệt đối "Bóng ma" UI khi đang thao tác
  const isActionPendingRef = useRef(false);

  const [isController, setIsController] = useState(() => {
    const role = String(initialAssignmentType || '').toUpperCase();
    return role.includes('HEAD') || role.includes('FINAL_EXTERNAL');
  });

  const [localTimerPhase, setLocalTimerPhase] = useState('IDLE');
  const [localRemainingSeconds, setLocalRemainingSeconds] = useState(0);

  // 1. KIỂM TRA QUYỀN TRƯỞNG BAN
  const fetchControllerStatus = useCallback(async () => {
    if (!roundId) return;
    try {
      const res = isFinal ? await presentationService.getRoundController(roundId) : await presentationService.getTrackController(trackId);
      const data = res?.data || res;
      const controllerId = data?.judgeId ?? data?.judge_id ?? data?.judge?.id ?? data?.user?.id ?? data?.id;
      if (controllerId && currentUserId) setIsController(Number(currentUserId) === Number(controllerId));
    } catch (e) {}
  }, [roundId, trackId, isFinal, currentUserId]);

  // 2. TẢI DỮ LIỆU TĨNH VÀ ĐIỂM ĐÃ CHẤM TỪ DB (GIẢI QUYẾT LỖI MẤT ĐIỂM F5)
  const fetchStaticData = useCallback(async () => {
    try {
      const [critRes, subRes, myScoresRes] = await Promise.all([
        isFinal ? criteriaService.listByFinalRound(roundId) : criteriaService.listByTrack(trackId),
        judgeService.getSubmissions({ roundId, trackId: isFinal ? undefined : trackId }),
        judgeService.getMyScores(roundId).catch(() => []) 
      ]);

      const critData = Array.isArray(critRes) ? critRes : critRes?.items || [];
      setCriteria(critData);
      setSubmissionsData(Array.isArray(subRes) ? subRes : subRes?.items || subRes?.data || []);

      const scoresData = Array.isArray(myScoresRes) ? myScoresRes : myScoresRes?.items || myScoresRes?.data || [];
      setRawMyScores(scoresData); // Lưu lại điểm thô để lát đổ vào Form

      // Tính tổng điểm cho Sidebar
      const weightMap = {};
      critData.forEach(c => weightMap[c.id] = c.weight || 0);

      const scoredMap = {};
      scoresData.forEach(s => {
        const subId = String(s.submissionId ?? s.submission_id);
        const critId = String(s.criterionId ?? s.criterion_id);
        const val = Number(s.scoreValue ?? s.score_value ?? 0);
        if (!scoredMap[subId]) scoredMap[subId] = 0;
        scoredMap[subId] += val * (weightMap[critId] || 0);
      });

      const finalScoredMap = {};
      Object.keys(scoredMap).forEach(subId => { finalScoredMap[subId] = scoredMap[subId].toFixed(2); });
      setMyScoredSubmissions(finalScoredMap);

    } catch (error) {}
  }, [roundId, trackId, isFinal]);

  // 3. TẢI HÀNG ĐỢI REAL-TIME (CÓ CHỐT KHÓA BÓNG MA)
  const fetchQueue = useCallback(async (force = false) => {
    // Nếu Trưởng ban đang bấm nút, CHẶN KHÔNG CHO TẢI NGẦM (Trừ khi ép buộc `force = true`)
    if (!roundId || (!force && isActionPendingRef.current)) return;
    
    try {
      const qRes = await presentationService.getQueue(roundId, isFinal ? null : trackId);
      const qData = qRes?.data || qRes;
      setQueueData(qData);

      const track = isFinal ? qData.groups?.[0] : qData.tracks?.find(t => t.trackId === Number(trackId));
      const presenting = (track?.items || track?.teams || []).find(item => item.status === 'PRESENTING');
      
      if (presenting?.timer) {
        setLocalTimerPhase(presenting.timer.phase);
        setLocalRemainingSeconds(presenting.timer.remainingSeconds);
      } else {
        setLocalTimerPhase('IDLE');
        setLocalRemainingSeconds(0);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [roundId, trackId, isFinal]);

  useEffect(() => {
    fetchControllerStatus();
    fetchStaticData();
    fetchQueue(true);
    const interval = setInterval(() => fetchQueue(false), 3000);
    return () => clearInterval(interval);
  }, [fetchControllerStatus, fetchStaticData, fetchQueue]);

  // ĐỒNG HỒ ĐẾM TỪNG GIÂY
  useEffect(() => {
    let ticker = null;
    if (localTimerPhase === 'PRESENTING' || localTimerPhase === 'QA') {
      ticker = setInterval(() => {
        setLocalRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(ticker);
  }, [localTimerPhase]);

  const { trackQueue, activeSlot } = useMemo(() => {
    if (!queueData) return { trackQueue: [], activeSlot: null };
    const track = isFinal ? queueData.groups?.[0] : queueData.tracks?.find(t => t.trackId === Number(trackId));
    let queueItems = track?.items || track?.teams || [];
    queueItems = queueItems.map(item => {
      const subInfo = submissionsData.find(s => s.submissionId === item.submissionId) || {};
      return { ...item, slideFile: subInfo.slideFile, repoUrl: subInfo.repoUrl };
    });
    return { trackQueue: queueItems, activeSlot: queueItems.find(item => item.status === 'PRESENTING') };
  }, [queueData, submissionsData, trackId, isFinal]);

  // KIỂM TRA TOÀN BỘ ĐỘI ĐÃ HOÀN THÀNH CHƯA (Hiển thị màn hình Chúc mừng)
  const isAllDone = trackQueue.length > 0 && trackQueue.every(item => item.status === 'DONE');

  // ĐỘI NÀY ĐÃ ĐƯỢC MÌNH CHẤM CHƯA?
  const hasScoredCurrentTeam = useMemo(() => {
    if (!activeSlot?.submissionId) return false;
    return !!myScoredSubmissions[String(activeSlot.submissionId)];
  }, [activeSlot, myScoredSubmissions]);

  // 4. LOGIC LƯU NHÁP (LOCAL STORAGE) & ĐỔI DB VÀO FORM
  useEffect(() => {
    if (!activeSlot?.submissionId) return;
    const subIdStr = String(activeSlot.submissionId);

    if (hasScoredCurrentTeam) {
      // Đã chốt -> Lấy điểm gốc từ Database đổ vào Form (Xem lại)
      const dbScores = {};
      let dbComment = '';
      rawMyScores.forEach(s => {
        if (String(s.submissionId ?? s.submission_id) === subIdStr) {
          dbScores[String(s.criterionId ?? s.criterion_id)] = Number(s.scoreValue ?? s.score_value);
          if (s.comment) dbComment = s.comment;
        }
      });
      setCurrentScores(dbScores);
      setComment(dbComment);
    } else {
      // Chưa chốt -> Lấy điểm Nháp từ Local Storage (Chống mất khi F5)
      const draftKey = `seal_draft_${assignmentId}_${subIdStr}`;
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey));
        if (draft) {
          setCurrentScores(draft.scores || {});
          setComment(draft.comment || '');
        } else {
          setCurrentScores({});
          setComment('');
        }
      } catch(e) {
        setCurrentScores({});
        setComment('');
      }
    }
  }, [activeSlot?.submissionId, hasScoredCurrentTeam, rawMyScores, assignmentId]);

  // Tự động Lưu Nháp mỗi khi gõ phím
  useEffect(() => {
    if (!activeSlot?.submissionId || hasScoredCurrentTeam) return;
    const subIdStr = String(activeSlot.submissionId);
    const draftKey = `seal_draft_${assignmentId}_${subIdStr}`;
    localStorage.setItem(draftKey, JSON.stringify({ scores: currentScores, comment }));
  }, [currentScores, comment, activeSlot?.submissionId, hasScoredCurrentTeam, assignmentId]);

  const canScore = !scoringLocked && activeSlot; 
  const canSubmitFinalScore = canScore && ['QA', 'ENDED'].includes(localTimerPhase) && !hasScoredCurrentTeam;

  const handleScoreChange = (criteriaId, value) => setCurrentScores(prev => ({ ...prev, [criteriaId]: value }));

  const calculateTotal = () => criteria.reduce((sum, c) => sum + (currentScores[c.id] || 0) * (c.weight || 0), 0).toFixed(2);

  // 5. CHỐT ĐIỂM LÊN SERVER
  const submitScore = async () => {
    if (hasScoredCurrentTeam) return message.error("Bài thi này đã được chốt, không thể thay đổi điểm.");
    if (!canSubmitFinalScore) return;
    if (criteria.some(c => currentScores[c.id] === undefined)) return message.warning("Vui lòng chấm đủ tiêu chí.");
    
    setIsSubmitting(true);
    try {
      const promises = criteria.map(c => judgeService.submitScore({
        submissionId: activeSlot.submissionId, criterionId: c.id, scoreValue: currentScores[c.id] || 0, comment: comment.trim(), scoreType: 'NORMAL'
      }));
      await Promise.all(promises);
      await judgeService.confirmSubmissionScoring(activeSlot.submissionId);
      
      message.success("Chốt điểm thành công! Form đã được khóa.");
      
      // Xóa Nháp LocalStorage
      localStorage.removeItem(`seal_draft_${assignmentId}_${activeSlot.submissionId}`);
      
      // Load lại Database điểm
      await fetchStaticData();
      await fetchQueue(true); 
    } catch (error) { message.error(error.message || "Lỗi lưu điểm."); } finally { setIsSubmitting(false); }
  };

  // 6. ĐIỀU KHIỂN ĐỒNG HỒ (SỬA LỖI BÓNG MA 100%)
  const handleTimerAction = async (actionType) => {
    if (!isController || !activeSlot) return;
    
    isActionPendingRef.current = true; // BẬT KHÓA MUTEX: Ép Server chờ
    setIsTimerActionLoading(true);
    const previousPhase = localTimerPhase;
    
    try {
      if (actionType === 'START_OR_RESUME') {
        setLocalTimerPhase('PRESENTING'); 
        if (previousPhase === 'PAUSED') await presentationService.resumeTimer(roundId, trackId);
        else await presentationService.startTimer(roundId, trackId);
      } 
      else if (actionType === 'PAUSE') {
        setLocalTimerPhase('PAUSED'); // DỪNG UI NGAY LẬP TỨC
        await presentationService.pauseTimer(roundId, trackId);
      } 
      else if (actionType === 'QA') {
        setLocalTimerPhase('QA'); 
        await presentationService.qaTimer(roundId, trackId);
      } 
      else if (actionType === 'NEXT') {
        await presentationService.advanceNext(roundId, trackId, { currentSubmissionId: activeSlot.submissionId });
      }
      message.success('Thao tác thành công!');
    } catch (error) {
      setLocalTimerPhase(previousPhase); // Rollback nếu lỗi
      message.error(error?.response?.data?.error?.message || error.message || 'Lỗi điều khiển đồng hồ.');
    } finally {
      // SAU KHI SERVER TRẢ VỀ -> ÉP TẢI LẠI SỐ GIÂY CHUẨN TỪ DB
      await fetchQueue(true); 
      isActionPendingRef.current = false; // MỞ KHÓA MUTEX
      setIsTimerActionLoading(false);
    }
  };

  return {
    isLoading, criteria, currentScores, comment, setComment, handleScoreChange, calculateTotal, submitScore, isSubmitting, 
    trackQueue, activeSlot, localTimerPhase, localRemainingSeconds, canScore, canSubmitFinalScore, isController, handleTimerAction, isTimerActionLoading,
    myScoredSubmissions, hasScoredCurrentTeam, isAllDone // <-- Trả thêm cờ isAllDone
  };
};