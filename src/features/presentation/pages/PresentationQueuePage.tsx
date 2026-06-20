import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Typography, Spin, Alert, Segmented } from 'antd';
import { personBApi, PresentationQueueResponse, QueueTeam, QueueGroup } from '../../../api/personB.api';
import { presentationService } from '../../judging/services/presentationService';
import { roundService } from '../../rounds/services/roundService';
import { trackService } from '../../tracks/services/trackService';
import PresentationControllerCard from '../components/PresentationControllerCard';
import PresentationReadinessPanel from '../components/PresentationReadinessPanel';
import {
  COORD_TIMER_WARN_KEY,
  getPresentationRoleHints,
  getShuffleLockedWarning,
  getTimerPhaseBanner,
  shouldWarnShuffleWhenLocked,
} from '../utils/presentationWorkflow';
import { countGradableSubmissions } from '../utils/presentationSubmissionUtils';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

interface FlatTeam extends QueueTeam {
  group_name: string;
}

interface RoundDetail {
  scoringLocked?: boolean;
  scoring_locked?: boolean;
  isFinal?: boolean;
  is_final?: boolean;
}

interface PresentationControllerInfo {
  judgeId?: number;
  judge_id?: number;
  judgeName?: string;
  judge_name?: string;
  source?: string;
}

const PresentationQueuePage: React.FC = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role || '';
  const userId = userInfo.id ?? userInfo.userId;
  const isCoordinator = ['COORDINATOR', 'ADMIN'].includes(userRole);
  const isJudge = ['JUDGE', 'TEMP_JUDGE'].includes(userRole);

  const [searchParams, setSearchParams] = useSearchParams();
  const roundIdFromUrl = searchParams.get('roundId');
  const trackIdFromUrl = searchParams.get('trackId');

  const [localGroups, setLocalGroups] = useState<QueueGroup[]>([]);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(
    trackIdFromUrl ? Number(trackIdFromUrl) : null
  );

  useEffect(() => {
    if (roundIdFromUrl) {
      setRoundId(Number(roundIdFromUrl));
      return;
    }
    personBApi.resolveActiveRoundId().then((id) => {
      if (id) setRoundId(id);
    });
  }, [roundIdFromUrl]);

  const { data: queueData, isLoading, error, refetch } = useQuery<PresentationQueueResponse>({
    queryKey: ['presentationQueue', roundId],
    queryFn: async () => {
      try {
        return await personBApi.getPresentationQueue(roundId ?? undefined);
      } catch (err: any) {
        toast.error(`Lỗi tải thứ tự thuyết trình: ${err?.message || 'Không thể lấy dữ liệu'}`);
        throw err;
      }
    },
    enabled: roundId != null,
    retry: false
  });

  const { data: roundTracks = [] } = useQuery<any[]>({
    queryKey: ['roundTracks', roundId],
    queryFn: async () => {
      const data: any = await trackService.listByRound(roundId!);
      return Array.isArray(data) ? data : data?.items || [];
    },
    enabled: !!roundId,
  });

  const { data: roundSubmissions = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ['roundSubmissions', roundId],
    queryFn: () => personBApi.getRoundSubmissions(roundId!),
    enabled: !!roundId && isCoordinator,
  });

  const { data: roundDetail } = useQuery<RoundDetail>({
    queryKey: ['roundDetail', roundId],
    queryFn: () => roundService.getById(roundId!) as Promise<RoundDetail>,
    enabled: !!roundId,
  });

  const scoringLocked = Boolean(roundDetail?.scoringLocked ?? roundDetail?.scoring_locked);
  const isFinalRound = Boolean(roundDetail?.isFinal ?? roundDetail?.is_final);

  // Keep local groups in sync with query data
  useEffect(() => {
    if (queueData?.groups) {
      setLocalGroups(queueData.groups);
    }
  }, [queueData]);

  const trackTabs = useMemo(() => {
    if (localGroups.length > 0) {
      return localGroups.filter((g) => g.track_id != null);
    }
    return roundTracks.map((track: any) => ({
      group_name: track.name ?? track.trackName ?? `Track ${track.id}`,
      track_id: track.id,
      shuffled: false,
      teams: [] as QueueTeam[],
    }));
  }, [localGroups, roundTracks]);

  useEffect(() => {
    if (!trackTabs.length) return;
    const urlTrack = trackIdFromUrl ? Number(trackIdFromUrl) : null;
    const fromUrl = trackTabs.find((g) => g.track_id === urlTrack);
    if (fromUrl?.track_id) {
      setSelectedTrackId(fromUrl.track_id);
      return;
    }
    if (!selectedTrackId && trackTabs[0]?.track_id) {
      setSelectedTrackId(trackTabs[0].track_id);
    }
  }, [trackTabs, trackIdFromUrl, selectedTrackId]);

  const gradableOnSelectedTrack = useMemo(() => {
    if (!selectedTrackId) return 0;
    return countGradableSubmissions(
      roundSubmissions.filter((s) => s.track_id === selectedTrackId)
    );
  }, [roundSubmissions, selectedTrackId]);

  const trackSegmentOptions = useMemo(
    () =>
      trackTabs.map((g) => {
        const gradable = countGradableSubmissions(
          roundSubmissions.filter((s) => s.track_id === g.track_id)
        );
        const inQueue = g.teams.length;
        const suffix = isCoordinator
          ? ` (${gradable} vào queue${inQueue ? ` · ${inQueue} slot` : ''})`
          : '';
        return {
          label: `${g.group_name}${suffix}`,
          value: g.track_id!,
        };
      }),
    [trackTabs, roundSubmissions, isCoordinator]
  );

  const selectedGroup = useMemo(() => {
    if (!trackTabs.length) return null;
    return trackTabs.find((g) => g.track_id === selectedTrackId) || trackTabs[0];
  }, [trackTabs, selectedTrackId]);

  const handleTrackChange = (trackId: number) => {
    setSelectedTrackId(trackId);
    const next = new URLSearchParams(searchParams);
    next.set('trackId', String(trackId));
    if (roundId) next.set('roundId', String(roundId));
    setSearchParams(next, { replace: true });
  };

  // Teams scoped to selected track (not cross-track flatten)
  const flatTeams: FlatTeam[] = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.teams
      .map((t) => ({ ...t, group_name: selectedGroup.group_name }))
      .sort((a, b) => a.order - b.order);
  }, [selectedGroup]);

  const { data: controllerInfo } = useQuery<PresentationControllerInfo>({
    queryKey: ['presentationController', isFinalRound ? 'round' : 'track', isFinalRound ? roundId : selectedTrackId],
    queryFn: () =>
      (isFinalRound
        ? presentationService.getRoundController(roundId!)
        : presentationService.getTrackController(selectedTrackId!)) as Promise<PresentationControllerInfo>,
    enabled: isFinalRound ? !!roundId : !!selectedTrackId,
  });

  const controllerJudgeId = controllerInfo?.judgeId ?? controllerInfo?.judge_id;
  const isController =
    isCoordinator || (isJudge && controllerJudgeId != null && controllerJudgeId === userId);
  const roleHints = getPresentationRoleHints({
    role: userRole,
    isController,
    scoringLocked,
  });

  // Find currently presenting team
  const currentTeamIndex = flatTeams.findIndex((t) => t.status === 'PRESENTING');
  const currentTeam = currentTeamIndex !== -1 ? flatTeams[currentTeamIndex] : null;

  // Find first upcoming team in the queue if none is currently presenting
  const firstUpcomingTeam = flatTeams.find((t) => t.status === 'WAITING');

  // Find next team in queue (first WAITING team after current presenting team, or first WAITING team in general if none presenting)
  const nextTeam = currentTeamIndex !== -1
    ? flatTeams.slice(currentTeamIndex + 1).find(t => t.status === 'WAITING')
    : flatTeams.find(t => t.status === 'WAITING');

  const trackIds = useMemo(
    () =>
      trackTabs
        .map((g) => g.track_id)
        .filter((id): id is number => id != null),
    [trackTabs]
  );

  // =========================================================
  // LOGIC THÊM VÀO THEO YÊU CẦU: Khóa chỉnh sửa Hàng đợi
  // =========================================================
  const hasScoringStarted = useMemo(() => {
    const isQueueRunning = localGroups.some(g => 
      g.teams.some(t => t.status === 'PRESENTING' || t.status === 'DONE')
    );
    const isSubmissionGraded = roundSubmissions.some(s => 
      s.status === 'GRADED' || s.status === 'SCORING'
    );
    return isQueueRunning || isSubmissionGraded;
  }, [localGroups, roundSubmissions]);

  // isQueueConfigLocked = Chỉ dùng để cấm xáo trộn và cấm duyệt bài trễ.
  const isQueueConfigLocked = scoringLocked || hasScoringStarted;
  // =========================================================

  const handleRefreshAll = async () => {
    await Promise.all([refetch(), isCoordinator ? refetchSubmissions() : Promise.resolve()]);
  };

  const isQueueShuffled = useMemo(
    () => Boolean(selectedGroup?.shuffled),
    [selectedGroup?.shuffled]
  );

  const timerPhase = currentTeam?.timer?.phase || 'IDLE';
  const phaseBanner = getTimerPhaseBanner(timerPhase);
  const isPresentPhase = ['PRESENTING', 'PAUSED', 'SETUP'].includes(timerPhase);
  const isQaPhase = timerPhase === 'QA';
  const displaySeconds = currentTeam?.timer?.remainingSeconds ?? 0;

  useEffect(() => {
    if (!roundId) return undefined;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [roundId, refetch]);

  const shuffleMutation = useMutation({
    mutationFn: async (ids?: number[]) => {
      if (!roundId) throw new Error('Thiếu roundId');
      const trackIdsToShuffle = ids?.length ? ids : selectedTrackId ? [selectedTrackId] : trackIds;
      return personBApi.shufflePresentationQueue(roundId, trackIdsToShuffle.length ? trackIdsToShuffle : undefined);
    },
    onSuccess: async () => {
      toast.success('Đã xáo trộn hàng đợi thuyết trình.');
      await Promise.all([refetch(), isCoordinator ? refetchSubmissions() : Promise.resolve()]);
    },
    onError: (err: any) => {
      const code = err?.code || err?.response?.data?.error?.code;
      if (code === 'INVALID_STATE') {
        toast.error(err?.message || 'Trạng thái không hợp lệ — round có thể đã khóa.');
      } else {
        toast.error(err?.message || 'Không thể xáo trộn hàng đợi.');
      }
    },
  });

  const confirmCoordTimerAction = useCallback(() => {
    if (!roleHints.showTimerControls) return false;
    if (isCoordinator && roleHints.warningMessage && !sessionStorage.getItem(COORD_TIMER_WARN_KEY)) {
      const ok = window.confirm(`${roleHints.warningMessage}\n\nTiếp tục thao tác?`);
      if (!ok) return false;
      sessionStorage.setItem(COORD_TIMER_WARN_KEY, '1');
    }
    return true;
  }, [isCoordinator, roleHints]);

  const handleShuffleClick = (shuffleAll = false) => {
    // KHÓA XÁO TRỘN NẾU QUÁ TRÌNH CHẤM/THUYẾT TRÌNH ĐÃ BẮT ĐẦU
    if (isQueueConfigLocked) {
      toast.error('Quá trình chấm thi đang diễn ra, không thể xáo trộn hàng đợi.');
      return;
    }
    if (shouldWarnShuffleWhenLocked(scoringLocked)) {
      const ok = window.confirm(getShuffleLockedWarning());
      if (!ok) return;
    }
    const ids = shuffleAll ? trackIds : selectedTrackId ? [selectedTrackId] : trackIds;
    shuffleMutation.mutate(ids);
  };

  const handleShuffleAllClick = () => handleShuffleClick(true);

  const nextMutation = useMutation({
    mutationFn: async (options?: {
      currentSubmissionId?: number;
      currentTeamId?: string | number;
      acknowledgeIncompleteScoring?: boolean;
    }) => {
      return personBApi.triggerNextPresentation(roundId ?? undefined, options?.currentTeamId, {
        currentSubmissionId: options?.currentSubmissionId,
        trackId: currentTeam?.track_id,
        acknowledgeIncompleteScoring: options?.acknowledgeIncompleteScoring,
      });
    },
    onSuccess: async () => {
      toast.success('Đã chuyển đội tiếp theo trên hệ thống.');
      await refetch();
    },
    onError: (err: any) => {
      if (err?.code === 'SCORING_INCOMPLETE_BEFORE_NEXT') {
        const ack = window.confirm(
          `${err?.message || 'Chưa chấm đủ điểm.'}\n\nBạn có muốn chuyển đội tiếp theo anyway?`
        );
        if (ack && currentTeam) {
          nextMutation.mutate({
            currentSubmissionId: currentTeam.submission_id,
            currentTeamId: currentTeam.team_id,
            acknowledgeIncompleteScoring: true,
          });
        }
        return;
      }
      toast.error(err?.message || 'Không thể đồng bộ đội tiếp theo.');
    },
  });

  const handleStartQA = async () => {
    if (!roundId || !confirmCoordTimerAction()) return;
    try {
      await presentationService.qaTimer(roundId, currentTeam?.track_id);
      toast.success('Đã chuyển sang pha Q&A.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể chuyển sang Q&A.');
    }
  };

  const handleStartTimer = async () => {
    if (!roundId || !confirmCoordTimerAction()) return;
    try {
      const trackId = currentTeam?.track_id ?? selectedTrackId ?? trackIds[0];
      await presentationService.startTimer(roundId, trackId);
      toast.success('Đã bắt đầu timer thuyết trình.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể bắt đầu timer.');
    }
  };

  const handleStartQueue = async () => {
    if (!roundId || !confirmCoordTimerAction()) return;
    try {
      if (!isQueueShuffled || flatTeams.length === 0) {
        await shuffleMutation.mutateAsync(
          selectedTrackId ? [selectedTrackId] : trackIds
        );
      }
      const trackId = currentTeam?.track_id ?? selectedTrackId ?? trackIds[0];
      await presentationService.startTimer(roundId, trackId);
      toast.success('Đã bắt đầu timer thuyết trình.');
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể bắt đầu thuyết trình.');
    }
  };

  const handleNextTeam = () => {
    if (!confirmCoordTimerAction()) return;
    if (!nextTeam && !currentTeam) {
      toast.error('Đã đến đội cuối cùng trong hàng đợi.');
      return;
    }
    nextMutation.mutate({
      currentSubmissionId: currentTeam?.submission_id,
      currentTeamId: currentTeam?.team_id,
    });
  };

  // Timer display helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Time format helper for schedule display
  const formatTimeRange = (startStr?: string, endStr?: string) => {
    if (!startStr) return '';
    try {
      const start = new Date(startStr);
      const startH = String(start.getHours()).padStart(2, '0');
      const startM = String(start.getMinutes()).padStart(2, '0');
      
      if (endStr) {
        const end = new Date(endStr);
        const endH = String(end.getHours()).padStart(2, '0');
        const endM = String(end.getMinutes()).padStart(2, '0');
        return `${startH}:${startM} - ${endH}:${endM}`;
      }
      return `${startH}:${startM}`;
    } catch {
      return '';
    }
  };

  // Date format helper for schedule start
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const mins = String(d.getMinutes()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      
      return `${hours}:${mins} ngày ${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  const total = flatTeams.length;
  const done = flatTeams.filter((t) => t.status === 'DONE').length;
  const absent = flatTeams.filter((t) => t.status === 'ELIMINATED').length;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '20px' }}>
        
        {/* Title row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
            color: '#111827'
          }}>
            👥 Thứ Tự Thuyết Trình
          </h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {roleHints.showShuffle && (
              <>
                <button
                  onClick={() => handleShuffleClick(false)}
                  disabled={shuffleMutation.isPending || !roundId || isQueueConfigLocked}
                  title={
                    isQueueConfigLocked 
                      ? 'Hàng đợi đã bị khóa do vòng thi đang diễn ra' 
                      : (selectedTrackId ? `Xáo trộn track hiện tại (${gradableOnSelectedTrack} bài đủ điều kiện)` : 'Xáo trộn track hiện tại')
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    border: isQueueConfigLocked ? '1px solid #E5E7EB' : '1px solid #BBF7D0',
                    borderRadius: '8px',
                    background: isQueueConfigLocked ? '#F3F4F6' : '#DCFCE7',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: (shuffleMutation.isPending || isQueueConfigLocked) ? 'not-allowed' : 'pointer',
                    color: isQueueConfigLocked ? '#9CA3AF' : '#166534',
                    opacity: (shuffleMutation.isPending || isQueueConfigLocked) ? 0.7 : 1,
                  }}
                >
                  🔀 Xáo trộn track này
                </button>
                {trackIds.length > 1 && (
                  <button
                    onClick={handleShuffleAllClick}
                    disabled={shuffleMutation.isPending || !roundId || isQueueConfigLocked}
                    title={isQueueConfigLocked ? 'Hàng đợi đã bị khóa do vòng thi đang diễn ra' : 'Xáo trộn tất cả track'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      border: isQueueConfigLocked ? '1px solid #E5E7EB' : '1px solid #BFDBFE',
                      borderRadius: '8px',
                      background: isQueueConfigLocked ? '#F3F4F6' : '#EFF6FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: (shuffleMutation.isPending || isQueueConfigLocked) ? 'not-allowed' : 'pointer',
                      color: isQueueConfigLocked ? '#9CA3AF' : '#1D4ED8',
                      opacity: (shuffleMutation.isPending || isQueueConfigLocked) ? 0.7 : 1,
                    }}
                  >
                    🔀 Xáo trộn tất cả track
                  </button>
                )}
              </>
            )}
            <button 
            onClick={handleRefreshAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#374151',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            ↺ Làm mới
          </button>
          </div>
        </div>

        {/* Subtitle */}
        <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 10px 0' }}>
          Điều hành phòng thuyết trình và theo dõi thời gian trình bày, phản biện.
        </p>

        {trackTabs.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: 6 }}>
              Chọn track để xem hàng đợi và xáo trộn riêng từng phòng:
            </div>
            <Segmented
              block
              value={selectedTrackId ?? undefined}
              onChange={(value) => handleTrackChange(Number(value))}
              options={trackSegmentOptions}
            />
          </div>
        )}

        {isCoordinator && trackTabs.length <= 1 && roundTracks.length > 1 && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Hackathon có nhiều track"
            description="Đang tải danh sách track — nếu không thấy tab chuyển track, bấm Làm mới."
          />
        )}

        {roleHints.warningMessage && (
          <Alert
            type="info"
            showIcon
            message={roleHints.warningMessage}
            style={{ marginBottom: 12 }}
          />
        )}

        {scoringLocked && (
          <Alert
            type="warning"
            showIcon
            message="Round đã khóa chấm điểm"
            description="Xáo trộn/timer vẫn có thể thử — BE là gate cuối."
            style={{ marginBottom: 12 }}
          />
        )}

        {/* THÔNG BÁO VÒNG THI ĐANG DIỄN RA -> KHÓA HÀNG ĐỢI */}
        {hasScoringStarted && !scoringLocked && (
          <Alert
            type="warning"
            showIcon
            message="Quá trình chấm thi đang diễn ra"
            description="Hàng đợi thuyết trình đã được khóa để đảm bảo tính đồng bộ. Không thể xáo trộn hay duyệt thêm bài nộp trễ."
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Role badge */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: '#DCFCE7',
          border: '1px solid #BBF7D0',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#16A34A',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          ✦ VAI TRÒ: {userInfo.role || 'MENTOR'}
        </span>

      </div>

      {isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: '12px'
        }}>
          <Spin size="large" />
          <div style={{ color: '#6B7280', fontSize: '14px' }}>Đang tải thứ tự thuyết trình...</div>
        </div>
      ) : error ? (
        <div style={{
          background: 'white',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#DC2626', margin: '0 0 8px 0' }}>Lỗi kết nối máy chủ</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 16px 0' }}>{(error as any)?.message || 'Không thể tải thứ tự thuyết trình từ server'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button 
              onClick={() => refetch()} 
              style={{
                padding: '8px 16px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        /* LAYOUT TỔNG THỂ */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '16px',
          alignItems: 'start'
        }}>
          
          {/* CỘT TRÁI — QUEUE LIST */}
          <div>
            <PresentationReadinessPanel
              roundId={roundId}
              trackId={selectedTrackId}
              trackName={selectedGroup?.group_name}
              canReviewLate={isCoordinator && !isQueueConfigLocked} // TRUYỀN VÀO ĐỂ KHÓA TÍNH NĂNG DUYỆT TRỄ
              onReviewSuccess={handleRefreshAll}
            />

            {selectedGroup && selectedGroup.teams.length === 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Hàng đợi track này chưa được xáo trộn"
                description={
                  gradableOnSelectedTrack > 0
                    ? `Có ${gradableOnSelectedTrack} bài đủ điều kiện — bấm "Xáo trộn track này" để tạo thứ tự thuyết trình.`
                    : 'Chưa có bài đủ điều kiện (nộp đúng hạn hoặc đã duyệt trễ). Kiểm tra bảng tình trạng bài nộp phía trên.'
                }
              />
            )}

            {selectedGroup && (
              <div 
                key={selectedGroup.group_name}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                {/* Section header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  background: '#F9FAFB'
                }}>
                  👥 {selectedGroup.group_name}
                </div>

                {/* Danh sách đội */}
                {selectedGroup.teams.map((team, idx) => {
                  const isPresenting = team.status === 'PRESENTING';
                  const isDone = team.status === 'DONE';
                  const isEliminated = team.status === 'ELIMINATED';

                  // Row wrapper with bottom border separation
                  return (
                    <div 
                      key={`${team.submission_id ?? team.team_id}-${team.order}`}
                      style={{
                        borderBottom: idx < selectedGroup.teams.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}
                    >
                      {isPresenting ? (
                        /* Trạng thái 1: PRESENTING — đang thuyết trình */
                        <div style={{
                          padding: '12px 16px',
                          background: '#F0FDF4',
                          borderLeft: '3px solid #16A34A',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          {/* Số thứ tự */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#16A34A',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {team.order}
                          </div>

                          {/* Tên + ID */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {team.team_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', display: 'flex', gap: '8px' }}>
                              <span>Mã bài: {team.display_code || (team.submission_id ? `#${team.submission_id}` : 'N/A')}</span>
                              {team.slot_start_at && (
                                <span style={{ color: '#4B5563', fontWeight: 500 }}>
                                  ⏱ {formatTimeRange(team.slot_start_at, team.slot_end_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge "Đang Thuyết Trình" */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 12px',
                            background: '#16A34A',
                            color: 'white',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            ● Đang Thuyết Trình
                          </span>
                        </div>
                      ) : isEliminated ? (
                        /* Trạng thái 3: ELIMINATED — bị loại */
                        <div style={{
                          padding: '12px 16px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: 0.6
                        }}>
                          {/* Số thứ tự */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#FEE2E2',
                            color: '#EF4444',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {team.order}
                          </div>

                          {/* Tên + ID */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF', textDecoration: 'line-through' }}>
                              {team.team_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '8px' }}>
                              <span>Mã bài: {team.display_code || (team.submission_id ? `#${team.submission_id}` : 'N/A')}</span>
                              {team.slot_start_at && (
                                <span style={{ color: '#9CA3AF' }}>
                                  ⏱ {formatTimeRange(team.slot_start_at, team.slot_end_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge */}
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                            ELIMINATED
                          </span>
                        </div>
                      ) : isDone ? (
                        /* Trạng thái Hoàn thành */
                        <div style={{
                          padding: '12px 16px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: 0.7
                        }}>
                          {/* Số thứ tự */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#E5E7EB',
                            color: '#9CA3AF',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {team.order}
                          </div>

                          {/* Tên + ID */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF' }}>
                              {team.team_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '8px' }}>
                              <span>Mã bài: {team.display_code || (team.submission_id ? `#${team.submission_id}` : 'N/A')}</span>
                              {team.slot_start_at && (
                                <span style={{ color: '#9CA3AF' }}>
                                  ⏱ {formatTimeRange(team.slot_start_at, team.slot_end_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge */}
                          <span style={{ color: '#16A34A', fontSize: '12px', fontWeight: 600 }}>
                            ✓ Hoàn Thành
                          </span>
                        </div>
                      ) : (
                        /* Trạng thái 2: WAITING — chờ đợi */
                        <div style={{
                          padding: '12px 16px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          {/* Số thứ tự */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#F3F4F6',
                            color: '#6B7280',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {team.order}
                          </div>

                          {/* Tên + ID */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {team.team_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', display: 'flex', gap: '8px' }}>
                              <span>Mã bài: {team.display_code || (team.submission_id ? `#${team.submission_id}` : 'N/A')}</span>
                              {team.slot_start_at && (
                                <span style={{ color: '#4B5563' }}>
                                  ⏱ {formatTimeRange(team.slot_start_at, team.slot_end_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge "Chờ Đợi" */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 12px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#6B7280',
                          }}>
                            ⏱ Chờ Đợi
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CỘT PHẢI — PANEL */}
          <div>
            <PresentationControllerCard
              trackId={selectedTrackId}
              roundId={roundId}
              mode={isFinalRound ? 'round' : 'track'}
              canGrant={isCoordinator}
            />

            {phaseBanner && (
              <Alert
                type={phaseBanner.type as 'info' | 'warning' | 'success'}
                message={phaseBanner.text}
                style={{ marginBottom: 12 }}
                showIcon
              />
            )}
            
            {/* Card 1: Đội đang thuyết trình — dark card */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              marginBottom: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>

              {/* Label nhỏ */}
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                {currentTeam ? 'ĐỘI ĐANG THUYẾT TRÌNH' : 'PHÒNG THUYẾT TRÌNH CHƯA BẮT ĐẦU'}
              </div>

              {/* Tên đội to */}
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                lineHeight: 1.3,
                marginBottom: '12px',
                wordBreak: 'break-word'
              }}>
                {currentTeam 
                  ? currentTeam.team_name 
                  : (firstUpcomingTeam ? firstUpcomingTeam.team_name : '--- Không có ---')}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span style={{
                  padding: '3px 10px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {currentTeam 
                    ? (isQaPhase ? 'Hỏi & Đáp' : isPresentPhase ? 'Thuyết Trình' : timerPhase)
                    : 'Chưa Bắt Đầu'}
                </span>
                <span style={{
                  padding: '3px 10px',
                  background: currentTeam ? '#16A34A' : '#4B5563',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {currentTeam ? 'Active Slot' : 'Dự Kiến'}
                </span>
              </div>

              {/* Timer + ID grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#94A3B8',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {currentTeam ? 'THỜI GIAN CÒN LẠI' : 'DỰ KIẾN BẮT ĐẦU'}
                  </div>
                  <div style={{
                    fontSize: currentTeam ? '28px' : '13px',
                    fontWeight: 800,
                    fontFamily: currentTeam ? 'monospace' : 'inherit',
                    color: 'white',
                    lineHeight: currentTeam ? 'inherit' : '24px'
                  }}>
                    {currentTeam 
                      ? formatTime(displaySeconds) 
                      : (firstUpcomingTeam && firstUpcomingTeam.slot_start_at 
                          ? formatDateTime(firstUpcomingTeam.slot_start_at) 
                          : 'N/A')}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#94A3B8',
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    MÃ BÀI
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {currentTeam
                      ? currentTeam.display_code || (currentTeam.submission_id ? `#${currentTeam.submission_id}` : 'N/A')
                      : firstUpcomingTeam
                        ? firstUpcomingTeam.display_code || (firstUpcomingTeam.submission_id ? `#${firstUpcomingTeam.submission_id}` : 'N/A')
                        : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Nút điều khiển — Coord hỗ trợ / Judge controller */}
              {roleHints.showTimerControls && (
                currentTeam ? (
                  timerPhase === 'IDLE' || timerPhase === 'SETUP' ? (
                    <button
                      onClick={handleStartTimer}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#16A34A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(22,163,74,0.3)',
                      }}
                    >
                      ▶ Bắt đầu timer
                    </button>
                  ) : (timerPhase === 'PRESENTING' || timerPhase === 'PAUSED') && !isQaPhase ? (
                    <button 
                      onClick={handleStartQA}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#16A34A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
                      }}
                    >
                      ⏱ Bắt đầu phản biện
                    </button>
                  ) : (
                    <button 
                      onClick={handleNextTeam}
                      disabled={!nextTeam}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: nextTeam ? 'pointer' : 'not-allowed',
                        opacity: nextTeam ? 1 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: nextTeam ? '0 2px 4px rgba(59,130,246,0.3)' : 'none'
                      }}
                    >
                      ⏭ Đội tiếp theo
                    </button>
                  )
                ) : (
                  (currentTeam || firstUpcomingTeam) && (
                    <button 
                      onClick={handleStartQueue}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#16A34A',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
                      }}
                    >
                      ▶ Bắt đầu thuyết trình
                    </button>
                  )
                )
              )}

              {/* Phân quyền Mentor/Judge hiển thị thông tin chờ đợi */}
              {!isCoordinator && !currentTeam && firstUpcomingTeam && (
                <div style={{
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#94A3B8'
                }}>
                  ⏱ Chờ ban tổ chức bắt đầu thuyết trình...
                </div>
              )}

            </div>

            {/* Card 2: Trạng thái phòng */}
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1F2937' }}>
                Trạng thái phòng
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#6B7280' }}>Tổng số đội</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#6B7280' }}>Đã hoàn thành</span>
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>{done}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#6B7280' }}>Vắng mặt</span>
                  <span style={{ fontWeight: 700, color: '#EF4444' }}>{absent}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                height: '6px',
                background: '#F3F4F6',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '4px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: '#16A34A',
                  borderRadius: '999px',
                  transition: 'width 500ms ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'right' }}>
                Tiến độ: {progressPercent}%
              </div>
            </div>

            {/* Card 3: Banner ảnh bottom */}
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              height: '120px',
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <img 
                src="/banner-hackathon.jpg" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="Hackathon Room Banner"
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '12px',
              }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>
                  PHÒNG HỘI THẢO A1
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                  Tầng 12, Toa nhà Công nghệ
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default PresentationQueuePage;