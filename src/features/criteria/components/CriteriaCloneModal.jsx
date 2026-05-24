import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  Alert,
  Typography,
  Switch,
  Space,
  Spin,
  message,
} from "antd";
import axiosClient from "../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../shared/api/endpoints";
import { criteriaService } from "../services/criteriaService";

const { Text } = Typography;
const { Option, OptGroup } = Select;

export const CriteriaCloneModal = ({
  visible,
  onCancel,
  onClone,
  currentHackathonId,
  currentRound,
  selectedRoundId,
  selectedTrackId,
}) => {
  const [hackathons, setHackathons] = useState([]);
  const [sourceRounds, setSourceRounds] = useState([]);
  const [trackCloneSources, setTrackCloneSources] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState(null);
  const [cloneSourceId, setCloneSourceId] = useState(null);
  const [cloneSourceType, setCloneSourceType] = useState("TRACK");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.content)) return res.content;
    if (Array.isArray(res.data)) return res.data;
    if (res.data) {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data.content)) return res.data.content;
    }
    return [];
  };

  useEffect(() => {
    if (visible) {
      setCloneSourceId(null);
      setReplaceExisting(false);
      fetchHackathons();

      if (currentRound?.is_final) {
        setCloneSourceType("ROUND");
        setSelectedHackathonId(null);
      } else {
        setCloneSourceType("TRACK");
        setSelectedHackathonId(currentHackathonId);
        if (selectedTrackId) {
          fetchTrackCloneSources(selectedTrackId);
        }
      }
    } else {
      setSelectedHackathonId(null);
      setCloneSourceId(null);
      setReplaceExisting(false);
    }
  }, [visible, currentRound, currentHackathonId, selectedTrackId]);

  useEffect(() => {
    if (selectedHackathonId && visible && currentRound?.is_final) {
      fetchRoundsForFinal(selectedHackathonId);
    }
  }, [selectedHackathonId, visible, currentRound]);

  const fetchHackathons = async () => {
    try {
      const res = await axiosClient.get(ENDPOINTS.HACKATHONS.BASE);
      setHackathons(extractArray(res));
    } catch (error) {
      message.error("Lỗi tải danh sách Hackathon");
    }
  };

  const fetchRoundsForFinal = async (hackId) => {
    setIsLoading(true);
    setCloneSourceId(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.HACKATHONS.ROUNDS(hackId));
      setSourceRounds(extractArray(res));
    } catch (error) {
      message.error("Lỗi tải dữ liệu Vòng thi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrackCloneSources = async (trackId) => {
    setIsLoading(true);
    setCloneSourceId(null);
    try {
      const res = await criteriaService.getCloneSourcesForTrack(trackId);

      let sources = [];
      if (res && Array.isArray(res.sources)) sources = res.sources;
      else if (res?.data && Array.isArray(res.data.sources))
        sources = res.data.sources;
      else if (res?.data?.data && Array.isArray(res.data.data.sources))
        sources = res.data.data.sources;

      setTrackCloneSources(sources);
    } catch (error) {
      message.error("Lỗi tải danh sách bảng đấu nguồn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOk = () => {
    if (cloneSourceId) onClone(cloneSourceType, cloneSourceId, replaceExisting);
  };

  const filteredTrackSources = trackCloneSources.filter(
    (s) => s.hackathonId === selectedHackathonId,
  );

  return (
    <Modal
      title={
        currentRound?.is_final
          ? "Sao chép tiêu chí từ Mùa giải khác"
          : "Sao chép tiêu chí từ Bảng đấu khác"
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Tiến hành Sao chép"
      cancelText="Hủy"
      okButtonProps={{ disabled: !cloneSourceId || isLoading }}
      width={600}
    >
      <div
        style={{
          marginBottom: 24,
          padding: "12px 16px",
          backgroundColor: "#fafafa",
          borderRadius: 8,
          border: "1px solid #f0f0f0",
        }}
      >
        <Space size="middle" style={{ marginBottom: 8 }}>
          <Text strong>Chế độ sao chép:</Text>
          <Switch
            checkedChildren="Thay thế tất cả"
            unCheckedChildren="Cộng dồn"
            checked={replaceExisting}
            onChange={setReplaceExisting}
          />
        </Space>
        <div style={{ fontSize: "13px", color: "#8c8c8c" }}>
          {replaceExisting ? (
            <span style={{ color: "#faad14" }}>
              ⚠️ <b>Chú ý:</b> Toàn bộ tiêu chí hiện tại của vòng/bảng này sẽ bị{" "}
              <b>xóa sạch</b> và thay thế.
            </span>
          ) : (
            <span>
              ✅ Dữ liệu sao chép sẽ được <b>thêm nối tiếp</b> vào danh sách
              tiêu chí hiện tại.
            </span>
          )}
        </div>
      </div>

      <Spin spinning={isLoading}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>1. Chọn Mùa giải (Hackathon) nguồn:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Tìm kiếm mùa giải..."
            value={selectedHackathonId}
            onChange={(val) => {
              setSelectedHackathonId(val);
              setCloneSourceId(null);
            }}
            showSearch
            optionFilterProp="children"
          >
            {hackathons.map((h) => {
              const disabledHackathon = currentRound?.is_final
                ? h.id === currentHackathonId
                : false;

              return (
                <Option key={h.id} value={h.id} disabled={disabledHackathon}>
                  {h.name}
                </Option>
              );
            })}
          </Select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>2. Chọn Vòng thi / Bảng đấu nguồn:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Chọn bảng đấu hoặc vòng thi"
            value={
              cloneSourceId ? `${cloneSourceType}_${cloneSourceId}` : undefined
            }
            onChange={(val) => {
              const [type, id] = val.split("_");
              setCloneSourceType(type);
              setCloneSourceId(parseInt(id));
            }}
            disabled={
              currentRound?.is_final
                ? !selectedHackathonId || sourceRounds.length === 0
                : filteredTrackSources.length === 0
            }
          >
            {currentRound?.is_final
              ? sourceRounds.map((r) => {
                  const isRoundFinal =
                    r.is_final === true ||
                    r.isFinal === true ||
                    r.name?.toLowerCase().includes("chung kết") ||
                    r.name?.toLowerCase().includes("final");

                  if (!isRoundFinal) return null;
                  const isSameRound =
                    selectedHackathonId === currentHackathonId &&
                    r.id === selectedRoundId;
                  return (
                    <Option
                      key={`ROUND_${r.id}`}
                      value={`ROUND_${r.id}`}
                      disabled={isSameRound}
                    >
                      🏆 Vòng Chung kết: {r.name}
                    </Option>
                  );
                })
              : filteredTrackSources.map((s) => (
                  <Option
                    key={`TRACK_${s.trackId}`}
                    value={`TRACK_${s.trackId}`}
                  >
                    Bảng: {s.trackName} ({s.criteriaCount} tiêu chí)
                  </Option>
                ))}
          </Select>
        </div>
      </Spin>

      <Alert
        type="info"
        showIcon
        message={
          currentRound?.is_final
            ? "Vòng Chung kết chỉ có thể sao chép bộ tiêu chí từ các vòng Chung kết khác."
            : "Bạn có thể chọn Mùa giải bất kỳ ở trên để tìm kiếm các bảng đấu có sẵn tiêu chí để sao chép."
        }
        style={{ marginBottom: 24 }}
      />
    </Modal>
  );
};
