import UserKey from "./keyStruct";
import contractKeys from "../contractKeys";

const delegateServerKey =new UserKey(UserKey.recoverFromUserSk(contractKeys.DELEGATE_SERVER_SK), contractKeys.DELEGATE_SERVER_SK);
const auditorKey = new UserKey(UserKey.recoverFromUserSk(contractKeys.AUDITOR_SK), contractKeys.AUDITOR_SK);

export default {
    auditorKey : auditorKey,
    delegateServerKey : delegateServerKey,
    pkOwn : delegateServerKey.pk.pkOwn,
    pkEnc : delegateServerKey.pk.pkEnc,
    skOwn : delegateServerKey.skOwn,
    skEnc : delegateServerKey.skEnc,
}