// ====================================
// Configuration
// ====================================

// IMPORTANT: Change this to your Render backend URL before deploying to Vercel
// For local development: Same origin (served by backend)
// For production on Vercel: https://your-app-name.onrender.com
const API_URL = window.location.hostname === 'localhost' 
  ? '' // Empty string = same origin for local dev
  : 'https://YOUR_RENDER_BACKEND_URL_HERE.onrender.com';

console.log('🌐 API URL:', API_URL || 'Same origin (localhost)');

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
    const response = await fetch(API_URL + "/today");
    if (!response.ok) {
      throw new Error("Failed to fetch wisdom");
    }
    const data = await response.json();
    wisdomEl.textContent = data.message;
  } catch (error) {
    console.error("Failed to load wisdom:", error);
    wisdomEl.textContent = "فشل تحميل الحكمة. يرجى تحديث الصفحة.";
  }
}

// Fetch VAPID public key from server
async function getVAPIDPublicKey() {
  try {
    const response = await fetch(API_URL + "/vapid-public-key");
    if (!response.ok) {
      throw new Error("Failed to fetch VAPID key");
    }
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error("Failed to fetch VAPID key:", error);
    throw new Error("Failed to get server public key. Please check if backend is running.");
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
      console.log("🔑 VAPID key received");
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
    const response = await fetch(API_URL + "/subscribe", {
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
