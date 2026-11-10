// 艾爾琳之旅 網頁版：雲端存檔（Firebase 專案 erinn-journey）設定。apiKey 不是密碼，本來就會出現在網頁裡；存取權限由 Firestore 安全規則控管。
// authDomain：放在 GitHub Pages（xxx.github.io，網站根目錄有自架的 /__/auth/ 登入輔助檔）時自動用自己的網域，
// iPhone 主畫面版的「轉址登入」才拿得回結果；其他地方（localhost 測試等）用 Firebase 預設網域。
window.ERINN_FIREBASE={
  apiKey:'AIzaSyBzz0qTCPB8WjIH1EoIrb-SPs9ucrXgIPU',
  authDomain:/\.github\.io$/.test(location.hostname)?location.hostname:'erinn-journey.firebaseapp.com',
  projectId:'erinn-journey',
  storageBucket:'erinn-journey.firebasestorage.app',
  messagingSenderId:'300449011425',
  appId:'1:300449011425:web:49dd8fbda1c7ab1fa689a0'
};
