// Independent DirectX Spout receiver. No CPU readback in the frame loop.
#include <SpoutDX.h>
#include <d3dcompiler.h>
#include <wrl/client.h>
#include <chrono>
#include <fstream>
#include <filesystem>
#include <iostream>
#include <thread>
#include <stdexcept>
#include <array>
using Microsoft::WRL::ComPtr;
using Clock=std::chrono::steady_clock;
static int view=3;
static LRESULT CALLBACK windowProc(HWND h,UINT m,WPARAM w,LPARAM l) {
  if(m==WM_DESTROY) { PostQuitMessage(0); return 0; }
  if(m==WM_KEYDOWN && w>='1' && w<='3') { view=int(w-'0'); return 0; }
  return DefWindowProc(h,m,w,l);
}
void check(HRESULT hr,const char* s) { if(FAILED(hr)) { char msg[256]; sprintf_s(msg,"%s: 0x%08lx",s,(unsigned long)hr); throw std::runtime_error(msg); } }
const char* shader=R"(
Texture2D bg:register(t0); Texture2D fg:register(t1); SamplerState smp:register(s0);
cbuffer Params:register(b0) { float mode; float3 unused; };
struct V { float4 p:SV_Position; float2 uv:TEXCOORD0; };
V vs(uint id:SV_VertexID) { V v; v.uv=float2((id<<1)&2,id&2); v.p=float4(v.uv*float2(2,-2)+float2(-1,1),0,1); return v; }
float4 ps(V v):SV_Target {
 float4 b=bg.Sample(smp,v.uv), f=fg.Sample(smp,v.uv);
 float k=fmod(floor(v.uv.x*48)+floor(v.uv.y*24),2); float3 checker=lerp(float3(.13,.13,.13),float3(.3,.3,.3),k);
 if(mode<1.5) return float4(b.rgb,1);
 if(mode<2.5) return float4(f.rgb+checker*(1-f.a),1);
 return float4(f.rgb+b.rgb*(1-f.a),1);
})";
void snapshot(ID3D11Device* d,ID3D11DeviceContext* ctx,ID3D11Texture2D* tex,const std::filesystem::path& path) {
  D3D11_TEXTURE2D_DESC desc; tex->GetDesc(&desc); auto stageDesc=desc;
  stageDesc.Usage=D3D11_USAGE_STAGING; stageDesc.BindFlags=0; stageDesc.CPUAccessFlags=D3D11_CPU_ACCESS_READ; stageDesc.MiscFlags=0;
  ComPtr<ID3D11Texture2D> stage; check(d->CreateTexture2D(&stageDesc,nullptr,&stage),"Create staging");
  ctx->CopyResource(stage.Get(),tex); D3D11_MAPPED_SUBRESOURCE mapped;
  check(ctx->Map(stage.Get(),0,D3D11_MAP_READ,0,&mapped),"Snapshot Map");
  std::ofstream f(path.string()+".raw",std::ios::binary);
  uint64_t alpha[3]={0,0,0};
  for(UINT y=0;y<desc.Height;y++) {
    auto row=(const unsigned char*)mapped.pData+y*mapped.RowPitch;
    f.write((const char*)row,desc.Width*4);
    for(UINT x=0;x<desc.Width;x++) { auto a=row[x*4+3]; alpha[a==0?0:a==255?2:1]++; }
  }
  ctx->Unmap(stage.Get(),0);
  std::ofstream meta(path.string()+".json");
  meta<<"{\"width\":"<<desc.Width<<",\"height\":"<<desc.Height<<",\"dxgiFormat\":"<<desc.Format<<",\"alphaZero\":"<<alpha[0]<<",\"alphaPartial\":"<<alpha[1]<<",\"alphaOpaque\":"<<alpha[2]<<"}";
}
int main(int argc,char** argv) {
 struct TimerResolution { TimerResolution(){timeBeginPeriod(1);} ~TimerResolution(){timeEndPeriod(1);} } timerResolution;
 try {
  std::filesystem::path out=argc>1?argv[1]:"receiver-results"; int seconds=argc>2?atoi(argv[2]):180;
  if(seconds<10 || seconds>14400) throw std::runtime_error("duration must be 10..14400 seconds");
  std::filesystem::create_directories(out);
  std::ofstream log(out/"receiver.csv"); log<<"elapsedMs,channel,frame,width,height,format\n";
  WNDCLASS wc{}; wc.lpfnWndProc=windowProc; wc.hInstance=GetModuleHandle(nullptr); wc.lpszClassName="KdwSpoutProbe"; RegisterClass(&wc);
  HWND window=CreateWindow(wc.lpszClassName,"KDW Spout probe | 1 background | 2 alpha content | 3 composite",WS_OVERLAPPED|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX,30,30,1280,680,nullptr,nullptr,wc.hInstance,nullptr);
  if(!window) throw std::runtime_error("CreateWindow failed");
  DXGI_SWAP_CHAIN_DESC sd{}; sd.BufferCount=2; sd.BufferDesc.Width=1280; sd.BufferDesc.Height=640; sd.BufferDesc.Format=DXGI_FORMAT_B8G8R8A8_UNORM; sd.BufferUsage=DXGI_USAGE_RENDER_TARGET_OUTPUT; sd.OutputWindow=window; sd.SampleDesc.Count=1; sd.Windowed=TRUE; sd.SwapEffect=DXGI_SWAP_EFFECT_DISCARD;
  ComPtr<ID3D11Device> device; ComPtr<ID3D11DeviceContext> ctx; ComPtr<IDXGISwapChain> swap;
  check(D3D11CreateDeviceAndSwapChain(nullptr,D3D_DRIVER_TYPE_HARDWARE,nullptr,D3D11_CREATE_DEVICE_BGRA_SUPPORT,nullptr,0,D3D11_SDK_VERSION,&sd,&swap,&device,nullptr,&ctx),"D3D receiver");
  ComPtr<ID3D11Texture2D> buffer; check(swap->GetBuffer(0,IID_PPV_ARGS(&buffer)),"Back buffer");
  ComPtr<ID3D11RenderTargetView> target; check(device->CreateRenderTargetView(buffer.Get(),nullptr,&target),"RTV");
  ComPtr<ID3DBlob> vcode,pcode,err;
  check(D3DCompile(shader,strlen(shader),nullptr,nullptr,nullptr,"vs","vs_4_0",0,0,&vcode,&err),"VS compile");
  check(D3DCompile(shader,strlen(shader),nullptr,nullptr,nullptr,"ps","ps_4_0",0,0,&pcode,&err),"PS compile");
  ComPtr<ID3D11VertexShader> vs; ComPtr<ID3D11PixelShader> ps;
  check(device->CreateVertexShader(vcode->GetBufferPointer(),vcode->GetBufferSize(),nullptr,&vs),"VS");
  check(device->CreatePixelShader(pcode->GetBufferPointer(),pcode->GetBufferSize(),nullptr,&ps),"PS");
  D3D11_SAMPLER_DESC ss{}; ss.Filter=D3D11_FILTER_MIN_MAG_MIP_LINEAR; ss.AddressU=ss.AddressV=ss.AddressW=D3D11_TEXTURE_ADDRESS_CLAMP; ss.MaxLOD=D3D11_FLOAT32_MAX;
  ComPtr<ID3D11SamplerState> sampler; check(device->CreateSamplerState(&ss,&sampler),"Sampler");
  D3D11_BUFFER_DESC bd{}; bd.ByteWidth=16; bd.Usage=D3D11_USAGE_DEFAULT; bd.BindFlags=D3D11_BIND_CONSTANT_BUFFER;
  ComPtr<ID3D11Buffer> params; check(device->CreateBuffer(&bd,nullptr,&params),"Params");
  std::array<spoutDX,2> receivers; const char* names[]={"KDW_MAX_BACKGROUND","KDW_MAX_CONTENT"};
  std::array<ComPtr<ID3D11Texture2D>,2> textures; std::array<ComPtr<ID3D11ShaderResourceView>,2> views;
  std::array<long,2> last={-1,-1}; std::array<uint64_t,2> count={0,0}; std::array<double,2> lastSeen={0,0}; bool snapshots=false;
  for(int i=0;i<2;i++) { if(!receivers[i].OpenDirectX11(device.Get())) throw std::runtime_error("Receiver OpenDirectX11 failed"); receivers[i].SetReceiverName(names[i]); }
  ShowWindow(window,SW_SHOWNOACTIVATE);
  auto start=Clock::now(),lastPresent=start; bool quit=false;
  while(!quit) {
    MSG msg; while(PeekMessage(&msg,nullptr,0,0,PM_REMOVE)) { if(msg.message==WM_QUIT) quit=true; TranslateMessage(&msg); DispatchMessage(&msg); }
    double ms=std::chrono::duration<double,std::milli>(Clock::now()-start).count(); if(ms>seconds*1000) break;
    for(int i=0;i<2;i++) {
      // SDK copies under the sender mutex into receiver-owned texture.
      ID3D11Texture2D* tex=textures[i].Detach(); bool ok=receivers[i].ReceiveTexture(&tex); textures[i].Attach(tex);
      if(receivers[i].IsUpdated()) {
        views[i].Reset(); textures[i].Reset();
        D3D11_TEXTURE2D_DESC desc{}; desc.Width=receivers[i].GetSenderWidth(); desc.Height=receivers[i].GetSenderHeight(); desc.Format=receivers[i].GetSenderFormat(); desc.MipLevels=1; desc.ArraySize=1; desc.SampleDesc.Count=1; desc.Usage=D3D11_USAGE_DEFAULT; desc.BindFlags=D3D11_BIND_SHADER_RESOURCE;
        check(device->CreateTexture2D(&desc,nullptr,&textures[i]),"Receiver texture");
        continue; // The next ReceiveTexture copies the first frame into it.
      }
      if(ok && textures[i]) {
        if(!views[i]) check(device->CreateShaderResourceView(textures[i].Get(),nullptr,&views[i]),"Receiver SRV");
        auto frame=receivers[i].GetSenderFrame();
        if(receivers[i].IsFrameNew() && frame!=last[i]) { last[i]=frame; count[i]++; lastSeen[i]=ms; log<<ms<<","<<i<<","<<frame<<","<<receivers[i].GetSenderWidth()<<","<<receivers[i].GetSenderHeight()<<","<<receivers[i].GetSenderFormat()<<"\n"; }
      }
    }
    // Preview at <=60 Hz; receiver polling is independent of vsync.
    if(std::chrono::duration<double,std::milli>(Clock::now()-lastPresent).count()>16.0) {
      lastPresent=Clock::now(); float clear[]={.03f,.03f,.03f,1}; ctx->ClearRenderTargetView(target.Get(),clear);
      if(views[0] && views[1]) {
        float mode[]={float(view),0,0,0}; ctx->UpdateSubresource(params.Get(),0,nullptr,mode,0,0);
        D3D11_VIEWPORT vp{0,0,1280,640,0,1}; ctx->RSSetViewports(1,&vp); ctx->OMSetRenderTargets(1,target.GetAddressOf(),nullptr);
        ctx->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST); ctx->VSSetShader(vs.Get(),nullptr,0); ctx->PSSetShader(ps.Get(),nullptr,0);
        ctx->PSSetSamplers(0,1,sampler.GetAddressOf()); ctx->PSSetConstantBuffers(0,1,params.GetAddressOf()); ID3D11ShaderResourceView* srvs[]={views[0].Get(),views[1].Get()}; ctx->PSSetShaderResources(0,2,srvs); ctx->Draw(3,0);
        ID3D11ShaderResourceView* empty[2]={nullptr,nullptr}; ctx->PSSetShaderResources(0,2,empty);
      }
      check(swap->Present(0,0),"Present");
    }
    if(!snapshots && ms>3000 && textures[0] && textures[1]) {
      snapshot(device.Get(),ctx.Get(),textures[0].Get(),out/"background"); snapshot(device.Get(),ctx.Get(),textures[1].Get(),out/"content"); snapshot(device.Get(),ctx.Get(),buffer.Get(),out/"composite"); snapshots=true;
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
  }
  for(auto& r:receivers) r.ReleaseReceiver();
  std::ofstream result(out/"receiver-summary.json"); result<<"{\"frames\":["<<count[0]<<","<<count[1]<<"],\"lastSeenMs\":["<<lastSeen[0]<<","<<lastSeen[1]<<"],\"snapshots\":"<<(snapshots?"true":"false")<<"}";
  return count[0]>30 && count[1]>30 && snapshots?0:2;
 } catch(const std::exception& ex) { std::cerr<<ex.what()<<std::endl; return 1; }
}
