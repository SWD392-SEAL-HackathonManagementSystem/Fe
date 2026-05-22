import React from "react";
import { Space, Select, Typography, Switch, Card } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

export const CriteriaHeader = ({
  hackathonRounds = [],
  roundTracks = [],
  currentRound,
  selectedRoundId,
  setSelectedRoundId,
  selectedTrackId,
  setSelectedTrackId,
  updateRound,
}) => {
  return (
    <>
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space
          size="large"
          style={{ display: "flex", width: "100%", alignItems: "flex-start" }}
        >
          <div style={{ minWidth: 300 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Vòng thi (Round):
            </Text>
            <Select
              style={{ width: "100%" }}
              placeholder="Chọn vòng thi"
              value={selectedRoundId}
              onChange={setSelectedRoundId}
            >
              {hackathonRounds?.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} {r.is_final ? "(Chung Kết)" : "(Sơ Loại)"}
                </Option>
              ))}
            </Select>
          </div>
          {currentRound && !currentRound.is_final && (
            <div style={{ minWidth: 300 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Bảng đấu (Track):
              </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn bảng đấu"
                value={selectedTrackId}
                onChange={setSelectedTrackId}
              >
                {roundTracks?.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {t.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </Space>
      </Card>

      {currentRound && (currentRound.is_final || selectedTrackId) && (
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {currentRound.is_final
              ? currentRound.name
              : `${currentRound.name} - Bảng: ${roundTracks?.find((t) => t.id === selectedTrackId)?.name}`}
          </Title>
          <Space>
            <Text>Kích hoạt vòng thi:</Text>
            <Switch
              checked={currentRound?.is_active}
              onChange={(checked) =>
                updateRound(currentRound.id, { is_active: checked })
              }
            />
          </Space>
        </div>
      )}
    </>
  );
};
