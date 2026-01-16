let total = 0;
let loggedIn = false;

// Ảnh bạn có: 400.jpg, 800.jpg... 8000.jpg
const products = [
  { id: "400",  label: "400",  name: "Gói 400 Robux",  price: 50000,   img: "assets/images/400.jpg" },
  { id: "800",  label: "800",  name: "Gói 800 Robux",  price: 100000,  img: "assets/images/800.jpg" },
  { id: "1600", label: "1600", name: "Gói 1600 Robux", price: 200000,  img: "assets/images/1600.jpg" },
  { id: "2400", label: "2400", name: "Gói 2400 Robux", price: 300000,  img: "assets/images/2400.jpg" },
  { id: "4000", label: "4000", name: "Gói 4000 Robux", price: 500000,  img: "assets/images/4000.jpg" },
  { id: "8000", label: "8000", name: "Gói 8000 Robux", price: 1000000, img: "assets/images/8000.jpg" },
];

const cart = {};
let selectedTelco = "";

function money(n){ return Number(n || 0).toLocaleString("vi-VN"); }

/* =======================
   HELPERS
   ======================= */
function genRequestId(){
  // request_id nên unique để TrumThe không bị trùng
  return "REQ" + Date.now() + Math.floor(Math.random() * 1000);
}

function getSingleCartItem(){
  const items = Object.entries(cart); // [ [id, {name, price, qty}], ... ]
  if(items.length !== 1) return null;
  const [id, item] = items[0];
  if(item.qty !== 1) return null;
  return { id, ...item };
}

async function callTrumtheCharge({ telco, code, serial, amount, request_id }){
  // Gọi netlify function cùng domain (an toàn, khỏi lo domain)
  const res = await fetch("/.netlify/functions/trumthe-charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telco, code, serial, amount, request_id })
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if(!res.ok){
    throw new Error(data?.message || data?.raw || ("HTTP " + res.status));
  }
  return data;
}

/* =======================
   LOADING + ACCOUNT UI
   ======================= */
function showLoginLoading(){
  const el = document.getElementById("loginLoading");
  if(el) el.hidden = false;
}
function hideLoginLoading(){
  const el = document.getElementById("loginLoading");
  if(el) el.hidden = true;
}

function setLoggedInUI(username){
  const loginBox = document.getElementById("loginBox");
  const accountBox = document.getElementById("accountBox");

  if(loginBox) loginBox.hidden = true;
  if(accountBox) accountBox.hidden = false;

  const nameEl = document.getElementById("accountName");
  const handleEl = document.getElementById("accountHandle");
  if(nameEl) nameEl.textContent = username;
  if(handleEl) handleEl.textContent = "@" + username;

  const avatarEl = document.getElementById("accountAvatar");
  if(avatarEl) avatarEl.src = "assets/images/roblox-icon.jpg";
}

function logout(){
  loggedIn = false;

  const loginBox = document.getElementById("loginBox");
  const accountBox = document.getElementById("accountBox");
  if(loginBox) loginBox.hidden = false;
  if(accountBox) accountBox.hidden = true;

  const input = document.getElementById("username");
  const error = document.getElementById("usernameError");
  if(input){
    input.value = "";
    input.classList.remove("is-error");
  }
  if(error) error.hidden = true;

  clearCart();
  renderProducts();
  updateUI();
}

/* =======================
   LOGIN
   ======================= */
function login(){
  const input = document.getElementById("username");
  const error = document.getElementById("usernameError");
  const u = input.value.trim();

  input.classList.remove("is-error");
  if(error) error.hidden = true;

  if(!u){
    input.classList.add("is-error");
    if(error){
      error.textContent = "Vui lòng nhập tên tài khoản.";
      error.hidden = false;
    }
    return;
  }

  if(/^\d+$/.test(u)){
    input.classList.add("is-error");
    if(error){
      error.textContent =
        "Nhân vật không được tìm thấy trong khu vực này. " +
        "Vui lòng kiểm tra lại thông tin hoặc server tương ứng.";
      error.hidden = false;
    }
    return;
  }

  loggedIn = true;
  showLoginLoading();

  setTimeout(() => {
    hideLoginLoading();
    setLoggedInUI(u);
    renderProducts();
    updateUI();
  }, 1500);
}

/* =======================
   PRODUCTS + CART
   ======================= */
function renderProducts(){
  const el = document.getElementById("products");
  if(!el) return;
  el.innerHTML = "";

  products.forEach(p => {
    const disabledAttr = loggedIn ? "" : "disabled";
    const disabledClass = loggedIn ? "" : " disabled";

    el.innerHTML += `
      <div class="product">
        <div class="productTop">
          <img src="${p.img}" alt="${p.name}">
          <div class="productChip"><span class="chipDot"></span>${p.label}</div>
        </div>
        <div class="productBody">
          <div>
            <div class="productName">${p.name}</div>
            <div class="productPrice">${money(p.price)} VND</div>
          </div>
          <button class="btnAdd${disabledClass}" ${disabledAttr} onclick="addToCart('${p.id}')">+</button>
        </div>
      </div>
    `;
  });
}

function addToCart(id){
  if(!loggedIn){
    alert("Bạn cần đăng nhập trước khi chọn gói!");
    return;
  }
  const p = products.find(x => x.id === id);
  if(!p) return;

  if(!cart[id]) cart[id] = { name: p.name, price: p.price, qty: 0 };
  cart[id].qty += 1;

  updateUI();
}

function removeFromCart(id){
  if(!cart[id]) return;
  cart[id].qty -= 1;
  if(cart[id].qty <= 0) delete cart[id];
  updateUI();
}

function clearCart(){
  for(const k in cart) delete cart[k];
  updateUI();
}

function calcTotal(){
  let t = 0;
  Object.values(cart).forEach(i => t += i.price * i.qty);
  total = t;
}

function renderCart(){
  const el = document.getElementById("cart");
  const empty = document.getElementById("orderEmpty");
  if(!el || !empty) return;

  const items = Object.entries(cart);
  if(items.length === 0){
    el.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  el.innerHTML = items.map(([id, i]) => `
    <div class="cartItem">
      <div class="cartLeft">
        <div class="cartName">${i.name}</div>
        <div class="cartSub">${money(i.price)} VND × ${i.qty}</div>
      </div>
      <button class="cartBtn" onclick="removeFromCart('${id}')">−</button>
    </div>
  `).join("");
}

function updateTotals(){
  const totalEl = document.getElementById("total");
  const totalSmallEl = document.getElementById("totalSmall");
  if(totalEl) totalEl.innerText = money(total);
  if(totalSmallEl) totalSmallEl.innerText = money(total);

  const payBtn = document.getElementById("openPayModalBtn");
  const canPay = total > 0 && loggedIn;

  if(payBtn){
    payBtn.disabled = !canPay;
    payBtn.classList.toggle("enabled", canPay);
  }
}

function updateUI(){
  calcTotal();
  renderCart();
  updateTotals();
}

/* =======================
   MODAL PAYMENT
   ======================= */
function buildModalItems(){
  const modalItems = document.getElementById("modalItems");
  if(!modalItems) return;

  const items = Object.entries(cart);
  if(items.length === 0){
    modalItems.innerHTML = `<div class="muted">Đơn hàng đang trống</div>`;
    return;
  }

  modalItems.innerHTML = items.map(([id, i]) => {
    const p = products.find(x => x.id === id);
    const img = p ? p.img : "";
    return `
      <div class="modalItem">
        <img class="modalItemImg" src="${img}" alt="">
        <div class="modalItemInfo">
          <div class="modalItemName">${i.name}</div>
          <div class="modalItemPrice">${money(i.price)} VND</div>
        </div>
        <div class="modalItemQty">x${i.qty}</div>
      </div>
    `;
  }).join("");
}

function syncModalPayBtnState(){
  const payBtn = document.getElementById("modalPayBtn");
  if(!payBtn) return;

  const seri = document.getElementById("cardSeriModal")?.value.trim() || "";
  const code = document.getElementById("cardCodeModal")?.value.trim() || "";

  const ok =
    !!selectedTelco &&
    /^\d{6,20}$/.test(seri) &&
    /^\d{6,20}$/.test(code) &&
    total > 0 &&
    loggedIn;

  payBtn.disabled = !ok;

  const amountText = document.getElementById("modalAmountText");
  const totalText = document.getElementById("modalTotalText");
  if(amountText) amountText.innerText = money(total);
  if(totalText) totalText.innerText = money(total);
}

function openPayModal(){
  const modal = document.getElementById("payModal");
  if(!modal) return;

  if(!loggedIn){ alert("Bạn cần đăng nhập trước!"); return; }
  if(total <= 0){ alert("Giỏ hàng đang trống!"); return; }

  buildModalItems();

  const amountSel = document.getElementById("cardAmountModal");
  if(amountSel) amountSel.style.display = "none";

  const seriEl = document.getElementById("cardSeriModal");
  const codeEl = document.getElementById("cardCodeModal");
  if(seriEl) seriEl.value = "";
  if(codeEl) codeEl.value = "";

  const grid = document.getElementById("telcoGrid");
  if(grid) grid.querySelectorAll(".telcoBtn").forEach(b => b.classList.remove("active"));
  selectedTelco = "";

  modal.hidden = false;
  modal.classList.add("show");
  document.body.classList.add("modalOpen");

  syncModalPayBtnState();
}

function closePayModal(){
  const modal = document.getElementById("payModal");
  if(!modal) return;
  modal.hidden = true;
  modal.classList.remove("show");
  document.body.classList.remove("modalOpen");
}

function setupModalEvents(){
  const openBtn = document.getElementById("openPayModalBtn");
  const closeBtn = document.getElementById("closePayModalBtn");
  const modal = document.getElementById("payModal");
  const grid = document.getElementById("telcoGrid");
  const payBtn = document.getElementById("modalPayBtn");

  if(openBtn) openBtn.addEventListener("click", openPayModal);
  if(closeBtn) closeBtn.addEventListener("click", closePayModal);

  if(modal){
    modal.addEventListener("click", (e) => {
      if(e.target === modal) closePayModal();
    });
  }

  if(grid){
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".telcoBtn");
      if(!btn) return;

      selectedTelco = btn.dataset.telco || "";
      grid.querySelectorAll(".telcoBtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      syncModalPayBtnState();
    });
  }

  const seriEl = document.getElementById("cardSeriModal");
  const codeEl = document.getElementById("cardCodeModal");
  if(seriEl) seriEl.addEventListener("input", syncModalPayBtnState);
  if(codeEl) codeEl.addEventListener("input", syncModalPayBtnState);

  // ✅ THAY ALERT BẰNG GỬI TRUMTHE
  if(payBtn){
    payBtn.addEventListener("click", async () => {
      const u = document.getElementById("username")?.value.trim() || "";
      if(!u){ // ====== CALL NETLIFY FUNCTION THẬT ======
(async () => {
  const payBtn = document.getElementById("modalPayBtn");
  try {
    payBtn.disabled = true;
    payBtn.textContent = "Đang xử lý...";

    const u = document.getElementById("username")?.value.trim() || "";
    const seri = document.getElementById("cardSeriModal")?.value.trim() || "";
    const code = document.getElementById("cardCodeModal")?.value.trim() || "";

    const payload = {
      telco: selectedTelco.toUpperCase(), // VIETTEL, MOBIFONE...
      code,
      serial: seri,
      amount: total,                       // tổng đơn
      request_id: `RBX_${Date.now()}`,      // id đơn của bạn
      username: u,                         // nếu muốn lưu ở backend sau này
      cart,                                // nếu muốn lưu chi tiết
    };

    const res = await fetch("/.netlify/functions/trumthe-charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // ====== XỬ LÝ KẾT QUẢ TRẢ VỀ TỪ TRUMTHE ======
    // Thường status: 1 (thành công), 99 (pending), 3 (sai thẻ), ...
    if (data.status == 1) {
      alert("✅ Nạp thẻ thành công!");
      clearCart();
      closePayModal();
      updateUI();
    } else if (data.status == 99) {
      alert("⏳ Thẻ đang chờ xử lý (pending). Hệ thống sẽ cập nhật sau.");
      closePayModal();
    } else {
      alert(`❌ Nạp thẻ thất bại!\nMã: ${data.status}\n${data.message || ""}`);
    }

  } catch (err) {
    alert("Lỗi gọi thanh toán: " + err.message);
  } finally {
    const payBtn = document.getElementById("modalPayBtn");
    if (payBtn) {
      payBtn.textContent = "Thanh toán ngay";
      // bật lại nút dựa theo điều kiện
      syncModalPayBtnState();
    }
  }
})();

          // bạn muốn thì clear cart sau khi gửi:
          // clearCart();
          return;
        }

        // lỗi
        alert("Gửi thẻ thất bại: " + (data.message || "Unknown error"));
      } catch (err) {
        alert("Lỗi gọi thanh toán: " + err.message);
      } finally {
        payBtn.textContent = oldText;
        syncModalPayBtnState(); // bật lại theo điều kiện
      }
    });
  }
}

/* init */
renderProducts();
updateUI();
setupModalEvents();
