import { Grid, Typography, theme } from "antd";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ApprovalSummary = ({ title, description, metrics }) => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div
      style={{
        alignItems: isMobile ? "stretch" : "flex-start",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 16,
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <div>
        <Title level={4} style={{ color: token.colorText, margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{description}</Text>
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: isMobile
            ? "repeat(3, minmax(0, 1fr))"
            : "repeat(3, 124px)",
        }}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              boxShadow: token.boxShadowTertiary,
              minWidth: 0,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                color: token.colorText,
                fontSize: 22,
                fontWeight: 750,
                lineHeight: 1,
              }}
            >
              {metric.value}
            </div>
            <div style={{ color: token.colorTextSecondary, fontSize: 12, marginTop: 6 }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalSummary;
