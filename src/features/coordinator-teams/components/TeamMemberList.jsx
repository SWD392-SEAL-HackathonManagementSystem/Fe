import { Avatar, Empty, Grid, Space, Tag, Tooltip, Typography, theme } from "antd";
import { MEMBER_ROLE } from "../constants/team.constants";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const TeamMemberList = ({ members = [] }) => {
  const screens = useBreakpoint();
  const { token } = theme.useToken();
  const isMobile = !screens.md;

  if (!members.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có dữ liệu thành viên"
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 8px 14px",
      }}
    >
      {members.map((member) => {
        const isLeader = member.roleInTeam === MEMBER_ROLE.LEADER;

        return (
          <div
            key={member.userId}
            style={{
              alignItems: "center",
              background: isLeader ? token.colorInfoBg : token.colorBgContainer,
              border: `1px solid ${isLeader ? token.colorInfoBorder : token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              display: "grid",
              gap: 12,
              gridTemplateColumns: isMobile
                ? "36px minmax(0, 1fr)"
                : "36px minmax(180px, 1fr) minmax(220px, 1.4fr) auto",
              minWidth: 0,
              padding: "10px 12px",
            }}
          >
            <Avatar
              size={36}
              style={{
                background: isLeader ? token.colorInfoBgHover : token.colorFillTertiary,
                color: isLeader ? token.colorInfoText : token.colorTextSecondary,
                fontWeight: 700,
              }}
            >
              {getInitials(member.fullName)}
            </Avatar>

            <div style={{ minWidth: 0 }}>
              <Text
                strong
                style={{ display: "block", overflowWrap: "anywhere" }}
              >
                {member.fullName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {member.userId}
              </Text>
            </div>

            <Tooltip title={member.email}>
              <Text
                copyable={{ text: member.email }}
                type="secondary"
                style={{
                  display: "block",
                  lineHeight: 1.45,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {member.email}
              </Text>
            </Tooltip>

            <Space
              size={[6, 6]}
              wrap
              style={{
                gridColumn: isMobile ? "2" : undefined,
                justifyContent: isMobile ? "flex-start" : "flex-end",
              }}
            >
              <Tag color={isLeader ? "blue" : "default"} style={{ margin: 0 }}>
                {member.roleLabel}
              </Tag>
              <Tag color={member.statusColor} style={{ margin: 0 }}>
                {member.statusLabel}
              </Tag>
            </Space>
          </div>
        );
      })}
    </div>
  );
};

export default TeamMemberList;
