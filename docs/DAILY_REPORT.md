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

---

## Ngày 5: Tiền Gửi & Rút Tiền Đúng Hạn (Deposit & Maturity Withdrawals)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Cập nhật `VaultManager.sol`:**
  - Bổ sung địa chỉ `feeReceiver` (để nhận phí phạt rút trước hạn sau này).
  - Bổ sung cấu hình `savingCore` để kết nối và tin tưởng hợp đồng SavingCore.
  - Xây dựng hàm `payoutInterest`: Hàm này chỉ cho phép duy nhất `SavingCore` gọi để trả tiền lãi cho người dùng.
- **Cập nhật `SavingCore.sol`:**
  - Định nghĩa struct `Deposit`: Lưu trữ thông tin chi tiết từng khoản gửi, đặc biệt **Snapshot** cứng `apr` và `penalty` tại thời điểm gửi tiền (giúp ngăn chặn thay đổi Admin sau này tác động đến người đã gửi).
  - Triển khai hàm `openDeposit`: Cho phép người dùng chọn Plan, chuyển tiền gốc (USDC) vào SavingCore, cập nhật snapshot và cấp phát chứng chỉ NFT cho người dùng.
  - Triển khai hàm `withdrawAtMaturity`: Dành cho người dùng rút tiền khi đã hết hạn. Hàm tính toán lãi suất đơn: `(Principal * APR * Tenor) / (10000 * 365 days)`. Nó sẽ tự động "đốt" (burn) NFT, trả tiền gốc từ SavingCore và gọi `VaultManager` trả tiền lãi.
- **Biên dịch (Compile):**
  - Chạy `npx hardhat compile` thành công xác nhận không có lỗi cú pháp và đảm bảo tính thống nhất giữa 2 contracts.

---

## Ngày 6: Rút Tiền Trước Hạn & Gia Hạn (Early Withdrawal & Renewals)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Thêm Cấu hình Thời gian Ân hạn (Grace Period):**
  - Khởi tạo biến `gracePeriod = 4 days` theo đúng Personal Variant được giao.
- **Rút tiền trước hạn (`earlyWithdraw`):**
  - Cho phép người dùng thanh lý khoản gửi trước khi đáo hạn (với điều kiện `block.timestamp < maturityTime`).
  - Xóa bỏ toàn bộ lãi suất sinh ra.
  - Tính toán phí phạt (Penalty) dựa trên Snapshot (ví dụ 4.0% của Tiền Gốc).
  - Hoàn trả phần Tiền Gốc còn lại cho người dùng và chuyển tiền phạt về `feeReceiver` của VaultManager.
- **Gia hạn thủ công (`renewDeposit`):**
  - Áp dụng khi `block.timestamp >= maturityTime`. Người dùng tự động nhận phần lãi của chu kỳ vừa qua.
  - Snapshot cấu hình `apr` và `penalty` mới nhất từ hệ thống cho chu kỳ tiếp theo, cập nhật lại `startTime` và `maturityTime`.
- **Gia hạn tự động (`autoRenewDeposit`):**
  - Cho phép một tài khoản bất kỳ (thường là Bot off-chain) gọi hàm này nếu khoản gửi đã hết hạn quá thời gian ân hạn (`block.timestamp >= maturityTime + gracePeriod`).
  - Lãi suất của chu kỳ cũ được gửi thẳng về ví người dùng. Khoản gửi tự động gia hạn với Snapshot cấu hình mới nhất.
- **Biên dịch (Compile):**
  - Code đã được biên dịch thành công qua `npx hardhat compile`, đảm bảo mọi logic toán học và phân quyền chuẩn xác.

---

## Ngày 7: Tích hợp, Refactoring & Script Deploy (Logic Integration & Deployment)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Refactoring & Security:**
  - Import và cấu hình `ReentrancyGuard` từ OpenZeppelin vào `SavingCore.sol`.
  - Cài đặt modifier `nonReentrant` cho toàn bộ các hàm liên quan đến chuyển tiền (`openDeposit`, `withdrawAtMaturity`, `earlyWithdraw`, `renewDeposit`, `autoRenewDeposit`) nhằm ngăn chặn rủi ro tấn công vòng lặp (Reentrancy Attack).
- **Phát triển Script Triển khai (`scripts/deploy.ts`):**
  - Viết kịch bản tự động hóa quá trình Deploy cho toàn bộ hệ thống bằng Typescript cho Hardhat 3.
  - Các bước tự động: Deploy MockUSDC -> Mint tiền ảo cho Admin -> Deploy VaultManager -> Bơm tiền cho Vault -> Deploy SavingCore -> Liên kết 2 hợp đồng -> Cấu hình feeReceiver -> Tạo Gói tiết kiệm số 1 (2.5% APR, 4% Phạt, 90 ngày).
- **Khởi chạy Localhost:**
  - Chạy thành công lệnh `npx hardhat run scripts/deploy.ts`. Script xuất ra thông báo thành công và log ra đầy đủ 3 địa chỉ Contract mạng ảo, sẵn sàng kết nối với Frontend.
- **Tái cấu trúc kế hoạch dự án:**
  - Cập nhật `PROJECT_PLAN.md`: Đẩy Giai đoạn làm Frontend lên thực hiện ngay lập tức trong Phase 3 để bắt kịp tiến độ Demo MVP cho Mentor vào Thứ Sáu, đẩy Giai đoạn Viết Test lùi lại thành Phase 4.

---

## Ngày 8: Khởi tạo Bộ khung Frontend (Frontend Scaffolding)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Khởi tạo Dự án React + Vite:**
  - Thiết lập thành công ứng dụng React TypeScript bên trong thư mục `frontend/`.
  - Cài đặt thư viện `ethers` (v6) để giao tiếp với mạng lưới Blockchain và ví MetaMask.
- **Xây dựng Hệ thống Giao diện (Premium UI):**
  - Đã triển khai `index.css` theo yêu cầu phong cách Xanh Lá - Trắng (Green & White). Giao diện mang lại cảm giác tin cậy (Trustworthy), dịu mắt và cực kỳ hiện đại.
  - Tích hợp hiệu ứng Kính (Glassmorphism), bóng đổ đa tầng (Shadows) và nút bấm động (Micro-animations).
- **Thiết lập Cấu hình Hợp đồng:**
  - Lấy ABI và địa chỉ thực tế của 3 Smart Contracts (`MockUSDC`, `VaultManager`, `SavingCore`) từ bản Deploy ở mạng Localhost lưu trữ vào tệp `constants.ts`.
- **Hoàn thiện Nút Connect Wallet:**
  - Trong `App.tsx`, đã xây dựng thành công tính năng "Connect Wallet" yêu cầu quyền truy cập MetaMask.
  - Tính năng tự động hiển thị địa chỉ ví thu gọn (VD: `0x123...abcd`) khi kết nối thành công. Giao diện thay đổi mượt mà báo hiệu người dùng đã sẵn sàng thao tác trong những ngày tới.

---

## Ngày 9: Tương tác Giao diện & Chức năng Gửi tiền (UI Implementation)
**Trạng thái:** ✅ Hoàn thành

**Các công việc đã thực hiện:**
- **Triển khai Faucet (Nhận token test):**
  - Xây dựng nút "Mint 1,000 mUSDC". Khi click, Frontend sẽ gọi trực tiếp đến hàm `mint` của hợp đồng `MockUSDC`.
  - Tự động hiển thị số dư khả dụng (mUSDC) của người dùng ngay trên thanh Header.
- **Tải Danh sách Gói Tiết Kiệm (Fetch Plans):**
  - Tích hợp hàm `loadData` đọc biến `nextPlanId` từ hợp đồng `SavingCore`. Dùng vòng lặp gọi thông tin từng gói (APR, Penalty, Tenor).
  - Trình bày thông tin gói tiết kiệm dưới dạng các "Thẻ Card" đẹp mắt. Các thông số được xử lý chia tỷ lệ (/100) để hiển thị định dạng phần trăm (Ví dụ: 2.50%).
- **Xử lý Luồng Gửi tiền 2 bước (Two-step Deposit Flow):**
  - Thiết kế Form nhập số tiền (mUSDC) kết hợp khung chọn Gói Tiết Kiệm.
  - Tối ưu hóa trải nghiệm người dùng với chuỗi gọi hàm tự động qua `ethers.js`: 
    1. Đầu tiên gọi hàm `approve` của MockUSDC để mở khóa chi tiêu. 
    2. Chờ giao dịch xác nhận (wait) rồi tự động gọi tiếp hàm `openDeposit` của SavingCore.
  - Bổ sung hiệu ứng nút "Processing..." và hiển thị thông báo thành công (alert) giúp người dùng an tâm thao tác.

---

## Ngày 10: Xây dựng Dashboard Quản lý & Tương tác khoản gửi
**Trạng thái:** ✅ Hoàn thành (Sẵn sàng Demo MVP)

**Các công việc đã thực hiện:**
- **Triển khai Dashboard "My Active Deposits":**
  - Xây dựng luồng logic quét qua toàn bộ NFT (`tokenId`) trên mạng lưới, sử dụng `ownerOf` để lọc ra danh sách các Chứng chỉ Tiền gửi thuộc sở hữu của ví đang kết nối.
  - Xử lý các Token đã bị đốt (burned) an toàn bằng khối `try-catch` để không làm gián đoạn vòng lặp.
  - Hiển thị danh sách dưới dạng Thẻ chứa đầy đủ dữ liệu tài chính (Gốc, Lãi, Phí phạt, Thời gian đếm ngược).
- **Hệ thống nút hành động thông minh (Smart Action Buttons):**
  - Sử dụng đồng hồ đếm ngược theo thời gian thực (Real-time Timer) cập nhật liên tục mỗi giây để so sánh với thời gian đáo hạn (`maturityTime`).
  - **Trạng thái chưa đáo hạn (Locked):** Hệ thống chỉ hiển thị nút màu đỏ "Early Withdraw". Nếu người dùng bấm vào, trình duyệt sẽ bật lên một cảnh báo (Confirm dialog) xác nhận việc họ sẽ mất sạch lãi và chịu phạt phần trăm để tránh ấn nhầm. Khi xác nhận, gọi hàm `earlyWithdraw`.
  - **Trạng thái đã đáo hạn (Matured):** Hệ thống tự động ẩn nút rút trước hạn, hiện ra thông báo "Ready to Claim!". Đồng thời hiển thị 2 nút bấm mới là "Withdraw" (Gửi lệnh `withdrawAtMaturity`) và "Renew" (Gửi lệnh `renewDeposit`).
- **Thử nghiệm thành công:** Mọi luồng giao dịch đều kích hoạt MetaMask chính xác và tự động Load lại (Refresh) dữ liệu ngay sau khi mạng lưới xác nhận thành công. Giao diện Frontend giờ đã trở thành một hệ thống DApp hoạt động độc lập và hoàn hảo!
