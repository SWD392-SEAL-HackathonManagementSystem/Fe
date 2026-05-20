import { useState, useMemo, useEffect, useCallback } from 'react';

import { CRITERIA_TYPES, MAX_WEIGHT_TOTAL } from '../constants/criteria.constants';
import { criteriaApi } from '../api/criteria.api';
import { message } from 'antd';

import { roundService } from '../../rounds/services/roundService';
import { trackService } from '../../tracks/services/trackService';
import { mapRoundToFE } from '../../rounds/mappers/roundMapper';
import { mapTrackToFE } from '../../tracks/mappers/trackMapper';

export const useCriteriaManagement = (hackathonId) => {
  const [rounds, setRounds] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  
  // State lưu trữ dữ liệu từ API
  const [criteriaList, setCriteriaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBaseData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [roundsRes, tracksRes] = await Promise.all([
        roundService.listByHackathon(hackathonId),
        trackService.listByHackathon(hackathonId)
      ]);
      setRounds((roundsRes || []).map(mapRoundToFE));
      setTracks((tracksRes || []).map(mapTrackToFE));
      setIsDataLoaded(true);
    } catch (err) {
      message.error('Lỗi khi tải dữ liệu Vòng thi/Bảng đấu');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  // 1. Lấy danh sách Vòng thi (Rounds) của Hackathon
  const hackathonRounds = useMemo(() => {
    return rounds
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }, [rounds]);
  
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
    return tracks;
  }, [tracks]);

  // Reset Track khi chọn Round khác
  useEffect(() => {
    setSelectedTrackId(null);
  }, [selectedRoundId]);

  // 3. Gọi API Lấy danh sách Tiêu chí
  const fetchCriteria = useCallback(async () => {
    if (!currentRound) return;
    if (!currentRound.is_final && !selectedTrackId) return;

    setIsLoading(true);
    try {
      const res = await criteriaApi.getCriteria(
        currentRound.is_final ? selectedRoundId : null,
        currentRound.is_final ? null : selectedTrackId
      );
      setCriteriaList(res.data?.items || []);
    } catch (error) {
      console.error('Fetch criteria failed:', error);
      message.error('Không thể tải danh sách tiêu chí');
      setCriteriaList([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, selectedRoundId, selectedTrackId]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const currentCriteria = useMemo(() => {
    return [...criteriaList].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [criteriaList]);

  // 4. Tính tổng trọng số
  const totalWeight = useMemo(() => {
    return currentCriteria
      .filter(c => c.type !== CRITERIA_TYPES.PENALTY)
      .reduce((sum, c) => sum + (c.weight || 0), 0);
  }, [currentCriteria]);

  const isWeightValid = Math.abs(totalWeight - MAX_WEIGHT_TOTAL) < 0.001;

  // 5. Hàm cân bằng điểm tự động (Dùng Batch API)
  const handleAutoBalance = useCallback(async () => {
    const nonPenalty = currentCriteria.filter(c => c.type !== CRITERIA_TYPES.PENALTY);
    if (nonPenalty.length === 0) return;
    
    const evenWeight = parseFloat((MAX_WEIGHT_TOTAL / nonPenalty.length).toFixed(2));
    let remaining = MAX_WEIGHT_TOTAL;

    // Chuẩn bị payload batch update (Thực tế FR-04 không nói rõ API PUT /batch, nhưng ta có thể gọi PUT từng cái hoặc tạo mới batch. 
    // Giả sử gọi update lần lượt cho an toàn vì API chưa support batch update)
    const promises = nonPenalty.map((c, index) => {
      let weightToAssign;
      if (index === nonPenalty.length - 1) {
        weightToAssign = parseFloat(remaining.toFixed(2));
      } else {
        weightToAssign = evenWeight;
        remaining -= evenWeight;
      }
      return criteriaApi.updateCriterion(c.id, { ...c, weight: weightToAssign });
    });

    setIsLoading(true);
    try {
      await Promise.all(promises);
      message.success('Đã cân bằng trọng số tự động');
      fetchCriteria();
    } catch (error) {
      message.error(error.message || 'Lỗi khi cân bằng trọng số');
    } finally {
      setIsLoading(false);
    }

  }, [currentCriteria, fetchCriteria]);

  // 6. Hàm Clone Tiêu chí (Sao chép từ Round/Track khác)
  const handleCloneCriteria = useCallback(async (sourceRoundId, sourceTrackId) => {
    setIsLoading(true);
    try {
      await criteriaApi.cloneCriteria(
        currentRound?.is_final ? selectedRoundId : null,
        currentRound?.is_final ? null : selectedTrackId,
        sourceRoundId,
        sourceTrackId,
        false
      );
      message.success('Sao chép tiêu chí thành công');
      fetchCriteria();
      return 1; // Return 1 to indicate success
    } catch (error) {
      message.error(error.message || 'Lỗi khi sao chép tiêu chí');
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, selectedRoundId, selectedTrackId, fetchCriteria]);

  // 7. Hàm lưu Criteria (Thêm mới / Cập nhật)
  const handleSaveCriteria = useCallback(async (values, editingId) => {
    const criteriaData = { ...values };
    
    setIsLoading(true);
    try {
      if (editingId) {
        await criteriaApi.updateCriterion(editingId, criteriaData);
        message.success('Cập nhật tiêu chí thành công');
      } else {
        await criteriaApi.createCriterion(
          currentRound?.is_final ? selectedRoundId : null,
          currentRound?.is_final ? null : selectedTrackId,
          criteriaData
        );
        message.success('Thêm tiêu chí thành công');
      }
      fetchCriteria();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }, [currentRound, selectedRoundId, selectedTrackId, fetchCriteria]);

  // 8. Hàm Xóa
  const handleDeleteCriteria = useCallback(async (id) => {
    setIsLoading(true);
    try {
      await criteriaApi.deleteCriterion(id);
      message.success('Đã xóa tiêu chí');
      fetchCriteria();
    } catch (error) {
      if (error.status === 409) {
        message.error('Không thể xóa do tiêu chí đã có dữ liệu chấm điểm');
      } else {
        message.error(error.message || 'Lỗi khi xóa tiêu chí');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchCriteria]);

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
    deleteCriteria: handleDeleteCriteria,
    updateRound: async (id, data) => {
      try {
        await roundService.update(id, data);
        message.success('Cập nhật trạng thái vòng thi thành công');
        fetchBaseData();
      } catch (err) {
        message.error('Lỗi khi cập nhật vòng thi');
      }
    },
    isLoading
  };
};
