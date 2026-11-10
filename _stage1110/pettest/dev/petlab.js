/*DEV*/
// 測試版專用：獨立存檔、資源給好給滿。正式版整個 dev/ 資料夾不打包（tools/build_release.sh 會拿掉）。
'use strict';
(function (P) {
  window.__PETLAB__ = true;
  const C = P.CFG;
  C.saveKey = 'petlab_save';
  // 開發者介面改過的設定（存在 localStorage）在開機前套回去
  P.CFG_DEFAULT = JSON.parse(JSON.stringify(C));
  try { const o = JSON.parse(localStorage.getItem('petlab_cfg') || 'null'); if (o) Object.assign(C, o) } catch (e) { }
  const ns = P.newState;
  P.newState = () => {
    const s = ns();
    Object.assign(s, { gold: 9999999, bread: 999, snackMat: 999, disk: 999, shards: 999, collar: 99, letters: { b: 99, p: 99, k: 99 }, frag: { star: 0, dusk: 0 }, rep: C.repLv[4] });
    s.mat = Object.assign(s.mat || {}, { feather: 5, dew: 10, fruit: 5, wish: 3 });
    return s;
  };
})(window.PET);
/*/DEV*/
