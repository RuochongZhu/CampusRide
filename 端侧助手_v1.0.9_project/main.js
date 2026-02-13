"ui";
ui.layout(
  <vertical padding="32">
    <button id="wannaStartBtn" text="启动浮窗"></button>

    <text>1、启动浮窗</text>
    <text>2、打开要服务的微信群 </text>
    <text>3、点击启动</text>
  </vertical>
);


let execution = null;
const scriptPath = "./floaty.js";

const storage = storages.create("zhouzhe5934@163.com:mobile-wx-rpa:page-bus");
ui.wannaStartBtn.on("click",()=>{
    if(ui.wannaStartBtn.attr("text") == "启动浮窗"){
        execution = engines.execScriptFile(scriptPath);
        ui.wannaStartBtn.attr("text","关闭浮窗");
    }else{
        if(execution){
            execution.getEngine().forceStop();
        }
        ui.wannaStartBtn.attr("text","启动浮窗");
    }
})

log(device.fingerprint)