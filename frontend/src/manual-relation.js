import * as Func from "./functions";

const relationText = "[relation]:\n  from: [from]\n  to: [to]";

let from;
let to;

export function initManualRelation() {
    document.getElementById("manual-relation-text").innerHTML = relationText;
}


export function updateManualRelation(objectId) {
    if (Func.isNull(from)) {
        from = objectId;
        let text = relationText.replace("[from]", from);
        document.getElementById("manual-relation-text").innerHTML = text;
        return;
    }
    if (Func.isNull(to)) {
        to = objectId;
        let text = relationText.replace("[from]", from);
        text = text.replace("[to]", to);
        text = text.replace("[relation]", from + "-" + to);
        document.getElementById("manual-relation-text").innerHTML = text;
        from = null;
        to = null;
    }
}