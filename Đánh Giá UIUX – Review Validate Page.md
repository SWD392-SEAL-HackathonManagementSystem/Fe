# Đánh Giá UI/UX – Review Validate Page

## Tổng Quan

### Điểm tổng thể: **7/10**

UI hiện đại, bố cục rõ ràng, có cảm giác chuyên nghiệp và dễ đọc. Luồng kiểm tra readiness của hackathon được thể hiện khá trực quan. Tuy nhiên vẫn còn một số vấn đề về UX logic, consistency và responsive cần cải thiện.

---

# 1. Điểm Mạnh

## 1.1 Thiết kế trực quan tốt

- Màu sắc phân biệt rõ:
  - Đỏ = lỗi nghiêm trọng
  - Vàng = cảnh báo
  - Xanh = hoàn thành

- Summary card nổi bật, giúp người dùng:
  - biết trạng thái hiện tại
  - số lượng lỗi
  - khả năng kích hoạt

- Visual hierarchy khá ổn:
  - Header
  - Tabs kiểm tra
  - Summary/action

---

## 1.2 UX phân nhóm hợp lý

Các lỗi được chia:

- Vòng thi
- Tiêu chí
- Nhân sự
- Khác
- Cảnh báo

Điều này giúp:

- dễ tìm lỗi
- giảm cognitive load
- tăng khả năng xử lý theo nhóm

---

## 1.3 Có điều hướng sửa lỗi

Button:

```jsx
Xử lý →
```

giúp user:

- click trực tiếp tới nơi cần sửa
- không phải tự tìm thủ công

Đây là UX rất tốt.

---

## 1.4 Empty State đẹp

Khi không có lỗi:

- có icon
- có màu xanh
- có message tích cực

Tạo cảm giác hoàn thành tốt.

---

## 1.5 Layout desktop ổn

Bố cục:

- trái = danh sách kiểm tra
- phải = summary sticky

rất hợp lý cho workflow kiểm tra cấu hình.

---

# 2. Vấn Đề & Sai Logic

# 2.1 Sai prop `onNavigate`

Trong:

```jsx
<ReviewTabs
  ...
  onNavigate={(code) => {...}}
/>
```

Nhưng bên trong `ReviewTabs`:

- không nhận prop `onNavigate`
- tự dùng `useNavigate`

=> Prop đang bị thừa.

---

## Đề xuất

### Cách 1

Xóa prop `onNavigate`.

### Cách 2

Cho `ReviewTabs` nhận callback từ parent.

Ví dụ:

```jsx
export const ReviewTabs = {
  groupedBlockers,
  warnings,
  hackathonId,
  onNavigate,
};
```

---

# 2.2 Sai tên tab điều hướng

Trong `ReviewTabs`:

```js
tab = "people";
```

Nhưng tab thực tế:

```js
key: "personnel";
```

=> có khả năng navigate sai tab.

---

## Đề xuất

Thống nhất toàn bộ:

```js
tab = "personnel";
```

---

# 2.3 UX nút Activate chưa tốt

Hiện tại:

```jsx
disabled={!isReady || hackathonStatus !== "DRAFT"}
```

Nhưng user không biết:

- vì sao bị khóa
- thiếu gì
- status nào được phép

---

## Đề xuất

### Hiển thị lý do disabled

Ví dụ:

```jsx
tooltip = "Còn 3 lỗi bắt buộc cần xử lý";
```

Hoặc:

```jsx
tooltip = "Chỉ có thể kích hoạt khi trạng thái là DRAFT";
```

---

# 2.4 Logic text button chưa đầy đủ

Hiện tại:

```jsx
{
  !isReady ? "Vui lòng xử lý lỗi" : "Xác nhận Kích hoạt";
}
```

Nếu:

- `isReady = true`
- nhưng status != DRAFT

thì text vẫn là:

```txt
Xác nhận Kích hoạt
```

=> gây hiểu nhầm.

---

## Đề xuất

```jsx
{
  !isReady
    ? "Vui lòng xử lý lỗi"
    : hackathonStatus !== "DRAFT"
      ? "Không thể kích hoạt ở trạng thái hiện tại"
      : "Xác nhận kích hoạt";
}
```

---

# 2.5 Reload page không tối ưu

Hiện tại:

```js
window.location.reload();
```

UX không mượt.

---

## Đề xuất

Dùng:

- refetch()
- hoặc update state
- hoặc navigate()

Ví dụ:

```js
await refetch();
```

---

# 3. Responsive / Mobile

## Điểm yếu

Tabs hiện tại:

- icon
- text
- badge
- scale animation

=> dễ bị chật trên mobile.

---

## Đề xuất

### Mobile:

- dùng scrollable tabs
- rút gọn text
- hoặc chuyển Collapse

Ví dụ:

```jsx
tabPosition = "top";
moreIcon;
```

---

# 4. Thiếu UX Quan Trọng

# 4.1 Thiếu Progress tổng thể

Hiện chưa có:

- bao nhiêu điều kiện đạt
- bao nhiêu còn thiếu

---

## Đề xuất

Ví dụ:

```txt
8/10 điều kiện đã hoàn thành
```

kèm Progress bar.

---

# 4.2 Thiếu nút "Kiểm tra lại"

Nên có:

```txt
[ Kiểm tra lại ]
```

để user refetch data.

---

# 4.3 Thiếu confirm modal

Kích hoạt hackathon là action lớn.

Nên thêm:

```txt
Bạn chắc chắn muốn kích hoạt?
```

---

# 4.4 Thiếu tên Hackathon

Header hiện chỉ có:

```txt
Điều kiện phát hành
```

Nên thêm:

```txt
Hackathon ABC 2026
```

để tăng context.

---

# 5. Code/UI Consistency

# 5.1 Hard-code màu quá nhiều

Ví dụ:

```js
#f6ffed
#fff1f0
#d9d9d9
```

---

## Đề xuất

Dùng token của Ant Design:

```js
token.colorSuccessBg;
token.colorErrorBg;
token.colorBorder;
```

=> hỗ trợ:

- dark mode
- consistency
- maintainability

---

# 5.2 Inline style quá nhiều

File hiện khá nặng vì:

- style inline everywhere

---

## Đề xuất

Tách:

- CSS module
- styled-components
- emotion

hoặc ít nhất:

- reusable style constants

---

# 5.3 Animation ổn nhưng hơi nhiều

Hover:

```css
scale(1.01)
translateY(-2px)
```

Tab:

```css
scale(1.05)
```

Nếu nhiều item:

- dễ gây cảm giác "nhảy"
- hơi noisy

---

## Đề xuất

Giảm animation:

- subtle hơn
- duration ngắn hơn

---

# 6. Chấm Điểm Chi Tiết

| Hạng mục          | Điểm   |
| ----------------- | ------ |
| Visual Design     | 8/10   |
| UX Flow           | 7/10   |
| Logic Consistency | 6.5/10 |
| Responsive        | 6/10   |
| Readability       | 8/10   |
| Actionability     | 8/10   |
| Maintainability   | 6.5/10 |

---

# 7. Kết Luận

## Điểm tổng thể: **7/10**

Đây là một UI:

- khá hiện đại
- có structure tốt
- UX xử lý lỗi tương đối rõ

Nhưng để đạt mức:

- production-ready
- polished
- senior-level UX

thì cần cải thiện:

- consistency
- responsive
- trạng thái disabled
- flow activate
- refetch/reload
- progress visibility
- mobile experience

Nếu refine tiếp các phần trên, UI hoàn toàn có thể lên mức:

## 8.5/10 hoặc 9/10.
