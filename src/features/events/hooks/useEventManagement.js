import { useState, useEffect, useCallback } from 'react';
import { message, Modal, notification } from 'antd';
import dayjs from 'dayjs';
import { eventService } from '../services/eventService';
import { hackathonService } from '../../hackathons/services/hackathonService';
import { roundService } from '../../rounds/services/roundService'; // Thêm service này để lấy thông tin Vòng Chung kết
import { mapEventToFE, mapEventToBE } from '../mappers/eventMapper';
import { mapHackathonToFE } from '../../hackathons/mappers/hackathonMapper';

export const useEventManagement = (hackathonId, addNotification) => {
  const [events, setEvents] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentHackathon, setCurrentHackathon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gọi API Lấy danh sách Event, Hackathon & Rounds
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hRes, eRes, rRes] = await Promise.all([
        hackathonService.getById(hackathonId),
        eventService.listByHackathon(hackathonId),
        roundService.listByHackathon(hackathonId)
      ]);
      
      setCurrentHackathon(mapHackathonToFE(hRes));
      
      const eventList = Array.isArray(eRes) ? eRes : (eRes?.items || eRes?.content || []);
      setEvents(eventList.map(mapEventToFE));

      const roundList = Array.isArray(rRes) ? rRes : (rRes?.items || rRes?.content || []);
      setRounds(roundList);
    } catch (error) {
      message.error('Lỗi tải dữ liệu từ Server');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logic Validate Timeline thông minh & Gọi API POST
  const createEvent = async (values, onSuccess) => {
    const eStart = dayjs(values.starts_at);
    const eEnd = values.ends_at ? dayjs(values.ends_at) : null;
    
    const hRegEnd = currentHackathon?.registration_end ? dayjs(currentHackathon.registration_end) : null;
    const hEvStart = currentHackathon?.event_start ? dayjs(currentHackathon.event_start) : null;
    const hEvEnd = currentHackathon?.event_end ? dayjs(currentHackathon.event_end).endOf('day') : null;

    const dateFormat = 'HH:mm DD/MM/YYYY';

    // --- 1. KIỂM TRA TRÙNG LẶP SỰ KIỆN DUY NHẤT (KICKOFF, AWARDS) ---
    const isOverlap = events.some(e => {
      if ((values.type === 'KICKOFF' && e.type === 'KICKOFF') || (values.type === 'AWARDS' && e.type === 'AWARDS')) {
        return true; // Chỉ cho phép 1 sự kiện Kickoff và 1 sự kiện Awards
      }
      return false;
    });

    if (isOverlap) {
      return message.error(`Sự kiện ${values.type === 'KICKOFF' ? 'Khai mạc' : 'Trao giải'} đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.`);
    }

    // --- 2. QUY TẮC: WORKSHOP ---
    if (values.type === 'WORKSHOP') {
      if (hRegEnd && eStart.isBefore(hRegEnd)) {
        return message.error(`Workshop phải diễn ra sau khi kết thúc đăng ký tham gia (Sau ${hRegEnd.format(dateFormat)}).`);
      }
      
      const kickoffEvent = events.find(e => e.type === 'KICKOFF');
      if (kickoffEvent && eStart.isAfter(dayjs(kickoffEvent.starts_at))) {
        return message.error(`Workshop phải diễn ra trước sự kiện Khai mạc (Trước ${dayjs(kickoffEvent.starts_at).format(dateFormat)}).`);
      }
    }

    // --- 3. QUY TẮC: KICK-OFF ---
    if (values.type === 'KICKOFF') {
      const workshopEvents = events.filter(e => e.type === 'WORKSHOP');
      if (workshopEvents.length > 0) {
        // Tìm workshop kết thúc muộn nhất
        const latestWorkshop = workshopEvents.sort((a, b) => dayjs(b.ends_at || b.starts_at).diff(dayjs(a.ends_at || a.starts_at)))[0];
        const workshopEnd = dayjs(latestWorkshop.ends_at || latestWorkshop.starts_at);
        if (eStart.isBefore(workshopEnd)) {
          return message.error(`Sự kiện Khai mạc phải diễn ra sau khi các buổi Workshop kết thúc (Sau ${workshopEnd.format(dateFormat)}).`);
        }
      }

      if (hEvStart && eStart.isAfter(hEvStart)) {
        return message.error(`Sự kiện Khai mạc phải diễn ra trước ngày thi chính thức của Hackathon (Trước ${hEvStart.format(dateFormat)}).`);
      }
    }

    // --- 4. QUY TẮC: AWARDS (LỄ TRAO GIẢI) ---
    if (values.type === 'AWARDS') {
      // Tìm hạn chót vòng Chung kết
      const finalRound = rounds.find(r => r.is_final || r.isFinal);
      if (finalRound && finalRound.submission_deadline || finalRound?.submissionDeadline) {
        const finalDeadline = dayjs(finalRound.submission_deadline || finalRound.submissionDeadline);
        if (eStart.isBefore(finalDeadline)) {
          return message.error(`Lễ Trao giải phải diễn ra sau hạn chót nộp bài Vòng Chung kết (Sau ${finalDeadline.format(dateFormat)}).`);
        }
      }

      if (hEvEnd && (eStart.isAfter(hEvEnd) || (eEnd && eEnd.isAfter(hEvEnd)))) {
        return message.error(`Lễ Trao giải không được tổ chức muộn hơn ngày bế mạc Hackathon (Ngày ${hEvEnd.format('DD/MM/YYYY')}).`);
      }
    }

    // Hàm thực thi gọi API
    const executeSave = async () => {
      setIsLoading(true);
      try {
        const payload = mapEventToBE(values);
        await eventService.create(hackathonId, payload);
        message.success('Đã tạo sự kiện thành công!');
        
        // Push notification UI
        addNotification({
          type: 'REMINDER',
          title: 'Đã lên lịch sự kiện',
          description: `Hệ thống đã tự động lên lịch nhắc nhở cho sự kiện: ${values.title}`
        });
        notification.info({
          message: 'Đã lên lịch nhắc nhở',
          description: `Sự kiện ${values.title} đã được thêm vào lịch trình.`,
          placement: 'bottomRight',
        });

        fetchData(); // Tải lại danh sách từ server
        if (onSuccess) onSuccess();
      } catch (error) {
        message.error(error.message || 'Có lỗi xảy ra khi tạo sự kiện. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    executeSave();
  };

  // Gọi API Xóa sự kiện
  const deleteEvent = async (eventId) => {
    setIsLoading(true);
    try {
      await eventService.delete(eventId);
      message.success('Đã xóa sự kiện thành công');
      fetchData();
    } catch (error) {
      message.error(error.message || 'Lỗi khi xóa sự kiện');
    } finally {
      setIsLoading(false);
    }
  };

  return { events, currentHackathon, isLoading, createEvent, deleteEvent };
};