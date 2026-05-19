import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../app/AppContext';
import { CRITERIA_TYPES, MAX_WEIGHT_TOTAL } from '../constants/criteria.constants';

export const useCriteriaManagement = (hackathonId) => {
  const { criteria = [], addCriteria, updateCriteria, deleteCriteria, rounds = [], tracks = [], updateRound } = useAppContext();
  
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState(null);

  // 1. Lấy danh sách Vòng thi (Rounds) của Hackathon
  const hackathonRounds = useMemo(() => {
    return rounds
      .filter(r => r.hackathon_id === hackathonId)
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }, [rounds, hackathonId]);
  
  const currentRound = hackathonRounds.find(r => r.id === selectedRoundId);
  
  // 2. Lấy danh sách Bảng đấu (Tracks) thuộc về Vòng thi đang chọn
  const roundTracks = useMemo(() => {
    if (!currentRound || currentRound.is_final) return [];
    return tracks
      .filter(t => t.round_id === selectedRoundId)
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }, [tracks, currentRound, selectedRoundId]);

  // Lấy toàn bộ Tracks của Hackathon để phục vụ tính năng Clone
  const hackathonTracks = useMemo(() => {
    const roundIds = hackathonRounds.map(r => r.id);
    return tracks.filter(t => roundIds.includes(t.round_id));
  }, [tracks, hackathonRounds]);

  // Reset Track khi chọn Round khác
  useEffect(() => {
    setSelectedTrackId(null);
  }, [selectedRoundId]);

  // 3. Lọc danh sách Tiêu chí
  const currentCriteria = useMemo(() => {
    if (!currentRound) return [];
    
    if (currentRound.is_final) {
      return criteria
        .filter(c => c.round_id === selectedRoundId)
        .sort((a, b) => a.display_order - b.display_order);
    }
    
    if (selectedTrackId) {
      return criteria
        .filter(c => c.track_id === selectedTrackId)
        .sort((a, b) => a.display_order - b.display_order);
    }
    
    return [];
  }, [criteria, currentRound, selectedRoundId, selectedTrackId]);

  // 4. Tính tổng trọng số
  const totalWeight = useMemo(() => {
    return currentCriteria
      .filter(c => c.type !== CRITERIA_TYPES.PENALTY)
      .reduce((sum, c) => sum + (c.weight || 0), 0);
  }, [currentCriteria]);

  const isWeightValid = Math.abs(totalWeight - MAX_WEIGHT_TOTAL) < 0.001;

  // 5. Hàm cân bằng điểm tự động (Sửa lại để chuẩn bị Batch Update)
  const handleAutoBalance = useCallback(() => {
    const nonPenalty = currentCriteria.filter(c => c.type !== CRITERIA_TYPES.PENALTY);
    if (nonPenalty.length === 0) return;
    
    const evenWeight = parseFloat((MAX_WEIGHT_TOTAL / nonPenalty.length).toFixed(2));
    let remaining = MAX_WEIGHT_TOTAL;

    // Chuẩn bị payload (dùng cho API thật)
    const updatePayload = nonPenalty.map((c, index) => {
      let weightToAssign;
      if (index === nonPenalty.length - 1) {
        weightToAssign = parseFloat(remaining.toFixed(2));
      } else {
        weightToAssign = evenWeight;
        remaining -= evenWeight;
      }
      return { id: c.id, changes: { weight: weightToAssign } };
    });

    // Mô phỏng gọi API: Vì mock data không có hàm update mảng (batchUpdate) 
    // nên ta lặp để update state local, nhưng ở đây in ra console dạng payload.
    console.log('--- BATCH UPDATE PAYLOAD ---', updatePayload);
    updatePayload.forEach(item => updateCriteria(item.id, item.changes));

  }, [currentCriteria, updateCriteria]);

  // 6. Hàm Clone Tiêu chí (Sao chép từ Round/Track khác)
  const handleCloneCriteria = useCallback((sourceRoundId, sourceTrackId) => {
    let sourceCriteriaList = [];
    
    if (sourceTrackId) {
      sourceCriteriaList = criteria.filter(c => c.track_id === sourceTrackId);
    } else if (sourceRoundId) {
      sourceCriteriaList = criteria.filter(c => c.round_id === sourceRoundId);
    }

    if (sourceCriteriaList.length === 0) return 0; // Trả về số lượng copy thành công = 0

    // Clone từng cái sang đích (Round/Track hiện tại)
    sourceCriteriaList.forEach(c => {
      const clonedCriteria = {
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
        description: c.description,
        rubric_url: c.rubric_url,
        display_order: c.display_order,
        // ID nguồn để trace lịch sử theo DB Schema V3.0
        source_criteria_id: c.id, 
        // Gắn vào hiện tại
        round_id: currentRound?.is_final ? selectedRoundId : null,
        track_id: currentRound?.is_final ? null : selectedTrackId
      };
      addCriteria(clonedCriteria);
    });

    return sourceCriteriaList.length;
  }, [criteria, currentRound, selectedRoundId, selectedTrackId, addCriteria]);

  // 7. Hàm lưu Criteria (Thêm mới / Cập nhật)
  const handleSaveCriteria = useCallback((values, editingId) => {
    const criteriaData = { ...values };
    
    if (currentRound?.is_final) {
      criteriaData.round_id = selectedRoundId;
      criteriaData.track_id = null;
    } else {
      criteriaData.track_id = selectedTrackId;
      criteriaData.round_id = null;
    }

    if (editingId) {
      updateCriteria(editingId, criteriaData);
    } else {
      addCriteria(criteriaData);
    }
  }, [currentRound, selectedRoundId, selectedTrackId, updateCriteria, addCriteria]);

  return {
    hackathonRounds,
    hackathonTracks,
    currentRound,
    roundTracks,
    currentCriteria,
    totalWeight,
    isWeightValid,
    selectedRoundId,
    setSelectedRoundId,
    selectedTrackId,
    setSelectedTrackId,
    handleAutoBalance,
    handleCloneCriteria,
    handleSaveCriteria,
    deleteCriteria,
    updateRound,
  };
};
