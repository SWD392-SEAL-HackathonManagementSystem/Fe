import React from "react";
import { theme, Typography } from "antd";
import { XCircle, AlertTriangle } from "lucide-react";

const { useToken } = theme;
const { Text } = Typography;

export const ValidationItem = ({ status, code, message, index }) => {
  const { token } = useToken();
  const isError = status === "error";

  const color = isError ? token.colorError : token.colorWarning;
  const bgSoft = isError ? token.colorErrorBg : token.colorWarningBg;

  const formatDate = (dateString) => {
    if (!dateString || !dateString.includes("T")) return dateString;
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessage = (text) => {
    if (!text) return "";
    let formattedText = text.replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/g,
      (match) => formatDate(match),
    );

    const parts = formattedText.split(/(['"][^'"]+['"])/g);
    const highlighted = parts.map((part, i) => {
      if (part.match(/^['"][^'"]+['"]$/)) {
        return (
          <strong key={i} style={{ color: token.colorTextHeading }}>
            {part}
          </strong>
        );
      }
      return part;
    });

    return highlighted.reduce((acc, part) => {
      const strPart = typeof part === "string" ? part : "";
      if (strPart.includes("phải trong khung")) {
        const split = strPart.split("phải trong khung");
        acc.push(split[0]);
        acc.push(<br key="br" />);
        acc.push(
          <Text type="secondary" key="label">
            Phải nằm trong khung:{" "}
          </Text>,
        );
        acc.push(split[1]);
      } else {
        acc.push(part);
      }
      return acc;
    }, []);
  };

  return (
    <div
      className="validation-item-hover"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 20px",
        marginBottom: "12px",
        borderRadius: "12px",
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderLeft: `4px solid ${color}`,
        boxShadow: token.boxShadowTertiary,
        transition: "all 0.3s ease",
        animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
      }}
    >
      <div
        style={{
          marginTop: 2,
          backgroundColor: bgSoft,
          padding: 8,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
        }}
      >
        {isError ? (
          <XCircle size={18} color={color} />
        ) : (
          <AlertTriangle size={18} color={color} />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: token.colorTextTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 6,
            display: "block",
          }}
        >
          {code}
        </Text>
        <div
          style={{
            color: token.colorText,
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {formatMessage(message)}
        </div>
      </div>
    </div>
  );
};
