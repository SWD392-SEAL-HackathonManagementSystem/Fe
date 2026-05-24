import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { roundService } from '../../rounds/services/roundService';
import { trackService } from '../../tracks/services/trackService';
// GIẢ ĐỊNH: Bạn cần có một file peopleService.js chứa các hàm gọi Axios (POST temp-judge, POST mentor-assignment,...)
// import { peopleService } from '../services/peopleService'; 
import { useAppContext } from '../../../app/AppContext';

export const usePeopleManagement = (hackathonId) => {
  const { people, assignments, addPerson, assignRole, removeAssignment } = useAppContext();
  
  const [tracks, setTracks] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Tracks & Rounds từ BE
  const fetchBaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        trackService.listByHackathon(hackathonId),
        roundService.listByHackathon(hackathonId)
      ]);
      setTracks(Array.isArray(tRes) ? tRes : tRes?.items || []);
      setRounds(Array.isArray(rRes) ? rRes : rRes?.items || []);
    } catch (err) {
      message.error('Lỗi khi tải dữ liệu Vòng thi/Bảng đấu từ Server');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  const hackathonAssignments = assignments.filter(a => a.hackathon_id === hackathonId);

  // Helper kiểm tra vòng chung kết
  const checkIsFinalRound = (round) => {
    if (!round) return false;
    return round.isFinal || round.is_final || round.name?.toLowerCase().includes('chung kết') || round.name?.toLowerCase().includes('final');
  };

  // 2. Logic Mời Giám khảo (Call API POST /temp-judges)
  const createTempJudge = async (values, onSuccess) => {
    setIsLoading(true);
    try {
      // TODO: Thay bằng hàm call API thật khi bạn có peopleService
      // await peopleService.createTempJudge(values);
      
      addPerson({ ...values, role: 'JUDGE', status: 'PENDING' }); // Tạm lưu Local để UI cập nhật
      message.success('Đã tạo tài khoản và gửi lời mời Giám khảo thành công');
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.message || 'Lỗi khi mời giám khảo');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Logic Phân công (Call API POST /judge-assignments hoặc /mentor-assignments)
  const assignPerson = async (values, type, onSuccess) => {
    // Logic 1: Kiểm tra trùng lặp
    const isExist = hackathonAssignments.some(a => 
      a.person_id === values.person_id && a.type === type && (a.track_id === values.track_id || a.round_id === values.round_id)
    );
    if (isExist) return message.error('Nhân sự này đã được phân công vào hạng mục này rồi!');

    const isMentorAnywhere = hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id);
    const isHeadJudge = hackathonAssignments.some(a => a.type === 'JUDGE' && a.assignment_type === 'HEAD' && a.person_id === values.person_id);

    // Logic 2: Luật cho GIÁM KHẢO (JUDGE)
    if (type === 'JUDGE') {
      const targetRound = rounds.find(r => r.id === values.round_id);
      const isFinalRound = checkIsFinalRound(targetRound);
      
      if (hackathonAssignments.some(a => a.type === 'MENTOR' && a.person_id === values.person_id && a.track_id === targetRound?.track_id)) {
        return message.error('Lỗi: Mentor không được làm Giám khảo cho chính Bảng đấu mà mình hướng dẫn!');
      }
      if (values.assignment_type === 'HEAD' && isMentorAnywhere) {
        return message.error('Lỗi: Người đã từng làm Mentor tuyệt đối không được giữ vai trò Trưởng ban!');
      }
      if (isFinalRound && isMentorAnywhere) {
        return message.error('Lỗi: Người đã tham gia làm Mentor không được phép chấm thi tại Vòng Chung kết!');
      }
    }

    // Logic 3: Luật cho MENTOR
    if (type === 'MENTOR') {
      if (isHeadJudge) {
        return message.error('Lỗi: Người này đang giữ vai trò Trưởng ban, không thể phân công đi làm Mentor!');
      }
      const isJudgeFinalRound = hackathonAssignments.some(a => a.type === 'JUDGE' && checkIsFinalRound(rounds.find(r => r.id === a.round_id)) && a.person_id === values.person_id);
      if (isJudgeFinalRound) {
        return message.error('Lỗi: Người này đang là Giám khảo Vòng Chung kết, không thể phân công đi làm Mentor!');
      }
    }

    setIsLoading(true);
    try {
      // TODO: Thay bằng hàm call API thật
      // if (type === 'JUDGE') await peopleService.assignJudge(values);
      // else await peopleService.assignMentor(values);

      assignRole({ ...values, hackathon_id: hackathonId, type }); // Lưu tạm Local
      message.success(`Đã phân công ${type === 'MENTOR' ? 'Mentor' : 'Giám khảo'} thành công!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error.message || 'Lỗi khi phân công');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Logic Xóa phân công
  const deleteAssignment = async (assignmentId) => {
    setIsLoading(true);
    try {
      // TODO: Call API DELETE /api/v1/judge-assignments/{id}
      removeAssignment(assignmentId); // Xóa tạm Local
      message.success('Đã gỡ phân công thành công');
    } catch (error) {
      message.error(error.message || 'Lỗi khi gỡ phân công');
    } finally {
      setIsLoading(false);
    }
  };

  return { tracks, rounds, people, hackathonAssignments, isLoading, createTempJudge, assignPerson, deleteAssignment };
};