// Fixed role modules only. No command/module path supplied over the network.
export async function startApplication(loaded) {
  const {root,config}=loaded;
  if(config.renderIdlePolicy){
    const {startRenderIdleClient}=await import('./control/render-idle-client.mjs');
    let ui;
    const idle=await startRenderIdleClient(loaded,{onNativeFrame:frame=>ui?.physicalPresented?.(frame)});
    if(config.application==='native-idle')return idle;
    // MAX UI and background keep separate handles. This does not composite the game into Spout.
    try{ui=await startApplication({...loaded,config:{...config,renderIdlePolicy:undefined}});}catch(error){await idle.close();throw error;}
    return {get readiness(){return idle.readiness;},lidar:ui.lidar,capabilities:[...new Set([...idle.capabilities,...ui.capabilities])],
      close:async()=>{try{await ui.close();}finally{await idle.close();}}};
  }
  if(config.application==='max-ui'&&config.role==='MAX_RIGHT'){
    const {startLocalMaxServer}=await import('./max-adapter/local-server.mjs');
    const {createMaxBindingProvider}=await import('./max-binding.mjs');
    const {requestMaster,subscribeMasterEvents}=await import('./transport.mjs');
    const provider=createMaxBindingProvider(loaded);
    let app;
    try{app=await startLocalMaxServer({packageRoot:root,port:config.uiPort,getBinding:provider.getBinding,
      requestMaster:request=>requestMaster(loaded,request),subscribeEvents:request=>subscribeMasterEvents(loaded,request)});}
    catch(error){provider.close();throw error;}
    return {...app,readiness:'ui-listening',capabilities:['max.ui.v1'],close:async()=>{provider.close();await app.close();}};
  }
  if(config.application==='portable-master'&&config.role==='MASTER'){
    const {startMasterApplication}=await import('./master-adapter/start-master.mjs');
    const {startBusinessGateway,localMasterRequest}=await import('./control/business-gateway.mjs');
    const backend=await startMasterApplication(loaded);
    let gateway;
    try {
      const health=await localMasterRequest(backend.backendPort,{method:'GET',path:'/health'});
      if(health.status!==200||health.body?.processId!==backend.processId||backend.readiness!=='backend-and-canonical-ready')throw Error('OWNED_MASTER_NOT_READY');
      gateway=await startBusinessGateway(root,{ownedMasterBootId:health.body.bootId});
    }
    catch(error) { await backend.close(); throw error; }
    let closing;
    return {get readiness(){return backend.readiness==='backend-and-canonical-ready'?'backend-canonical-gateway-ready':backend.readiness;},capabilities:['stella.gateway.v1','master.backend.v1','max.canonical.v1'],
      close:()=>closing??=(async()=>{try{await gateway.close();}finally{await backend.close();}})()};
  }
  if(config.application==='master-gateway'&&config.role==='MASTER'){
    const {startBusinessGateway}=await import('./control/business-gateway.mjs');
    const app=await startBusinessGateway(root);
    return {...app,readiness:'gateway-listening',capabilities:['stella.gateway.v1']};
  }
  if(config.application==='stella-ui'&&config.role==='STELLA'){
    if(!Number.isInteger(config.uiPort)||config.uiPort<1024||config.uiPort>65535)throw Error('Invalid local UI port');
    const {startLocalStellaServer}=await import('./stella-adapter/local-server.mjs');
    const {requestMaster}=await import('./transport.mjs');
    const app=await startLocalStellaServer({packageRoot:root,port:config.uiPort,requestMaster:async request=>{
      const response=await requestMaster(loaded,request);return {status:response.status,body:response.data};
    }});
    return {...app,readiness:'ui-listening',capabilities:['stella.ui.v1']};
  }
  throw Error('Unsupported role application');
}
