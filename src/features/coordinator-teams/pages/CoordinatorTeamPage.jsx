import React from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Select, Spin, Space, Alert } from "antd";
import { SearchOutlined, RocketOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useHackathonSelect } from "../hooks/useHackathonSelect";
import ApprovalTable from "../components/ApprovalTable";
import { TAB_KEYS } from "../constants/team.constants";

const { Title, Text } = Typography;

const CoordinatorTeamPage = () => {
  const { hackathonId } = useParams();

  const {
    hackathons,
    selectedHackathonId,
    setSelectedHackathonId,
    isLoadingHackathons,
  } = useHackathonSelect(hackathonId);

  const activeHackathonId = hackathonId || selectedHackathonId;

  if (!activeHackathonId && isLoadingHackathons) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin tip="Đang tải sự kiện..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}
    >
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #1890ff 0%, #1d39c4 100%)",
          padding: "24px 32px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(24, 144, 255, 0.2)",
          color: "white",
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <RocketOutlined /> Quản lý Đội thi
          </Title>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "16px",
              marginTop: 8,
              display: "block",
            }}
          >
            Hệ thống điều phối: Phê duyệt và quản lý hồ sơ đội thi nhanh chóng.
          </Text>
        </div>

        {!hackathonId && (
          <Space
            direction="vertical"
            size={4}
            style={{ alignItems: "flex-end" }}
          >
            <Text style={{ color: "white", fontWeight: 500, opacity: 0.9 }}>
              Sự kiện đang quản lý
            </Text>
            <Select
              showSearch
              placeholder="Chọn sự kiện Hackathon"
              loading={isLoadingHackathons}
              value={selectedHackathonId}
              onChange={(value) => setSelectedHackathonId(value)}
              style={{ width: 320 }}
              size="large"
              suffixIcon={<SearchOutlined style={{ color: "#1890ff" }} />}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={hackathons.map((h) => ({
                value: h.id,
                label: h.hackathonName || h.name || `Hackathon #${h.id}`,
              }))}
              dropdownStyle={{ borderRadius: 12, padding: 8 }}
            />
          </Space>
        )}
      </div>

      {!activeHackathonId && !isLoadingHackathons && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Alert
            message="Chưa chọn sự kiện Hackathon"
            description="Vui lòng chọn một sự kiện ở phía trên để bắt đầu quản lý danh sách đội thi."
            type="info"
            showIcon
            style={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          />
        </motion.div>
      )}

      {activeHackathonId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <ApprovalTable hackathonId={activeHackathonId} />
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CoordinatorTeamPage;
