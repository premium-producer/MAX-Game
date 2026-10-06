// Correlation only. A prepared DOM never grants a business presentation ACK.
// Call after the existing shared-texture publication has completed.
export function maxGameFrameEvidence({output,metadata,plan,epoch,ack,senders}){
 const m=metadata?.maxMission;
 if(output!=='MAX_RIGHT'||metadata?.ready!==true||metadata.planEpoch!==epoch||plan?.contentEnabled!==true||
    ack?.accepted!==true||ack.published!==true||!Number.isSafeInteger(ack.frameId)||ack.frameId<1||
    !m||Object.keys(m).sort().join(',')!=='assignmentId,contentRevision,datasetInstanceKey,sessionId'||
    ![m.assignmentId,m.sessionId].every(v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v))||
    typeof m.contentRevision!=='string'||!m.contentRevision||m.contentRevision.length>256||
    !/^dataset-v1:[a-f0-9]{64}$/.test(m.datasetInstanceKey))return null;
 const sender=senders?.find(s=>plan.mode==='layers'?s.alpha===true&&s.name.endsWith('-MAX_RIGHT-content'):plan.mode==='program'&&s.alpha===false&&s.name.endsWith('-MAX_RIGHT-program'));
 return sender?{maxMission:{...m},sender:sender.name}:null;
}
