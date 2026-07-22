# Hướng Dẫn Trình Bày (Demo Guide) - Decentralized Banking System

Tài liệu này cung cấp từng bước chi tiết để bạn chuẩn bị môi trường và trình diễn toàn bộ 5 tính năng ngân hàng cốt lõi (Gửi tiền, Rút trước hạn, Gia hạn...) một cách mượt mà nhất trước Mentor.

---

## Phần 1: Khởi Động Hệ Thống (Chuẩn bị trước khi gọi Mentor)

Bạn cần mở sẵn **3 cửa sổ Terminal (Command Prompt / VSCode Terminal)** và thực hiện lần lượt các bước sau:

### Terminal 1: Chạy Mạng Blockchain (Localhost)
Đây là trái tim của hệ thống. Phải bật cái này đầu tiên và **cứ để nó chạy ngầm**.
```bash
cd "c:\Assignment Intership"
npx hardhat node
```
*(Sau khi chạy, nó sẽ in ra danh sách 20 Accounts (Ví). Hãy copy dòng **Private Key của Account #0** để lát nữa Import vào MetaMask).*

### Terminal 2: Cài Đặt (Deploy) Hợp Đồng
Mở Terminal thứ 2, chạy đoạn kịch bản tự động để đưa các Smart Contract lên mạng Localhost vừa bật.
```bash
cd "c:\Assignment Intership"
npx hardhat run scripts/deploy.ts --network localhost
```
*(Nếu nó báo lỗi, hãy đảm bảo Terminal 1 vẫn đang chạy).*

### Terminal 3: Khởi Động Giao Diện Web (Frontend)
Mở Terminal thứ 3 để bật trang web của chúng ta lên.
```bash
cd "c:\Assignment Intership\frontend"
npm run dev
```

---

## Phần 2: Cài Đặt Ví MetaMask

Để website giao tiếp được với Blockchain giả lập, bạn phải chỉnh lại MetaMask:
1. Mở MetaMask, nhấn vào chọn Mạng (Network) ở trên cùng.
2. Bật "Show test networks" (Hiển thị mạng thử nghiệm) nếu có.
3. Chọn mạng **Localhost 8545**.
4. Chọn Import Account (Nhập tài khoản) -> Dán cái **Private Key** (Của Account #0 lấy từ Terminal 1) vào. 
*(Tài khoản này có sẵn 10,000 ETH ảo để bạn làm phí gas).*

---

## Phần 3: Kịch Bản Trình Diễn (Demo Script)

Hãy làm tuần tự các bước sau khi màn hình trình chiếu bắt đầu:

### 🌟 Bước 1: Kết nối & Nhận Token Test
1. Mở trình duyệt vào trang: `http://localhost:5173`
2. Nhấn nút **"Connect Wallet"** -> MetaMask sẽ hiện ra -> Xác nhận kết nối.
3. Giới thiệu: *"Em đã lấy được địa chỉ ví và Load được danh sách Gói Tiết Kiệm (Saving Plans) từ Blockchain."*
4. Nhấn nút **"🚰 Mint 1,000 mUSDC"** -> Xác nhận trên MetaMask.
5. Chỉ cho Mentor thấy số dư (Balance) trên góc phải màn hình đã nhảy lên `1,000 mUSDC`.

### 🌟 Bước 2: Gửi Tiền (Deposit)
1. Kéo xuống phần **Open a Deposit**.
2. Nhập `100` vào ô Amount (mUSDC).
3. Nhấn **Deposit Now**.
4. MetaMask sẽ bật lên 2 lần:
   - **Lần 1:** Cấp quyền (Approve) cho Ngân hàng rút tiền từ ví.
   - **Lần 2:** Giao dịch Deposit thực sự.
5. Chờ vài giây để màn hình Load lại. Bạn sẽ thấy **Deposit #1** xuất hiện ở khu vực "My Active Deposits" bên dưới với trạng thái màu vàng là **Locked**.

### 🌟 Bước 3: Rút Tiền Trước Hạn (Early Withdraw)
1. Giới thiệu: *"Khoản tiền này bị khóa 90 ngày. Nếu người dùng muốn rút ngay, họ sẽ bị mất lãi và chịu phí phạt 4%."*
2. Nhấn nút màu đỏ **"Early Withdraw"** của cái Deposit bạn vừa tạo.
3. Trình duyệt hiện cảnh báo -> Bấm OK. Xác nhận trên MetaMask.
4. Giao dịch thành công, khoản gửi biến mất. Nếu Mentor để ý, số tiền USDC của bạn trên Header đã bị trừ đi một khoản phí phạt nhỏ.

### 🌟 Bước 4: Chuyển thời gian đến tương lai (Time Travel)
Để demo tính năng GIA HẠN và RÚT TIỀN sau 90 ngày, bạn không thể ngồi đợi được. Tôi đã chuẩn bị một script "Cỗ máy thời gian".
1. Gửi lại một khoản tiền `100` mUSDC mới y hệt như Bước 2. Khoản tiền mới sẽ mang mã **Deposit #2** (hoặc 3) và đang bị **Locked**.
2. Mở lại **Terminal 2**, chạy lệnh tua thời gian:
   ```bash
   npx hardhat run scripts/advanceTime.ts --network localhost
   ```
3. Quay lại trình duyệt Web, **bấm F5 (Tải lại trang)**.
4. Điều kỳ diệu sẽ xảy ra: Trạng thái của thẻ Deposit tự động chuyển thành màu xanh lá **"Matured"** (Đã đáo hạn) đi kèm dòng chữ "🎉 Ready to Claim!". Hai nút mới (Withdraw và Renew) sẽ hiện ra!

### 🌟 Bước 5: Rút tiền / Gia hạn (Withdraw / Renew)
- Nhấn **Renew** để hệ thống tự động tái đầu tư và gửi trả lãi vào ví.
- Hoặc nhấn **Withdraw** để lấy lại cả Cốc lẫn Lãi và kết thúc kỳ hạn. Cả 2 nút này đều gọi đến Smart Contract và trừ tiền vô cùng chuẩn xác!

---
*Chúc bạn có một buổi bảo vệ dự án thành công rực rỡ!*

---

## Phần 4: Xử Lý Sự Cố Khi Demo (Troubleshooting)

Trong quá trình bảo vệ hoặc nếu bạn phải sửa code/khởi động lại máy chủ, hãy ghi nhớ 2 lỗi "kinh điển" sau đây và cách khắc phục trong 10 giây:

### 1. Lỗi "Mint failed", "No plans available" hoặc Giao dịch bị kẹt (Lỗi Nonce)
- **Nguyên nhân:** Khi máy chủ Hardhat (Terminal 1) bị tắt rồi bật lại, bộ đếm số giao dịch (Nonce) của nó quay về 0, nhưng MetaMask vẫn nhớ số cũ (ví dụ: 21). Mạng lưới sẽ từ chối giao dịch vì "lệch pha".
- **Cách khắc phục:** 
  1. Mở MetaMask -> Cài đặt (Settings) -> **Developer tools**.
  2. Bấm **"Delete activity and nonce data"** (Xóa hoạt động). Việc này chỉ xóa bộ nhớ đệm, không làm mất tiền.
  3. Bấm **F5** tải lại trang web là xong.

### 2. Sửa/Update Code Smart Contract hoặc Khởi động lại Hardhat
Nếu bạn vừa chỉnh sửa mã nguồn Smart Contract hoặc vừa bật lại `npx hardhat node`, toàn bộ các Ngân hàng cũ đã biến mất. Bạn bắt buộc phải làm 3 việc:
1. Chạy lại lệnh Cài đặt: `npx hardhat run scripts/deploy.ts --network localhost`
2. **Cập nhật địa chỉ:** Mở file `frontend/src/constants.ts`, copy 3 cái địa chỉ Contract (MockUSDC, VaultManager, SavingCore) mà Terminal vừa in ra và dán đè vào đó.
3. Làm thao tác **Xóa hoạt động (Clear Activity)** ở lỗi số 1, sau đó **F5 tải lại trang web**. Tiền và dữ liệu sẽ thông lại ngay lập tức!
