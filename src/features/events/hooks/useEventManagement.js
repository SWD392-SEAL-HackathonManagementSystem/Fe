import { useState, useEffect, useCallback } from 'react';
import { message, Modal, notification } from 'antd';
import dayjs from 'dayjs';
import { eventService } from '../services/eventService';
import { hackathonService } from '../../hackathons/services/hackathonService';
import { mapEventToFE, mapEventToBE } from '../mappers/eventMapper';
import { mapHackathonToFE } from '../../hackathons/mappers/hackathonMapper';

export const useEventManagement = (hackathonId, addNotification) => {
  const [events, setEvents] = useState([]);
  const [currentHackathon, setCurrentHackathon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gọi API Lấy danh sách Event & Thông tin Hackathon
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hRes, eRes] = await Promise.all([
        hackathonService.getById(hackathonId),
        eventService.listByHackathon(hackathonId)
      ]);
      setCurrentHackathon(mapHackathonToFE(hRes));
      
      const eventList = Array.isArray(eRes) ? eRes : (eRes?.items || eRes?.content || []);
      setEvents(eventList.map(mapEventToFE));
    } catch (error) {
      message.error('Lỗi tải dữ liệu sự kiện từ Server');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logic Validate 3 Lớp & Gọi API POST
  const createEvent = async (values, onSuccess) => {
    const eStart = dayjs(values.starts_at);
    const eEnd = values.ends_at ? dayjs(values.ends_at) : null;
    const hStart = currentHackathon?.event_start ? dayjs(currentHackathon.event_start) : null;
    const hEnd = currentHackathon?.event_end ? dayjs(currentHackathon.event_end).add(1, 'day') : null;
    const rStart = currentHackathon?.registration_start ? dayjs(currentHackathon.registration_start) : hStart;

    // --- LỚP 1: Chặn cứng (Nằm ngoài khung giải đấu) ---
    if (hStart && hEnd) {
      const minStartTime = values.type === 'WORKSHOP' ? rStart : hStart;
      if (eStart.isBefore(minStartTime) || (eEnd && eEnd.isAfter(hEnd))) {
        return message.error(`Lỗi Lớp 1: Thời gian không hợp lệ. ${values.type === 'WORKSHOP' ? 'Workshop phải nằm trong hoặc sau thời gian đăng ký' : 'Sự kiện phải nằm trong thời gian giải đấu'}.`);
      }
    }

    // --- LỚP 2: Chặn cứng (Chồng lấn KICKOFF hoặc AWARDS) ---
    const isOverlap = events.some(e => {
      if ((values.type === 'KICKOFF' && e.type === 'KICKOFF') || (values.type === 'AWARDS' && e.type === 'AWARDS')) {
        const existStart = dayjs(e.starts_at);
        const existEnd = e.ends_at ? dayjs(e.ends_at) : existStart.add(1, 'hour');
        return eStart.isBefore(existEnd) && (eEnd ? eEnd.isAfter(existStart) : eStart.isAfter(existStart));
      }
      return false;
    });

    if (isOverlap) {
      return message.error(`Lỗi Lớp 2: Đã có sự kiện ${values.type} trong khoảng thời gian này!`);
    }

    // --- LỚP 3: Logic tùy chỉnh theo yêu cầu mới ---
    const kickoffEvent = events.find(e => e.type === 'KICKOFF');
    const kickoffStart = kickoffEvent ? dayjs(kickoffEvent.starts_at) : hStart;
    const regEnd = currentHackathon?.registration_end ? dayjs(currentHackathon.registration_end) : null;

    if (values.type === 'WORKSHOP') {
      if (regEnd && eStart.isBefore(regEnd)) {
        return message.error('WORKSHOP training nên diễn ra sau ngày đóng đăng ký.');
      }
      if (kickoffStart && eStart.isAfter(kickoffStart)) {
        return message.error('WORKSHOP training nên diễn ra trước ngày Khai mạc (Kick-off).');
      }
    }

    let warningMsg = '';
    if (values.type === 'KICKOFF' && hStart && eStart.isAfter(hStart.add(1, 'day'))) {
      warningMsg = 'KICKOFF nên nằm trong ngày đầu tiên của sự kiện.';
    }

    // Hàm thực thi gọi API
    const executeSave = async () => {
      setIsLoading(true);
      try {
        const payload = mapEventToBE(values);
        await eventService.create(hackathonId, payload);
        message.success('Đã tạo lịch sự kiện thành công');
        
        // Vẫn giữ UI thông báo
        addNotification({
          type: 'REMINDER',
          title: 'Reminder Created',
          description: `Hệ thống đã tự động lên lịch nhắc nhở cho sự kiện: ${values.title}`
        });
        notification.info({
          message: 'Reminder Scheduled',
          description: `Hệ thống đã tự động lên lịch nhắc nhở cho sự kiện: ${values.title}`,
          placement: 'bottomRight',
        });

        fetchData(); // Tải lại danh sách từ server
        if (onSuccess) onSuccess();
      } catch (error) {
        message.error(error.message || 'Lỗi khi tạo sự kiện');
      } finally {
        setIsLoading(false);
      }
    };

    if (warningMsg) {
      Modal.confirm({
        title: 'Cảnh báo (Thứ tự Logic)',
        content: `${warningMsg} Bạn có chắc chắn muốn bỏ qua cảnh báo và lưu không?`,
        onOk: executeSave
      });
    } else {
      executeSave();
    }
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