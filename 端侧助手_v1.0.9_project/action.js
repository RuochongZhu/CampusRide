auto;
setScreenMetrics(1080,2460);
console.show();
const baseUri = "https://campusride-production.up.railway.app/wxgroup_notice_wait"
const sendMsg = (msg)=>{
    console.log("将发送消息 " +msg);
    const result = className("android.widget.EditText").findOne();
    if(!result){
        console.log("未检测到输入框，输入失败 " + msg);
        return false
    }
    result.setText(msg);
    click(979,2321);
    return true;
}
const msgQuery = ()=>{
    const  r= http.get(baseUri);
    if(r.statusCode != 200){
        console.log("同步异常！！")
        return false;
    }
    const msgContent = r.body.string()
    if(msgContent == ""){
        console.log("当前没有要发送的消息～");
        return false;
    }
    console.log("收到消息：：",msgContent)
    setText(msgContent);
    // const result = className("android.widget.EditText").findOne();
    // if(!result){
    //     console.log("未检测到输入框，输入失败 " + msgContent);
    //     return false
    // }
    // result.setText(msgContent);
    //click(979,2321);
    console.log("点击发送按钮")
    const sendBtn = text("发送").findOne();
    sendBtn.click();
}

while(true){
    msgQuery();
    // if(result)sendMsg(result);
    sleep(3000);
}

// setScreenMetrics(1080,2460);
// const posSendMsg = (msgContent)=>{
//     console.log("准备发送 " + msgContent);
//     setClip(msgContent);
//     click(442,1411);
//     sleep(300);
//     longClick(442,1411);
//     sleep(800);
//     click(123,1264);
//     sleep(800);
//     click(961,1404);
// }

// // while(true){
// //     const result = msgQuery();
// //     if(result)posSendMsg(result);
// //     sleep(3000);
// // }
// console.log("全部输入框")
// setText("ceshi all")
// console.log("检测输入框")
// const result = className("android.widget.EditText").findOne();
// console.log("检测到输入框")
// result.setText("hello");
// console.log("设置输入框内容")
