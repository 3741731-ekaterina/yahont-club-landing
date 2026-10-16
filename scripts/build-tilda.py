"""Build the native Tilda T123 fragment from the maintained standalone site."""
from pathlib import Path
import re,json
root=Path(__file__).resolve().parent.parent
scope='#yahont-club'
def css_scope(css):
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    def parse(text):
        out=''; pos=0
        while pos<len(text):
            start=text.find('{',pos)
            if start<0:return out+text[pos:]
            head=text[pos:start].strip(); depth=1;i=start+1
            while depth and i<len(text):
                if text[i]=='{':depth+=1
                elif text[i]=='}':depth-=1
                i+=1
            body=text[start+1:i-1]
            if head.startswith(('@media','@supports','@layer')):body=parse(body)
            elif not head.startswith('@'):
                sels=[]
                for sel in head.split(','):
                    sel=sel.strip()
                    if sel=='html':sel='html'
                    elif sel in (':root','body'):sel=scope
                    elif sel.startswith('.js-ready'):sel=scope+sel
                    else:sel=scope+' '+sel
                    sels.append(sel)
                head=','.join(sels)
            out+=head+'{'+body+'}\n';pos=i
        return out
    return parse(css)
s=(root/'index.html').read_text()
styles=re.search(r'<style>(.*?)</style>',s,re.S).group(1)+'\n'+(root/'october.css').read_text()
body=re.search(r'<body>(.*)</body>',s,re.S).group(1)
body=body.replace('document.documentElement.classList.add(\'js-ready\')',"document.getElementById('yahont-club').classList.add('js-ready')")
club=(root/'club.js').read_text().replace('document.body.appendChild(',"document.getElementById('yahont-club').appendChild(")
body=body.replace('<script src="club.js"></script>','<script>\n'+club+'\n</script>')
assets=json.loads((root/'migration/assets.json').read_text())
for asset in assets:
    assert asset['url'],asset['source']
    body=body.replace('"'+asset['source']+'"','"'+asset['url']+'"')
fonts=re.search(r'<link href="https://fonts.googleapis.com[^>]+>',s).group(0)
# A full-page T123, with selectors isolated from Tilda's native block styles.
compat='''html,body{margin:0;padding:0;background:#120B0B}body{overflow-x:hidden}#allrecords{overflow:visible!important}#yahont-club{min-height:100vh}#yahont-club a{color:inherit;text-decoration:none}#yahont-club .btn-primary{color:#fff}#yahont-club .grad-text{color:transparent}#yahont-club ul{padding:0;list-style:none}#yahont-club .t-records{font-family:inherit;color:inherit}#allrecords>.r:not([data-record-type="131"]){display:none!important}'''
intro='<script>document.body.id="yahont-club";</script>\n'+fonts+'\n<style>\n'+compat+'\n'+css_scope(styles)+'</style>\n<script>\n'+(root/'utm.js').read_text()+'\n</script>\n'
# Keep complete top-level sections together; each T123 stays below 60 KB.
units=re.split(r'(<section\b.*?</section>)',body,flags=re.S)
parts=[intro]; chunk=''
for unit in units:
    if len((chunk+unit).encode())>60000 and chunk:
        parts.append(chunk);chunk=''
    assert len(unit.encode())<60000
    chunk+=unit
if chunk:parts.append(chunk)
for i,part in enumerate(parts,1):
    assert 'vercel.app' not in part
    (root/f'migration/t123-{i:02d}.html').write_text(part)
fragment='\n'.join(parts)
(root/'tilda-t123-code.html').write_text(fragment)
shell=(root/'migration/tilda-before.html').read_text()
old=re.search(r'<div id="rec\d+"[^>]*class="r t-rec".*?<!-- T123 -->.*?<!-- nominify end -->\s*</div>\s*</div>\s*</div>\s*</div>',shell,re.S)
assert old
records=''.join('<div class="r t-rec" data-record-type="131"><div class="t123"><div class="t-container_100"><div class="t-width t-width_100">'+part+'</div></div></div></div>' for part in parts)
shell=shell[:old.start()]+records+shell[old.end():]
(root/'migration/preview.html').write_text(shell)
print('T123 blocks:',[(i+1,len(p.encode())) for i,p in enumerate(parts)])
