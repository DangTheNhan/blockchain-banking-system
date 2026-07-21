# Báo Cáo Tiến Độ Hàng Ngày (Daily Report)

Tài liệu này ghi lại chi tiết các công việc đã hoàn thành theo từng ngày trong quá trình phát triển dự án "Hệ thống Ngân hàng Phi tập trung (Decentralized Banking System)".

---

## Ngày 1: Khởi tạo dự án & Phân tích yêu cầu
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Phân tích tham số:** Dựa trên Mã số sinh viên `2231200022` (A=2, B=2), đã tính toán và chốt các tham số nghiệp vụ cốt lõi:
  - Thời gian gia hạn (Grace period): 4 ngày.
  - Lãi suất mặc định (APR): 250 bps (2.5%).
  - Phí phạt rút trước hạn (Penalty): 400 bps (4.0%).
  - Kỳ hạn chuẩn (Plan tenor): 90 ngày.
- **Thiết lập môi trường (Environment Setup):** 
  - Khởi tạo dự án bằng framework Hardhat.
  - Cài đặt các thư viện cần thiết, bao gồm thư viện tiêu chuẩn `@openzeppelin/contracts`.
  - Dọn dẹp các tệp mẫu không cần thiết (boilerplates như `Counter.sol`, `Lock.sol`...) để chuẩn bị sẵn sàng cho việc phát triển Smart Contract.
- **Lập kế hoạch dự án:** Tạo ra tài liệu `PROJECT_PLAN.md` với kế hoạch 14 ngày chi tiết.

---

## Ngày 2: Token giả lập (Mock Token) & Trình quản lý quỹ (Vault Manager)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Phát triển `MockUSDC.sol`:**
  - Viết Smart Contract kế thừa từ `ERC20` của OpenZeppelin.
  - Ghi đè (override) hàm `decimals()` để trả về giá trị `6` thay vì 18 mặc định, đảm bảo giống với USDC thực tế.
  - Thêm chức năng `mint()` phục vụ riêng cho môi trường thử nghiệm (Testing).
- **Phát triển `VaultManager.sol`:**
  - Viết Smart Contract quản lý quỹ với việc kế thừa `Ownable` (phân quyền) và `Pausable` (dừng khẩn cấp).
  - Tích hợp thư viện `SafeERC20` để tương tác an toàn với các token ERC20 (như USDC).
  - Hoàn thiện các logic nạp quỹ (`adminDeposit`), rút quỹ (`adminWithdraw`) cho Owner/Admin.
  - Hoàn thiện chức năng bảo mật `pause()` và `unpause()` để kiểm soát rủi ro.
- **Biên dịch (Compile):**
  - Chạy `npx hardhat compile` thành công (Solc 0.8.28) không gặp lỗi cú pháp hay bảo mật nào.
