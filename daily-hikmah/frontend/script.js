// ====================================
// Configuration
// ====================================

// IMPORTANT: Update RENDER_BACKEND_URL before deploying to Vercel
// Get your Render backend URL from: https://dashboard.render.com
// Example: 'https://daily-hikmah-backend.onrender.com'
const RENDER_BACKEND_URL = 'https://YOUR_APP_NAME.onrender.com'; // ⚠️ UPDATE THIS!

// Auto-detect environment: localhost uses same-origin, production uses Render
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Empty string = same origin for local dev (backend serves frontend)
  : RENDER_BACKEND_URL; // Production: Vercel frontend → Render backend

console.log('🌐 Environment:', window.location.hostname);
console.log('🔗 API URL:', API_URL || 'Same origin (localhost)');

if (API_URL.includes('YOUR_APP_NAME')) {
  console.error('⚠️ WARNING: Update RENDER_BACKEND_URL in script.js before deploying to Vercel!');
}

// ====================================
// DOM Elements
// ====================================

const subscribeBtn = document.getElementById("subscribeBtn");
const btnText = document.getElementById("btnText");
const unsubscribeBtn = document.getElementById("unsubscribeBtn");
const unsubBtnText = document.getElementById("unsubBtnText");
const statusEl = document.getElementById("status");
const wisdomEl = document.getElementById("wisdomText");
const frequencySection = document.getElementById("frequencySection");
const infoSection = document.getElementById("infoSection");

let vapidPublicKey = null;

// ====================================
// Utility Functions
// ====================================

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Update status message
function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? "status error" : "status success";
  statusEl.style.display = "block";
}

// Get selected frequency from radio buttons
function getSelectedFrequency() {
  const selected = document.querySelector('input[name="frequency"]:checked');
  return selected ? parseInt(selected.value) : 24; // Default to 24 hours
}

// ====================================
// API Functions
// ====================================

// Load today's wisdom from backend
async function loadTodaysWisdom() {
  try {
    const response = await fetch(API_URL + "/api/hikmah");
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    wisdomEl.textContent = data.message || data.body || "لا توجد حكمة متاحة";
    console.log("✅ Hikmah loaded successfully");
  } catch (error) {
    console.error("❌ Failed to load hikmah:", error);
    wisdomEl.textContent = "فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.";
    
    // Show detailed error in console for debugging
    if (API_URL.includes('YOUR_APP_NAME')) {
      console.error("⚠️ API_URL not configured! Update RENDER_BACKEND_URL in script.js");
    }
  }
}

// Fetch VAPID public key from server
async function getVAPIDPublicKey() {
  try {
    const response = await fetch(API_URL + "/api/vapid-public-key");
    if (!response.ok) {
      throw new Error(`Failed to fetch VAPID key: ${response.status}`);
    }
    const data = await response.json();
    if (!data.publicKey) {
      throw new Error("Server did not return a valid VAPID public key");
    }
    return data.publicKey;
  } catch (error) {
    console.error("❌ Failed to fetch VAPID key:", error);
    throw new Error("فشل الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي.");
  }
}

// ====================================
// Service Worker Functions
// ====================================

// Register Service Worker
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Workers not supported in this browser");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  console.log("✅ Service Worker registered:", registration);
  
  // Wait for the service worker to be ready
  await navigator.serviceWorker.ready;
  return registration;
}

// ====================================
// Subscription Functions
// ====================================

// Subscribe to push notifications
async function subscribeToPush() {
  try {
    // Disable button during subscription
    subscribeBtn.disabled = true;
    btnText.textContent = "جاري الاشتراك...";
    updateStatus("جاري تفعيل الإشعارات...");

    // Check notification permission
    if (Notification.permission === "denied") {
      throw new Error("لقد قمت بحظر الإشعارات. يرجى السماح بها من إعدادات المتصفح.");
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("يجب السماح بالإشعارات للاشتراك");
    }

    // Get selected frequency
    const frequency = getSelectedFrequency();
    console.log("📅 Selected frequency:", frequency, "hours");

    // Get VAPID public key
    if (!vapidPublicKey) {
      vapidPublicKey = await getVAPIDPublicKey();
      console.log("🔑 VAPID key received:", vapidPublicKey.substring(0, 20) + "...");
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("📬 Push subscription created:", subscription);

    // Send subscription to server with frequency preference
    const response = await fetch(API_URL + "/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscription,
        frequency: frequency
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Failed to save subscription: " + errorText);
    }

    const result = await response.json();
    console.log("✅ Subscription saved:", result);

    // Update UI
    btnText.textContent = "✓ مشترك";
    subscribeBtn.classList.add("subscribed");
    subscribeBtn.style.display = "none";
    unsubscribeBtn.style.display = "inline-block";
    
    const frequencyText = frequency === 6 ? "كل 6 ساعات" : frequency === 12 ? "كل 12 ساعة" : "كل 24 ساعة";
    updateStatus(`تم الاشتراك! ستستقبل حكمة ${frequencyText} 🎉`);

    // Hide frequency selection and instructions
    if (frequencySection) frequencySection.style.display = "none";
    if (infoSection) infoSection.style.display = "none";
    document.querySelector(".subtitle").style.display = "none";

  } catch (error) {
    console.error("❌ Subscription failed:", error);
    updateStatus(error.message || "فشل الاشتراك. حاول مرة أخرى.", true);
    
    // Re-enable button
    subscribeBtn.disabled = false;
    btnText.textContent = "اشترك الآن";
  }
}

// Check if already subscribed
async function checkSubscription() {
  try {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Already subscribed
      console.log("✅ Already subscribed");
      btnText.textContent = "✓ مشترك";
      subscribeBtn.classList.add("subscribed");
      subscribeBtn.style.display = "none";
      unsubscribeBtn.style.display = "inline-block";
      updateStatus("أنت مشترك بالفعل في الحكمة اليومية 🎉");
      
      // Hide UI elements
      if (frequencySection) frequencySection.style.display = "none";
      if (infoSection) infoSection.style.display = "none";
      document.querySelector(".subtitle").style.display = "none";
      
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

// Unsubscribe from push notifications
async function unsubscribeFromPush() {
  try {
    // Disable button during unsubscription
    unsubscribeBtn.disabled = true;
    unsubBtnText.textContent = "جاري الإلغاء...";
    updateStatus("جاري إلغاء الاشتراك...");

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error("Service Worker not found");
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Unsubscribe from push
    const success = await subscription.unsubscribe();
    if (!success) {
      throw new Error("Failed to unsubscribe");
    }

    console.log("✅ Unsubscribed successfully");

    // Update UI
    unsubscribeBtn.style.display = "none";
    subscribeBtn.style.display = "inline-block";
    subscribeBtn.classList.remove("subscribed");
    subscribeBtn.disabled = false;
    btnText.textContent = "اشترك الآن";
    updateStatus("تم إلغاء الاشتراك بنجاح");

    // Show frequency selection and instructions again
    if (frequencySection) frequencySection.style.display = "block";
    if (infoSection) infoSection.style.display = "block";
    document.querySelector(".subtitle").style.display = "block";

    // Re-enable unsubscribe button
    unsubscribeBtn.disabled = false;
    unsubBtnText.textContent = "إلغاء الاشتراك";

  } catch (error) {
    console.error("❌ Unsubscribe failed:", error);
    updateStatus(error.message || "فشل إلغاء الاشتراك. حاول مرة أخرى.", true);
    
    unsubscribeBtn.disabled = false;
    unsubBtnText.textContent = "إلغاء الاشتراك";
  }
}

// ====================================
// Event Listeners
// ====================================

subscribeBtn.addEventListener("click", subscribeToPush);
unsubscribeBtn.addEventListener("click", unsubscribeFromPush);

// ====================================
// Auto-Refresh Hikmah
// ====================================

// Auto-refresh hikmah every hour
function startAutoRefresh() {
  // Refresh every hour (3600000 ms)
  setInterval(() => {
    console.log("🔄 Auto-refreshing hikmah...");
    loadTodaysWisdom();
  }, 3600000); // 1 hour
}

// ====================================
// Initialization
// ====================================

// Load wisdom and check subscription status on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Daily Hikmah app initialized");
  loadTodaysWisdom();
  checkSubscription();
  startAutoRefresh();
});
