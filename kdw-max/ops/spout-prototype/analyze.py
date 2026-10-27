"""Analyze sender/independent receiver timing and convert raw GPU snapshots to PNG (stdlib)."""
import argparse,csv,json,pathlib,statistics,struct,zlib
def percentile(values,p):
    ordered=sorted(values)
    return round(ordered[min(len(ordered)-1,int((len(ordered)-1)*p))],3) if ordered else None
def analyze(root):
    report={}
    for kind in ['sender','receiver']:
        f=root/kind/(kind+'.csv')
        if not f.exists(): continue
        rows=list(csv.DictReader(f.open()))
        report[kind]=[]
        for channel in ['0','1']:
            samples=[r for r in rows if r['channel']==channel and float(r['elapsedMs'])>=5000]
            times=[float(r['elapsedMs']) for r in samples]
            dt=[b-a for a,b in zip(times,times[1:])]
            item={'channel':int(channel),'samples':len(samples),'fps':round(1000*(len(times)-1)/(times[-1]-times[0]),3) if len(times)>1 else 0,'intervalP50Ms':percentile(dt,.5),'intervalP95Ms':percentile(dt,.95),'intervalP99Ms':percentile(dt,.99),'gapsOver50Ms':sum(x>50 for x in dt),'maxGapMs':max(dt,default=0)}
            if kind=='sender': item['submitP95Ms']=percentile([float(r['submitMs']) for r in samples],.95)
            if kind=='receiver':
                frames=[int(r['frame']) for r in samples]
                item['sourceFrameGaps']=sum(max(0,b-a-1) for a,b in zip(frames,frames[1:]))
            report[kind].append(item)
    for name in ['background','content','composite']:
        p=root/'receiver'/name
        if not p.with_suffix('.raw').exists(): continue
        meta=json.loads(p.with_suffix('.json').read_text()); w,h=meta['width'],meta['height']; data=bytearray(p.with_suffix('.raw').read_bytes())
        if meta['dxgiFormat']==87:
            data[0::4],data[2::4]=data[2::4],data[0::4]
        elif meta['dxgiFormat']!=28: raise ValueError('Unsupported snapshot format')
        def pixel(x,y): return list(data[(y*w+x)*4:(y*w+x+1)*4])
        meta['cornerRGBA']=pixel(0,0); meta['redPatchRGBA']=pixel(int(w*.1)+10,int(h*.8)+10);meta['halfWhiteRGBA']=pixel(int(w*.15)+10,int(h*.8)+10)
        report[name]=meta
        # Spout content is premultiplied; unpremultiply for a standard PNG preview.
        if name=='content':
            for i in range(0,len(data),4):
                a=data[i+3]
                if 0<a<255:
                    for c in range(3): data[i+c]=min(255,round(data[i+c]*255/a))
        def chunk(t,b): return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
        scan=b''.join(b'\0'+data[y*w*4:(y+1)*w*4] for y in range(h))
        p.with_suffix('.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(scan,6))+chunk(b'IEND',b''))
    (root/'analysis.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=pathlib.Path);analyze(p.parse_args().root)
