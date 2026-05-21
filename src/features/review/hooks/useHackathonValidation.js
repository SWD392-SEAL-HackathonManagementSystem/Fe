import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../app/AppContext';
import { criteriaService } from '../../criteria/services/criteriaService';
import { hackathonService } from '../../hackathons/services/hackathonService';
import { roundService } from '../../rounds/services/roundService';
import { trackService } from '../../tracks/services/trackService';
import { eventService } from '../../events/services/eventService';
import { mapRoundToFE } from '../../rounds/mappers/roundMapper';
import { mapTrackToFE } from '../../tracks/mappers/trackMapper';
import { mapHackathonToFE } from '../../hackathons/mappers/hackathonMapper';

export const useHackathonValidation = (hackathonId) => {
  const { assignments = [] } = useAppContext();

  const [hackathon, setHackathon] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchBaseData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [hRes, rRes, tRes, eRes] = await Promise.all([
        hackathonService.getById(hackathonId),
        roundService.listByHackathon(hackathonId),
        trackService.listByHackathon(hackathonId),
        eventService.listByHackathon(hackathonId)
      ]);
      setHackathon(mapHackathonToFE(hRes));
      
      const fullRounds = await Promise.all(
        (rRes || []).map(async (r) => {
          try {
            const detail = await roundService.getById(r.id);
            return mapRoundToFE(detail);
          } catch (e) {
            return mapRoundToFE(r);
          }
        })
      );
      setRounds(fullRounds);
      
      setTracks((tRes || []).map(mapTrackToFE));
      
      const eventItems = Array.isArray(eRes) ? eRes : (eRes?.data || []);
      setEvents(eventItems);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu validation:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  const hackathonRounds = useMemo(() => rounds.sort((a, b) => a.sequence_order - b.sequence_order), [rounds]);
  
  const prelimRounds = useMemo(() => hackathonRounds.filter(r => !r.is_final), [hackathonRounds]);
  const finalRounds = useMemo(() => hackathonRounds.filter(r => r.is_final), [hackathonRounds]);
  
  const hasPrelim = prelimRounds.length >= 1;
  const hasFinal = finalRounds.length === 1;
  const hasCorrectRounds = hasPrelim && hasFinal;
  
  const prelimRoundsHaveTracks = useMemo(() => {
    if (prelimRounds.length === 0) return false;
    return prelimRounds.every(r => tracks.some(t => t.round_id === r.id));
  }, [prelimRounds, tracks]);

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
              criteriaService.getWeightSummaryByRound(r.id).then(summary => {
                if (!summary || (Array.isArray(summary.items) && summary.items.length === 0)) {
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
                criteriaService.getWeightSummaryByTrack(t.id).then(summary => {
                  if (!summary || (Array.isArray(summary.items) && summary.items.length === 0)) {
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

  const hasKickoffEvent = useMemo(() => {
    if (events.length === 0) return true;
    return events.some(e => 
      (e.hackathon_id === hackathonId || e.hackathonId === hackathonId) && 
      (e.type === 'KICKOFF' || e.eventType === 'KICKOFF')
    );
  }, [events, hackathonId]);

  const personnelErrors = useMemo(() => {
    const errors = [];
    const hAssignments = assignments.filter(a => a.hackathon_id === hackathonId);
    
    hackathonRounds.forEach((r) => {
      if (r.is_final) {
        const finalJudges = hAssignments.filter(a => a.round_id === r.id && a.type === 'JUDGE');
        if (finalJudges.length === 0) {
          errors.push(`Vòng Chung kết chưa được phân công Giám khảo (Judge).`);
        }
      } else {
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
    isValidatingCriteria,
    isLoadingData
  };
};
