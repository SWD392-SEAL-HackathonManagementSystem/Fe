import { useMemo } from 'react';
import { useAppContext } from '../../../app/AppContext';
import { CRITERIA_TYPES, MAX_WEIGHT_TOTAL } from '../constants/criteria.constants';

export const useHackathonValidation = (hackathonId) => {
  const { hackathons, tracks, rounds, criteria, events = [], assignments = [] } = useAppContext();

  const hackathon = useMemo(() => hackathons.find((h) => h.id === hackathonId), [hackathons, hackathonId]);

  // Lọc dữ liệu rounds
  const hackathonRounds = useMemo(() => rounds.filter((r) => r.hackathon_id === hackathonId), [rounds, hackathonId]);
  
  const prelimRounds = useMemo(() => hackathonRounds.filter(r => !r.is_final), [hackathonRounds]);
  const finalRounds = useMemo(() => hackathonRounds.filter(r => r.is_final), [hackathonRounds]);
  
  // 1. Validate số lượng Vòng thi
  const hasPrelim = prelimRounds.length >= 1;
  const hasFinal = finalRounds.length === 1;
  const hasCorrectRounds = hasPrelim && hasFinal;
  
  // 2. Validate Vòng Sơ loại có Bảng đấu không
  const prelimRoundsHaveTracks = useMemo(() => {
    if (prelimRounds.length === 0) return false;
    return prelimRounds.every(r => tracks.some(t => t.round_id === r.id));
  }, [prelimRounds, tracks]);

  // 3. Validate Trọng số và sự tồn tại của Tiêu chí
  const { weightErrors, missingCriteriaErrors } = useMemo(() => {
    const wErrors = [];
    const mErrors = [];

    hackathonRounds.forEach((r) => {
      if (r.is_final) {
        // Xét Vòng chung kết
        const finalCriteria = criteria.filter((c) => c.round_id === r.id && c.type !== CRITERIA_TYPES.PENALTY);
        if (finalCriteria.length === 0) {
          mErrors.push(`Vòng Chung kết chưa có tiêu chí đánh giá.`);
        } else {
          const totalWeight = finalCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
          if (Math.abs(totalWeight - MAX_WEIGHT_TOTAL) > 0.001) {
            wErrors.push(`Vòng Chung kết: Tổng trọng số đang là ${totalWeight.toFixed(2)}`);
          }
        }
      } else {
        // Xét Vòng sơ loại
        const rTracks = tracks.filter((t) => t.round_id === r.id);
        rTracks.forEach((t) => {
          const trackCriteria = criteria.filter((c) => c.track_id === t.id && c.type !== CRITERIA_TYPES.PENALTY);
          if (trackCriteria.length === 0) {
            mErrors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}) chưa có tiêu chí đánh giá.`);
          } else {
            const totalWeight = trackCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
            if (Math.abs(totalWeight - MAX_WEIGHT_TOTAL) > 0.001) {
              wErrors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}): Tổng trọng số đang là ${totalWeight.toFixed(2)}`);
            }
          }
        });
      }
    });

    return { weightErrors: wErrors, missingCriteriaErrors: mErrors };
  }, [hackathonRounds, criteria, tracks]);

  // 4. Validate sự kiện KICKOFF
  const hasKickoffEvent = useMemo(() => {
    return events.some(e => e.hackathon_id === hackathonId && e.type === 'KICKOFF');
  }, [events, hackathonId]);

  // 5. Validate Phân công Nhân sự (Mentor/Judge) sơ bộ
  const personnelErrors = useMemo(() => {
    const errors = [];
    const hAssignments = assignments.filter(a => a.hackathon_id === hackathonId);
    
    hackathonRounds.forEach((r) => {
      if (r.is_final) {
        // Chung kết: Phải có Judge (không có Mentor)
        const finalJudges = hAssignments.filter(a => a.round_id === r.id && a.type === 'JUDGE');
        if (finalJudges.length === 0) {
          errors.push(`Vòng Chung kết chưa được phân công Giám khảo (Judge).`);
        }
      } else {
        // Sơ loại: Mỗi Track phải có Mentor và Judge
        const rTracks = tracks.filter((t) => t.round_id === r.id);
        rTracks.forEach((t) => {
          const trackJudges = hAssignments.filter(a => a.track_id === t.id && a.type === 'JUDGE');
          const trackMentors = hAssignments.filter(a => a.track_id === t.id && a.type === 'MENTOR');
          
          if (trackJudges.length === 0) {
            errors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}) chưa phân công Giám khảo.`);
          }
          if (trackMentors.length === 0) {
            errors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}) chưa phân công Mentor.`);
          }
        });
      }
    });
    return errors;
  }, [assignments, hackathonId, hackathonRounds, tracks]);

  // Tính tổng số lỗi
  const totalErrors = useMemo(() => {
    let count = 0;
    if (!hasCorrectRounds || !prelimRoundsHaveTracks) count += 1;
    count += missingCriteriaErrors.length + weightErrors.length + personnelErrors.length;
    if (!hasKickoffEvent) count += 1;
    return count;
  }, [hasCorrectRounds, prelimRoundsHaveTracks, missingCriteriaErrors, weightErrors, personnelErrors, hasKickoffEvent]);
  
  const hasBlockingErrors = totalErrors > 0;

  return {
    hackathon,
    hasCorrectRounds,
    prelimRoundsHaveTracks,
    weightErrors,
    missingCriteriaErrors,
    personnelErrors,
    hasKickoffEvent,
    totalErrors,
    hasBlockingErrors,
  };
};
