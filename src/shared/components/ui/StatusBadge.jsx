import React from 'react';
import { Tag } from 'antd';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return { color: 'default', text: 'Draft' };
      case 'PUBLISHED':
        return { color: 'blue', text: 'Published' };
      case 'ONGOING':
        return { color: 'green', text: 'Ongoing' };
      case 'COMPLETED':
        return { color: 'purple', text: 'Completed' };
      case 'OPEN':
        return { color: 'green', text: 'Open' };
      case 'CLOSED':
        return { color: 'red', text: 'Closed' };
      case 'ACTIVE':
        return { color: 'green', text: 'Active' };
      case 'INACTIVE':
        return { color: 'default', text: 'Inactive' };
      default:
        return { color: 'default', text: status };
    }
  };

  const { color, text } = getStatusConfig(status);

  return <Tag color={color}>{text}</Tag>;
};

export default StatusBadge;
