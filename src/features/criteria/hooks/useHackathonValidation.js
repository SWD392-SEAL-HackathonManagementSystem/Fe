import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../../app/AppContext';
import { CRITERIA_TYPES, MAX_WEIGHT_TOTAL } from '../constants/criteria.constants';
import { criteriaApi } from '../api/criteria.api';

export const useHackathonValidation = (hackathonId) => {
  const { hackathons, tracks, rounds, events = [], assignments = [] } = useAppContext();

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

  // 3. Validate Trọng số và sự tồn tại của Tiêu chí qua API
  const [weightErrors, setWeightErrors] = useState([]);
  const [missingCriteriaErrors, setMissingCriteriaErrors] = useState([]);
  const [isValidatingCriteria, setIsValidatingCriteria] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateCriteria = async () => {
      if (hackathonRounds.length === 0) {
        if (isMounted) {
          setWeightErrors([]);
          setMissingCriteriaErrors([]);
        }
        return;
      }

      setIsValidatingCriteria(true);
      const wErrors = [];
      const mErrors = [];

      try {
        const promises = [];
        
        hackathonRounds.forEach((r) => {
          if (r.is_final) {
            promises.push(
              criteriaApi.getWeightSummary(r.id, null).then(res => {
                const summary = res.data;
                if (!summary || summary.items.length === 0) {
                  mErrors.push(`Vòng Chung kết chưa có tiêu chí đánh giá.`);
                } else if (summary.status === 'WARN') {
                  wErrors.push(`Vòng Chung kết: Tổng trọng số đang là ${summary.total.toFixed(2)}`);
                }
              }).catch(() => {
                mErrors.push(`Không thể kiểm tra tiêu chí Vòng Chung kết (Lỗi API).`);
              })
            );
          } else {
            const rTracks = tracks.filter((t) => t.round_id === r.id);
            rTracks.forEach((t) => {
              promises.push(
                criteriaApi.getWeightSummary(null, t.id).then(res => {
                  const summary = res.data;
                  if (!summary || summary.items.length === 0) {
                    mErrors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}) chưa có tiêu chí đánh giá.`);
                  } else if (summary.status === 'WARN') {
                    wErrors.push(`Bảng đấu '${t.name}' (Vòng ${r.name}): Tổng trọng số đang là ${summary.total.toFixed(2)}`);
                  }
                }).catch(() => {
                  mErrors.push(`Không thể kiểm tra tiêu chí Bảng đấu '${t.name}' (Lỗi API).`);
                })
              );
            });
          }
        });

        await Promise.all(promises);

        if (isMounted) {
          setWeightErrors(wErrors);
          setMissingCriteriaErrors(mErrors);
        }
      } catch (error) {
        console.error('Error validating criteria via API:', error);
      } finally {
        if (isMounted) setIsValidatingCriteria(false);
      }
    };

    validateCriteria();

    return () => {
      isMounted = false;
    };
  }, [hackathonRounds, tracks]);

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
    isValidatingCriteria
  };
};
