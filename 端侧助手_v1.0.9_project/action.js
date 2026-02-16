auto;
setScreenMetrics(1080, 2460);
console.show();

const baseUri = "https://campusride-production.up.railway.app/wxgroup_notice_wait_v2";
const ackUri = "https://campusride-production.up.railway.app/wxgroup_notice_ack";
const storage = storages.create("zhouzhe5934@163.com:mobile-wx-rpa:page-bus");

const getPendingBatch = () => storage.get("pending_batch", null);
const setPendingBatch = (batch) => storage.put("pending_batch", batch);
const clearPendingBatch = () => storage.remove("pending_batch");

const findInput = () => className("android.widget.EditText").findOne(1000);
const findSendButton = () => {
    let btn = text("发送").findOnce();
    if (btn) return btn;
    btn = textMatches(/发送|Send/i).findOnce();
    if (btn) return btn;
    btn = descMatches(/发送|Send/i).findOnce();
    return btn;
};

const sendContent = (content) => {
    console.log("将发送消息: " + content);
    const input = findInput();
    if (!input) {
        console.log("未检测到输入框，发送失败");
        return false;
    }
    input.setText(content);
    sleep(300);
    const sendBtn = findSendButton();
    if (!sendBtn) {
        console.log("未检测到发送按钮，发送失败");
        return false;
    }
    sendBtn.click();
    sleep(300);
    return true;
};

const ackBatch = (ids) => {
    try {
        const resp = http.postJson(ackUri, { ids: ids });
        return resp.statusCode === 200;
    } catch (e) {
        console.log("确认发送失败: " + e);
        return false;
    }
};

const fetchBatch = () => {
    try {
        const r = http.get(baseUri);
        if (r.statusCode !== 200) {
            console.log("同步异常！！");
            return null;
        }
        const body = r.body.string();
        const payload = JSON.parse(body);
        if (!payload || !payload.success || !payload.data) {
            console.log("当前没有要发送的消息～");
            return null;
        }
        return payload.data;
    } catch (e) {
        console.log("解析消息失败: " + e);
        return null;
    }
};

while (true) {
    const pending = getPendingBatch();
    if (pending && pending.ids && pending.content) {
        console.log("检测到待发送批次，尝试发送");
        const sent = sendContent(pending.content);
        if (sent) {
            const acked = ackBatch(pending.ids);
            if (acked) {
                clearPendingBatch();
                console.log("批次确认完成");
            } else {
                console.log("批次确认失败，稍后重试");
            }
        } else {
            console.log("发送失败，等待屏幕亮起后重试");
        }
        sleep(3000);
        continue;
    }

    const batch = fetchBatch();
    if (batch && batch.ids && batch.content) {
        console.log("收到新批次：" + batch.count);
        setPendingBatch({ ids: batch.ids, content: batch.content });
        const sent = sendContent(batch.content);
        if (sent) {
            const acked = ackBatch(batch.ids);
            if (acked) {
                clearPendingBatch();
                console.log("批次确认完成");
            } else {
                console.log("批次确认失败，稍后重试");
            }
        } else {
            console.log("发送失败，等待屏幕亮起后重试");
        }
    }
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
