#include <node_api.h>
#include <d3d11_1.h>
#include <dxgi1_2.h>
#include <wrl/client.h>
#include <SpoutDX.h>
#include <array>
#include <vector>
#include <memory>
#include <stdexcept>
#include <cstring>
#include <delayimp.h>
// Electron exports Node-API from electron.exe, not a separate node.exe.
static FARPROC WINAPI nodeDelayHook(unsigned event,PDelayLoadInfo info) {
  if(event==dliNotePreLoadLibrary && _stricmp(info->szDll,"node.exe")==0) return reinterpret_cast<FARPROC>(GetModuleHandle(nullptr));
  return nullptr;
}
extern "C" const PfnDliHook __pfnDliNotifyHook2=nodeDelayHook;
using Microsoft::WRL::ComPtr;
namespace {
struct Flight { uint32_t token; ComPtr<ID3D11Texture2D> input; ComPtr<ID3D11Query> done; };
struct Channel { std::unique_ptr<spoutDX> sender; std::vector<Flight> flights; ComPtr<ID3D11Texture2D> lastGood; };
ComPtr<ID3D11Device1> device;
ComPtr<ID3D11DeviceContext> context;
std::array<Channel,2> channels;
uint32_t serial=0;
std::string adapter;
void check(HRESULT hr, const char* operation) {
  if(FAILED(hr)) { char s[128]; sprintf_s(s,"%s HRESULT=0x%08lx",operation,(unsigned long)hr); throw std::runtime_error(s); }
}
napi_value num(napi_env e,double n) { napi_value v; napi_create_double(e,n,&v); return v; }
napi_value str(napi_env e,const std::string& s) { napi_value v; napi_create_string_utf8(e,s.c_str(),s.size(),&v); return v; }
napi_value undef(napi_env e) { napi_value v; napi_get_undefined(e,&v); return v; }
void args(napi_env e,napi_callback_info i,size_t count,napi_value* a) { size_t n=count; napi_get_cb_info(e,i,&n,a,nullptr,nullptr); if(n!=count) throw std::runtime_error("Wrong argument count"); }
void initialize(HANDLE handle) {
  ComPtr<IDXGIFactory1> factory; check(CreateDXGIFactory1(IID_PPV_ARGS(&factory)),"DXGI factory");
  for(UINT i=0;;i++) {
    ComPtr<IDXGIAdapter1> gpu;
    if(factory->EnumAdapters1(i,&gpu)==DXGI_ERROR_NOT_FOUND) break;
    DXGI_ADAPTER_DESC1 info; gpu->GetDesc1(&info); if(info.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) continue;
    ComPtr<ID3D11Device> candidate; ComPtr<ID3D11DeviceContext> ctx;
    if(FAILED(D3D11CreateDevice(gpu.Get(),D3D_DRIVER_TYPE_UNKNOWN,nullptr,D3D11_CREATE_DEVICE_BGRA_SUPPORT,nullptr,0,D3D11_SDK_VERSION,&candidate,nullptr,&ctx))) continue;
    ComPtr<ID3D11Device1> d; if(FAILED(candidate.As(&d))) continue;
    ComPtr<ID3D11Texture2D> probe; if(FAILED(d->OpenSharedResource1(handle,IID_PPV_ARGS(&probe)))) continue;
    device=d; context=ctx;
    char name[256]; WideCharToMultiByte(CP_UTF8,0,info.Description,-1,name,sizeof(name),nullptr,nullptr);
    char luid[64]; sprintf_s(luid," [%08lx:%08lx]",(unsigned long)info.AdapterLuid.HighPart,info.AdapterLuid.LowPart); adapter=std::string(name)+luid;
    const char* names[]={"KDW_MAX_BACKGROUND","KDW_MAX_CONTENT"};
    for(int c=0;c<2;c++) {
      channels[c].sender=std::make_unique<spoutDX>();
      if(!channels[c].sender->OpenDirectX11(device.Get())) throw std::runtime_error("Spout OpenDirectX11 failed");
      if(!channels[c].sender->SetSenderName(names[c]) || std::string(channels[c].sender->GetName())!=names[c]) throw std::runtime_error("Sender name already occupied");
    }
    return;
  }
  throw std::runtime_error("No hardware adapter can open Electron NT texture");
}
napi_value send(napi_env e,napi_callback_info info) {
 try {
  napi_value a[2]; args(e,info,2,a); uint32_t channel=99; napi_get_value_uint32(e,a[0],&channel);
  bool isBuffer=false; napi_is_buffer(e,a[1],&isBuffer);
  if(channel>1 || !isBuffer) throw std::runtime_error("Expected channel 0/1 and NT handle Buffer");
  void* bytes=nullptr; size_t length=0; napi_get_buffer_info(e,a[1],&bytes,&length);
  if(length!=sizeof(HANDLE)) throw std::runtime_error("Invalid NT handle size");
  HANDLE handle=nullptr; memcpy(&handle,bytes,sizeof(handle));
  if(!device) initialize(handle);
  auto& c=channels[channel]; if(c.flights.size()>=3) return num(e,0);
  Flight f; f.token=++serial;
  check(device->OpenSharedResource1(handle,IID_PPV_ARGS(&f.input)),"OpenSharedResource1");
  D3D11_TEXTURE2D_DESC desc{}; f.input->GetDesc(&desc);
  if(desc.Format!=DXGI_FORMAT_B8G8R8A8_UNORM && desc.Format!=DXGI_FORMAT_R8G8B8A8_UNORM) throw std::runtime_error("Unsupported texture format (SDR RGBA/BGRA required)");
  // A retained frame belongs to this bridge, never to a borrowed Electron paint.
  D3D11_TEXTURE2D_DESC previous{}; if(c.lastGood) c.lastGood->GetDesc(&previous);
  if(!c.lastGood || previous.Width!=desc.Width || previous.Height!=desc.Height || previous.Format!=desc.Format) {
    D3D11_TEXTURE2D_DESC owned=desc; owned.Usage=D3D11_USAGE_DEFAULT; owned.CPUAccessFlags=0; owned.MiscFlags=0; owned.BindFlags=D3D11_BIND_SHADER_RESOURCE|D3D11_BIND_RENDER_TARGET;
    ComPtr<ID3D11Texture2D> replacement; check(device->CreateTexture2D(&owned,nullptr,&replacement),"Create owned frame");c.lastGood=replacement;
  }
  c.flights.reserve(3); // Allocate before any GPU submission.
  D3D11_QUERY_DESC q{D3D11_QUERY_EVENT,0}; check(device->CreateQuery(&q,&f.done),"CreateQuery");
  context->CopyResource(c.lastGood.Get(),f.input.Get());
  c.sender->SetSenderFormat(desc.Format);
  if(!c.sender->SendTexture(c.lastGood.Get())) throw std::runtime_error("Spout SendTexture failed");
  context->End(f.done.Get()); context->Flush();
  auto token=f.token; c.flights.push_back(std::move(f)); return num(e,token);
 } catch(const std::exception& ex) { napi_throw_error(e,nullptr,ex.what()); return nullptr; }
}
napi_value poll(napi_env e,napi_callback_info) {
 try {
  napi_value out; napi_create_array(e,&out); uint32_t n=0;
  for(auto& c:channels) for(auto it=c.flights.begin();it!=c.flights.end();) {
    BOOL done=FALSE; HRESULT hr=context->GetData(it->done.Get(),&done,sizeof(done),D3D11_ASYNC_GETDATA_DONOTFLUSH);
    check(hr,"GPU completion");
    if(hr==S_OK && done) { napi_set_element(e,out,n++,num(e,it->token)); it=c.flights.erase(it); } else ++it;
  }
  return out;
 } catch(const std::exception& ex) { napi_throw_error(e,nullptr,ex.what()); return nullptr; }
}
napi_value status(napi_env e,napi_callback_info) {
  napi_value out; napi_create_object(e,&out); napi_set_named_property(e,out,"adapter",str(e,adapter));
  napi_set_named_property(e,out,"inflight",num(e,channels[0].flights.size()+channels[1].flights.size()));
  napi_set_named_property(e,out,"deviceRemovedReason",num(e,device?static_cast<unsigned long>(device->GetDeviceRemovedReason()):0));
  return out;
}
napi_value close(napi_env e,napi_callback_info) {
  // JS drains completions before closing. Never release a borrowed texture early.
  if(!channels[0].flights.empty() || !channels[1].flights.empty()) { napi_throw_error(e,nullptr,"Cannot close with GPU work in flight"); return nullptr; }
  for(auto& c:channels) { if(c.sender) c.sender->ReleaseSender(); c.sender.reset(); c.lastGood.Reset(); }
  context.Reset(); device.Reset(); return undef(e);
}
napi_value init(napi_env e,napi_value exports) {
  napi_property_descriptor p[]={{"send",nullptr,send,nullptr,nullptr,nullptr,napi_default,nullptr},{"poll",nullptr,poll,nullptr,nullptr,nullptr,napi_default,nullptr},{"status",nullptr,status,nullptr,nullptr,nullptr,napi_default,nullptr},{"close",nullptr,close,nullptr,nullptr,nullptr,napi_default,nullptr}};
  napi_define_properties(e,exports,4,p); return exports;
}
}
NAPI_MODULE(NODE_GYP_MODULE_NAME,init)
