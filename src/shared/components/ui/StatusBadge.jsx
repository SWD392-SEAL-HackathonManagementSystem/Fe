import React from 'react';
import { Tag } from 'antd';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return { color: 'default', text: 'Nháp' };
      case 'PUBLISHED':
        return { color: 'blue', text: 'Đã công bố' };
      case 'ONGOING':
        return { color: 'green', text: 'Đang diễn ra' };
      case 'FINISHED':
        return { color: 'orange', text: 'Đã hoàn thành' };
      case 'OPEN':
        return { color: 'green', text: 'Mở' };
      case 'CLOSED':
        return { color: 'red', text: 'Đóng' };
      case 'ACTIVE':
        return { color: 'green', text: 'Đang hoạt động' };
      case 'INACTIVE':
        return { color: 'default', text: 'Ngưng hoạt động' };
      default:
        return { color: 'default', text: status };
    }
  };

  const { color, text } = getStatusConfig(status);

  return <Tag color={color}>{text}</Tag>;
};

export default StatusBadge;
