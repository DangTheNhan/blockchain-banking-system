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

---

## Ngày 3: Viết Unit Test cơ bản (Base Unit Tests)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Triển khai môi trường Test:**
  - Viết test bằng TypeScript (`MockUSDC.ts` và `VaultManager.ts`).
  - Cấu hình sử dụng Mocha, Chai và Ethers (thông qua plugin của Hardhat: `@nomicfoundation/hardhat-toolbox-mocha-ethers`).
- **Test cho `MockUSDC.sol`:**
  - Đảm bảo tham số cấu hình: Name ("Mock USDC"), Symbol ("mUSDC") và số thập phân (6 decimals).
  - Kiểm tra chức năng `mint()` phát ra (emit) event `Transfer` chính xác và cập nhật đúng số dư (balance) lẫn tổng cung (total supply).
- **Test cho `VaultManager.sol`:**
  - Xác nhận Smart Contract được khởi tạo đúng địa chỉ token cơ sở và đúng Owner.
  - Kiểm tra logic `Pausable`: Chỉ Owner mới được gọi `pause`/`unpause`, phát sự kiện đầy đủ, tài khoản bình thường bị chặn (`OwnableUnauthorizedAccount`).
  - Kiểm tra logic nạp/rút quỹ Admin: Owner gửi tiền thì token vào vault, balance tăng, event `AdminDeposited` phát ra. Owner rút tiền thì balance giảm, event `AdminWithdrawn` phát ra.
  - Đảm bảo không thể nạp quỹ khi hệ thống bị tạm ngưng (`EnforcedPause`).
- **Khởi chạy Test Suite:**
  - Chạy `npx hardhat test` và tất cả các test case đều đã passed thành công (11/11 tests passing).

---

## Ngày 4: SavingCore & Plan Logic
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Triển khai `SavingCore.sol`:**
  - Viết Smart Contract chính kế thừa từ `ERC721` (để cấp phát Chứng chỉ tiền gửi - Certificate of Deposit dưới dạng NFT) và `Ownable` (dành cho các thao tác cấu hình Plan).
  - Tích hợp `SafeERC20` để chuẩn bị cho các luồng xử lý nạp/rút tiền (deposit/withdraw) trong những ngày tới.
- **Xây dựng cấu trúc Plan (Gói tiết kiệm):**
  - Định nghĩa struct `Plan` lưu trữ thông tin về: `apr` (Lãi suất), `penalty` (Phí phạt rút trước hạn), `tenor` (Kỳ hạn tính bằng giây), và `enabled` (Trạng thái kích hoạt).
  - Cài đặt hệ thống lưu trữ gói dựa trên `planId` tăng dần (bắt đầu từ 1).
- **Các hàm quản trị (Admin Functions):**
  - `createPlan`: Cho phép Owner tạo các gói tiết kiệm mới với tham số linh hoạt.
  - `updatePlan`: Cho phép cập nhật gói đã có (lưu ý theo yêu cầu của hệ thống, điều này không ảnh hưởng đến các Deposit cũ đã snapshot tỷ lệ).
  - `enablePlan` / `disablePlan`: Bật hoặc tắt trạng thái tiếp nhận tiền gửi mới của một gói.
  - Các sự kiện (events) đầy đủ được gắn vào các hàm trên (`PlanCreated`, `PlanUpdated`, `PlanEnabled`, `PlanDisabled`).
- **Biên dịch (Compile):**
  - Chạy `npx hardhat compile` thành công (Solc 0.8.28) để xác minh tính chính xác về mặt cú pháp của hợp đồng.
