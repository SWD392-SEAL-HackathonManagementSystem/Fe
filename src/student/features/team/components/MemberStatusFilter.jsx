import { Segmented, Space, Typography, theme } from 'antd';
import { MEMBER_STATUS } from '../constants/studentTeam.constants';

const { Text } = Typography;

const MEMBER_FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đã tham gia', value: MEMBER_STATUS.ACCEPTED },
  { label: 'Đang chờ', value: MEMBER_STATUS.PENDING },
  { label: 'Đã từ chối', value: MEMBER_STATUS.REJECTED },
  { label: 'Đã rời', value: MEMBER_STATUS.LEFT },
];

const MemberStatusFilter = ({ counts, value, onChange }) => {
  const { token } = theme.useToken();
  const options = MEMBER_FILTERS.map((filter) => ({
    ...filter,
    label: `${filter.label} (${counts[filter.value] || 0})`,
  }));

  return (
    <div
      style={{
        marginTop: 18,
        padding: 12,
        borderRadius: 16,
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Text strong>Lọc thành viên</Text>
        <Segmented block value={value} options={options} onChange={onChange} />
      </Space>
    </div>
  );
};

export { MEMBER_FILTERS };
export default MemberStatusFilter;
