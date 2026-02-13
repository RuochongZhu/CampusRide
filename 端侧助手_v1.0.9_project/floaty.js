"rhino";

var w = floaty.window(
  <frame gravity="center">
    <button id="action" layout_gravity="right" margin="10" text="" w="200"></button>
  </frame>
);
//if (!$floaty.checkPermission()) {
  // 没有悬浮窗权限，提示用户并跳转请求
  //toastLog("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本。");
  //$floaty.requestPermission();
 // exit();
//}
toastLog("已有悬浮窗权限");
w.exitOnClose();
w.setPosition(300,200)
const storage = storages.create("zhouzhe5934@163.com:mobile-wx-rpa:page-bus");
const btnName = "启动"
w.action.setText(btnName)
let execution = null;
const scriptPath = "./action.js";
w.action.click(()=>{
    if(w.action.getText() == btnName){
        execution = engines.execScriptFile(scriptPath);
        w.action.setText("停止")
    }else{
        if(execution){
            execution.getEngine().forceStop();
        }
        w.action.setText(btnName)
    }
})
w.action.longClick(()=>{
    w.setAdjustEnabled(!w.isAdjustEnabled());
    return true;
})
setInterval(() => {}, 1000);