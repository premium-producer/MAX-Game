/** Role-local credential only; never cache across lease changes or host restarts. */
export async function readLocalPlayerHeaders(request=globalThis.fetch){
 const response=await request('/bridge/player',{cache:'no-store'});
 if(!response.ok)throw Object.assign(Error('Managed host unavailable'),{code:'LOCAL_PLAYER_UNAVAILABLE'});
 const {token}=await response.json();
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Object.assign(Error('Invalid local credential'),{code:'LOCAL_PLAYER_UNAVAILABLE'});
 return {'X-Local-Player':token};
}
